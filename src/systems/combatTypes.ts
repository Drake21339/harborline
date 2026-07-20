export interface CombatantState {
  health: number;
  maxHealth: number;
  iFrameUntil: number;
  facing: number;
  ammo: number;
  maxAmmo: number;
  fireCooldownUntil: number;
  meleeCooldownUntil: number;
  flashUntil: number;
}

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
