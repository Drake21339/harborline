# Grok slices — HD pixel presentation expand

After Pier Ward v0.5.0 vertical slice.

| Slice | Goal | Primary files |
|-------|------|----------------|
| PX1 | Midstack building/road paint to pixel density | `src/world/renderWorld.ts` |
| PX2 | Freight-Cut industrial props + water edge | `src/world/renderWorld.ts` |
| PX3 | Replace generated atlases with sliced GPT sheets | `public/art/`, `docs/art/PIXEL-ATLAS-MAP.md` |
| PX4 | Ped facing bins / simple walk bob | `CivilianRuntime`, `PoliceRuntime` |
| PX5 | City-wide neon/sodium FX layer | GameScene FX helpers |
| PX6 | HUD final arcade chrome + version bump | GameScene, Minimap, `VERSIONS.md` |

Constraints: ADR-010 · no Three.js · surgical diffs · verify green per slice.
