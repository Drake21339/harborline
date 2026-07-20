export type WeaponId = "melee" | "pistol" | "smg" | "shotgun";

export interface WeaponDef {
  id: WeaponId;
  label: string;
  damage: number;
  range: number;
  cooldownMs: number;
  /** Ammo consumed per trigger pull (0 for melee). */
  ammoPerShot: number;
  projectileSpeed: number;
  /** Radians of random spread per pellet. */
  spread: number;
  pellets: number;
  isMelee: boolean;
  startAmmo: number;
  maxAmmo: number;
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  melee: {
    id: "melee",
    label: "Fists",
    damage: 22,
    range: 42,
    cooldownMs: 380,
    ammoPerShot: 0,
    projectileSpeed: 0,
    spread: 0,
    pellets: 0,
    isMelee: true,
    startAmmo: 0,
    maxAmmo: 0,
  },
  pistol: {
    id: "pistol",
    label: "Pistol",
    damage: 18,
    range: 420,
    cooldownMs: 280,
    ammoPerShot: 1,
    projectileSpeed: 520,
    spread: 0.02,
    pellets: 1,
    isMelee: false,
    startAmmo: 24,
    maxAmmo: 48,
  },
  smg: {
    id: "smg",
    label: "SMG",
    damage: 10,
    range: 360,
    cooldownMs: 110,
    ammoPerShot: 1,
    projectileSpeed: 560,
    spread: 0.08,
    pellets: 1,
    isMelee: false,
    startAmmo: 40,
    maxAmmo: 90,
  },
  shotgun: {
    id: "shotgun",
    label: "Shotgun",
    damage: 12,
    range: 220,
    cooldownMs: 700,
    ammoPerShot: 1,
    projectileSpeed: 480,
    spread: 0.18,
    pellets: 5,
    isMelee: false,
    startAmmo: 8,
    maxAmmo: 24,
  },
};

export const WEAPON_ORDER: WeaponId[] = ["melee", "pistol", "smg", "shotgun"];

export interface WeaponInventory {
  owned: Record<WeaponId, boolean>;
  ammo: Record<WeaponId, number>;
  active: WeaponId;
}

export function createWeaponInventory(): WeaponInventory {
  return {
    owned: {
      melee: true,
      pistol: true,
      smg: false,
      shotgun: false,
    },
    ammo: {
      melee: 0,
      pistol: WEAPONS.pistol.startAmmo,
      smg: 0,
      shotgun: 0,
    },
    active: "pistol",
  };
}

export function grantWeapon(inv: WeaponInventory, id: WeaponId, ammoBonus = 0): void {
  inv.owned[id] = true;
  const def = WEAPONS[id];
  inv.ammo[id] = Math.min(def.maxAmmo, inv.ammo[id] + (ammoBonus || def.startAmmo));
}

export function addAmmo(inv: WeaponInventory, id: WeaponId, amount: number): void {
  const def = WEAPONS[id];
  if (def.isMelee) return;
  inv.ammo[id] = Math.min(def.maxAmmo, inv.ammo[id] + amount);
}

export function selectWeapon(inv: WeaponInventory, id: WeaponId): boolean {
  if (!inv.owned[id]) return false;
  inv.active = id;
  return true;
}

export function cycleWeapon(inv: WeaponInventory, dir: 1 | -1): WeaponId {
  const owned = WEAPON_ORDER.filter((id) => inv.owned[id]);
  if (owned.length === 0) return inv.active;
  const idx = owned.indexOf(inv.active);
  const next = owned[(idx + dir + owned.length) % owned.length]!;
  inv.active = next;
  return next;
}

export function activeWeaponDef(inv: WeaponInventory): WeaponDef {
  return WEAPONS[inv.active];
}
