import Phaser from "phaser";
import { SeededRng } from "../config/seededRng";
import { Tile } from "../world/tileTypes";
import type { GeneratedWorld } from "../world/types";
import { tileAt } from "../world/types";
import { CIVILIAN, CIVILIAN_CAPS } from "./civilianConfig";

interface Agent {
  view: Phaser.GameObjects.Rectangle;
  x: number;
  y: number;
  heading: number;
  kind: "ped" | "car";
  fleeingUntil: number;
  active: boolean;
}

export class CivilianRuntime {
  private readonly peds: Agent[] = [];
  private readonly cars: Agent[] = [];
  private readonly rng: SeededRng;
  private readonly roadCells: Array<{ x: number; y: number }> = [];
  private readonly walkCells: Array<{ x: number; y: number }> = [];
  private sirenUntil = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly world: GeneratedWorld,
  ) {
    this.rng = new SeededRng(`${world.seed}:civilians`);
    this.indexWalkable();
    this.bootstrapPool();
  }

  get counts(): { pedestrians: number; traffic: number } {
    return {
      pedestrians: this.peds.filter((a) => a.active).length,
      traffic: this.cars.filter((a) => a.active).length,
    };
  }

  /** Call when player fires / explosion / heat siren nearby. */
  signalDanger(x: number, y: number, now: number, radius: number = CIVILIAN.reactRadius): void {
    for (const a of [...this.peds, ...this.cars]) {
      if (!a.active) continue;
      if (Math.hypot(a.x - x, a.y - y) <= radius) {
        a.fleeingUntil = now + CIVILIAN.fleeDurationMs;
        a.heading = Math.atan2(a.y - y, a.x - x);
      }
    }
  }

  signalSiren(now: number, durationMs = 3000): void {
    this.sirenUntil = now + durationMs;
  }

  update(now: number, focusX: number, focusY: number, dtSec: number): void {
    this.maintainPopulation(focusX, focusY, now);
    const siren = now < this.sirenUntil;
    for (const a of this.peds) {
      if (!a.active) continue;
      this.stepAgent(a, now, siren, dtSec, CIVILIAN.pedSpeed, CIVILIAN.pedFleeSpeed);
    }
    for (const a of this.cars) {
      if (!a.active) continue;
      this.stepAgent(a, now, siren, dtSec, CIVILIAN.trafficSpeed, CIVILIAN.trafficFleeSpeed);
    }
  }

  private stepAgent(
    a: Agent,
    now: number,
    siren: boolean,
    dtSec: number,
    walk: number,
    flee: number,
  ): void {
    if (siren && a.fleeingUntil < now) {
      a.fleeingUntil = now + CIVILIAN.fleeDurationMs;
    }
    const fleeing = now < a.fleeingUntil;
    const speed = fleeing ? flee : walk;
    if (!fleeing && this.rng.next() < 0.01) {
      a.heading += (this.rng.next() - 0.5) * 1.2;
    }
    a.x += Math.cos(a.heading) * speed * dtSec;
    a.y += Math.sin(a.heading) * speed * dtSec;

    const max = this.world.width * this.world.tileSize - 4;
    a.x = Math.max(4, Math.min(max, a.x));
    a.y = Math.max(4, Math.min(max, a.y));

    // Soft avoid solids by bouncing heading.
    const t = tileAt(
      this.world,
      Math.floor(a.x / this.world.tileSize),
      Math.floor(a.y / this.world.tileSize),
    );
    if (t === Tile.Building || t === Tile.Water || t === Tile.Fence) {
      a.heading += Math.PI * 0.6;
      a.x += Math.cos(a.heading) * 10;
      a.y += Math.sin(a.heading) * 10;
    }

    a.view.setPosition(a.x, a.y);
    a.view.setRotation(a.kind === "car" ? a.heading : 0);
    a.view.setFillStyle(fleeing ? 0xffaa66 : a.kind === "car" ? 0x9aa3b5 : 0xb8c4a8);
  }

  private maintainPopulation(focusX: number, focusY: number, _now: number): void {
    for (const a of [...this.peds, ...this.cars]) {
      if (!a.active) continue;
      if (Math.hypot(a.x - focusX, a.y - focusY) > CIVILIAN.cullRadius) {
        a.active = false;
        a.view.setVisible(false);
      }
    }

    const activePeds = this.peds.filter((a) => a.active).length;
    const activeCars = this.cars.filter((a) => a.active).length;
    for (let i = activePeds; i < CIVILIAN_CAPS.pedestrians; i += 1) {
      this.activateNear("ped", focusX, focusY);
    }
    for (let i = activeCars; i < CIVILIAN_CAPS.traffic; i += 1) {
      this.activateNear("car", focusX, focusY);
    }
  }

  private activateNear(kind: "ped" | "car", focusX: number, focusY: number): void {
    const pool = kind === "ped" ? this.peds : this.cars;
    const slot = pool.find((a) => !a.active);
    if (!slot) return;
    const cells = kind === "car" ? this.roadCells : this.walkCells;
    if (cells.length === 0) return;

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const cell = cells[this.rng.nextInt(0, cells.length)]!;
      const x = cell.x * this.world.tileSize + this.world.tileSize / 2;
      const y = cell.y * this.world.tileSize + this.world.tileSize / 2;
      const d = Math.hypot(x - focusX, y - focusY);
      if (d < 120 || d > CIVILIAN.spawnRadius) continue;
      slot.x = x;
      slot.y = y;
      slot.heading = this.rng.next() * Math.PI * 2;
      slot.fleeingUntil = 0;
      slot.active = true;
      slot.view.setVisible(true);
      slot.view.setPosition(x, y);
      return;
    }
  }

  private bootstrapPool(): void {
    for (let i = 0; i < CIVILIAN_CAPS.pedestrians; i += 1) {
      const view = this.scene.add.rectangle(0, 0, 10, 10, 0xb8c4a8).setDepth(6).setVisible(false);
      this.peds.push({
        view,
        x: 0,
        y: 0,
        heading: 0,
        kind: "ped",
        fleeingUntil: 0,
        active: false,
      });
    }
    for (let i = 0; i < CIVILIAN_CAPS.traffic; i += 1) {
      const view = this.scene.add.rectangle(0, 0, 22, 12, 0x9aa3b5).setDepth(7).setVisible(false);
      this.cars.push({
        view,
        x: 0,
        y: 0,
        heading: 0,
        kind: "car",
        fleeingUntil: 0,
        active: false,
      });
    }
  }

  private indexWalkable(): void {
    const w = this.world.width;
    const h = this.world.height;
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const t = tileAt(this.world, x, y);
        if (t === Tile.Road) this.roadCells.push({ x, y });
        if (t === Tile.Sidewalk || t === Tile.Plaza || t === Tile.Park || t === Tile.Grass) {
          this.walkCells.push({ x, y });
        }
      }
    }
  }
}
