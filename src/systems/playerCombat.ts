import { COMBAT, type CombatantState } from "./combatTypes";

export function createPlayerCombat(maxHealth: number): CombatantState {
  return {
    health: maxHealth,
    maxHealth,
    iFrameUntil: 0,
    facing: 0,
    ammo: COMBAT.startAmmo,
    maxAmmo: COMBAT.maxAmmo,
    fireCooldownUntil: 0,
    meleeCooldownUntil: 0,
    flashUntil: 0,
  };
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
  return state.ammo > 0 && nowMs >= state.fireCooldownUntil && state.health > 0;
}

export function canMelee(state: CombatantState, nowMs: number): boolean {
  return nowMs >= state.meleeCooldownUntil && state.health > 0;
}

export function consumeRangedShot(state: CombatantState, nowMs: number): void {
  state.ammo = Math.max(0, state.ammo - 1);
  state.fireCooldownUntil = nowMs + COMBAT.fireCooldownMs;
}

export function consumeMelee(state: CombatantState, nowMs: number): void {
  state.meleeCooldownUntil = nowMs + COMBAT.meleeCooldownMs;
}

export function facingFromPoints(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): number {
  return Math.atan2(toY - fromY, toX - fromX);
}
