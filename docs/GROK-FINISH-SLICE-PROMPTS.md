# Harborline — Grok Finish-Game Phase Prompts (v1)

Use with [`WALKAWAY-AFK-FINISH-GAME-PROMPT.md`](/Users/danielkirkpatrick/GAMES/NOT_GTA_1/docs/WALKAWAY-AFK-FINISH-GAME-PROMPT.md).

**Baseline:** `v0.1.0` + systems polish P1–P5 already on `main`. This pack **finishes the product**.

**Hard rails:** clean-room · keyboard-first · Canvas + window keys unless e2e re-proven · no force-push · no amend of pushed commits · no empty commits · do not move `v0.1.0` · prefer Phaser faux top-down 3D over a full engine rewrite.

---

## Art-director loop (F3 / F4) — mandatory protocol

For each surface listed in the phase:

1. Capture screenshot to `test-results/finish/<surface>-N.png` (N = iteration).
2. **Read the image** with the Read tool (you must see pixels, not guess).
3. Critique against the rubric (below). List concrete defects.
4. Patch the smallest visual/code change that addresses defects.
5. Reshoot. Repeat until **PASS** or **budget exhausted**.

**Per-surface budget:** max **6** iterations. If still FAIL at 6, keep best, log leftovers, move on.

**Global beauty rubric (PASS needs all):**
- Readable at a glance (player, roads, solids, HUD)
- Distinct districts (≥3 palettes / silhouettes)
- No purple-glow / generic AI-slop UI
- Harborline brand clear on title (brand-first)
- Late-90s arcade urban tone (gritty, warm sodium + cool harbor — not pastel SaaS)
- Top-down 3D *read*: height/facade/shadow cues even if meshes are faux
- Nothing critical overlapping unreadably

---

## F1 — Mission soul

**Effort:** High

```text
Goal: Each of the five mission types feels like a different job — distinct verbs, fail drama, and juice — not “E → circle → cash.”

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Constraints: keep the five existing type ids; no 6th type; E = enter/exit/accept; keyboard-only; commit+push after green.
Process: deepen MissionManager + MissionRuntime (+ world hooks) per personality table → unit tests for success AND interesting fail per type → e2e proves ≥2 non-intro missions startable in-world with non-trivial objectives → check/test/e2e → log → commit+push.
Personality (implement all):
- courier (Pier Packet): hot parcel — damage/arrest can drop it; timer; drop only if carrying; clear fail copy
- steal_deliver (Yellow Line): cab health floor; steal spikes heat; drop gated until not in active arrest range (or heat cool enough — pick one, test it)
- escape_heat (Cool Off): forced offense then hide — decay faster near safehouse/park, slower on open road with cops near
- multi_stop (Harbor Hops): mixed stops (timed / vehicle-required / contested timeout) — not three identical circles
- destruction (Crate Crack): ram or shoot; smash raises heat; soft-lock if target gone = clear message; optional nearby vehicle matter
Done when:
- A cold player can tell the five jobs apart by playing (document how in build log)
- Unit or e2e proof for success path of all five types
- Unit proof for at least one meaningful fail path on ≥3 types
- __GAME_DEBUG__.mission.id/objective stay truthful
- npm run check && npm run test && npm run test:e2e green
Stop: Do not add a 6th mission type id.
```

---

## F2 — City + drive + combat depth

**Effort:** High

```text
Goal: City reads alive; driving and fighting feel consequential.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Constraints: keep ped/traffic caps; shared arcade vehicle model; no full physics engine; commit+push after green.
Process: tighten AI tile bias + flee readability → vehicle↔world collision + impact damage already present: deepen juice (skid/flash/camera nudge optional light) → combat muzzle/melee/hit clarity → heat/police readable → check/test/e2e → log → commit+push.
Done when:
- Ped/traffic preferred-tile bias still measurable; caps held
- Active vehicle cannot ghost through buildings/water/fence; hard impacts cost health
- Combat hits have obvious feedback; keyboard fire still works
- npm run check && npm run test && npm run test:e2e green
Stop: No navmesh library unless tiny grid BFS fits without FPS collapse.
```

---

## F3 — Art-director: world / title / vehicles

**Effort:** High

```text
Goal: Harborline looks beautiful under a locked top-down camera — faux top-down 3D read (height, facades, light), brand-first title, vehicles readable.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Constraints: art-director loop REQUIRED with budgets; no purple-glow slop; clean-room palette; prefer Phaser (no mandatory Three.js); commit+push after green.
Surfaces (each ≤6 iterations): title, world-midstack, world-district-contrast, vehicle-fleet-close.
Process: paint/lighting/silhouette upgrades → loop protocol → evidence in test-results/finish/ → check/test/e2e → log → commit+push.
Done when:
- Each surface PASS against global beauty rubric OR budget-exhausted FAIL listed with best screenshot path
- Title is unmistakably Harborline brand-first
- ≥3 districts glance-distinct in one screenshot
- npm run check && npm run test && npm run test:e2e green
Stop: Do not start a second city. Do not download external art packs.
```

---

## F4 — Art-director: HUD / UI / minimap / pause / help

**Effort:** Medium–High

```text
Goal: First minute of play UI feels intentional and readable; help/pause truthful; minimap useful.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Constraints: art-director loop with budgets; keyboard-first copy; commit+push after green.
Surfaces (each ≤6 iterations): game-hud, minimap-expanded, pause, help.
Process: hierarchy/spacing/contrast pass → loop protocol → e2e still keyboard-startable → log → commit+push.
Done when:
- HUD shows health, ammo, cash/score, heat, mission objective without unreadable overlap
- Minimap shows roads + player + police + mission markers when relevant
- Help/pause match real controls
- Surfaces PASS or budget FAIL listed
- npm run check && npm run test && npm run test:e2e green
Stop: No licensed fonts/CDN; keep self-contained.
```

---

## F5 — Audio productize + Suno slots

**Effort:** Medium

```text
Goal: Audio feels like a product — distinct SFX + optional Daniel-authored Suno beds via drop-in files.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Constraints: unlock only after user gesture; if files missing, synth fallbacks still work; no external downloads in-agent; commit+push after green.
Process: extend audioBus for music beds (title/city/heat) + keep SFX kinds → load from public/audio/ per docs/SUNO-INSTRUMENTAL-PROMPTS.md → document drop-in in README → prove ≥4 SFX kinds still fire → check/test/e2e → log → commit+push.
Done when:
- Drop-in paths honored when files present; silent/synth fallback when absent (no crash)
- README section “Music (Suno)” lists exact filenames
- ≥4 SFX kinds on real actions after unlock
- npm run check && npm run test && npm run test:e2e green
Stop: Do not block Finish DoD waiting for Daniel to generate files.
```

---

## F6 — Performance, verify, version bump, completion report

**Effort:** Medium

```text
Goal: Finish-Game Definition of Done — verify green, docs true, version strings 0.3.0, honest report.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Constraints: cull/cheap paint before cutting core loops; bump GAME_VERSION + package.json to 0.3.0 (v0.2.0 is the systems-polish bookmark — do not reuse); do NOT create git tag unless paste explicitly says tag; commit+push after green.
Process: profile hotspots → optimize → npm run verify → update README + VERSIONS.md row note (tag pending Daniel) + AUTONOMOUS_BUILD_LOG → completion report in chat → commit+push.
Done when:
- npm run verify green with pasted output
- e2e spine still covers boot/start/move/missions/vehicle/pause/refresh/screenshots
- README + build log match reality; finish phases F1–F6 evidenced
- Version label shows v0.3.0 on title
- Completion report includes origin/main SHA + Suno drop-in reminder + honest limits
Stop: End. Do not start unrelated features after DoD.
```

---

## AFK mode block

```text
AFK FINISH MODE: Execute finish phases F1→F6 in order. Skip a phase only if AUTONOMOUS_BUILD_LOG.md already records it green with evidence. For each phase, follow Goal/Constraints/Process/Done/Stop above. Verify before advancing. Do not ask for confirmation between phases. After each green phase: update build log, git add, commit, push origin HEAD. After F6 Done-when, output the Completion report and stop.
```

---

### Quality Gate
Status: finish pack forces mission soul + budgeted art-director loops + Suno slots.  
Companion walk-away: `docs/WALKAWAY-AFK-FINISH-GAME-PROMPT.md`.
