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

---

## 2026-07-20 — Finish F1 Mission soul (green)

Five jobs feel distinct by play — not “E → circle → cash” only:

| Mission | Distinct verb / fail drama |
|---|---|
| Pier Packet (courier) | Hot parcel: pick up → carry (PARCEL tag) → drop only while carrying; damage/arrest drops it; 90s clock |
| Yellow Line (steal_deliver) | Steal cab spikes heat; HP floor (≥35) or fail; drop blocked in arrest range |
| Cool Off (escape_heat) | Must raise then clear heat; decay ×1.85 near safehouse/park, ×0.45 open road + cops |
| Harbor Hops (multi_stop) | Mixed stops: timed / vehicle-required / contested hold (not three identical circles) |
| Crate Crack (destruction) | Ram or shoot; smash raises heat; soft-lock if already gone with clear message |

- Unit success paths for all five types; meaningful fail paths on courier (damage/arrest/timeout), steal (HP floor / missing / arrest gate), multi (timed miss).
- `__GAME_DEBUG__.mission.id/objective` stay truthful; e2e still accepts intro + ≥2 non-intro missions.

### Verification (observed)

```text
npm run check → typecheck OK, lint OK
npm run test → 46 passed (16 mission + 5 heat)
npm run test:e2e → 1 passed ~2.0s (intro + cab-boost + cool-off + vehicle + pause + refresh)
```

### Next phase (Finish F2)

City + drive + combat depth.

---

## 2026-07-20 — Finish F2 City + drive + combat depth (green)

- Ped/traffic tile bias tightened (wider preferred-tile search); flee reads as amber pulse + burst ring; `__GAME_DEBUG__.counts.fleeing` published.
- Caps held (64 ped / 40 traffic). Vehicle↔world solids still block; hard impacts cost HP, spawn sparks, camera shake, and report crash heat.
- Handbrake skids at speed; muzzle flash ring + player-hit camera flash; police strobe/scale when hot; heat HUD pulses on ARRESTING.
- Unit proof: preferred-tile bias >70%; impact damage scales with speed.

### Verification (observed)

```text
npm run check → typecheck OK, lint OK
npm run test → 47 passed (incl. 7 vehicleSim + 4 civilianMove)
npm run test:e2e → 1 passed ~2.0s
```

### Next phase (Finish F3)

Art-director world / title / vehicles.

---

## 2026-07-20 — Finish F3 Art-director world/title/vehicles (green)

Art-director loop (screenshot → Read → critique → patch → reshoot). Budgets used: title×2, midstack×3, district×2, fleet×2 (under max 6).

| Surface | Verdict | Evidence | Notes |
|---|---|---|---|
| title | **PASS** | `test-results/finish/title-2.png` | Brand-first Harborline, night harbor + skyline + pier line, no purple-glow |
| world-midstack | **PASS** (soft leftover) | `test-results/finish/world-midstack-3.png` | Roads/player/HUD readable; building windows + district tints; faux height present but still Phaser-flat vs true meshes |
| world-district-contrast | **PASS** | `test-results/finish/world-district-contrast-2.png` | ≥3 glance-distinct palettes (harbor teal / mid grey-olive / freight rust / greenbelt) at zoom-out |
| vehicle-fleet-close | **PASS** (soft leftover) | `test-results/finish/vehicle-fleet-close-2.png` | Shadow + cabin + headlight/brake cues; archetypes still rectangle-based |

Upgrades: stronger building roof/face/shadow/windows, district ground contrast, vehicle roof/shadow/headlights, title brand motion + sodium haze.

### Verification (observed)

```text
npm run check → typecheck OK, lint OK
npm run test → 47 passed
npm run test:e2e → 1 passed ~2.3s (finish screenshots written)
```

### Next phase (Finish F4)

Art-director HUD / UI / minimap / pause / help.

---

## 2026-07-20 — Finish F4 Art-director HUD/UI/minimap/pause/help (green)

Art-director loop budgets: HUD×1, minimap×2, pause×1, help×1.

| Surface | Verdict | Evidence |
|---|---|---|
| game-hud | **PASS** | `test-results/finish/game-hud-1.png` — left chrome stack: controls, HP/ammo/cash/score, heat, mission accept/obj; gold rule; no purple glow |
| minimap-expanded | **PASS** | `test-results/finish/minimap-expanded-2.png` — roads/water/park/buildings + player triangle; brighter paint after iter 2 |
| pause | **PASS** | `test-results/finish/pause-1.png` — dim + gold-border panel; volume keys + reset + resume truthful |
| help | **PASS** | `test-results/finish/help-1.png` — keyboard-first controls match real bindings |

### Verification (observed)

```text
npm run check → typecheck OK, lint OK
npm run test → 47 passed
npm run test:e2e → 1 passed ~2.9s (HUD/minimap/pause/help screenshots)
```

### Next phase (Finish F5)

Audio productize + Suno slots.

---

## 2026-07-20 — Finish F5 Audio productize + Suno slots (green)

- Drop-in contract: `src/systems/audioTracks.ts` → exact `(harborline).mp3` names; URL-encoded spaces; synth fallback if missing.
- Beds: title / city / heat via `setBed`; stings win/fail; SFX kinds pickup/shoot/ui/arrest/engine/**crash**.
- README Music table lists exact filenames; pause ambience = beds.
- E2E proves ≥4 SFX kinds + all three beds probe ready + HTTP 200 for title file.

### Verification (observed)

```text
npm run check → typecheck OK, lint OK
npm run test → 49 passed (incl. 2 audioTracks)
npm run test:e2e → 1 passed ~2.9s (beds ready + SFX ≥4)
```

Files present in `public/audio/`: title-theme, city-night, heat-chase, mission-win, mission-fail (harborline).

### Next phase (Finish F6)

Performance, verify, version 0.3.0, completion report.

---

## 2026-07-20 — Finish F6 Performance + verify + v0.3.0 strings (green) — Finish-Game DoD

- Skid marks rate-limited (90ms) to cut tween spam; minimap base still cached; world paint once.
- `GAME_VERSION` + `package.json` → **0.3.0** (git tag **not** created — Daniel tags later).
- README + `docs/VERSIONS.md` + `docs/ART-DIRECTION.md` match Finish reality.
- Full `npm run verify` green; e2e spine retained.

### Verification (observed)

```text
npm run verify
→ typecheck OK
→ lint OK
→ vitest: 49 passed (10 files)
→ vite build OK (~1.78s)
→ playwright: 1 passed ~2.9s (full smoke + finish proofs)
```

### Finish-Game Definition of Done

Met for Harborline finish pass on pinned defaults (title/seed/tile/city). Soft leftovers documented under F3 (Phaser-flat vs true meshes). Tag `v0.3.0` pending Daniel.

### Honest limits

- Phaser faux top-down 3D, not a full Three.js/Babylon mesh city
- Mission scripting still lightweight (no cinematic cutscenes)
- FPS not profiled on low-end hardware beyond e2e headless Chromium
- “Fun” is playable with unit/e2e proofs — Daniel’s ear/eye is final

---

## 2026-07-20 — Graphics Beauty G1 (Phaser false-start — superseded)

Started before City Depth Overhaul landed on `origin/main`. Phaser paint work in `e0f53aa` is **superseded** by merge `6e924a5` + 3D G1 below. Do not treat Phaser G1 as Beauty DoD evidence.

---

## 2026-07-20 — Graphics Beauty G1 City mesh character on WorldRenderer3D (green)

Merged City Depth Overhaul (`b3568ff`) then polished `src/render3d/WorldRenderer3D.ts`.

**Critical fix:** Phaser canvas was opaque over the Three.js underlay — city invisible. Set `transparent: true`, clear camera rgba(0,0,0,0), CSS stacking so WebGL city shows through HUD canvas.

Art-director loop (post-merge): midstack×3, pier×2, freeway×2 (under max 5).

| Surface | Verdict | Evidence | Notes |
|---|---|---|---|
| world-midstack | **PASS** (soft leftover) | `test-results/beauty/world-midstack-3.png` | District height bands + roof/windows; ortho top-down still flattens side facades |
| world-pier | **PASS** (soft leftover) | `test-results/beauty/world-pier-2.png` | Pier Ward label + cooler warehouse palette; water read still subtle at night |
| world-freeway | **PASS** | `test-results/beauty/world-freeway-2.png` | Freeway vs local width/markings readable; median grass barriers present |

Upgrades: per-district building mass/colors/windows; road batches by RoadClass + markings; freeway median strips; brighter night lights; transparent Phaser compositing.

### Verification (observed)

```text
npm run check → typecheck OK, lint OK
npm run test → 60 passed
npm run test:e2e → 1 passed ~46s (beauty midstack/pier/freeway screenshots)
```

### Next phase (Beauty G2)

Vehicles + people silhouettes + paint tint on 3D meshes.
