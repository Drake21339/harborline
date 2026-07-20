# Harborline — Grok 4.5 Slice Prompts (v2)

Paste **after** the Conductor in [`REVISED-AUTONOMOUS-BUILD-PROMPT.md`](/Users/danielkirkpatrick/GAMES/NOT_GTA_1/docs/REVISED-AUTONOMOUS-BUILD-PROMPT.md).

**Rules for every slice:** implement only this slice · verify until green · log evidence · **commit + push** (Daniel-approved for this AFK) · **stop** (unless AFK block is active).

**Git cadence (approved):** after each green slice → `git add` → `git commit -m "…"` → `git push origin HEAD`. Never `--force`, never amend pushed commits, never change git config.

Scaffold already covers much of slice 1. Start at **slice 2** on a fresh build unless boot/pause/help are incomplete.

---

## Slice 1 — Boot shell  
**Effort:** Medium

```text
Goal: Complete boot shell — title → play → pause → help/controls overlay; __GAME_DEBUG__ accurate; gameplay keys never scroll the page.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Constraints: extend scaffold; clean-room; keep Canvas + window key input unless e2e re-proven; commit+push after green (approved).
Process: implement → npm run check && npm run test && npm run test:e2e → fix → append AUTONOMOUS_BUILD_LOG.md → commit+push.
Done when:
- Title starts with Enter/click; pause with P/Esc; help with F1/H; resume works
- __GAME_DEBUG__.bootCompleted true on title; scene name updates
- e2e still passes (grow if needed for pause/help)
- No page scroll on arrows/WASD/space
Stop: Do not start worldgen (slice 2).
```

---

## Slice 2 — World  
**Effort:** High

```text
Goal: Replace placeholder grid with seeded 128×128 Harborline city: districts, roads/sidewalks/buildings/parks, one boundary (water/rail/fence), camera follow, solid collision, district-name toast.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Constraints: seed harborline-1997 must be deterministic; unit test worldgen stability; clean-room original layout (not GTA maps); commit+push after green (approved).
Process: implement worldgen module → wire GameScene → npm run check && npm run test && npm run build → fix → log → commit+push. Run e2e if spawn/collision could break movement.
Done when:
- Deterministic worldgen unit test green
- Player collides with buildings/barriers; cannot leave world bounds wrongly
- ≥3 visually distinct districts; district name shows on enter
- Camera follows player; parked-vehicle-ready open area near spawn remains
- __GAME_DEBUG__ player position still updates while walking
Stop: Do not add combat/vehicles AI yet.
```

---

## Slice 3 — Player on foot  
**Effort:** Medium–High

```text
Goal: Full on-foot loop — 8-way move, sprint, mouse aim facing, ranged attack + melee fallback, health + i-frames, damage feedback.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Constraints: keep window key state compatible with Playwright; commit+push after green (approved).
Process: implement → npm run check && npm run test → npm run test:e2e → log → commit+push.
Done when:
- Sprint (Shift) faster than walk; facing/aim follows mouse when relevant
- Ranged + melee work with cooldown or ammo; damage flash + i-frames
- Health on __GAME_DEBUG__ or HUD stub; death/arrest path can be stubbed until slice 7
- e2e still moves player
Stop: Do not implement full vehicle sim (slice 4).
```

---

## Slice 4 — Vehicles  
**Effort:** High

```text
Goal: Six vehicle archetypes with arcade driving; enter/exit near spawn; damage stages; destroyed/explode; safe exit position; camera follows active vehicle.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Constraints: exactly 6 types (compact, sedan, sports, van, taxi-like, police); shared movement model; place enterable parked car at spawn; commit+push after green (approved).
Process: implement vehicle defs + controller → unit tests enter/exit + damage → grow e2e: enter, drive, exit → verify → log → commit+push.
Done when:
- E near vehicle enters; E exits to safe free cell
- Throttle/reverse/steer/handbrake (Space); brake cue + heading readable
- Damage stages visible; heavy damage can explode/disable
- __GAME_DEBUG__.inVehicle, vehicle.speed, vehicle.health populated
- Unit tests + e2e vehicle steps green
Stop: Do not build full traffic AI (slice 5) beyond what's needed for parked cars.
```

---

## Slice 5 — Civilians  
**Effort:** High

```text
Goal: Living city — pooled pedestrians + road traffic with hard caps; flee/react to danger; no unbounded entity growth.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Constraints: ~40–80 peds, ~30–50 traffic max; cull/pool off-screen; __GAME_DEBUG__ counts; commit+push after green (approved).
Process: implement → check/test/build → brief manual or e2e smoke that counts > 0 → log → commit+push.
Done when:
- Peds walk sidewalks/open areas; traffic follows roads/waypoints reasonably
- Attack/explosion/siren causes visible flee/react
- Caps enforced; counts on __GAME_DEBUG__
- FPS remains playable on desktop target
Stop: Do not implement heat/police (slice 7).
```

---

## Slice 6 — Combat + pickups  
**Effort:** Medium

```text
Goal: World pickups + combat resources — health, ammo/weapon, cash/score, repair pickup or zone; safehouse/respawn; pickups respawn so the world cannot permanently starve.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Constraints: original art via primitives; commit+push after green (approved).
Process: implement → unit test reward/apply where pure → check/test → log → commit+push.
Done when:
- Pickups collectible with SFX hook or clear feedback
- Repair restores vehicle or player as designed
- Safehouse/respawn point exists
- Resources respawn or replace over time
Stop: Do not implement heat system (slice 7).
```

---

## Slice 7 — Heat + police  
**Effort:** High

```text
Goal: Five-level heat with police foot + vehicle pursuit, arrest hold, unseen decay, capped units, clear HUD/debug feedback.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Constraints: unit test heat gain/decay; offenses: observed steal, attack, serious crash, destroy, reoffend; commit+push after green (approved).
Process: implement → npm run check && npm run test (heat cases) → build → log → commit+push. Extend e2e only if stable/deterministic.
Done when:
- Heat 0–5 behavior matches Spec Appendix
- Police pursue on foot and in vehicles; caps clean up after pursuit ends
- Arrest after short close control; money/score penalty + respawn path
- __GAME_DEBUG__.heat updates; decay after escape works
- Heat unit tests green
Stop: Do not implement full mission manager (slice 8).
```

---

## Slice 8 — Missions  
**Effort:** High

```text
Goal: Five playable missions, one of each required type; intro marker at spawn; free-roam between; no soft-locks.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Constraints: types must be distinct (courier, steal-deliver, escape-heat, multi-stop, destruction|protection|race); unit test state transitions; commit+push after green (approved).
Process: implement mission manager + 5 defs → unit tests → grow e2e to start intro mission + see objective → verify → log → commit+push.
Done when:
- Each mission: title, briefing, accept, HUD objective, world markers, success/fail, reward, retry, cleanup
- Intro mission startable near spawn; objective on HUD + __GAME_DEBUG__.mission
- Destroyed target/NPC does not soft-lock
- Mission transition unit tests green; e2e mission step green
Stop: Do not polish full HUD/audio suite beyond mission needs (slice 9).
```

---

## Slice 9 — HUD / audio / persistence  
**Effort:** Medium

```text
Goal: Readable HUD + minimap + expanded map; Web Audio after user gesture; localStorage settings/progress with reset-save.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Constraints: master/SFX/ambience buses; audio starts only after gesture; corrupt localStorage safe; commit+push after green (approved).
Process: implement → check/test → e2e gesture path → log → commit+push.
Done when:
- HUD: health, cash/score, weapon/ammo, vehicle health when driving, heat pips, mission/objective, timer if needed
- Minimap: roads, player heading, police, mission markers/objectives; M toggles expanded map
- Pause has audio controls + reset save
- Save validation unit test green; audio unlock proven in e2e or build-log note with repro
Stop: Do not claim full DoD until slice 10 hardening.
```

---

## Slice 10 — Hardening  
**Effort:** High

```text
Goal: Full Definition of Done — harden e2e smoke to the Spec spine, restart/refresh safe, README accurate, verify green, completion report.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Constraints: no fake buttons; no core TODOs; no GTA IP; no external runtime assets; final commit+push after green (approved).
Process: expand e2e to Spec Playwright spine → npm run verify → fix until green → finalize README + AUTONOMOUS_BUILD_LOG.md → commit+push → write completion report in chat.
Done when:
- npm run verify green (or documented strongest fallback with evidence)
- Playwright covers: boot, start, move, enter/drive/exit, intro mission objective, pause/resume, screenshot
- Restart + refresh do not duplicate listeners/entities or soft-lock
- README matches commands/controls/missions
- Completion report cites real command output
Stop: End. Do not start new features past DoD.
```

---

## AFK mode — prefer the single walk-away file

Use [`WALKAWAY-AFK-BUILD-PROMPT.md`](/Users/danielkirkpatrick/GAMES/NOT_GTA_1/docs/WALKAWAY-AFK-BUILD-PROMPT.md) for one-paste AFK.

```text
AFK MODE: Execute Build Order slices in order starting at the first incomplete slice (check AUTONOMOUS_BUILD_LOG.md). For each slice, follow that slice's Goal/Constraints/Process/Done/Stop from docs/GROK-SLICE-PROMPTS.md. Verify each slice before advancing. Do not ask for confirmation between slices. After each green slice: git add, commit, push origin HEAD (Daniel-approved for this AFK; no force-push). After slice 10 Done-when, output the Completion report and stop.
```

---

### Quality Gate
Status: slice contracts are Grok-shaped (Goal/Constraints/Process/Done/Stop); verify forced per slice; AFK optional.  
Key checks: slice 1 acknowledged as mostly scaffolded; high effort on world/vehicles/heat/missions; e2e growth staged.  
Companion: `docs/REVISED-AUTONOMOUS-BUILD-PROMPT.md` conductor + appendix.
