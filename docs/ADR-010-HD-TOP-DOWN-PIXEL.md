# ADR-010 — HD top-down pixel presentation (retire Three.js city)

- **Date:** 2026-07-20
- **Status:** Accepted
- **Context:** Graphics Beauty (v0.4.1) polished Three.js extruded boxes under a locked ortho camera. Playtest: buildings still read flat, cars were “boxes inside boxes,” and the look did not match Daniel’s GPT HD pixel reference sheets (night pier, detailed vehicles, civilians, SWAT).
- **Decision:** Presentation target is **HD top-down pixel** in Phaser: baked/layered world paint + sprite atlases + 2D FX/HUD. **Disable and remove** the Three.js `WorldRenderer3D` city path. Gameplay/physics/missions stay Phaser arcade. Art atlases live in `public/art/atlases/` with `docs/art/PIXEL-ATLAS-MAP.md`. First proof is a **Pier Ward vertical slice**; other districts expand later.
- **Reasoning:** The reference look is authored pixel shading and clutter, not mesh extrusion. Phaser already owns input/physics/HUD; a second mesh renderer fought that aesthetic and burned polish time.
- **Consequences:** Remove `three` runtime dependency when unused. Supersedes ADR-009 for ongoing presentation. Updates ADR-005’s forever target from “mesh top-down 3D” to HD pixel under the same locked camera. Vault `DECISIONS.md` / `SPEC.md` should mirror this when the vault is available.
- **Supersedes:** ADR-009 (Phaser + Three.js top-down 3D). Soft-supersedes ADR-005’s mesh end-state wording (camera/formula unchanged).
