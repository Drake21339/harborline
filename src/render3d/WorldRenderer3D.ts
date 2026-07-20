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
    this.scene = scene;

    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 5000);
    cam.position.set(0, 800, 0);
    cam.up.set(0, 0, -1);
    cam.lookAt(0, 0, 0);
    this.camera = cam;

    const ambient = new THREE.AmbientLight(0xb0c4d8, 0.7);
    const sun = new THREE.DirectionalLight(0xfff0d0, 0.85);
    sun.position.set(-200, 400, -160);
    scene.add(ambient, sun);

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
      } else if (p.fleeing && obj instanceof THREE.Group) {
        obj.traverse((c) => {
          if (c instanceof THREE.Mesh) {
            (c.material as THREE.MeshStandardMaterial).color.setHex(0xff7a33);
          }
        });
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
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a2430, roughness: 0.95 });
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(this.worldW, this.worldH),
      groundMat,
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(this.worldW / 2, 0, this.worldH / 2);
    this.root.add(ground);

    // Merge-ish: one mesh per tile type batch using InstancedMesh for buildings/roads.
    const buildingGeo = new THREE.BoxGeometry(ts * 0.92, 1, ts * 0.92);
    const roadGeo = new THREE.BoxGeometry(ts, 0.4, ts);
    const sidewalkGeo = new THREE.BoxGeometry(ts, 0.5, ts);
    const waterGeo = new THREE.BoxGeometry(ts, 0.2, ts);

    type Batch = { positions: THREE.Vector3[]; colors: number[]; scalesY: number[] };
    const buildings: Batch = { positions: [], colors: [], scalesY: [] };
    const roads: Batch = { positions: [], colors: [], scalesY: [] };
    const sidewalks: Batch = { positions: [], colors: [], scalesY: [] };
    const waters: Batch = { positions: [], colors: [], scalesY: [] };
    const parks: Batch = { positions: [], colors: [], scalesY: [] };

    for (let ty = 0; ty < world.height; ty += 1) {
      for (let tx = 0; tx < world.width; tx += 1) {
        const tile = world.tiles[ty * world.width + tx]!;
        const d = districtAt(world, tx, ty);
        const x = tx * ts + ts / 2;
        const z = ty * ts + ts / 2;
        if (tile === Tile.Building) {
          const hash = (tx * 17 + ty * 31) & 255;
          const h = 18 + (hash % 28) + (d?.id === "midstack" ? 12 : 0);
          let color = 0x6e6858;
          if (d?.id === "pier-ward") color = 0x4a6478;
          else if (d?.id === "ridge-hollow") color = 0x8a7250;
          else if (d?.id === "freight-cut") color = 0x8a5a38;
          else if (d?.id === "greenbelt") color = 0x4a6e42;
          buildings.positions.push(new THREE.Vector3(x, h / 2, z));
          buildings.colors.push(color);
          buildings.scalesY.push(h);
        } else if (tile === Tile.Road) {
          const cls = world.roadClass[ty * world.width + tx] ?? RoadClass.Local;
          let color = 0x3a3a44;
          if (cls === RoadClass.Arterial) color = 0x32323c;
          if (cls === RoadClass.Freeway) color = 0x282830;
          roads.positions.push(new THREE.Vector3(x, 0.2, z));
          roads.colors.push(color);
          roads.scalesY.push(1);
        } else if (tile === Tile.Sidewalk || tile === Tile.Plaza) {
          sidewalks.positions.push(new THREE.Vector3(x, 0.25, z));
          sidewalks.colors.push(tile === Tile.Plaza ? 0x505060 : 0x585860);
          sidewalks.scalesY.push(1);
        } else if (tile === Tile.Water) {
          waters.positions.push(new THREE.Vector3(x, 0.05, z));
          waters.colors.push(0x1e4a6a);
          waters.scalesY.push(1);
        } else if (tile === Tile.Park || tile === Tile.Grass) {
          parks.positions.push(new THREE.Vector3(x, 0.15, z));
          parks.colors.push(tile === Tile.Park ? 0x2f5e34 : d?.groundColor ?? 0x2a3828);
          parks.scalesY.push(1);
        } else if (tile === Tile.Fence) {
          const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(ts * 0.9, 10, ts * 0.35),
            new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 0.7 }),
          );
          mesh.position.set(x, 5, z);
          this.root.add(mesh);
        }
      }
    }

    this.addInstanced(buildingGeo, buildings, true);
    this.addInstanced(roadGeo, roads, false);
    this.addInstanced(sidewalkGeo, sidewalks, false);
    this.addInstanced(waterGeo, waters, false);
    this.addInstanced(new THREE.BoxGeometry(ts, 0.3, ts), parks, false);
  }

  private addInstanced(geo: THREE.BufferGeometry, batch: {
    positions: THREE.Vector3[];
    colors: number[];
    scalesY: number[];
  }, scaleY: boolean): void {
    if (!this.root || batch.positions.length === 0) return;
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.85,
      metalness: 0.05,
      vertexColors: true,
    });
    const mesh = new THREE.InstancedMesh(geo, mat, batch.positions.length);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < batch.positions.length; i += 1) {
      const p = batch.positions[i]!;
      dummy.position.copy(p);
      if (scaleY) {
        dummy.scale.set(1, batch.scalesY[i]!, 1);
        // BoxGeometry is centered; position.y already at half height for unit scale —
        // with scaleY, keep center at half of scaled height.
        dummy.position.y = batch.scalesY[i]! / 2;
      } else {
        dummy.scale.set(1, 1, 1);
      }
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
      if (c instanceof THREE.Mesh) {
        c.geometry.dispose();
        const m = c.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m.dispose();
      }
      if (c instanceof THREE.InstancedMesh) {
        c.geometry.dispose();
        const m = c.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m.dispose();
      }
    });
  }
}
