/** HD pixel atlas keys + frame maps for Pier Ward slice. */
import type Phaser from "phaser";

export const PIXEL_ATLAS = {
  carsCiv: "cars-civ",
  carsPolice: "cars-police",
  carsEmergency: "cars-emergency",
  civilians: "civilians",
  swat: "swat",
} as const;

/** Archetype → cars-civ / police / emergency frame index. */
export const VEHICLE_FRAME: Record<string, { atlas: string; frame: number }> = {
  compact: { atlas: PIXEL_ATLAS.carsCiv, frame: 0 },
  sedan: { atlas: PIXEL_ATLAS.carsCiv, frame: 1 },
  sports: { atlas: PIXEL_ATLAS.carsCiv, frame: 2 },
  van: { atlas: PIXEL_ATLAS.carsCiv, frame: 3 },
  taxi: { atlas: PIXEL_ATLAS.carsCiv, frame: 9 },
  police: { atlas: PIXEL_ATLAS.carsPolice, frame: 0 },
  ambulance: { atlas: PIXEL_ATLAS.carsEmergency, frame: 0 },
};

export const TRAFFIC_FRAMES = [1, 3, 4, 5, 6, 7, 8] as const;

/** Must match scripts/generate-pixel-atlases.py cell sizes (content + pad). */
const CAR_FRAME = { frameWidth: 116, frameHeight: 72 };
const PED_FRAME = { frameWidth: 56, frameHeight: 56 };

export function loadPixelAtlases(scene: Phaser.Scene): void {
  const base = "art/atlases";
  scene.load.spritesheet(PIXEL_ATLAS.carsCiv, `${base}/cars-civ.png`, CAR_FRAME);
  scene.load.spritesheet(PIXEL_ATLAS.carsPolice, `${base}/cars-police.png`, CAR_FRAME);
  scene.load.spritesheet(PIXEL_ATLAS.carsEmergency, `${base}/cars-emergency.png`, CAR_FRAME);
  scene.load.spritesheet(PIXEL_ATLAS.civilians, `${base}/civilians.png`, PED_FRAME);
  scene.load.spritesheet(PIXEL_ATLAS.swat, `${base}/swat.png`, PED_FRAME);
}
