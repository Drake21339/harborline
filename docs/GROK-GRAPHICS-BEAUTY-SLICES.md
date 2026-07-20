# Harborline — Grok Graphics Beauty Phase Prompts (v1)

Use with [`WALKAWAY-AFK-GRAPHICS-BEAUTY-PROMPT.md`](WALKAWAY-AFK-GRAPHICS-BEAUTY-PROMPT.md).

**Baseline:** City Depth Overhaul on `main` (or the merged PR) — Phaser + Three.js top-down 3D (ADR-009), multi-lane roads, graph NPCs already shipped. This pack is **look only**.

**Hard rails:** clean-room · locked bird’s-eye camera (no free orbit) · keyboard-first gameplay unchanged · no force-push · no amend of pushed commits · no empty commits · do **not** rewrite worldgen / AI / weapons / heat / missions unless a tiny visual hook is required · prefer materials/meshes/lighting in `src/render3d/` over Phaser rectangle paint.

---

## Art-director loop — mandatory protocol

For each surface listed in the phase:

1. Capture screenshot to `test-results/beauty/<surface>-N.png` (N = iteration).
2. **Read the image** with the Read tool (you must see pixels, not guess).
3. Critique against the rubric. List concrete defects.
4. Patch the smallest visual change that addresses defects.
5. Reshoot. Repeat until **PASS** or **budget exhausted**.

**Per-surface budget:** max **5** iterations. If still FAIL at 5, keep best, log leftovers, move on.

**Global beauty rubric (PASS needs all):**
- Readable at a glance (player, roads by class, buildings, water, HUD)
- Distinct districts (≥3 material/height/silhouette reads)
- Roads read as 2-lane / 4-lane / freeway (markings, width, median)
- Vehicles look like cars (cabin, glass, wheels cue); peds look person-sized
- Depth: real mesh height + lighting (not flat boards)
- No purple-glow / generic AI-slop UI chrome
- Harborline brand clear on title (brand-first)
- Late-90s arcade urban tone (gritty, warm sodium + cool harbor — not pastel SaaS)
- Nothing critical overlapping unreadably

---

## G1 — City mesh character

**Effort:** High

```text
Goal: The Three.js city looks like Harborline districts with depth — not a uniform Lego field.

Repo: current Harborline checkout (City Depth Overhaul already present).
Constraints: locked ortho top-down; keep generateWorld road hierarchy; no new city size; surgical changes in src/render3d/ (+ tiny world data hooks if needed for heights); commit+push after green.
Process: improve building variety (height bands, facade colors, window/roof cues per district) → road materials/markings by RoadClass (local/arterial/freeway median) → water/park/plaza ground reads → screenshot loop for surfaces: world-midstack, world-pier, world-freeway → check/test/e2e → log → commit+push.
Done when:
- Beauty rubric PASS for world-midstack OR budget leftovers listed with screenshots
- Freeway vs local road distinguishable in a screenshot you Read
- District palettes still distinct
- npm run check && npm run test && npm run test:e2e green
Stop: Do not rewrite generateWorld layout from scratch; do not add free camera.
```

---

## G2 — Vehicles + people silhouettes

**Effort:** High

```text
Goal: Cars and people read as cars and people from overhead — not colored boxes.

Repo: current Harborline checkout.
Constraints: sync still driven by Phaser poses; keep archetype count at six; ped/traffic caps unchanged; commit+push after green.
Process: richer vehicle meshes (body/cabin/glass/wheels/shadow) per archetype tint → ped capsule/shoulder read + facing cue → police distinct → paint-shop recolor still updates 3D material → screenshot loop: vehicles-fleet, ped-crowd, police-chase → check/test/e2e → log → commit+push.
Done when:
- Beauty rubric PASS for vehicles-fleet OR leftovers listed
- Player readable vs civilians; cars vs peds obvious at glance
- Paint color change visible on mesh after shop use (unit or manual proof in log)
- npm run check && npm run test && npm run test:e2e green
Stop: No asset-store packs; no skeletal animation system.
```

---

## G3 — Light, atmosphere, title

**Effort:** High

```text
Goal: Night-harbor atmosphere and brand-first title that match the 3D city.

Repo: current Harborline checkout.
Constraints: title can stay Phaser/DOM; game world lighting is Three.js; no purple neon SaaS look; commit+push after green.
Process: tune ambient/directional lights + optional cheap fog/horizon wash → ground contact shadows or blob shadows under agents if cheap → TitleScene brand hierarchy (Harborline hero, not overpowered by subtitle) → screenshot loop: title-brand, night-atmosphere, spawn-plaza → check/test/e2e → log → commit+push.
Done when:
- Title beauty rubric PASS (brand-first) OR leftovers listed
- In-game lighting makes building faces read (not flat ambient-only mush)
- npm run check && npm run test && npm run test:e2e green
Stop: No post-processing stack that tanks FPS below playable on a laptop.
```

---

## G4 — HUD harmony + verify + report

**Effort:** Medium

```text
Goal: HUD/minimap/pause/help still late-90s arcade and readable over the 3D world; product strings honest.

Repo: current Harborline checkout.
Constraints: do not redesign gameplay; HUD remains Phaser scrollFactor-0; commit+push after green.
Process: contrast/hierarchy pass on HUD over dark 3D → minimap still truthful for multi-lane city → help text mentions 3D/paint/weapons accurately → bump GAME_VERSION to 0.4.1 (patch beauty) in version.ts + package.json if not already past 0.4.0 beauty → npm run verify → AUTONOMOUS_BUILD_LOG G1–G4 → README/ART-DIRECTION truth → commit+push.
Done when:
- HUD readable in a screenshot over the 3D scene
- npm run verify green with pasted output
- Completion report: SHA, what passed beauty, budget leftovers, how to play
Stop: Do not git-tag; Daniel tags when happy.
```
