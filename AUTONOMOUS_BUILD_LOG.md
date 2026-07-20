# Harborline — Autonomous Build Log

## 2026-07-20 — Scaffold

- Git re-initialized (prior `.git` was incomplete / missing objects).
- Vite + Phaser 3 + TypeScript strict scaffold landed by Grok in Cursor (Codex not used).
- Scenes: Boot → Title → Game (placeholder grid + WASD player via window key state).
- `window.__GAME_DEBUG__` wired; Canvas renderer for headless e2e reliability.
- Vitest + Playwright smoke green.
- Docs: prompt audit + revised build prompt in `docs/`.
- Cursor coding posture: Grok implements unless otherwise specified (global for Cursor).

### Verification (observed)

```text
npm run verify
→ typecheck OK
→ lint OK
→ vitest: 2 passed
→ vite build OK
→ playwright: 1 passed (boots, starts, moves player) ~569ms
```

Preflight: scripts/identity/node/npm/scripts OK; FAIL only because no git commit yet (expected). Dirty tree = uncommitted scaffold.

### Prompt v2 (Grok high+fast)

- Walk-away one-paste: `docs/WALKAWAY-AFK-BUILD-PROMPT.md`
- Conductor + lean appendix: `docs/REVISED-AUTONOMOUS-BUILD-PROMPT.md`
- Slice pack: `docs/GROK-SLICE-PROMPTS.md`
- AFK git: commit+push after each green slice (Daniel-approved 2026-07-20)
- Start gameplay build at **slice 2** (world).

### Next slice (Build Order #2)

Seeded worldgen with real collision / districts (replace placeholder grid).

---

## 2026-07-20 — Slice 2 World (green)

- Seeded `generateWorld("harborline-1997")`: 128×128 tiles, 5 districts (Pier Ward, Midstack, Ridge Hollow, Freight Cut, Greenbelt).
- Roads/sidewalks/buildings/parks + water + south freight fence boundary.
- Midstack plaza spawn pad kept clear for future parked vehicles.
- RenderTexture paint + merged static collision bodies; camera follow retained; district-name toast on enter.
- Unit tests: deterministic fingerprint/tiles/spawn; solid/road counts; clear spawn pad.

### Verification (observed)

```text
npm run check → typecheck OK, lint OK
npm run test → 6 passed (2 rng + 4 worldgen)
npm run build → OK
npm run test:e2e → 1 passed (boots, starts, moves) ~1.1s
```

### Next slice (Build Order #3)

On-foot loop: sprint, mouse aim, ranged+melee, health/i-frames.

---

## 2026-07-20 — Slice 3 On-foot (green)

- Mouse aim facing + aim stub; LMB/F ranged projectiles with ammo; melee fallback when empty.
- Health + i-frames + damage flash; HUD stub; `__GAME_DEBUG__.player.health/ammo/facing`.
- Plaza hazard (contact damage) + sparring dummy (hit proof); R respawn stub when down.

### Verification (observed)

```text
npm run check → OK
npm run test → 9 passed (incl. 3 combat)
npm run test:e2e → 1 passed ~627ms
```

### Next slice (Build Order #4)

Six vehicle archetypes; enter/exit; arcade drive; damage stages.

---

## 2026-07-20 — Slice 4 Vehicles (green)

- Six archetypes (compact/sedan/sports/van/taxi/police) with shared arcade sim.
- E enter/exit near spawn fleet; throttle/steer/handbrake; damage stages → wreck; safe exit.
- `__GAME_DEBUG__.inVehicle` + `vehicle.speed/health`; e2e enter/drive/exit.

### Verification (observed)

```text
npm run check → OK
npm run test → 13 passed (incl. 4 vehicleSim)
npm run test:e2e → 1 passed enter/drive/exit ~1.1s
```

### Next slice (Build Order #5)

Pooled pedestrians + road traffic with caps and flee/react.
