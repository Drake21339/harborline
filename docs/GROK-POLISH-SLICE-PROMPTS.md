# Harborline — Grok Polish Slice Prompts (v1)

Use with [`WALKAWAY-AFK-POLISH-PROMPT.md`](/Users/danielkirkpatrick/GAMES/NOT_GTA_1/docs/WALKAWAY-AFK-POLISH-PROMPT.md).

**Baseline:** Build Order 1–10 already green on `main` (DoD playable). This pack **deepens** existing systems — it does **not** add a 7th vehicle, new mission *types*, multiplayer, a second city, or a full **top-down 3D** engine migration (that is a later track; see `docs/ART-DIRECTION.md`).

**Rules for every slice:** implement only this slice · keep `npm run verify` green (or the slice’s stated subset, then full verify by P5) · log evidence in `AUTONOMOUS_BUILD_LOG.md` · **commit + push** (only if the AFK paste grants git) · **stop** unless AFK mode is active.

**Hard rails:** clean-room original only · keep Phaser.CANVAS + window key-state input unless e2e re-proven · **keyboard-only playable** (mouse optional for aim/start) · **no art-director loop** (ADR-007; evidence screenshots only) · no force-push · no amend of pushed commits · no git config changes · no empty commits · no fake “done” without command output · do not move tag `v0.1.0`.

---

## P1 — Mission depth (all five playable)

**Effort:** High

```text
Goal: Every mission type is acceptably startable in the live world (not only unit-forced), completable without soft-locks, with clear briefing → accept → objective → success/fail → reward → cleanup → next unlock.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Constraints: keep the five existing types/ids; do not invent a 6th type; intro remains near spawn; E stays enter/exit/interact; commit+push after green if AFK-approved.
Process: deepen MissionManager + MissionRuntime accept UX for available missions → unit tests for each type’s happy path → grow e2e or debug-scripted proof for ≥2 non-intro missions → check/test → log → commit+push.
Done when:
- Available missions show a world marker + on-screen accept prompt (not only intro)
- Courier, steal-deliver, multi-stop, destruction each have a unit or e2e path that reaches success
- Escape-heat reaches success only after heat was raised then cleared (no instant win)
- Destroyed/missing targets never soft-lock (fail or auto-complete with message)
- __GAME_DEBUG__.mission.id/objective update during active missions
- npm run check && npm run test green; e2e still green
Stop: Do not redesign heat formulas or add new vehicle archetypes.
```

---

## P2 — Living city feel (AI + districts)

**Effort:** High

```text
Goal: Pedestrians and traffic read as a city — sidewalk/road bias, less random swimming through buildings, clearer district visual identity, flee still readable.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Constraints: keep caps (~40–80 peds, ~30–50 traffic); pool/cull; no unbounded spawn; clean-room palette; commit+push after green if AFK-approved.
Process: tighten CivilianRuntime movement against tile types → strengthen district colors/building silhouettes in world paint → prove counts + flee still work → check/test/e2e → log → commit+push.
Done when:
- Most ped steps prefer sidewalk/plaza/park/grass; most traffic steps prefer road (measure in unit helper or debug counters if needed)
- ≥3 districts remain visually distinct at a glance (screenshot in test-results/)
- Attack/siren still flips agents to flee tint/speed
- Caps still enforced on __GAME_DEBUG__.counts
- FPS stays playable; if not, shrink draw detail before cutting caps below minima
- npm run verify subset for this slice green (check+test+e2e minimum)
Stop: Do not implement pathfinding libraries or navmeshes unless a tiny grid BFS fits in this slice without breaking FPS.
```

---

## P3 — Drive / combat juice

**Effort:** Medium–High

```text
Goal: Driving and fighting feel consequential — vehicle↔world solid collision, readable damage/brake/heading, combat feedback that is obvious without clutter.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Constraints: shared arcade vehicle model stays; keep window keys for Playwright; no external art packs; commit+push after green if AFK-approved.
Process: collide active vehicle with world solids → impact damage on hard hits → improve brake/damage stage readability → tighten muzzle/melee/hit feedback → unit tests for impact/damage where pure → e2e enter/drive/exit still green → log → commit+push.
Done when:
- Active vehicle cannot freely drive through buildings/water/fence
- Hard impacts reduce vehicle health; wreck still forces safe exit
- Damage stages remain visible; brake light still readable
- Ranged/melee hits show a clear feedback cue (flash/arc/tint)
- __GAME_DEBUG__.vehicle.speed/health still correct while driving
- npm run check && npm run test && npm run test:e2e green
Stop: Do not add a full physics engine or tire sim.
```

---

## P4 — Presentation (title / HUD / audio / map)

**Effort:** Medium

```text
Goal: First minute feels intentional — title composition, HUD hierarchy, minimap usefulness, audio variety after gesture, pause/help copy accurate. Bias interim art toward a future top-down 3D read (height cues, facade variety) without swapping engines.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Constraints: no purple-glow AI-slop UI; keep late-90s arcade tone; audio only after user gesture; corrupt save still safe; no Three.js/Babylon migration in this slice; commit+push after green if AFK-approved.
Process: polish TitleScene + HUD stacking → distinct SFX for pickup/shoot/ui/arrest/engine cue (still synthesized) → minimap shows roads/player/police/mission markers clearly → pause volume + reset save still work → screenshot title+game HUD → check/test/e2e → log → commit+push.
Done when:
- Title reads as Harborline (brand-first), not a generic Phaser template
- HUD shows health, cash/score, ammo, heat, mission objective without overlapping unreadably
- Minimap (and M expand) remains usable; police + mission markers visible when relevant
- ≥4 distinct SFX kinds fire on real actions after unlock
- Help/pause text matches real controls and states keyboard-only is fully supported
- Mouse remains optional: start/aim/fire/vehicles/missions/pause/help all work without it
- npm run check && npm run test && npm run test:e2e green
Stop: Do not add licensed music, voice lines, or external asset downloads.
```

---

## P5 — Performance, verify, README truth

**Effort:** Medium

```text
Goal: Full polish Definition of Done — stable FPS on desktop target, npm run verify green, README/build-log match reality, completion report honest about remaining limits.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Constraints: prefer culling/batching/cheaper paint over cutting core loops; keep seed/title/tile/city pins unless FPS forces city shrink toward 96×96 (document if so); commit+push after green if AFK-approved.
Process: profile hotspots (world paint, civ update, minimap) → optimize → expand e2e only if stable → npm run verify → update README + AUTONOMOUS_BUILD_LOG.md → commit+push → write completion report in chat.
Done when:
- npm run verify green with pasted output
- e2e still covers: boot, start, move, enter/drive/exit, intro mission objective, pause/resume, refresh-safe re-entry, screenshot
- README controls/missions/systems match code
- Build log notes polish milestones P1–P5 with evidence
- Completion report lists SHA on origin/main + honest non-blocking limits
Stop: End. Do not start a new feature track past polish DoD.
```

---

## AFK mode block

```text
AFK POLISH MODE: Execute polish slices P1→P5 in order. Skip a slice only if AUTONOMOUS_BUILD_LOG.md already records it green with evidence. For each slice, follow Goal/Constraints/Process/Done/Stop above. Verify before advancing. Do not ask for confirmation between slices. After each green slice: update build log, git add, commit, push origin HEAD (only if the walk-away paste grants git for this AFK). After P5 Done-when, output the Completion report and stop.
```

---

### Quality Gate
Status: polish pack is Grok-shaped; evidence forced; scope capped to deepen existing DoD systems.  
Key checks: missions actually playable; city/AI readable; drive collision; presentation; verify.  
Companion: `docs/WALKAWAY-AFK-POLISH-PROMPT.md`.
