# Harborline — Autonomous Build Prompt (revised 2026-07-20)

Paste this entire file into a fresh Cursor agent session after reading the boot packet.

---

You are a principal game engineer in the Cursor coding harness (Grok implements code directly unless the user says otherwise — do not delegate coding to Codex).

This is an EXECUTION task. Inspect the existing scaffold in `/Users/danielkirkpatrick/GAMES/NOT_GTA_1`, implement the game on top of it, verify with the commands below, fix failures, and continue until the Definition of Done passes—or until you hit a documented BLOCKED stop.

Do not stop after planning. Do not leave core systems as TODOs. Do not ask the user to run commands you can run. Do not modify files outside this project directory. Prefer safe, non-destructive git operations; **do not commit, merge, or push unless the user explicitly says to.** After each major slice, stage relevant files (`git add`) and append a milestone to `AUTONOMOUS_BUILD_LOG.md`.

If uncertain about a non-blocking design detail, decide using the Pinned Defaults below and state the choice in the build log. Stop and report BLOCKED only when: (a) required tools cannot run even after the documented fallback, (b) you would need to write outside the project, or (c) legal/clean-room risk is ambiguous after applying the clean-room rules.

## Pinned Defaults

| Item | Value |
|---|---|
| Working title | **Harborline** |
| Premise | Arcade crime-sandbox in a fictional coastal city; original characters/districts |
| Tone | Late-90s top-down arcade; cartoon violence; no gore; no real trademarks |
| World seed | `harborline-1997` |
| Tile size | 32 px |
| City size | 128×128 tiles (shrink toward 96×96 only if FPS forces it) |
| Package manager | npm |
| Stack | TypeScript strict + Phaser 3 + Vite + Vitest + Playwright + ESLint |
| Fallback | If npm/Phaser install is impossible: zero-dependency Canvas + local static server; still complete DoD |
| Violence / content | No Rockstar/DMA IP; no copied maps, names, logos, music, sprites, dialogue |

## Mission

Build a polished, playable, **clean-room** spiritual recreation of the *gameplay formula* of 1997 top-down GTA—not a distribution or literal copy.

Required formula:

- Top-down scrolling city; on-foot exploration
- Enter / steal / drive / damage / exit vehicles
- Pedestrians + road traffic
- Police response + 5-level heat
- Arcade combat
- Missions, money, score, health, pickups, progression
- Minimap, HUD, objectives, menus, synthesized audio, game-over/restart

All art/audio must be generated locally (Phaser graphics, Canvas, SVG, procedural pixels, Web Audio). No remote asset hosts at runtime.

## Clean-room (positive contract)

Produce only original: title, map, districts, characters, vehicles, missions, UI, palette, audio, story. Do not include Rockstar/DMA source, reverse-engineered behavior, exact maps, mission scripts, dialogue, names, logos, trademarks, artwork, sprites, music, SFX, fonts, or other copyrighted GTA content.

## Autonomy loop

1. Inspect repo + tools (`node`, `npm`, existing scaffold).
2. Implement the next unfinished slice from **Build Order** (below).
3. Run `npm run verify` (or the strongest subset available).
4. Fix blockers; update `AUTONOMOUS_BUILD_LOG.md`.
5. Repeat until Definition of Done passes.

When scope threatens completion: shrink visual detail or world size **before** removing any core gameplay loop.

## Build Order (do not skip ahead)

Complete and verify each slice before the next:

1. **Boot shell** — title → play → pause → help; `__GAME_DEBUG__` populated; no page-scroll on keys
2. **World** — seeded 128×128 city, districts, camera follow, collision, district name toast
3. **Player on foot** — 8-way move, sprint, aim (mouse), ranged + melee fallback, health/i-frames
4. **Vehicles** — 6 archetypes; enter/exit near spawn; arcade drive; damage stages; explosion; safe exit
5. **Civilians** — pooled peds + traffic with caps; flee/react; no unbounded growth
6. **Combat + pickups** — weapons/ammo/health/cash; respawning resources; safehouse/repair
7. **Heat + police** — 5 levels; foot + vehicle pursuit; arrest hold; decay when unseen; capped units
8. **Missions** — five missions, **one of each type below**; intro marker at spawn; free-roam between
9. **HUD/audio/persistence** — full HUD/minimap/maps; Web Audio after gesture; localStorage + reset save
10. **Hardening** — e2e smoke green (or documented fallback); restart/refresh safe; README accurate

## Gameplay requirements (compressed)

**Controls:** WASD/arrows move or drive; Shift sprint; E enter/exit/interact; mouse aim; LMB/F fire; Space handbrake; R restart/unstick; M map; P/Esc pause; Enter start; F1/H help. Show controls on title, pause, README, first-run panel.

**Vehicles (exactly 6 required):** compact, sedan, sports, van, taxi-like, police cruiser. Each: max speed, accel, reverse, steer rate, grip, mass, durability, collision damage, engine pitch range. Shared movement model for AI where practical.

**Heat (0–5):** offenses raise heat (steal observed, attack, serious crash, destroy, reoffend). L1 investigate → L2 pursue → L3 more units → L4 roadblocks/reinforce → L5 max. Decay only after configurable unseen time. Arrest after short close control; lose some money/score; respawn unless retries exhausted.

**Missions (5, distinct types—no duplicates):**
1. Timed checkpoint courier
2. Steal specified vehicle → drop point
3. Escape pursuit until heat clears
4. Multi-stop passenger/package route
5. Destruction **or** protection **or** pursuit/race (pick one; original objectives)

Each: title, briefing, marker, accept, HUD objective, world markers, success/fail, reward, retry, cleanup, rising difficulty, no soft-lock if target destroyed.

**World:** roads, intersections, sidewalks, alleys, buildings, parking, parks, one boundary (water/rail/fence); parked car + intro mission near spawn; culling/pooling.

**Visual feedback (minimum):** facing/aim; vehicle heading + brake cue; damage states; sparks/debris; muzzle/hit flash; heat/pursuit cues; mission markers; pickup anim; skids; simple explosions; light screen shake on big impacts; nearest-neighbor / pixel scaling OK.

**Audio:** Web Audio synthesis for engine, skid, impact, siren, weapon, pickup, mission start/complete, damage, explosion, UI; master/SFX/ambience buses; start after user gesture.

**Architecture:** modular scenes/systems (boot, menu, game, pause; worldgen; input; player; vehicles; peds; traffic; heat/police; missions; combat; pickups; audio; HUD/minimap; persistence; config/types). Strict TS; no broad `any`; constants in config; spatial partition or distance activation; clean shutdown (no leaked timers/listeners/sounds).

**Persistence (localStorage):** high score, best mission progress, audio settings, help ack, seed/settings; corrupt/unavailable → safe defaults; “reset save” in pause/settings.

**Debug (dev/test):** read-only `window.__GAME_DEBUG__` with boot flag, scene, player pos, inVehicle, vehicle speed/health, heat, mission state, ped/traffic/police counts, FPS. No filesystem/system ops. Minimize in production builds.

## Scripts (must exist)

- `npm run dev` | `build` | `typecheck` | `lint` | `test` | `test:e2e` | `verify` | `check`
- `check` = typecheck + lint (preflight requires `check`, `test`, `build`)
- `verify` = check → test → build → test:e2e (skip e2e binaries only if install failed; then run documented fallback and note it)

## Unit tests (minimum)

Heat gain/decay; mission transitions; vehicle enter/exit eligibility; damage/destruction; rewards; deterministic worldgen; save validation.

## Playwright smoke (arrange spawn for reliability)

1. Open game; fail on page errors / unexpected console errors  
2. Start gameplay (gesture)  
3. `__GAME_DEBUG__.bootCompleted === true`  
4. Move player; position changes  
5. Enter nearby vehicle; drive (speed or position changes); exit  
6. Start intro mission; objective present  
7. Pause/resume  
8. Screenshot → `test-results/` or `artifacts/`  
Clear `localStorage` before each run. Pin seed.

If Playwright browsers cannot install: keep the test file; run build + unit tests + HTTP smoke + headless system simulation; record BLOCKED only if even that fails.

## Performance target

~60 FPS desktop; ~30–50 traffic, ~40–80 peds, heat-capped police; dynamic reduce if FPS tanks. Correctness > max counts.

## Documentation

Maintain accurate `README.md` (title, clean-room statement, install, commands, controls, systems, missions, architecture, testing, minor limitations, dependency attribution only). Keep `.gitignore` + MIT (or equivalent) license for original code.

## Definition of Done (all must be true)

- Installs and runs via README
- Title loads; keyboard+mouse playable
- Walk city; solid collision works
- Enter/drive/damage/exit vehicles; 6 archetypes present
- Traffic + peds active; peds react to danger
- 5 missions programmatically completable; 5 distinct types as specified
- Combat, pickups, heat up + police pursue + heat decay + arrest/defeat loop
- HUD, minimap, objectives, pause, help, audio controls work
- SFX path works after first gesture (graph/unlock proven in e2e or manual note)
- Restart + refresh safe; no runtime-critical external URLs
- No GTA IP assets; no fake buttons; no core TODOs
- `npm run typecheck`, `build`, `test`, and strongest e2e/fallback succeed
- README matches reality
- Evidence lives in `AUTONOMOUS_BUILD_LOG.md` with commands + results

Non-blocking: extra visual polish, seventh vehicle, collectible tokens, “fun” beyond gates.

## Completion report (only after DoD)

- Title, path, run command, verify command  
- Controls blurb  
- Systems + mission types done  
- Tests run + results (paste key output)  
- Minor non-blocking limitations only  

Base claims on commands you actually ran.

## Start

Read `docs/*HANDOFF*.md` if present, then `package.json` and `src/`. Continue from the first incomplete Build Order slice. Implement, verify, log, repeat.
