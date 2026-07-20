export type VehicleArchetypeId =
  | "compact"
  | "sedan"
  | "sports"
  | "van"
  | "taxi"
  | "police"
  | "ambulance";

export interface VehicleDef {
  id: VehicleArchetypeId;
  label: string;
  color: number;
  /** Length along heading (px) — ~1.5–2 tiles. */
  width: number;
  /** Width across lane (px) — ~one lane on a 2-lane road. */
  height: number;
  maxSpeed: number;
  accel: number;
  reverse: number;
  steer: number;
  grip: number;
  mass: number;
  durability: number;
  collisionDamage: number;
  enginePitchMin: number;
  enginePitchMax: number;
}

/** Harborline vehicle archetypes — original labels, no IP names. */
export const VEHICLE_DEFS: Record<VehicleArchetypeId, VehicleDef> = {
  compact: {
    id: "compact",
    label: "Compact",
    color: 0xe24a4a,
    width: 48,
    height: 24,
    maxSpeed: 220,
    accel: 260,
    reverse: 140,
    steer: 2.8,
    grip: 0.92,
    mass: 0.9,
    durability: 90,
    collisionDamage: 12,
    enginePitchMin: 0.8,
    enginePitchMax: 1.4,
  },
  sedan: {
    id: "sedan",
    label: "Sedan",
    color: 0xc8d0dc,
    width: 56,
    height: 26,
    maxSpeed: 240,
    accel: 240,
    reverse: 130,
    steer: 2.5,
    grip: 0.9,
    mass: 1.0,
    durability: 110,
    collisionDamage: 14,
    enginePitchMin: 0.75,
    enginePitchMax: 1.35,
  },
  sports: {
    id: "sports",
    label: "Sports",
    color: 0x2a6aff,
    width: 52,
    height: 24,
    maxSpeed: 320,
    accel: 360,
    reverse: 150,
    steer: 3.2,
    grip: 0.95,
    mass: 0.85,
    durability: 80,
    collisionDamage: 16,
    enginePitchMin: 0.9,
    enginePitchMax: 1.7,
  },
  van: {
    id: "van",
    label: "Van",
    color: 0x3a8a5a,
    width: 62,
    height: 30,
    maxSpeed: 190,
    accel: 180,
    reverse: 110,
    steer: 2.0,
    grip: 0.85,
    mass: 1.35,
    durability: 140,
    collisionDamage: 18,
    enginePitchMin: 0.65,
    enginePitchMax: 1.2,
  },
  taxi: {
    id: "taxi",
    label: "Harbor Cab",
    color: 0xf0c040,
    width: 56,
    height: 26,
    maxSpeed: 230,
    accel: 230,
    reverse: 130,
    steer: 2.6,
    grip: 0.9,
    mass: 1.05,
    durability: 105,
    collisionDamage: 13,
    enginePitchMin: 0.7,
    enginePitchMax: 1.3,
  },
  police: {
    id: "police",
    label: "Patrol",
    color: 0x3a5cff,
    width: 56,
    height: 26,
    maxSpeed: 270,
    accel: 280,
    reverse: 140,
    steer: 2.7,
    grip: 0.93,
    mass: 1.1,
    durability: 130,
    collisionDamage: 15,
    enginePitchMin: 0.75,
    enginePitchMax: 1.5,
  },
  ambulance: {
    id: "ambulance",
    label: "Medic Van",
    color: 0xe8e8e8,
    width: 60,
    height: 28,
    maxSpeed: 240,
    accel: 220,
    reverse: 120,
    steer: 2.3,
    grip: 0.88,
    mass: 1.25,
    durability: 120,
    collisionDamage: 14,
    enginePitchMin: 0.7,
    enginePitchMax: 1.35,
  },
};

export const VEHICLE_ARCHETYPE_ORDER: VehicleArchetypeId[] = [
  "compact",
  "sedan",
  "sports",
  "van",
  "taxi",
  "police",
  "ambulance",
];
