# Harborline — Graphics Beauty slices (G1–G4)

Daniel-approved walk-away AFK. Prefer edits in `src/world/renderWorld.ts`, vehicle/ped views, `TitleScene`, light GameScene sync hooks. Locked top-down camera. Clean-room only.

## Foundation note (2026-07-20)

`origin/main` has **Phaser faux top-down 3D** (`paintWorldTexture` in `src/world/renderWorld.ts`). There is **no** `src/render3d/WorldRenderer3D.ts`, no Three.js dep, and no ADR-009 City Depth Overhaul branch on this checkout. Beauty phases polish the **sole** renderer — do **not** invent a second mesh engine mid-AFK.

Pinned: title Harborline · seed `harborline-1997` · tile 32 · city 128×128 · keyboard-only playable · GAME_VERSION → `0.4.1` strings on G4 (Daniel tags later).

## Global beauty rubric

- Districts glance-distinct (palette + silhouette), not muddy grey
- Roads read as roads (class/markings), buildings read height (roof/face/shadow)
- Vehicles/peds readable at mid zoom; police distinct
- Harbor night light (cool + sodium), no purple-glow AI slop
- Title brand-first: Harborline is the hero word
- Locked orthographic bird’s-eye — no orbit camera

Art-director loop: screenshot → Read image → critique → patch → reshoot. Max **5** iterations per surface. Leftovers → honest FAIL + path under `test-results/beauty/`.

## G1 — City mesh character

```text
Goal: City reads as depth + district character — stronger roofs/faces/shadows, road-class marks, glanceable districts.
Constraints: no generateWorld road-layout rewrite; paint/visual only; locked camera; clean-room.
Surfaces (≤5 iter each): world-midstack, world-district-contrast, world-roads-close.
Process: upgrade paintWorldTexture → e2e screenshots → Read → patch → check/test/e2e → log → commit+push.
Done when:
- ≥3 districts glance-distinct in one zoomed-out shot
- Midstack buildings show clear roof/face/shadow depth vs F3 baseline
- Road arterials vs intersections readable (dashes/crosswalk/stop bars)
- npm run check && npm run test && npm run test:e2e green
Stop: Do not add Three.js. Do not rewrite NPC/mission systems.
```

## G2 — Vehicles + people silhouettes

```text
Goal: Cars/peds/police readable silhouettes; paint tint visible on vehicle meshes/views.
Constraints: no new vehicle archetypes; arcade sim untouched; visual layers only.
Surfaces (≤5 iter each): vehicle-fleet-close, ped-midzoom, police-read.
Process: multi-part vehicle/ped views + tint sync → screenshots → Read → patch → verify → log → commit+push.
Done when:
- Six archetypes glance-distinct up close
- Peds read as people (head/body), not identical squares
- Police vehicle/ped clearly marked
- Paint-shop / damage tint still applies to body color
- npm run check && npm run test && npm run test:e2e green
Stop: No AI/weapons/heat rewrites.
```

## G3 — Light, atmosphere, title

```text
Goal: Harbor night atmosphere + brand-first title that could not belong to another game.
Constraints: no purple glow; self-contained fonts/CSS; locked camera.
Surfaces (≤5 iter each): title-brand, world-night-light, atmosphere-harbor.
Process: title composition + world night wash/sodium → screenshots → Read → patch → verify → log → commit+push.
Done when:
- Title: Harborline hero-level, one CTA, night harbor atmosphere
- In-world: cool harbor + warm window sodium, readable at night
- npm run check && npm run test && npm run test:e2e green
Stop: No free camera. No asset packs.
```

## G4 — HUD harmony + verify + 0.4.1

```text
Goal: HUD sits with the prettier world; full verify; version strings 0.4.1; completion report.
Constraints: strings only for version; do not git-tag; commit+push after green.
Surfaces (≤5 iter): game-hud-harmony (optional if already PASS).
Process: HUD contrast pass if needed → npm run verify → VERSIONS/README/ART-DIRECTION → build log + report → commit+push.
Done when:
- npm run verify green with pasted output
- GAME_VERSION + package.json = 0.4.1
- G1–G4 evidenced in AUTONOMOUS_BUILD_LOG.md
- Completion report: SHA, what looks better, leftovers, tag reminder
Stop: No force-push / amend / empty commits.
```

## Git (this AFK only)

After every green G1–G4: update `AUTONOMOUS_BUILD_LOG.md` with commands+output → `git add` → `git commit` → `git push origin HEAD`.
