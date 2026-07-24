/** HD pixel atlas keys + frame maps for Pier Ward slice (GPT sheets). */
import type Phaser from "phaser";

export const PIXEL_ATLAS = {
  carsCiv: "cars-civ",
  carsPolice: "cars-police",
  carsEmergency: "cars-emergency",
  civilians: "civilians",
  swat: "swat",
} as const;

/**
 * Archetype → atlas frame. Indices match docs/art/PIXEL-ATLAS-MAP.md
 * after scripts/slice-gpt-refs.py.
 */
export const VEHICLE_FRAME: Record<string, { atlas: string; frame: number }> = {
  compact: { atlas: PIXEL_ATLAS.carsCiv, frame: 0 },
  taxi: { atlas: PIXEL_ATLAS.carsCiv, frame: 1 },
  sports: { atlas: PIXEL_ATLAS.carsCiv, frame: 2 },
  van: { atlas: PIXEL_ATLAS.carsCiv, frame: 3 },
  sedan: { atlas: PIXEL_ATLAS.carsCiv, frame: 8 }, // luxury black sedan stand-in
  police: { atlas: PIXEL_ATLAS.carsPolice, frame: 0 },
  ambulance: { atlas: PIXEL_ATLAS.carsEmergency, frame: 6 },
};

/** Traffic NPC frames from cars-civ (skip fleet-primary indices). */
export const TRAFFIC_FRAMES = [3, 4, 5, 6, 7, 8, 9] as const;

/** Must match public/art/atlases/frame-sizes.json from slice-gpt-refs.py */
const CAR_FRAME = { frameWidth: 516, frameHeight: 282 };
const SWAT_FRAME = { frameWidth: 254, frameHeight: 160 };
const PED_FRAME = { frameWidth: 152, frameHeight: 254 };

export function loadPixelAtlases(scene: Phaser.Scene): void {
  const base = "art/atlases";
  scene.load.spritesheet(PIXEL_ATLAS.carsCiv, `${base}/cars-civ.png`, CAR_FRAME);
  scene.load.spritesheet(PIXEL_ATLAS.carsPolice, `${base}/cars-police.png`, CAR_FRAME);
  scene.load.spritesheet(PIXEL_ATLAS.carsEmergency, `${base}/cars-emergency.png`, CAR_FRAME);
  scene.load.spritesheet(PIXEL_ATLAS.civilians, `${base}/civilians.png`, PED_FRAME);
  scene.load.spritesheet(PIXEL_ATLAS.swat, `${base}/swat.png`, SWAT_FRAME);
}
