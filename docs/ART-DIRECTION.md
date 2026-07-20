# Harborline — Art / Presentation Direction

## Label (use this)

**HD top-down pixel** — authored pixel-art city, vehicles, and characters under a **locked top-down / bird’s-eye gameplay camera**.

Not the hard term: “2.5D”. Not mesh/Three.js boxes.

## What stays 2D (gameplay)

- Top-down camera and arcade controls (keyboard-first, mouse optional)
- Formula: walk, drive, heat, missions, sandbox city — 1997 GTA *feel*, original content

## What “HD pixel” means here

- Depth comes from **shading, facades, drop shadows, neon/sodium glow, and clutter** in sprites and baked world paint — not extruded meshes
- Cars/people are **sprite sheets** (rotated frames OK; full walk cycles later)
- Camera does **not** become free third-person orbit like GTA III+

## Current build (v0.5.0 Pier Ward vertical slice)

- Phaser-only presentation (Three.js city path **retired**, ADR-010)
- Pier Ward night waterfront paint + shared road language
- Production pixel atlases in `public/art/atlases/` (see `docs/art/PIXEL-ATLAS-MAP.md`)
- Brand-first title (Harborline hero wordmark + pier motif)
- Suno beds in `public/audio/`

## Hard bans

- Do **not** reintroduce Three.js world meshes or “box-in-box” vehicle overlays
- Do **not** treat flat interim rectangles as the forever end state — prefer atlas frames
- No GTA IP assets, maps, names, audio, or reverse-engineered source

## For agents

- Expand district polish after Pier Ward proves the look
- Walk-away: `docs/WALKAWAY-AFK-PIXEL-PRESENTATION-PROMPT.md`
- Suno instrumentals: `docs/SUNO-INSTRUMENTAL-PROMPTS.md` → `public/audio/`
