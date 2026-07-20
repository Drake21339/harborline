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
  /** Vehicle archetype id for silhouette variety (compact/sedan/…). */
  archetype?: string;
}

type DistrictId = "pier-ward" | "midstack" | "ridge-hollow" | "freight-cut" | "greenbelt";

const DISTRICT_STYLE: Record<
  DistrictId,
  { face: number; roof: number; trim: number; window: number; baseH: number; varH: number }
> = {
  "pier-ward": {
    face: 0x7aa0b8,
    roof: 0x3a5870,
    trim: 0xc8e8f8,
    window: 0xe0ffff,
    baseH: 16,
    varH: 18,
  },
  midstack: {
    face: 0xc8b890,
    roof: 0x5a5440,
    trim: 0xfff0c0,
    window: 0xffe8a8,
    baseH: 30,
    varH: 38,
  },
  "ridge-hollow": {
    face: 0xc89860,
    roof: 0x6a4828,
    trim: 0xffd090,
    window: 0xffe0a0,
    baseH: 18,
    varH: 22,
  },
  "freight-cut": {
    face: 0xc87040,
    roof: 0x5a3020,
    trim: 0xffb060,
    window: 0xffd080,
    baseH: 12,
    varH: 12,
  },
  greenbelt: {
    face: 0x6a9860,
    roof: 0x2a5830,
    trim: 0xb8f0a0,
    window: 0xd0ffb0,
    baseH: 10,
    varH: 10,
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
    this.canvas.dataset.harborThree = "1";
    this.host.style.position = "relative";
    // Insert behind Phaser canvas.
    this.host.insertBefore(this.canvas, this.host.firstChild);

    this.worldW = world.width * world.tileSize;
    this.worldH = world.height * world.tileSize;

    const scene = new THREE.Scene();
    // Readable night harbor — not crushed black (ortho tops need value, not just side light).
    scene.background = new THREE.Color(0x152838);
    this.scene = scene;

    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 5000);
    cam.position.set(0, 800, 0);
    cam.up.set(0, 0, -1);
    cam.lookAt(0, 0, 0);
    this.camera = cam;

    // Strong ambient so roof tops stay readable under locked bird’s-eye.
    const ambient = new THREE.AmbientLight(0xffffff, 1.35);
    const sun = new THREE.DirectionalLight(0xfff0d8, 0.85);
    sun.position.set(-180, 600, -140);
    const fill = new THREE.DirectionalLight(0x90b8d8, 0.55);
    fill.position.set(160, 300, 120);
    scene.add(ambient, sun, fill);

    this.root = new THREE.Group();
    this.entityRoot = new THREE.Group();
    scene.add(this.root, this.entityRoot);

    this.buildCity(world);
    this.placeStreetGlow(world);
    this.setViewSize(this.viewW, this.viewH);
  }

  /** Cheap sodium point lights near plazas / midstack — atmosphere without a post stack. */
  private placeStreetGlow(world: GeneratedWorld): void {
    if (!this.scene || !this.root) return;
    const ts = world.tileSize;
    let placed = 0;
    for (let ty = 8; ty < world.height && placed < 48; ty += 10) {
      for (let tx = 8; tx < world.width && placed < 48; tx += 12) {
        const tile = world.tiles[ty * world.width + tx]!;
        if (tile !== Tile.Sidewalk && tile !== Tile.Plaza) continue;
        const d = districtAt(world, tx, ty);
        if (!d || (d.id !== "midstack" && d.id !== "pier-ward")) continue;
        const x = tx * ts + ts / 2;
        const z = ty * ts + ts / 2;
        const warm = d.id === "midstack";
        const light = new THREE.PointLight(warm ? 0xffc060 : 0x88c0e0, 0.85, 140, 2);
        light.position.set(x, 28, z);
        this.scene.add(light);
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(2.2, 6, 4),
          new THREE.MeshStandardMaterial({
            color: warm ? 0xffe0a0 : 0xc0e8ff,
            emissive: warm ? 0xffaa40 : 0x60a0c0,
            emissiveIntensity: 1.2,
          }),
        );
        bulb.position.set(x, 22, z);
        this.root.add(bulb);
        placed += 1;
      }
    }
  }

  setViewSize(w: number, h: number): void {
    if (!this.active || !this.renderer || !this.camera || !this.canvas) return;
    this.viewW = w;
    this.viewH = h;
    // Match Phaser's displayed canvas box so the city lines up with HUD world-space.
    const phaserCanvas = this.host.querySelector("canvas:not([data-harbor-three])") as
      | HTMLCanvasElement
      | null;
    if (phaserCanvas) {
      const r = phaserCanvas.getBoundingClientRect();
      const hostR = this.host.getBoundingClientRect();
      this.canvas.style.position = "absolute";
      // Clear shorthand first — setting `inset` after left/top wipes them.
      this.canvas.style.inset = "";
      this.canvas.style.right = "auto";
      this.canvas.style.bottom = "auto";
      this.canvas.style.left = `${Math.round(r.left - hostR.left)}px`;
      this.canvas.style.top = `${Math.round(r.top - hostR.top)}px`;
      this.canvas.style.width = `${Math.round(r.width)}px`;
      this.canvas.style.height = `${Math.round(r.height)}px`;
    }
    this.canvas.dataset.harborThree = "1";
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
      const key = `${p.kind}:${p.archetype ?? ""}:${p.width ?? 0}x${p.height ?? 0}`;
      if (obj && obj.userData.meshKey !== key) {
        this.entityRoot.remove(obj);
        this.disposeObject(obj);
        this.meshes.delete(p.id);
        obj = undefined;
      }
      if (!obj) {
        obj = this.makeEntityMesh(p);
        obj.userData.meshKey = key;
        this.entityRoot.add(obj);
        this.meshes.set(p.id, obj);
      }
      const lift = p.kind === "ped" || p.kind === "player" ? 9 : 5;
      obj.position.set(p.x, lift, p.y);
      obj.rotation.y = -p.heading;
      this.applyPoseTint(obj, p);
    }
    for (const [id, obj] of this.meshes) {
      if (!seen.has(id)) {
        this.entityRoot.remove(obj);
        this.disposeObject(obj);
        this.meshes.delete(id);
      }
    }
  }

  private applyPoseTint(obj: THREE.Object3D, p: EntityPose3D): void {
    const tint = p.fleeing ? 0xff7a33 : (p.color ?? 0xf2c14e);
    obj.traverse((c) => {
      if (!(c instanceof THREE.Mesh) || !c.userData.tintable) return;
      const mat = c.material as THREE.MeshStandardMaterial;
      mat.color.setHex(tint);
    });
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

    const groundMat = new THREE.MeshBasicMaterial({ color: 0x1a3048 });
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
          let color = 0x5a5a68;
          if (cls === RoadClass.Arterial) color = 0x505060;
          if (cls === RoadClass.Freeway) color = 0x444450;
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
          const tint = hash % 2 === 0 ? 0x2a6a90 : 0x3a80a8;
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
    // MeshBasic for city tiles: locked ortho top-down must stay readable.
    // Instance colors via InstancedMesh.setColorAt (do NOT set vertexColors —
    // that flag expects a geometry color attribute and can blank instances).
    const mat = emissive
      ? new THREE.MeshStandardMaterial({
          roughness,
          metalness,
          color: 0xffffff,
          emissive: new THREE.Color(0xffe0a0),
          emissiveIntensity,
        })
      : new THREE.MeshBasicMaterial({
          color: 0xffffff,
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
    // InstancedMesh bounds stay at origin — without this, the whole city
    // disappears once the camera leaves the map corner.
    mesh.frustumCulled = false;
    this.root.add(mesh);
  }

  private makeEntityMesh(p: EntityPose3D): THREE.Object3D {
    if (p.kind === "ped" || p.kind === "player" || (p.kind === "police" && !p.width)) {
      return this.makePersonMesh(p);
    }
    return this.makeVehicleMesh(p);
  }

  private makePersonMesh(p: EntityPose3D): THREE.Object3D {
    const color = p.color ?? 0xb8c4a8;
    const group = new THREE.Group();
    const isPlayer = p.kind === "player";
    const isCop = p.kind === "police";
    const bodyColor = isCop ? 0x2a4a9a : color;
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(isPlayer ? 5.5 : 4.5, isPlayer ? 9 : 7, 4, 8),
      new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.65 }),
    );
    body.position.y = 2;
    body.userData.tintable = true;
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(isPlayer ? 3.2 : 2.8, 8, 6),
      new THREE.MeshStandardMaterial({
        color: isCop ? 0xd0b090 : 0xe0c8a8,
        roughness: 0.7,
      }),
    );
    head.position.y = isPlayer ? 12 : 10;
    // Facing cue — small nose/shoulder bias toward heading (+X local after rotation).
    const shoulder = new THREE.Mesh(
      new THREE.BoxGeometry(isPlayer ? 12 : 10, 3, 4),
      new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.7 }),
    );
    shoulder.position.set(0, 6, 0);
    shoulder.userData.tintable = true;
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(6, 10),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -8;
    group.add(shadow, body, head, shoulder);
    if (isCop) {
      const hat = new THREE.Mesh(
        new THREE.CylinderGeometry(3.2, 3.4, 2.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x1a2a60, roughness: 0.6 }),
      );
      hat.position.y = 13.5;
      group.add(hat);
    }
    if (isPlayer) {
      const marker = new THREE.Mesh(
        new THREE.ConeGeometry(3, 5, 4),
        new THREE.MeshStandardMaterial({ color: 0xffe08a, emissive: 0xaa8800, emissiveIntensity: 0.5 }),
      );
      marker.position.set(6, 4, 0);
      marker.rotation.z = -Math.PI / 2;
      group.add(marker);
    }
    group.userData.body = body;
    return group;
  }

  private makeVehicleMesh(p: EntityPose3D): THREE.Object3D {
    const color = p.color ?? 0x9aa3b5;
    const arch = p.archetype ?? (p.kind === "police" ? "police" : "sedan");
    let w = p.width ?? 48;
    let h = p.height ?? 24;
    let bodyH = 7;
    let cabinH = 6;
    let cabinScaleX = 0.48;
    const cabinZ = 0.72;
    if (arch === "compact") {
      w *= 0.95;
      bodyH = 6.5;
      cabinScaleX = 0.42;
    } else if (arch === "sports") {
      bodyH = 5.5;
      cabinH = 4.5;
      cabinScaleX = 0.4;
      h *= 0.95;
    } else if (arch === "van") {
      bodyH = 10;
      cabinH = 9;
      cabinScaleX = 0.55;
    } else if (arch === "taxi") {
      bodyH = 7.5;
    } else if (arch === "police") {
      bodyH = 7.5;
    }

    const group = new THREE.Group();
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 1.05, h * 1.1),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(2, -4.5, 3);

    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(w, bodyH, h),
      new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.25 }),
    );
    chassis.position.y = bodyH / 2 - 2;
    chassis.userData.tintable = true;
    group.userData.body = chassis;

    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(w * cabinScaleX, cabinH, h * cabinZ),
      new THREE.MeshStandardMaterial({
        color: 0x1a3048,
        roughness: 0.25,
        metalness: 0.35,
        emissive: 0x102030,
        emissiveIntensity: 0.2,
      }),
    );
    glass.position.set(-w * 0.06, bodyH / 2 + cabinH / 2 - 1.5, 0);

    // Wheels — four dark discs for silhouette from above.
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.9 });
    const wheelGeo = new THREE.CylinderGeometry(2.4, 2.4, 3.2, 8);
    const wheelOffsets: Array<[number, number]> = [
      [w * 0.32, h * 0.42],
      [w * 0.32, -h * 0.42],
      [-w * 0.32, h * 0.42],
      [-w * 0.32, -h * 0.42],
    ];
    for (const [wx, wz] of wheelOffsets) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, -1.5, wz);
      group.add(wheel);
    }

    // Headlights + brake.
    const hl = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2.5, 4),
      new THREE.MeshStandardMaterial({
        color: 0xfff2c0,
        emissive: 0xffe080,
        emissiveIntensity: 0.9,
      }),
    );
    hl.position.set(w * 0.42, 2, 0);
    const brake = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 2, 8),
      new THREE.MeshStandardMaterial({
        color: 0xaa2020,
        emissive: 0x661010,
        emissiveIntensity: 0.4,
      }),
    );
    brake.position.set(-w * 0.42, 2.2, 0);

    group.add(shadow, chassis, glass, hl, brake);

    if (arch === "police") {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.35, 2.5, h * 0.55),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0x2244ff,
          emissiveIntensity: 0.85,
        }),
      );
      bar.position.set(0, bodyH / 2 + cabinH - 0.5, 0);
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.98, 1.2, h * 0.15),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }),
      );
      stripe.position.set(0, bodyH / 2 - 1, 0);
      group.add(bar, stripe);
    }
    if (arch === "taxi") {
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(10, 3, 6),
        new THREE.MeshStandardMaterial({
          color: 0xf0c040,
          emissive: 0xaa8800,
          emissiveIntensity: 0.5,
        }),
      );
      sign.position.set(0, bodyH / 2 + cabinH + 0.5, 0);
      group.add(sign);
    }
    if (arch === "sports") {
      const scoop = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.25, 1.5, h * 0.35),
        new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.5 }),
      );
      scoop.position.set(w * 0.1, bodyH / 2 + 0.5, 0);
      group.add(scoop);
    }
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
