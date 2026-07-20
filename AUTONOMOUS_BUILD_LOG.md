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

---

## 2026-07-20 — Slice 5 Civilians (green)

- Pooled peds (cap 64) + traffic (cap 40); spawn/cull around player; sidewalk/road cells.
- Attack/melee triggers flee tint+speed; counts on `__GAME_DEBUG__`; e2e asserts counts > 0.

### Verification (observed)

```text
npm run check → OK
npm run test → 13 passed
npm run test:e2e → 1 passed (incl. civilian counts) ~1.1s
```

### Next slice (Build Order #6)

Pickups, repair, safehouse/respawn, resource refresh.

---

## 2026-07-20 — Slice 6 Pickups (green)

- Plaza pickups: health/ammo/cash/repair with respawn timers + collect feedback.
- Safehouse marker; R respawns there with restored HP/ammo; repair heals nearest/active vehicle.
- Unit tests for apply/collect/respawn.

### Verification (observed)

```text
npm run check → OK
npm run test → 16 passed (incl. 3 pickups)
npm run test:e2e → 1 passed ~1.1s
```

### Next slice (Build Order #7)

Heat 0–5, police pursuit, arrest, decay.

---

## 2026-07-20 — Slice 7 Heat/Police (green)

- Heat 0–5 with offense gain (attack/steal/crash/destroy/reoffend), unseen decay, arrest hold.
- Foot+car police pool capped by heat; money penalty + safehouse respawn on arrest.
- HUD heat pips; `__GAME_DEBUG__.heat` + police counts; unit tests green.

### Verification (observed)

```text
npm run check → OK
npm run test → 20 passed (incl. 4 heat)
npm run test:e2e → 1 passed ~1.1s
```

### Next slice (Build Order #8)

Five distinct missions + mission manager.

---

## 2026-07-20 — Slice 8 Missions (green)

- Five missions (courier, steal-deliver, escape-heat, multi-stop, destruction) via MissionManager.
- Intro "Pier Packet" accept near spawn (E); markers/objectives; rewards; retry; crate soft-lock safe.
- Unit transition tests + e2e intro mission objective.

### Verification (observed)

```text
npm run check → OK
npm run test → 24 passed (incl. 4 missions)
npm run test:e2e → 1 passed (mission + vehicle) ~1.4s
```

### Next slice (Build Order #9)

HUD/minimap, Web Audio, localStorage persistence.

---

## 2026-07-20 — Slice 9 HUD/Audio/Save (green)

- Pause (P/Esc) with master/SFX/ambience controls + reset save; Help (F1/H).
- Minimap + M expand; Web Audio unlocks after gesture; localStorage save validation.
- e2e pause/resume; save unit tests.

### Verification (observed)

```text
npm run check → OK
npm run test → 26 passed (incl. 2 save)
npm run test:e2e → 1 passed (pause/resume included) ~1.5s
```

### Next slice (Build Order #10)

Harden e2e spine, README, full verify, completion report.

---

## 2026-07-20 — Slice 10 Hardening + Definition of Done (green)

- README updated to match controls/missions/commands.
- e2e spine: boot → start → move → intro mission → enter/drive/exit → civilians → pause/resume → refresh re-enter GameScene → screenshot.
- No GTA IP strings in `src/`; no core TODOs.
- `npm run verify` green end-to-end.

### Verification (observed)

```text
npm run verify
→ typecheck OK
→ lint OK
→ vitest: 26 passed (8 files)
→ vite build OK (~1.73s)
→ playwright: 1 passed ~1.9s (full smoke + refresh)
```

### Definition of Done

Met for playable Harborline sandbox on pinned defaults (title/seed/tile/city). Non-blocking polish remains (extra VFX, more mission scripting depth, further FPS tuning).

### Polish AFK (in progress)

- One-paste: `docs/WALKAWAY-AFK-POLISH-PROMPT.md`
- Slices P1–P5: `docs/GROK-POLISH-SLICE-PROMPTS.md`
- **No art-director loop** in this pass (ADR-007). Deep artwork / top-down 3D AFK comes *after* systems polish DoD.

---

## 2026-07-20 — Polish P1 Mission depth (green)

- All five missions have plaza accept points + world markers + on-screen `E: Accept` prompt (not only intro).
- Unit happy paths: courier, steal-deliver, multi-stop, destruction; escape-heat requires raise-then-clear (no instant win).
- Soft-lock guards: missing steal target fails with message; destroyed crate auto-completes with message.
- `__GAME_DEBUG__.mission.id/objective` updates during active missions; e2e accepts intro + cab-boost + cool-off via in-world accept points.
- `window.__HARBOR_TEST__` helpers for scripted mission unlock proofs only.

### Verification (observed)

```text
npm run check → typecheck OK, lint OK
npm run test → 33 passed (10 mission tests)
npm run test:e2e → 1 passed ~1.4s (intro + 2 non-intro accepts + vehicle + pause + refresh)
```

### Next slice (Polish P2)

Living city feel: AI tile bias + district visual read.

---

## 2026-07-20 — Polish P2 Living city feel (green)

- Ped/traffic movement uses tile bias (sidewalk/plaza/park/grass vs road); unit helper proves >70% preferred steps.
- District paint strengthened: distinct ground tints + building roof/face/trim silhouettes (interim faux height).
- Caps still enforced; flee tint path still trips via danger signal; `__GAME_DEBUG__.civBias` counters published.
- Evidence screenshot: `test-results/districts-read.png` (zoomed Midstack vantage, ≥3 district palettes readable).

### Verification (observed)

```text
npm run check → typecheck OK, lint OK
npm run test → 37 passed (incl. 4 civilianMove)
npm run test:e2e → 1 passed ~1.6s (caps + district screenshot)
```

### Next slice (Polish P3)

Drive/combat juice: vehicle↔world collision + feedback.

---

## 2026-07-20 — Polish P3 Drive/combat juice (green)

- Active vehicle collides with buildings/water/fence (sample footprint → restore pose, kill speed).
- Hard impacts apply scaled vehicle damage; wreck path still forces safe exit in GameScene.
- Damage stages + critical pulse + brighter/larger brake light while braking.
- Combat feedback: muzzle flash, melee arc, hit sparks on dummy/crate.
- Unit proof for solid block + impact damage threshold; e2e enter/drive/exit still green.

### Verification (observed)

```text
npm run check → typecheck OK, lint OK
npm run test → 39 passed (incl. 6 vehicleSim)
npm run test:e2e → 1 passed ~1.6s
```

### Next slice (Polish P4)

Presentation: title/HUD/audio/map (light interim readability).

---

## 2026-07-20 — Polish P4 Presentation (green)

- Title: brand-first Harborline composition (gradient harbor + skyline cue), keyboard Enter CTA, version stamp.
- HUD stack: controls → HP/ammo/cash/score → heat → mission accept/objective without overlap.
- Minimap: roads/water/parks + clearer police/mission markers; M expand retained.
- Audio: distinct synthesized SFX kinds (pickup/shoot/ui/arrest/engine) after gesture unlock; e2e proves ≥4 kinds on real actions.
- Help/pause copy matches keyboard-first controls; mouse remains optional.
- Evidence: `test-results/title-brand.png`, `test-results/game-hud.png`.

### Verification (observed)

```text
npm run check → typecheck OK, lint OK
npm run test → 39 passed
npm run test:e2e → 1 passed ~2.0s (title+HUD screenshots + ≥4 SFX kinds)
```

### Next slice (Polish P5)

Performance, full verify, README truth, completion report.

---

## 2026-07-20 — Polish P5 Performance + verify (green) — systems-polish DoD

- Minimap static road/water/park layer cached in RenderTexture (repaint only on expand toggle); markers still per-frame.
- README controls/missions/systems aligned with polished code.
- Full `npm run verify` green; e2e spine retained (boot/start/move/missions/vehicle/civilians/SFX/pause/refresh/screenshots).
- Systems-polish Definition of Done met for P1–P5. Artwork / top-down 3D AFK remains a separate later track (ADR-007).

### Verification (observed)

```text
npm run verify
→ typecheck OK
→ lint OK
→ vitest: 39 passed (9 files)
→ vite build OK (~1.72s)
→ playwright: 1 passed ~2.0s (full smoke + polish proofs)
```

### Systems-polish DoD

Met. Non-blocking remaining limits: Phaser flats still interim (no 3D engine), mission scripting still lightweight, FPS not profiled on low-end hardware, no licensed music/voice.

---

## 2026-07-20 — Bookmark v0.2.0 + mega finish AFK authored

- Version strings bumped to **0.2.0**; git tag `v0.2.0` bookmarks systems-polish game state.
- Mega finish-the-game AFK written: `docs/WALKAWAY-AFK-FINISH-GAME-PROMPT.md` + `docs/GROK-FINISH-SLICE-PROMPTS.md` (F1–F6; art-director loop; finish → planned **v0.3.0**).
- Suno instrumental prompts: `docs/SUNO-INSTRUMENTAL-PROMPTS.md` → `public/audio/`.
- Load bookmark: `./scripts/play-version.sh v0.2.0`

### Art direction pin (2026-07-20)

- **Top-down 3D** is the presentation target (ADR-005 / `docs/ART-DIRECTION.md`).
- Phaser flats remain interim; full 3D migration is a separate track after polish.

### v0.1.0 registered

- Version history: `docs/VERSIONS.md` + tag `v0.1.0` + `scripts/play-version.sh`
- Title screen shows `v0.1.0`
- Includes keyboard-first controls, polish AFK prompts, art-direction pin
