# ADR-009 — Phaser + Three.js top-down 3D presentation

- **Date:** 2026-07-20
- **Status:** Superseded by [ADR-010](ADR-010-HD-TOP-DOWN-PIXEL.md)
- **Context:** Finish-Game v0.3.0 shipped Phaser faux-3D (painted boxes). Playtest feedback: artwork still read as flat boxes; ADR-005 already named true mesh top-down 3D as the presentation target.
- **Decision (historical):** Keep Phaser for scenes, keyboard/mouse input, Arcade physics, HUD, and minimap. Add **Three.js** with a **locked orthographic bird’s-eye camera** to render the city, vehicles, and peds as meshes. If WebGL is unavailable (e.g. some headless paths), fall back to the existing baked 2D `paintWorldTexture` path.
- **Superseded because:** Mesh boxes did not reach Daniel’s HD pixel reference look (2026-07-20). Presentation moved to Phaser pixel atlases + world paint (ADR-010).
