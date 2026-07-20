export const GAME_TITLE = "Harborline";
export const WORLD_SEED = "harborline-1997";

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const TILE_SIZE = 32;
export const CITY_SIZE_TILES = 128;

export const PLAYER = {
  walkSpeed: 140,
  sprintSpeed: 220,
  radius: 10,
  maxHealth: 100,
} as const;

export const COLORS = {
  sky: 0x1a2740,
  ground: 0x2f3b2f,
  road: 0x3a3a42,
  building: 0x5a4a3a,
  water: 0x2a4a6a,
  park: 0x3a6b3e,
  player: 0xf2c14e,
  uiText: "#e8eefc",
  uiMuted: "#9db0d0",
  accent: "#7dffa8",
} as const;
