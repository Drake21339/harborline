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

## Current build

Phaser flat primitives / painted tiles = **interim playable stand-in**. Do not treat that look as the final art goal (ADR-005 in vault `DECISIONS.md`).

## For agents

- **Systems polish AFK first** (`docs/WALKAWAY-AFK-POLISH-PROMPT.md`): deepen gameplay/feel; evidence screenshots only — **no** art-director iterate-until-perfect loop (ADR-007).
- **Artwork polish AFK later** (not written yet): in-depth visual / top-down 3D presentation pass after systems polish DoD — screenshot→iterate with an explicit budget.
- Do **not** silently rip out Phaser for a full 3D engine during systems polish.
