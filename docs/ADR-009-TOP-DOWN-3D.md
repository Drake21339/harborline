# ADR-009 — Phaser + Three.js top-down 3D presentation

- **Date:** 2026-07-20
- **Status:** Accepted
- **Context:** Finish-Game v0.3.0 shipped Phaser faux-3D (painted boxes). Playtest feedback: artwork still read as flat boxes; ADR-005 already named true mesh top-down 3D as the presentation target.
- **Decision:** Keep Phaser for scenes, keyboard/mouse input, Arcade physics, HUD, and minimap. Add **Three.js** with a **locked orthographic bird’s-eye camera** to render the city, vehicles, and peds as meshes. If WebGL is unavailable (e.g. some headless paths), fall back to the existing baked 2D `paintWorldTexture` path.
- **Reasoning:** Matches ADR-005 without rewriting gameplay. Orthographic lock preserves the 1997-formula camera. Dual-layer keeps e2e/HUD reliability while unlocking real height/lighting.
- **Consequences:** `three` is a runtime dependency. GameScene syncs entity poses each frame when 3D is active and hides Phaser world/agent overlays. Beauty polish iterates on mesh materials/heights, not more faux roof paint.
- **Supersedes:** ADR-008’s “prefer Phaser faux-3D / mesh only as last resort” outcome for ongoing presentation work.
