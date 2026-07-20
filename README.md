# Harborline

Clean-room top-down urban action sandbox for the browser. Original city, characters, systems, art, and audio — inspired by the *gameplay formula* of 1997 top-down GTA, not a copy of Grand Theft Auto.

**No Rockstar / DMA Design IP** (maps, names, logos, sprites, music, dialogue, or source) is included.

**Presentation target:** **top-down 3D** (3D look, locked top-down camera). Current Phaser art is an interim stand-in — see [`docs/ART-DIRECTION.md`](/Users/danielkirkpatrick/GAMES/NOT_GTA_1/docs/ART-DIRECTION.md).

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
- **E** — enter/exit vehicle; accept/retry available missions near their plaza markers
- **Aim** — mouse if recently moved; otherwise face walk direction
- **Fire** — hold **F** or **J** (keyboard) or **LMB** (mouse); melee when ammo empty
- **Space** — handbrake
- **R** — safehouse respawn
- **M** — expand/collapse minimap
- **P** / **Esc** — pause / resume (pause: volume + reset save)
- **F1** / **H** — help overlay

## Systems

- Seeded districts (Pier Ward, Midstack, Ridge Hollow, Freight Cut, Greenbelt) with collision + glanceable district silhouettes
- On-foot combat (muzzle/melee/hit feedback), pickups, safehouse
- Six vehicles: compact, sedan, sports, van, Harbor Cab, Patrol — arcade drive with world solid collision + impact damage
- Pooled pedestrians + traffic (sidewalk/road bias, flee reactions, caps ~64/40)
- Heat 0–5 with police pursuit / arrest / decay
- Five mission types, each startable in-world from plaza accept markers
- HUD, cached minimap (M expand), Web Audio after gesture (pickup/shoot/ui/arrest/engine), localStorage save

## Mission types (one each)

1. **Pier Packet** — timed courier (intro near spawn)
2. **Yellow Line** — steal Harbor Cab → drop
3. **Cool Off** — raise heat, escape until clear
4. **Harbor Hops** — multi-stop packages
5. **Crate Crack** — destruction (auto-completes if target already gone)

## Versions

Historical builds are git tags — see [`docs/VERSIONS.md`](/Users/danielkirkpatrick/GAMES/NOT_GTA_1/docs/VERSIONS.md).

```bash
./scripts/play-version.sh v0.1.0   # first playable DoD in a side folder
```

## Testing

- Unit: RNG, worldgen, combat, vehicles (incl. world collision), civilian tile bias, pickups, heat, missions (all five types), save validation
- E2E: boot → title → start → move → intro + non-intro mission accepts → enter/drive/exit → civilians/caps → SFX kinds → pause/resume → refresh re-entry → screenshots

## Architecture

Scenes (`Boot` / `Title` / `Game`) plus `src/world/*`, `src/vehicles/*`, `src/missions/*`, `src/systems/*`, `src/ui/*`, `src/config/*`.

Runtime debug: `window.__GAME_DEBUG__` (read-only snapshot).

## License

MIT (original project code). Dependencies: see `package.json`. No third-party art/audio packs — assets are generated in-engine.
