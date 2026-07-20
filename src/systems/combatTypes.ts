import type { WeaponId, WeaponInventory } from "./weapons";
import { createWeaponInventory } from "./weapons";

export interface CombatantState {
  health: number;
  maxHealth: number;
  iFrameUntil: number;
  facing: number;
  /** Convenience mirror of active weapon ammo for HUD/debug/save. */
  ammo: number;
  maxAmmo: number;
  fireCooldownUntil: number;
  meleeCooldownUntil: number;
  flashUntil: number;
  weapons: WeaponInventory;
}

/** Shared non-weapon combat constants (i-frames, flash). Legacy aliases kept for older call sites. */
export const COMBAT = {
  rangedDamage: 18,
  meleeDamage: 22,
  rangedRange: 420,
  meleeRange: 42,
  fireCooldownMs: 280,
  meleeCooldownMs: 380,
  iFrameMs: 650,
  flashMs: 120,
  startAmmo: 24,
  maxAmmo: 48,
  projectileSpeed: 520,
} as const;

export function syncAmmoMirror(state: CombatantState): void {
  const w = state.weapons;
  const id = w.active;
  state.ammo = w.ammo[id];
  state.maxAmmo = id === "melee" ? 0 : (id === "pistol" ? 48 : id === "smg" ? 90 : 24);
}

export function mirrorFromWeapons(state: CombatantState): void {
  syncAmmoMirror(state);
}

export type { WeaponId };
export { createWeaponInventory };
