import type { CombatantState } from "./combatTypes";
import { COMBAT } from "./combatTypes";

export type PickupKind = "health" | "ammo" | "cash" | "repair";

export interface WalletState {
  cash: number;
  score: number;
}

export interface PickupDef {
  id: string;
  kind: PickupKind;
  x: number;
  y: number;
  amount: number;
  respawnMs: number;
}

export interface PickupRuntimeState extends PickupDef {
  availableAt: number;
  collected: boolean;
}

export function createWallet(): WalletState {
  return { cash: 0, score: 0 };
}

export function applyPickupToPlayer(
  kind: PickupKind,
  amount: number,
  combat: CombatantState,
  wallet: WalletState,
): { vehicleRepair: number } {
  if (kind === "health") {
    combat.health = Math.min(combat.maxHealth, combat.health + amount);
  } else if (kind === "ammo") {
    combat.ammo = Math.min(combat.maxAmmo, combat.ammo + amount);
  } else if (kind === "cash") {
    wallet.cash += amount;
    wallet.score += amount;
  }
  return { vehicleRepair: kind === "repair" ? amount : 0 };
}

export function tryCollectPickup(
  p: PickupRuntimeState,
  now: number,
  playerX: number,
  playerY: number,
  radius: number,
): boolean {
  if (p.collected && now < p.availableAt) return false;
  if (Math.hypot(p.x - playerX, p.y - playerY) > radius) return false;
  p.collected = true;
  p.availableAt = now + p.respawnMs;
  return true;
}

export function refreshPickups(pickups: PickupRuntimeState[], now: number): void {
  for (const p of pickups) {
    if (p.collected && now >= p.availableAt) {
      p.collected = false;
    }
  }
}

export function defaultPlazaPickups(spawnX: number, spawnY: number): PickupRuntimeState[] {
  const defs: PickupDef[] = [
    { id: "hp1", kind: "health", x: spawnX - 40, y: spawnY - 50, amount: 35, respawnMs: 12000 },
    { id: "ammo1", kind: "ammo", x: spawnX + 70, y: spawnY - 55, amount: 12, respawnMs: 10000 },
    { id: "cash1", kind: "cash", x: spawnX - 70, y: spawnY + 55, amount: 50, respawnMs: 15000 },
    { id: "repair1", kind: "repair", x: spawnX + 55, y: spawnY + 70, amount: 40, respawnMs: 18000 },
  ];
  return defs.map((d) => ({ ...d, availableAt: 0, collected: false }));
}

export function isAtSafehouse(
  playerX: number,
  playerY: number,
  safeX: number,
  safeY: number,
  radius = 48,
): boolean {
  return Math.hypot(playerX - safeX, playerY - safeY) <= radius;
}

export function respawnAtSafehouse(combat: CombatantState, safeX: number, safeY: number): {
  x: number;
  y: number;
} {
  combat.health = combat.maxHealth;
  combat.ammo = Math.max(combat.ammo, Math.floor(COMBAT.startAmmo / 2));
  combat.iFrameUntil = 0;
  combat.flashUntil = 0;
  return { x: safeX, y: safeY };
}
