import { COMBAT, syncAmmoMirror, type CombatantState } from "./combatTypes";
import { activeWeaponDef, createWeaponInventory } from "./weapons";

export function createPlayerCombat(maxHealth: number): CombatantState {
  const weapons = createWeaponInventory();
  const state: CombatantState = {
    health: maxHealth,
    maxHealth,
    iFrameUntil: 0,
    facing: 0,
    ammo: weapons.ammo.pistol,
    maxAmmo: 48,
    fireCooldownUntil: 0,
    meleeCooldownUntil: 0,
    flashUntil: 0,
    weapons,
  };
  syncAmmoMirror(state);
  return state;
}

export function applyDamage(
  state: CombatantState,
  amount: number,
  nowMs: number,
): { applied: boolean; killed: boolean } {
  if (nowMs < state.iFrameUntil) {
    return { applied: false, killed: false };
  }
  if (state.health <= 0) {
    return { applied: false, killed: true };
  }
  state.health = Math.max(0, state.health - amount);
  state.iFrameUntil = nowMs + COMBAT.iFrameMs;
  state.flashUntil = nowMs + COMBAT.flashMs;
  return { applied: true, killed: state.health <= 0 };
}

export function canFireRanged(state: CombatantState, nowMs: number): boolean {
  const def = activeWeaponDef(state.weapons);
  if (def.isMelee) return false;
  return (
    state.weapons.ammo[def.id] >= def.ammoPerShot &&
    nowMs >= state.fireCooldownUntil &&
    state.health > 0
  );
}

export function canMelee(state: CombatantState, nowMs: number): boolean {
  if (state.health <= 0 || nowMs < state.meleeCooldownUntil) return false;
  const def = activeWeaponDef(state.weapons);
  if (def.isMelee) return true;
  // Melee fallback when the active gun is dry.
  return state.weapons.ammo[def.id] <= 0;
}

export function consumeRangedShot(state: CombatantState, nowMs: number): void {
  const def = activeWeaponDef(state.weapons);
  if (def.isMelee) return;
  state.weapons.ammo[def.id] = Math.max(0, state.weapons.ammo[def.id] - def.ammoPerShot);
  state.fireCooldownUntil = nowMs + def.cooldownMs;
  syncAmmoMirror(state);
}

export function consumeMelee(state: CombatantState, nowMs: number): void {
  const def = activeWeaponDef(state.weapons);
  const cd = def.isMelee ? def.cooldownMs : COMBAT.meleeCooldownMs;
  state.meleeCooldownUntil = nowMs + cd;
}

export function facingFromPoints(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): number {
  return Math.atan2(toY - fromY, toX - fromX);
}

/** Keyboard-only aim: face move vector; keep last facing when standing still. */
export function facingFromMove(vx: number, vy: number, fallback: number): number {
  if (vx === 0 && vy === 0) return fallback;
  return Math.atan2(vy, vx);
}
