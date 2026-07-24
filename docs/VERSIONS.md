# Harborline — Version History

Plain English: each row is a frozen “save state” of the game you can boot again later to compare then vs now.

Technical: versions are **git tags** on `origin`. Load with `scripts/play-version.sh <tag>` (creates a side worktree so your current `main` checkout stays put).

| Version | Tag | Date | What it is |
|---|---|---|---|
| **0.1.0** | `v0.1.0` | 2026-07-20 | First playable Definition-of-Done sandbox (Build Order 1–10). Keyboard-first controls; Phaser interim art; top-down 3D pinned as future presentation (ADR-005). |
| **0.2.0** | `v0.2.0` | 2026-07-20 | Systems polish (P1–P5): in-world mission accepts, city AI tile bias, vehicle↔world collision, presentation/SFX pass, minimap cache. Mega finish AFK docs staged for next run (→ planned v0.3.0). |
| **0.3.0** | *(tag pending Daniel)* | 2026-07-20 | Finish-Game (F1–F6): mission soul, city/drive/combat juice, art-director title/world/HUD, Suno audio productize, version strings 0.3.0. Git tag not created by AFK — Daniel tags when happy. |
| **0.4.0** | *(tag pending Daniel)* | 2026-07-20 | City Depth Overhaul: multi-lane roads + nav graph, graph NPC AI, Phaser+Three.js top-down 3D (ADR-009), weapons (melee/pistol/SMG/shotgun), heat crash retune, paint shops ($150 recolor + clear heat). |
| **0.4.1** | *(tag pending Daniel)* | 2026-07-20 | Graphics Beauty (G1–G4): transparent Phaser+Three.js compositing, district mesh character, vehicle/ped silhouettes + paint tint, harbor night lights, brand-first title. Strings only — Daniel tags when happy. |
| **0.5.0** | *(tag pending Daniel)* | 2026-07-20 | HD Pixel Pier Ward vertical slice (ADR-010): retire Three.js city; Phaser pixel atlases for vehicles/peds/cops; Pier Ward night paint; neon HUD chrome; ambulance archetype. Expand via `docs/WALKAWAY-AFK-PIXEL-PRESENTATION-PROMPT.md`. |

## How to load a historical version

```bash
# From the main repo — boots that tag in a sibling worktree
./scripts/play-version.sh v0.1.0
./scripts/play-version.sh v0.2.0
```

Or manually:

```bash
git fetch origin tag v0.2.0
git worktree add ../harborline-v0.2.0 v0.2.0
cd ../harborline-v0.2.0 && npm install && npm run dev
```

Open the URL Vite prints. Quit when done; remove the worktree with:

```bash
git worktree remove ../harborline-v0.2.0
```

## How to register the next version

1. Bump `GAME_VERSION` in `src/config/version.ts` and `"version"` in `package.json` together.
2. Ship the milestone on `main` (verify green).
3. Add a row to the table above.
4. `git tag -a vX.Y.Z -m "Harborline vX.Y.Z — …"` then `git push origin vX.Y.Z`.

## Tag ↔ commit

| Tag | Commit (full SHA) |
|---|---|
| `v0.1.0` | `0c73941e29f05b97047e49f91d19e07ec6360a29` |
| `v0.2.0` | `0ae42e35b6c5273438a5a66c09311fb4d8c58d70` |
