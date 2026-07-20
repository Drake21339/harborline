# Harborline — Art / Presentation Direction

## Label (use this)

**Top-down 3D** — 3D-looking city, vehicles, and characters under a **locked top-down / bird’s-eye gameplay camera**.

Not the hard term: “2.5D” (too ambiguous). Casual nickname only.

## What stays 2D (gameplay)

- Top-down camera and arcade controls (keyboard-first, mouse optional)
- Formula: walk, drive, heat, missions, sandbox city — 1997 GTA *feel*, original content

## What “3D” means here

- Buildings/cars/people can be real 3D meshes (or strong faux-3D) with height, lighting, and readable facades
- Camera does **not** become free third-person orbit like GTA III+

## Current build (v0.3.0 Finish)

Phaser **faux top-down 3D** under a locked camera: building roof/face/shadow/windows, district palettes, vehicle cabin/headlight/shadow cues, brand-first title, arcade HUD. Still not a full mesh engine — that remains optional last resort (ADR-005 / finish AFK).

## For agents

- **Systems polish AFK** (`docs/WALKAWAY-AFK-POLISH-PROMPT.md`): done on `main` (P1–P5). Evidence screenshots only; no art-director loop (ADR-007).
- **Mega finish-the-game AFK** (`docs/WALKAWAY-AFK-FINISH-GAME-PROMPT.md`): Daniel-authorized (ADR-008) — mission soul + **art-director loop with budgets** + Suno music slots. Prefer Phaser **faux top-down 3D** under locked camera; full mesh engine only as last resort.
- Suno instrumentals: `docs/SUNO-INSTRUMENTAL-PROMPTS.md` → drop files in `public/audio/`.
- Do **not** treat flat interim art as the forever end state (ADR-005).
