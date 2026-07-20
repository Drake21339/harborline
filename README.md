# Harborline

Clean-room top-down urban action sandbox for the browser. Original city, characters, systems, art, and audio — inspired by the *gameplay formula* of 1997 top-down GTA, not a copy of Grand Theft Auto.

**No Rockstar / DMA Design IP** (maps, names, logos, sprites, music, dialogue, or source) is included.

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

## Controls (scaffold)

- **Enter** / click — start from title
- **WASD** / arrows — move
- **Shift** — sprint
- **Esc** — return to title

Full control map lands with the gameplay build (see `docs/REVISED-AUTONOMOUS-BUILD-PROMPT.md`).

## Current status

Scaffold: title screen, placeholder city grid, movable player, `__GAME_DEBUG__`, unit + e2e smoke harness. Full sandbox systems are not implemented yet.

## Architecture (target)

Scenes (`Boot` / `Title` / `Game`) plus modular `src/systems/*`, `src/config/*`, `src/types/*`. Expand toward vehicles, civilians, heat, missions per the revised build prompt.

## Testing

- Unit: deterministic RNG / seed stability
- E2E: boot → start → move → screenshot in `test-results/`

## License

MIT (original project code). Dependencies: see `package.json`. No third-party art/audio packs — assets are generated in-engine.
