# Walk-away AFK — HD Pixel Presentation (post Pier Ward slice)

Paste into a fresh Cursor agent when expanding beyond the Pier Ward vertical slice.

## Mission

Harborline presentation is **HD top-down pixel** (ADR-010). Three.js city is retired. Prove and expand pixel polish district-by-district using atlases in `public/art/atlases/` and `docs/art/PIXEL-ATLAS-MAP.md`.

## Read first

- `docs/ART-DIRECTION.md`
- `docs/ADR-010-HD-TOP-DOWN-PIXEL.md`
- `docs/art/PIXEL-ATLAS-MAP.md`
- `docs/GROK-PIXEL-PRESENTATION-SLICES.md` (if present)
- `AUTONOMOUS_BUILD_LOG.md`

## Hard rails

- Clean-room · locked bird’s-eye camera · keyboard-first gameplay unchanged
- Do **not** reintroduce Three.js world meshes or box-in-box vehicle overlays
- Prefer atlas frames + `paintWorldTexture` + 2D FX
- Drop Daniel’s GPT sheets into `public/art/refs/` and re-slice into atlases when available (same frame indices)
- No force-push · no amend of pushed commits · ask-before-commit unless this AFK explicitly re-authorizes commits

## Expand order

1. Midstack night blocks (brick, awnings, clutter)
2. Freight-Cut docks (containers, crane props)
3. Ridge-Hollow / Greenbelt softer residential read
4. Full walk cycles / 8-dir only after static frames look right city-wide
5. HUD chrome polish pass if still gold-era vs neon arcade refs

## Done when

Eye match to GPT comps on multiple districts; `npm run verify` green; version bumped per `docs/VERSIONS.md`.
