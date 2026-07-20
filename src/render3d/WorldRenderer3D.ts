import * as THREE from "three";
import { RoadClass } from "../world/roadTypes";
import { Tile } from "../world/tileTypes";
import { districtAt, type GeneratedWorld } from "../world/types";

export interface EntityPose3D {
  id: string;
  x: number;
  y: number;
  heading: number;
  kind: "player" | "ped" | "car" | "vehicle" | "police";
  color?: number;
  width?: number;
  height?: number;
  fleeing?: boolean;
}

type DistrictId = "pier-ward" | "midstack" | "ridge-hollow" | "freight-cut" | "greenbelt";

const DISTRICT_STYLE: Record<
  DistrictId,
  { face: number; roof: number; trim: number; window: number; baseH: number; varH: number }
> = {
  "pier-ward": {
    face: 0x6a8aa0,
    roof: 0x243848,
    trim: 0xb0d0e0,
    window: 0xc8f0ff,
    baseH: 14,
    varH: 16,
  },
  midstack: {
    face: 0xa89878,
    roof: 0x2a2820,
    trim: 0xe8dcb0,
    window: 0xffe8a8,
    baseH: 28,
    varH: 36,
  },
  "ridge-hollow": {
    face: 0x8e7450,
    roof: 0x2e2010,
    trim: 0xe0b878,
    window: 0xf0d090,
    baseH: 18,
    varH: 22,
  },
  "freight-cut": {
    face: 0x8a5230,
    roof: 0x24180c,
    trim: 0xf0a040,
    window: 0xffb060,
    baseH: 12,
    varH: 10,
  },
  greenbelt: {
    face: 0x4a6e42,
    roof: 0x162816,
    trim: 0x98d080,
    window: 0xc0f0a0,
    baseH: 10,
    varH: 8,
  },
};

/**
 * Locked top-down Three.js mesh city. Phaser keeps HUD/input/physics;
 * this layer draws the world + agents when WebGL is available.
 */
export class WorldRenderer3D {
  readonly active: boolean;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private root: THREE.Group | null = null;
  private entityRoot: THREE.Group | null = null;
  private readonly meshes = new Map<string, THREE.Object3D>();
  private readonly canvas: HTMLCanvasElement | null = null;
  private worldW = 0;
  private worldH = 0;
  private viewW = 1280;
  private viewH = 720;

  constructor(
    private readonly host: HTMLElement,
    world: GeneratedWorld,
  ) {
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      this.active = false;
      return;
    }
    // Headless / software GL sometimes constructs but can't render.
    const gl = renderer.getContext();
    if (!gl) {
      renderer.dispose();
      this.active = false;
      return;
    }

    this.active = true;
    this.renderer = renderer;
    this.canvas = renderer.domElement;
    this.canvas.style.position = "absolute";
    this.canvas.style.inset = "0";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.pointerEvents = "none";
    this.canvas.style.zIndex = "0";
    this.host.style.position = "relative";
    // Insert behind Phaser canvas.
    this.host.insertBefore(this.canvas, this.host.firstChild);

    this.worldW = world.width * world.tileSize;
    this.worldH = world.height * world.tileSize;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c1828);
    // Light fog only — heavy FogExp2 crushed the city to black under ortho.
    scene.fog = new THREE.Fog(0x0c1828, 900, 2800);
    this.scene = scene;

    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 5000);
    cam.position.set(0, 800, 0);
    cam.up.set(0, 0, -1);
    cam.lookAt(0, 0, 0);
    this.camera = cam;

    const ambient = new THREE.AmbientLight(0xc0d4e8, 0.85);
    const sun = new THREE.DirectionalLight(0xfff2d0, 1.35);
    sun.position.set(-220, 520, -180);
    const fill = new THREE.DirectionalLight(0x88b0d0, 0.55);
    fill.position.set(180, 280, 120);
    const sodium = new THREE.HemisphereLight(0xe0c070, 0x243848, 0.45);
    scene.add(ambient, sun, fill, sodium);

    this.root = new THREE.Group();
    this.entityRoot = new THREE.Group();
    scene.add(this.root, this.entityRoot);

    this.buildCity(world);
    this.setViewSize(this.viewW, this.viewH);
  }

  setViewSize(w: number, h: number): void {
    if (!this.active || !this.renderer || !this.camera) return;
    this.viewW = w;
    this.viewH = h;
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setSize(w, h, false);
    const halfW = w / 2;
    const halfH = h / 2;
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();
  }

  /** Follow gameplay camera center (Phaser world pixels). */
  syncCamera(centerX: number, centerY: number, zoom: number): void {
    if (!this.camera) return;
    // Phaser Y-down → Three XZ with +Z south mapped from +Y.
    this.camera.position.set(centerX, 800 / Math.max(0.5, zoom), centerY);
    this.camera.lookAt(centerX, 0, centerY);
    const halfW = this.viewW / (2 * zoom);
    const halfH = this.viewH / (2 * zoom);
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();
  }

  syncEntities(poses: EntityPose3D[]): void {
    if (!this.entityRoot) return;
    const seen = new Set<string>();
    for (const p of poses) {
      seen.add(p.id);
      let obj = this.meshes.get(p.id);
      if (!obj) {
        obj = this.makeEntityMesh(p);
        this.entityRoot.add(obj);
        this.meshes.set(p.id, obj);
      }
      obj.position.set(p.x, p.kind === "ped" || p.kind === "player" ? 8 : 6, p.y);
      obj.rotation.y = -p.heading;
      if (p.color !== undefined && obj instanceof THREE.Mesh) {
        const mat = obj.material as THREE.MeshStandardMaterial;
        mat.color.setHex(p.fleeing ? 0xff7a33 : p.color);
      } else if (obj instanceof THREE.Group) {
        const body = obj.userData.body as THREE.Mesh | undefined;
        if (body && p.color !== undefined) {
          const mat = body.material as THREE.MeshStandardMaterial;
          mat.color.setHex(p.fleeing ? 0xff7a33 : p.color);
        } else if (p.fleeing) {
          obj.traverse((c) => {
            if (c instanceof THREE.Mesh && c.userData.tintable) {
              (c.material as THREE.MeshStandardMaterial).color.setHex(0xff7a33);
            }
          });
        }
      }
    }
    for (const [id, obj] of this.meshes) {
      if (!seen.has(id)) {
        this.entityRoot.remove(obj);
        this.disposeObject(obj);
        this.meshes.delete(id);
      }
    }
  }

  render(): void {
    if (!this.active || !this.renderer || !this.scene || !this.camera) return;
    this.renderer.render(this.scene, this.camera);
  }

  destroy(): void {
    if (!this.active) return;
    for (const obj of this.meshes.values()) this.disposeObject(obj);
    this.meshes.clear();
    if (this.root) this.disposeObject(this.root);
    this.renderer?.dispose();
    this.canvas?.remove();
    this.renderer = null;
    this.scene = null;
    this.camera = null;
  }

  private buildCity(world: GeneratedWorld): void {
    if (!this.root) return;
    const ts = world.tileSize;

    const groundMat = new THREE.MeshStandardMaterial({ color: 0x121c28, roughness: 0.98 });
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(this.worldW, this.worldH),
      groundMat,
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(this.worldW / 2, -0.05, this.worldH / 2);
    this.root.add(ground);

    type Batch = {
      positions: THREE.Vector3[];
      colors: number[];
      scales: THREE.Vector3[];
      emissive?: number[];
    };
    const mk = (): Batch => ({ positions: [], colors: [], scales: [], emissive: [] });

    const buildingFaces = mk();
    const roofs = mk();
    const windows = mk();
    const roadsLocal = mk();
    const roadsArterial = mk();
    const roadsFreeway = mk();
    const markings = mk();
    const sidewalks = mk();
    const plazas = mk();
    const waters = mk();
    const parks = mk();
    const medians = mk();
    const canopies = mk();

    for (let ty = 0; ty < world.height; ty += 1) {
      for (let tx = 0; tx < world.width; tx += 1) {
        const tile = world.tiles[ty * world.width + tx]!;
        const d = districtAt(world, tx, ty);
        const did = (d?.id ?? "midstack") as DistrictId;
        const style = DISTRICT_STYLE[did] ?? DISTRICT_STYLE.midstack;
        const x = tx * ts + ts / 2;
        const z = ty * ts + ts / 2;
        const hash = (tx * 17 + ty * 31) & 255;

        if (tile === Tile.Building) {
          const h = style.baseH + (hash % style.varH);
          const footprint = 0.86 + (hash % 5) * 0.02;
          // South-east shadow blob (cheap contact cue under ortho light).
          // Face body.
          buildingFaces.positions.push(new THREE.Vector3(x, h / 2, z));
          buildingFaces.colors.push(style.face);
          buildingFaces.scales!.push(new THREE.Vector3(footprint, h / ts, footprint));
          // Darker roof cap.
          const roofH = Math.max(2.2, h * 0.08);
          roofs.positions.push(new THREE.Vector3(x, h + roofH / 2, z));
          roofs.colors.push(style.roof);
          roofs.scales!.push(new THREE.Vector3(footprint * 1.02, roofH / ts, footprint * 1.02));
          // Trim rim.
          roofs.positions.push(new THREE.Vector3(x, h + 0.4, z));
          roofs.colors.push(style.trim);
          roofs.scales!.push(new THREE.Vector3(footprint * 1.04, 0.8 / ts, footprint * 1.04));
          // Lit windows — emissive panes on top face for bird’s-eye read.
          if (hash % 3 !== 0) {
            windows.positions.push(new THREE.Vector3(x - 6, h * 0.55, z + 2));
            windows.colors.push(style.window);
            windows.emissive!.push(style.window);
            windows.scales!.push(new THREE.Vector3(0.28, Math.min(0.55, h / 40), 0.12));
            windows.positions.push(new THREE.Vector3(x + 6, h * 0.55, z + 2));
            windows.colors.push(style.window);
            windows.emissive!.push(style.window);
            windows.scales!.push(new THREE.Vector3(0.28, Math.min(0.55, h / 40), 0.12));
            if (h > 28) {
              windows.positions.push(new THREE.Vector3(x - 6, h * 0.78, z + 2));
              windows.colors.push(style.window);
              windows.emissive!.push(style.window);
              windows.scales!.push(new THREE.Vector3(0.28, 0.4, 0.12));
              windows.positions.push(new THREE.Vector3(x + 6, h * 0.78, z + 2));
              windows.colors.push(style.window);
              windows.emissive!.push(style.window);
              windows.scales!.push(new THREE.Vector3(0.28, 0.4, 0.12));
            }
          }
          // Midstack AC unit / pier warehouse band.
          if (did === "midstack" && hash % 4 === 0) {
            roofs.positions.push(new THREE.Vector3(x + 8, h + roofH + 1.5, z - 6));
            roofs.colors.push(0x5a6a78);
            roofs.scales!.push(new THREE.Vector3(0.28, 0.12, 0.22));
          }
          continue;
        }

        if (tile === Tile.Road) {
          const cls = world.roadClass[ty * world.width + tx] ?? RoadClass.Local;
          const batch =
            cls === RoadClass.Freeway
              ? roadsFreeway
              : cls === RoadClass.Arterial
                ? roadsArterial
                : roadsLocal;
          let color = 0x4a4a56;
          if (cls === RoadClass.Arterial) color = 0x404048;
          if (cls === RoadClass.Freeway) color = 0x34343c;
          batch.positions.push(new THREE.Vector3(x, 0.2, z));
          batch.colors.push(color);
          batch.scales!.push(new THREE.Vector3(1, 1, 1));

          // Class markings (bird’s-eye readable).
          if (cls === RoadClass.Freeway) {
            // Outer edge stripe.
            markings.positions.push(new THREE.Vector3(x, 0.45, z));
            markings.colors.push(0xf0e8c0);
            markings.scales!.push(new THREE.Vector3(0.9, 0.15, 0.08));
          } else if (cls === RoadClass.Arterial) {
            if ((tx + ty) % 2 === 0) {
              markings.positions.push(new THREE.Vector3(x, 0.42, z));
              markings.colors.push(0xd4c050);
              markings.scales!.push(new THREE.Vector3(0.12, 0.12, 0.45));
            }
          } else if ((tx + ty) % 2 === 0) {
            markings.positions.push(new THREE.Vector3(x, 0.4, z));
            markings.colors.push(0xb0a868);
            markings.scales!.push(new THREE.Vector3(0.08, 0.1, 0.28));
          }
          continue;
        }

        if (tile === Tile.Sidewalk) {
          let c = 0x5c5c66;
          if (did === "pier-ward") c = 0x6a7a88;
          if (did === "freight-cut") c = 0x6a5a4a;
          sidewalks.positions.push(new THREE.Vector3(x, 0.28, z));
          sidewalks.colors.push(c);
          sidewalks.scales!.push(new THREE.Vector3(1, 1, 1));
          continue;
        }

        if (tile === Tile.Plaza) {
          plazas.positions.push(new THREE.Vector3(x, 0.3, z));
          plazas.colors.push(0x5a5868);
          plazas.scales!.push(new THREE.Vector3(1, 1, 1));
          continue;
        }

        if (tile === Tile.Water) {
          const tint = hash % 2 === 0 ? 0x1a4a6a : 0x245878;
          waters.positions.push(new THREE.Vector3(x, 0.02, z));
          waters.colors.push(tint);
          waters.scales!.push(new THREE.Vector3(1, 0.5, 1));
          continue;
        }

        if (tile === Tile.Park || tile === Tile.Grass) {
          // Freeway median grass between dual carriageways — raised barrier strip.
          const nearFreeway =
            (tx > 0 && world.roadClass[ty * world.width + (tx - 1)] === RoadClass.Freeway) ||
            (tx + 1 < world.width &&
              world.roadClass[ty * world.width + (tx + 1)] === RoadClass.Freeway) ||
            (ty > 0 && world.roadClass[(ty - 1) * world.width + tx] === RoadClass.Freeway) ||
            (ty + 1 < world.height &&
              world.roadClass[(ty + 1) * world.width + tx] === RoadClass.Freeway);
          if (nearFreeway && tile === Tile.Grass) {
            medians.positions.push(new THREE.Vector3(x, 0.8, z));
            medians.colors.push(0x2a4a28);
            medians.scales!.push(new THREE.Vector3(0.85, 2.2 / ts, 0.85));
            continue;
          }
          let c = tile === Tile.Park ? 0x2f5e34 : (d?.groundColor ?? 0x2a3828);
          if (did === "greenbelt") c = blendHex(c, 0x1a8a38, 0.35);
          if (did === "freight-cut") c = blendHex(c, 0x5a2818, 0.25);
          if (did === "ridge-hollow") c = blendHex(c, 0x7a5a28, 0.2);
          parks.positions.push(new THREE.Vector3(x, 0.12, z));
          parks.colors.push(c);
          parks.scales!.push(new THREE.Vector3(1, 1, 1));
          if ((tile === Tile.Park || did === "greenbelt") && hash % 11 === 0) {
            canopies.positions.push(new THREE.Vector3(x, 6, z));
            canopies.colors.push(0x3a7a40);
            canopies.scales!.push(new THREE.Vector3(0.55, 0.45, 0.55));
          }
          continue;
        }

        if (tile === Tile.Fence) {
          const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(ts * 0.9, 10, ts * 0.35),
            new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 0.7 }),
          );
          mesh.position.set(x, 5, z);
          this.root.add(mesh);
        }
      }
    }

    const unit = new THREE.BoxGeometry(ts, ts, ts);
    this.addInstanced(unit, buildingFaces, 0.72, 0.04);
    this.addInstanced(unit, roofs, 0.88, 0.04);
    this.addInstanced(unit, windows, 0.35, 0.05, true, 1.4);
    this.addInstanced(new THREE.BoxGeometry(ts, 0.4, ts), roadsLocal, 0.95, 0.02);
    this.addInstanced(new THREE.BoxGeometry(ts, 0.42, ts), roadsArterial, 0.92, 0.04);
    this.addInstanced(new THREE.BoxGeometry(ts, 0.45, ts), roadsFreeway, 0.9, 0.06);
    this.addInstanced(new THREE.BoxGeometry(ts, 0.3, ts), markings, 0.7, 0.1);
    this.addInstanced(new THREE.BoxGeometry(ts, 0.5, ts), sidewalks, 0.9, 0.05);
    this.addInstanced(new THREE.BoxGeometry(ts, 0.55, ts), plazas, 0.88, 0.08);
    this.addInstanced(new THREE.BoxGeometry(ts, 0.25, ts), waters, 0.35, 0.35);
    this.addInstanced(new THREE.BoxGeometry(ts, 0.3, ts), parks, 0.95, 0.02);
    this.addInstanced(unit, medians, 0.9, 0.02);
    this.addInstanced(new THREE.SphereGeometry(ts * 0.45, 6, 4), canopies, 0.95, 0.0);
  }

  private addInstanced(
    geo: THREE.BufferGeometry,
    batch: {
      positions: THREE.Vector3[];
      colors: number[];
      scales?: THREE.Vector3[];
      emissive?: number[];
    },
    roughness: number,
    metalness: number,
    emissive = false,
    emissiveIntensity = 1.2,
  ): void {
    if (!this.root || batch.positions.length === 0) return;
    const mat = new THREE.MeshStandardMaterial({
      roughness,
      metalness,
      vertexColors: true,
      ...(emissive
        ? { emissive: new THREE.Color(0xffe0a0), emissiveIntensity }
        : {}),
    });
    const mesh = new THREE.InstancedMesh(geo, mat, batch.positions.length);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < batch.positions.length; i += 1) {
      const p = batch.positions[i]!;
      dummy.position.copy(p);
      const s = batch.scales?.[i];
      if (s) dummy.scale.copy(s);
      else dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.setHex(batch.colors[i]!);
      mesh.setColorAt(i, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.root.add(mesh);
  }

  private makeEntityMesh(p: EntityPose3D): THREE.Object3D {
    const color = p.color ?? 0xf2c14e;
    if (p.kind === "ped" || p.kind === "player") {
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(5, 8, 4, 8),
        new THREE.MeshStandardMaterial({ color, roughness: 0.7 }),
      );
      body.position.y = 0;
      body.userData.tintable = true;
      return body;
    }
    const w = p.width ?? 48;
    const h = p.height ?? 24;
    const group = new THREE.Group();
    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(w, 8, h),
      new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.2 }),
    );
    chassis.position.y = 4;
    chassis.userData.tintable = true;
    group.userData.body = chassis;
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.45, 6, h * 0.7),
      new THREE.MeshStandardMaterial({ color: 0x1a2430, roughness: 0.4 }),
    );
    cabin.position.set(-w * 0.05, 10, 0);
    group.add(chassis, cabin);
    return group;
  }

  private disposeObject(obj: THREE.Object3D): void {
    obj.traverse((c) => {
      if (c instanceof THREE.Mesh || c instanceof THREE.InstancedMesh) {
        c.geometry.dispose();
        const m = c.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m.dispose();
      }
    });
  }
}

function blendHex(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}
