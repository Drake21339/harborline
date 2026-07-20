# Harborline — Grok 4.5 Build Prompt (v2, high + fast)

Optimized for **Grok 4.5** in Cursor: short Goal/Constraints/Process/Done/Stop contracts, tight verify loops, lean context. Full gameplay encyclopedia is an appendix — open only when implementing that system.

**Model:** Grok 4.5 · **Reasoning:** High for slices 2,4,7,8 · Medium OK for 3,5,6,9 · High for 10  
**Mode:** Fast  
**Coder:** Implement directly in Cursor (do not delegate coding to Codex)

---

## How Daniel runs this

| Mode | What to paste |
|---|---|
| **(Recommended)** Slice mode | 1) Conductor below once → 2) one slice from [`GROK-SLICE-PROMPTS.md`](/Users/danielkirkpatrick/GAMES/NOT_GTA_1/docs/GROK-SLICE-PROMPTS.md) at a time |
| AFK mode | Conductor + the AFK block at the bottom of the slice file (runs slices in order, still verifies each) |

Also read the boot packet if present: `docs/HARBORLINE-SCAFFOLD-HANDOFF-20260720.md`.

---

## CONDUCTOR — paste this first

```text
Goal: Finish Harborline as a playable clean-room top-down urban sandbox on the existing scaffold until Definition of Done passes.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Stack: TypeScript strict + Phaser 3 + Vite + Vitest + Playwright (already scaffolded).
Title/seed: Harborline / harborline-1997. Tile 32px. City 128×128 (shrink toward 96×96 only if FPS forces it).

Constraints:
- Implement code yourself in Cursor. Do not delegate coding to Codex.
- **Git (APPROVED for this AFK build by Daniel, 2026-07-20):** after each green slice, `git add` relevant files, `git commit` with a concise message, and `git push origin HEAD`. Do not force-push, rewrite history, or change git config. No empty commits.
- Do not write outside this project directory.
- Clean-room only: original city/characters/vehicles/missions/UI/audio. No Rockstar/DMA IP, maps, names, logos, sprites, music, dialogue, or reverse-engineered source.
- Extend the scaffold; do not rewrite the whole app from scratch.
- Keep window key-state input + Phaser.CANVAS unless you re-prove e2e after changing them.
- Prefer smallest change that completes the current slice.

Process (every slice):
1) Read AUTONOMOUS_BUILD_LOG.md + package.json + relevant src/.
2) Implement ONLY the current slice.
3) Run the slice's verify command; fix until green.
4) Append milestone + command output summary to AUTONOMOUS_BUILD_LOG.md.
5) Commit + push that slice (approved). Stop (slice mode) or advance (AFK mode).

Decision rule: if uncertain on non-blocking design, use Pinned Defaults in the Spec Appendix and note the choice in the build log.
Triage: shrink visuals/world size before cutting any core gameplay loop.
BLOCKED stop only if: tools fail after documented fallback, need writes outside project, or clean-room risk stays ambiguous.

Done when (whole game — Spec Appendix Definition of Done):
- npm run verify green (or documented e2e fallback)
- All Build Order slices complete with evidence in AUTONOMOUS_BUILD_LOG.md
- No core TODOs; README matches reality

Return (only after full DoD): title, path, run cmd, verify cmd, controls blurb, systems/missions done, tests+results pasted, minor non-blocking limits only. Claims must cite commands you ran.

Stop: Do not plan-only. Do not skip verify. Do not start the next slice until the current slice Done-when is green (unless AFK mode, which still requires per-slice verify before advancing).
```

---

## Spec Appendix (read on demand)

### Pinned Defaults

| Item | Value |
|---|---|
| Title | Harborline |
| Premise | Arcade coastal crime-sandbox; original districts/characters |
| Tone | Late-90s top-down arcade; cartoon violence; no gore |
| Seed | `harborline-1997` |
| Fallback stack | If npm/Phaser impossible → zero-dep Canvas + local static server; still hit DoD |

### Build Order

1. Boot shell — title/play/pause/help; `__GAME_DEBUG__`; no page scroll on keys  
2. World — seeded city, districts, camera, collision, district toast  
3. Player on foot — 8-way, sprint, mouse aim, ranged+melee, health/i-frames  
4. Vehicles — 6 archetypes; enter/exit; arcade drive; damage; explode; safe exit  
5. Civilians — pooled peds+traffic; flee/react; hard caps  
6. Combat + pickups — weapons/ammo/health/cash; respawn; safehouse/repair  
7. Heat + police — levels 0–5; foot+car pursuit; arrest hold; decay; caps  
8. Missions — five missions, **one of each type** (no duplicate types)  
9. HUD/audio/persistence — minimap/maps; Web Audio after gesture; localStorage+reset  
10. Hardening — full e2e; restart/refresh; README accurate  

### Mission types (exactly one each)

1. Timed checkpoint courier  
2. Steal specified vehicle → drop  
3. Escape until heat clears  
4. Multi-stop passenger/package  
5. Destruction **or** protection **or** pursuit/race (pick one)  

### Vehicles (exactly six)

compact, sedan, sports, van, taxi-like, police cruiser — each with max speed, accel, reverse, steer, grip, mass, durability, collision damage, engine pitch range.

### Controls

WASD/arrows · Shift sprint · E enter/exit/interact · mouse aim · LMB/F fire · Space handbrake · R restart/unstick · M map · P/Esc pause · Enter start · F1/H help.

### Heat

0 none · 1 investigate · 2 pursue · 3 more units · 4 roadblocks/reinforce · 5 max. Decay only after unseen timer. Arrest after short close control.

### Scripts

`dev` `build` `typecheck` `lint` `check` `test` `test:e2e` `verify`  
`check` = typecheck+lint · `verify` = check→test→build→test:e2e  

### Unit tests (minimum)

heat · mission transitions · vehicle enter/exit · damage/destruction · rewards · seeded worldgen · save validation  

### Playwright smoke spine

boot → start → move → enter/drive/exit vehicle → start intro mission → pause/resume → screenshot · clear localStorage · pin seed · Canvas+window keys already proven in scaffold  

### Performance

~60 FPS · ~30–50 traffic · ~40–80 peds · heat-capped police · dynamic reduce OK  

### Architecture targets

scenes + systems modules; strict TS; config constants; pooling/culling; clean shutdown; `window.__GAME_DEBUG__` read-only  

### Definition of Done

Playable keyboard+mouse city; collision; 6 vehicles enter/drive/damage/exit; peds+traffic; 5 distinct missions completable; combat+pickups; heat up/pursue/decay/arrest loop; HUD/minimap/pause/help/audio; SFX after gesture; restart/refresh safe; no external runtime assets; no GTA IP; no fake buttons; no core TODOs; typecheck+build+test+strongest e2e/fallback green; README true; evidence in `AUTONOMOUS_BUILD_LOG.md`.

Non-blocking: extra polish, 7th vehicle, collectibles, “fun” beyond gates.

### Scaffold anchors (extend these)

- `src/main.ts` — Phaser.CANVAS, scenes, input guard  
- `src/scenes/TitleScene.ts` — `bootCompleted`  
- `src/scenes/GameScene.ts` — window key Set, player, debug patch  
- `src/systems/debugSnapshot.ts` — `__GAME_DEBUG__`  
- `e2e/smoke.spec.ts` — grow this as systems land  
- `src/config/gameConfig.ts` — title/seed/constants  

---

### Quality Gate
Status: revised for Grok 4.5 high+fast; conductor + slice pack is the execution path; appendix is on-demand.  
Key checks: shorter front contract; per-slice verify; no autocommit; clean-room; scaffold anchors.  
Companion: `docs/GROK-SLICE-PROMPTS.md`.
