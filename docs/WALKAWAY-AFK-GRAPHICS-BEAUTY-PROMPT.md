# Harborline — One-Paste AFK: Graphics Beauty (top-down 3D)

**Paste the fenced block below as the entire first message** in a fresh Cursor Agent chat.

**What this is:** walk-away **art-only** polish on the City Depth Overhaul renderer. The 3D engine + locked overhead camera already exist (ADR-009). This run makes the city/vehicles/people/title **look great** via screenshot→judge→fix loops — not another systems rewrite.

**Prereqs:**
1. City Depth Overhaul merged to `main` (or start the chat on the branch that already has Three.js + multi-lane city).
2. Playtest once if you can — optional; AFK does not wait.

Settings before you walk away:
- Model: **Grok 4.5** · Reasoning: **High** · Speed: **Fast**
- Run Mode: **Run Everything** (Settings → Agents → Approvals & Execution), then switch back to Auto-review when done
- External-file protection: leave **on** (stay inside this repo)

Companion phase contracts: [`docs/GROK-GRAPHICS-BEAUTY-SLICES.md`](GROK-GRAPHICS-BEAUTY-SLICES.md)

---

```text
You are Grok 4.5 in Cursor. Implement Harborline yourself — do not delegate coding to Codex.

WALK-AWAY AFK — GRAPHICS BEAUTY (Daniel-approved).
Goal: make the existing Phaser+Three.js top-down 3D Harborline look vastly better — depth, district character, car/ped silhouettes, lighting, title brand — without rewriting gameplay systems. Keep going until Graphics Beauty Definition of Done or a true BLOCKED stop.

Repo: Harborline (this checkout). Prefer origin/main after City Depth Overhaul merge; if that merge is not on main yet, stay on the branch that already contains src/render3d/WorldRenderer3D.ts + multi-lane generateWorld and do not invent a second renderer.
Read first: docs/ART-DIRECTION.md, docs/ADR-009-TOP-DOWN-3D.md, docs/GROK-GRAPHICS-BEAUTY-SLICES.md, docs/VERSIONS.md, AUTONOMOUS_BUILD_LOG.md, README.md, src/render3d/WorldRenderer3D.ts.

CONTEXT: Renderer foundation is DONE (ADR-009). You are NOT choosing between 2D and 3D. You are polishing meshes/materials/lighting/title under a LOCKED orthographic bird’s-eye camera. Phaser keeps HUD/input/physics. Prefer edits in src/render3d/ and TitleScene styling; touch GameScene only for sync/hooks needed by visuals.

OUT OF SCOPE (never start):
- Free third-person / orbit camera
- Rewriting generateWorld road layout from scratch
- Rewriting NPC AI, weapons, heat, missions, paint-shop rules (visual feedback OK)
- Asset-store megapacks, GTA/Rockstar/DMA IP
- Multiplayer, new mission types, 7th vehicle archetype
- Force-push, amend of pushed commits, git config changes

Pinned: title Harborline · seed harborline-1997 · tile 32 · city 128×128 · clean-room · keyboard-only still fully playable · GAME_VERSION patch to 0.4.1 when Beauty DoD met (strings only; do not git-tag — Daniel tags later).

GIT APPROVAL (this beauty AFK only): After EVERY green phase G1–G4 you MUST:
1) update AUTONOMOUS_BUILD_LOG.md with milestone + verify evidence (commands + observed output) + beauty pass/fail notes
2) git add relevant files
3) git commit -m "concise why-focused message for the beauty phase"
4) git push origin HEAD
Never force-push, never amend already-pushed commits, never change git config, no empty commits.

Process:
1) Inspect repo. Confirm Three.js world renderer exists. Start at first incomplete beauty phase G1–G4 in AUTONOMOUS_BUILD_LOG.md (start G1 if none logged).
2) For each phase: follow Goal/Constraints/Process/Done/Stop in docs/GROK-GRAPHICS-BEAUTY-SLICES.md exactly.
3) Art-director loop: screenshot → Read image tool → critique vs rubric → patch → reshoot. Max 5 iterations per surface. Log leftovers honestly if budget exhausted.
4) Verify before advancing (check/test/e2e at minimum; full npm run verify on G4). Fix until green. Log → commit → push → next phase.
5) BLOCKED only if: tools fail after documented fallback, need writes outside project, or clean-room risk stays ambiguous — then write BLOCKED + evidence in build log, commit+push that note, and stop.

Beauty Order (phases):
G1 City mesh character — districts, road-class reads, building depth
G2 Vehicles + people silhouettes — cars/peds/police readable; paint tint on meshes
G3 Light, atmosphere, title — harbor night light + brand-first title
G4 HUD harmony + npm run verify + version 0.4.1 strings + completion report

Graphics Beauty Done when ALL are true:
- Every G1–G4 Done-when line is true (or honest budget-exhausted FAIL listed with screenshots under test-results/beauty/)
- Global beauty rubric passed for title + world-midstack + vehicles-fleet OR leftovers explicit
- Locked top-down camera preserved (no orbit)
- Gameplay systems still work (missions/heat/weapons/paint) — smoke via e2e
- npm run verify green with pasted output
- AUTONOMOUS_BUILD_LOG has G1–G4 evidence
- Completion report: SHA on origin, what looks better, honest leftovers, remind Daniel to tag when happy

Evidence rules:
- Never claim beauty without a screenshot you actually Read (image tool).
- Do not infinite-loop past budgets.
- Paste real command output into AUTONOMOUS_BUILD_LOG.md per phase.
- If uncertain, say so and add a small regression test — do not bluff.

Final return (only after Beauty DoD): title, path, npm run dev, npm run verify (pasted), beauty surfaces passed/leftover, latest commit SHA, reminder Daniel can tag v0.4.1 (or v0.4.0 if you kept 0.4.0) when happy.

Begin now. No planning-only turn. Execute G1 (or first incomplete beauty phase) immediately.
```

---

### Quality Gate
Status: graphics beauty AFK; art-director loop authorized with hard budgets; systems frozen; ADR-009 renderer is the canvas.  
Companions: `docs/GROK-GRAPHICS-BEAUTY-SLICES.md`, `docs/ADR-009-TOP-DOWN-3D.md`, `docs/ART-DIRECTION.md`.
