# Harborline

Clean-room top-down urban action sandbox for the browser. Original city, characters, systems, art, and audio — inspired by the *gameplay formula* of 1997 top-down GTA, not a copy of Grand Theft Auto.

**No Rockstar / DMA Design IP** (maps, names, logos, sprites, music, dialogue, or source) is included.

**Presentation:** **top-down 3D** via Phaser + Three.js (locked bird’s-eye camera) — see [`docs/ART-DIRECTION.md`](docs/ART-DIRECTION.md) and [`docs/ADR-009-TOP-DOWN-3D.md`](docs/ADR-009-TOP-DOWN-3D.md).

Pinned defaults: title **Harborline**, seed `harborline-1997`, tile **32px**, city **128×128**.

## Requirements

- Node.js 20+ (Node 26 OK)
- npm

## Install

```bash
npm install
npx playwright install chromium   # once, for e2e
```

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run check` | Typecheck + lint |
| `npm run test` | Unit tests (Vitest) |
| `npm run test:e2e` | Playwright smoke |
| `npm run verify` | check → test → build → e2e |

## Controls

Fully playable **with or without a mouse** (keyboard-first).

- **Enter** — start from title (click optional; unlocks audio)
- **WASD** / arrows — move on foot; throttle/steer in vehicles
- **Shift** — sprint
- **E** — enter/exit vehicle; accept missions; use paint shops ($150 recolor + clear heat)
- **1–4** / **Q** / **Tab** — weapons (Fists, Pistol, SMG, Shotgun)
- **Aim** — mouse if recently moved; otherwise face walk direction
- **Fire** — hold **F** or **J** (keyboard) or **LMB** (mouse); melee when ammo empty / fists
- **Space** — handbrake
- **R** — safehouse respawn
- **M** — expand/collapse minimap
- **P** / **Esc** — pause / resume (pause: volume + reset save)
- **F1** / **H** — help overlay

## Systems

- Seeded districts with multi-lane roads (2-lane / 4-lane / freeway) + nav graph
- Top-down 3D mesh city (Three.js) with Phaser HUD/input/physics (2D fallback)
- On-foot combat with weapon inventory, pickups (incl. SMG/shotgun), safehouse, paint shops
- Six vehicles — arcade drive with world solid collision + impact damage
- Graph-following pedestrians + traffic (flee reactions, caps ~64/40)
- Heat 0–5 with police pursuit / arrest / decay (softened crash threshold)
- Five mission types, each startable in-world from plaza accept markers
- HUD, cached minimap (M expand), Web Audio after gesture (SFX + Suno beds in `public/audio/`), localStorage save

## Music (Suno)

Plain English: drop your Suno MP3s into the folder with these **exact** names — the game picks them up after any key/click unlocks audio. Missing files fall back to soft synth beds (no crash).

Drop-in folder: [`public/audio/`](/Users/danielkirkpatrick/GAMES/NOT_GTA_1/public/audio/)  
Prompts: [`docs/SUNO-INSTRUMENTAL-PROMPTS.md`](/Users/danielkirkpatrick/GAMES/NOT_GTA_1/docs/SUNO-INSTRUMENTAL-PROMPTS.md)

| Role | Exact filename |
|---|---|
| Title / menu | `title-theme (harborline).mp3` |
| City cruise | `city-night (harborline).mp3` |
| Heat / chase (heat ≥ 2) | `heat-chase (harborline).mp3` |
| Mission win sting | `mission-win (harborline).mp3` |
| Mission fail / bust sting | `mission-fail (harborline).mp3` |

Pause **ambience** volume controls music beds; **sfx** covers synthesized action sounds (pickup, shoot, UI, engine, arrest, crash).

## Mission types (one each)

1. **Pier Packet** — hot parcel courier: pick up, keep it through hits/arrests, timed drop
2. **Yellow Line** — steal Harbor Cab (heat spike), keep HP floor, drop outside arrest range
3. **Cool Off** — raise heat, then hide (faster cool near safehouse/park)
4. **Harbor Hops** — mixed stops: timed / vehicle-required / contested hold
5. **Crate Crack** — ram or shoot crate (smash raises heat); soft-lock if already gone

## Versions

Historical builds are git tags — see [`docs/VERSIONS.md`](/Users/danielkirkpatrick/GAMES/NOT_GTA_1/docs/VERSIONS.md).

```bash
./scripts/play-version.sh v0.1.0   # first playable DoD
./scripts/play-version.sh v0.2.0   # systems polish bookmark
# v0.3.0 — Finish-Game strings on main; tag when Daniel is happy
```

Current UI label: **v0.3.0** (Finish-Game product pass).

## Testing

- Unit: RNG, worldgen, combat, vehicles (incl. world collision), civilian tile bias, pickups, heat, missions (all five types + fails), audioTracks, save validation
- E2E: boot → title → start → move → intro + non-intro mission accepts → enter/drive/exit → civilians/caps → SFX + Suno beds → HUD/pause/help/minimap screenshots → pause/resume → refresh re-entry

## Architecture

Scenes (`Boot` / `Title` / `Game`) plus `src/world/*`, `src/vehicles/*`, `src/missions/*`, `src/systems/*`, `src/ui/*`, `src/config/*`.

Runtime debug: `window.__GAME_DEBUG__` (read-only snapshot).

## License

MIT (original project code). Dependencies: see `package.json`. No third-party art/audio packs — assets are generated in-engine.
