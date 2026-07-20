# Harborline — Art / Presentation Direction

## Label (use this)

**Top-down 3D** — 3D-looking city, vehicles, and characters under a **locked top-down / bird’s-eye gameplay camera**.

Not the hard term: “2.5D” (too ambiguous). Casual nickname only.

## What stays 2D (gameplay)

- Top-down camera and arcade controls (keyboard-first, mouse optional)
- Formula: walk, drive, heat, missions, sandbox city — 1997 GTA *feel*, original content

## What “3D” means here

- Buildings/cars/people are real 3D meshes with height, lighting, and readable facades (ADR-009)
- Camera does **not** become free third-person orbit like GTA III+

## Current build (v0.4.1 Graphics Beauty)

- **Three.js** orthographic mesh city under **transparent** Phaser HUD/input/physics (ADR-009)
- District height/color bands, road-class markings, sodium street glow
- Archetype vehicle silhouettes + ped/cop body cues; paint-shop tint on meshes
- Brand-first title (Harborline hero wordmark + pier motif)
- Fallback: baked Phaser `paintWorldTexture` if WebGL cannot start

## For agents

- Do **not** treat flat interim art as the forever end state (ADR-005 / ADR-009).
- Prefer mesh/material/lighting iteration over painting more 2D faux roofs.
- **Graphics beauty AFK** (art-only on the Three.js layer): `docs/WALKAWAY-AFK-GRAPHICS-BEAUTY-PROMPT.md` + `docs/GROK-GRAPHICS-BEAUTY-SLICES.md`.
- Suno instrumentals: `docs/SUNO-INSTRUMENTAL-PROMPTS.md` → drop files in `public/audio/`.
