import Phaser from "phaser";
import { SeededRng } from "../config/seededRng";
import type { NavEdge } from "../world/navGraph";
import { nearestNode, pickOutgoingEdge } from "../world/navGraph";
import type { GeneratedWorld } from "../world/types";
import { CIVILIAN, CIVILIAN_CAPS } from "./civilianConfig";
import { graphCivilianStep } from "./civilianMove";

interface Agent {
  id: string;
  view: Phaser.GameObjects.Rectangle;
  x: number;
  y: number;
  heading: number;
  kind: "ped" | "car";
  fleeingUntil: number;
  active: boolean;
  wasFleeing: boolean;
  edge: NavEdge | null;
  t: number;
  destNodeId: number | null;
}

export class CivilianRuntime {
  private readonly peds: Agent[] = [];
  private readonly cars: Agent[] = [];
  private readonly rng: SeededRng;
  private sirenUntil = 0;
  private overlayVisible = true;
  /** Rolling counters for tile-bias / graph proof (debug / tests). */
  readonly bias = {
    pedPreferred: 0,
    pedTotal: 0,
    carPreferred: 0,
    carTotal: 0,
  };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly world: GeneratedWorld,
  ) {
    this.rng = new SeededRng(`${world.seed}:civilians`);
    this.bootstrapPool();
  }

  get counts(): { pedestrians: number; traffic: number; fleeing: number } {
    const now = this.scene.time.now;
    return {
      pedestrians: this.peds.filter((a) => a.active).length,
      traffic: this.cars.filter((a) => a.active).length,
      fleeing: [...this.peds, ...this.cars].filter((a) => a.active && now < a.fleeingUntil).length,
    };
  }

  /** Active agent poses for 3D sync / debug. */
  get poses(): Array<{
    id: string;
    x: number;
    y: number;
    heading: number;
    kind: "ped" | "car";
    fleeing: boolean;
  }> {
    const now = this.scene.time.now;
    return [...this.peds, ...this.cars]
      .filter((a) => a.active)
      .map((a) => ({
        id: a.id,
        x: a.x,
        y: a.y,
        heading: a.heading,
        kind: a.kind,
        fleeing: now < a.fleeingUntil,
      }));
  }

  signalDanger(x: number, y: number, now: number, radius: number = CIVILIAN.reactRadius): void {
    for (const a of [...this.peds, ...this.cars]) {
      if (!a.active) continue;
      if (Math.hypot(a.x - x, a.y - y) <= radius) {
        a.fleeingUntil = now + CIVILIAN.fleeDurationMs;
        a.heading = Math.atan2(a.y - y, a.x - x);
        a.edge = null;
        a.t = 0;
        a.destNodeId = null;
      }
    }
  }

  signalSiren(now: number, durationMs = 3000): void {
    this.sirenUntil = now + durationMs;
  }

  setOverlayVisible(visible: boolean): void {
    this.overlayVisible = visible;
    for (const a of [...this.peds, ...this.cars]) {
      a.view.setAlpha(visible && a.active ? 1 : 0);
    }
  }

  update(now: number, focusX: number, focusY: number, dtSec: number): void {
    this.maintainPopulation(focusX, focusY);
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
    const worldW = this.world.width * this.world.tileSize;
    const worldH = this.world.height * this.world.tileSize;

    const stepped = graphCivilianStep({
      state: {
        x: a.x,
        y: a.y,
        heading: a.heading,
        edge: a.edge,
        t: a.t,
        destNodeId: a.destNodeId,
      },
      graph: this.world.nav,
      kind: a.kind,
      speed,
      dtSec,
      fleeing,
      worldW,
      worldH,
      rng: () => this.rng.next(),
    });

    a.x = stepped.x;
    a.y = stepped.y;
    a.heading = stepped.heading;
    a.edge = stepped.edge;
    a.t = stepped.t;
    a.destNodeId = stepped.destNodeId;

    if (a.kind === "ped") {
      this.bias.pedTotal += 1;
      if (stepped.preferred) this.bias.pedPreferred += 1;
    } else {
      this.bias.carTotal += 1;
      if (stepped.preferred) this.bias.carPreferred += 1;
    }

    a.view.setPosition(a.x, a.y);
    a.view.setRotation(a.kind === "car" ? a.heading : 0);
    if (!this.overlayVisible) {
      a.view.setAlpha(0);
      a.wasFleeing = fleeing;
      return;
    }
    if (fleeing) {
      const pulse = 0.75 + 0.25 * Math.sin(now / 70);
      a.view.setFillStyle(0xff7a33);
      a.view.setAlpha(pulse);
      a.view.setScale(a.kind === "car" ? 1.08 : 1.2);
      if (!a.wasFleeing) {
        const burst = this.scene.add.circle(a.x, a.y, 14, 0xffcc66, 0.55).setDepth(5);
        this.scene.tweens.add({
          targets: burst,
          alpha: 0,
          scale: 2.2,
          duration: 280,
          onComplete: () => burst.destroy(),
        });
      }
    } else {
      a.view.setFillStyle(a.kind === "car" ? 0x9aa3b5 : 0xb8c4a8);
      a.view.setAlpha(1);
      a.view.setScale(1);
    }
    a.wasFleeing = fleeing;
  }

  private maintainPopulation(focusX: number, focusY: number): void {
    for (const a of [...this.peds, ...this.cars]) {
      if (!a.active) continue;
      if (Math.hypot(a.x - focusX, a.y - focusY) > CIVILIAN.cullRadius) {
        a.active = false;
        a.view.setVisible(false);
        a.edge = null;
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
    const graphKind = kind === "car" ? "vehicle" : "ped";
    const edges = kind === "car" ? this.world.nav.vehicleEdges : this.world.nav.pedEdges;
    if (edges.length === 0) return;

    for (let attempt = 0; attempt < 16; attempt += 1) {
      const edge = edges[this.rng.nextInt(0, edges.length)]!;
      const from = this.world.nav.nodes[edge.from]!;
      const to = this.world.nav.nodes[edge.to]!;
      const tt = this.rng.next();
      const x = from.x + (to.x - from.x) * tt;
      const y = from.y + (to.y - from.y) * tt;
      // Keep spawns off the map rim.
      const worldW = this.world.width * this.world.tileSize;
      const worldH = this.world.height * this.world.tileSize;
      if (x < 64 || y < 64 || x > worldW - 64 || y > worldH - 64) continue;
      const d = Math.hypot(x - focusX, y - focusY);
      if (d < 120 || d > CIVILIAN.spawnRadius) continue;
      slot.x = x;
      slot.y = y;
      slot.heading = Math.atan2(to.y - from.y, to.x - from.x);
      slot.edge = edge;
      slot.t = tt;
      slot.destNodeId = edge.to;
      slot.fleeingUntil = 0;
      slot.wasFleeing = false;
      slot.active = true;
      slot.view.setVisible(true);
      slot.view.setPosition(x, y);
      slot.view.setScale(1);
      slot.view.setAlpha(1);
      // Soft spacing: nudge if too close to another active of same kind.
      for (const other of pool) {
        if (!other.active || other === slot) continue;
        if (Math.hypot(other.x - slot.x, other.y - slot.y) < 28) {
          slot.t = Math.min(0.95, slot.t + 0.2);
          const nfrom = this.world.nav.nodes[edge.from]!;
          const nto = this.world.nav.nodes[edge.to]!;
          slot.x = nfrom.x + (nto.x - nfrom.x) * slot.t;
          slot.y = nfrom.y + (nto.y - nfrom.y) * slot.t;
        }
      }
      // Ensure we have a valid outgoing path from nearest node.
      const node = nearestNode(this.world.nav, slot.x, slot.y, graphKind);
      if (node && !slot.edge) {
        slot.edge = pickOutgoingEdge(
          this.world.nav,
          node.id,
          graphKind,
          slot.heading,
          () => this.rng.next(),
        );
      }
      return;
    }
  }

  private bootstrapPool(): void {
    for (let i = 0; i < CIVILIAN_CAPS.pedestrians; i += 1) {
      // Person-sized (~14×14 on 32px tiles).
      const view = this.scene.add.rectangle(0, 0, 14, 14, 0xb8c4a8).setDepth(6).setVisible(false);
      this.peds.push({
        id: `ped-${i}`,
        view,
        x: 0,
        y: 0,
        heading: 0,
        kind: "ped",
        fleeingUntil: 0,
        active: false,
        wasFleeing: false,
        edge: null,
        t: 0,
        destNodeId: null,
      });
    }
    for (let i = 0; i < CIVILIAN_CAPS.traffic; i += 1) {
      // Car-sized (~48×24).
      const view = this.scene.add.rectangle(0, 0, 48, 24, 0x9aa3b5).setDepth(7).setVisible(false);
      this.cars.push({
        id: `car-${i}`,
        view,
        x: 0,
        y: 0,
        heading: 0,
        kind: "car",
        fleeingUntil: 0,
        active: false,
        wasFleeing: false,
        edge: null,
        t: 0,
        destNodeId: null,
      });
    }
  }
}
