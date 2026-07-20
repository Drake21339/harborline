# Harborline — Scaffold Handoff / Boot Packet (2026-07-20)

Resume packet for a FRESH chat. Self-sufficient; read top-to-bottom. Assume zero memory of the prior conversation.

## TL;DR / current state

Plain English: the empty game folder now has a runnable **Harborline** browser scaffold — title screen, placeholder city grid, you can walk with WASD, and the automated checks pass. The full GTA-formula game is **not** built yet.

Technical: Vite + Phaser 3 + TS strict at `/Users/danielkirkpatrick/GAMES/NOT_GTA_1`. Repo baseline: branch `main`, **no commits yet**, working tree dirty with full scaffold. Vault project: `/Users/danielkirkpatrick/Documents/VAULT/projects/not-gta-1/`.

## The arc (what happened, in order)

1. Audited the mega autonomous-build prompt → gaps fixed in `docs/PROMPT-AUDIT-20260720.md` + `docs/REVISED-AUTONOMOUS-BUILD-PROMPT.md` (no autocommit; pinned Harborline defaults; 5 distinct mission types; slice order; Cursor-portable).
2. Bootstrapped vault seven docs + issues tracker + repo `CLAUDE.md` / `AGENTS.md` / preflight.
3. Rejected: driving Codex for coding in Cursor — Daniel set **global Cursor rule: Grok codes unless otherwise specified**. Claude Code’s `codex-codes-gate` is a separate product switch; leave it alone unless he flips it.
4. Scaffold implemented directly; e2e needed Canvas renderer + window-level key state (Phaser keyboard plugin missed Playwright events).

## Current state of the work / live decision

- Scaffold DoD for “boot + move” is proven via `npm run verify`.
- Full game follows **Build Order** in the revised prompt, starting at slice 2 (world).
- Do not commit unless Daniel asks. Preflight will FAIL “last commit unavailable” until first commit.

## The decisive next requirement / core open work

Implement Build Order slice 2–10 from the revised prompt until full Definition of Done. Silent failure mode: claiming missions/heat “done” without Playwright/`__GAME_DEBUG__` evidence.

## Next steps (in order)

1. Read `docs/REVISED-AUTONOMOUS-BUILD-PROMPT.md` and this handoff.
2. Confirm state in your own words; wait for Daniel’s go (or he pastes the build prompt to run AFK).
3. On go: implement slices starting at **World** (seeded 128×128, collision, districts).
4. After each slice: `npm run verify` (or strongest subset) + log in `AUTONOMOUS_BUILD_LOG.md`.
5. Recommend commit points; do not commit unbidden.

## Verified code facts / anchors (uncommitted tree)

- `src/main.ts` — Phaser.CANVAS game; Boot/Title/Game scenes; input guard
- `src/scenes/TitleScene.ts` — sets `__GAME_DEBUG__.bootCompleted = true`
- `src/scenes/GameScene.ts` — window key Set for WASD/arrows; player physics; debug patch each frame
- `src/config/gameConfig.ts` — `GAME_TITLE = "Harborline"`, `WORLD_SEED = "harborline-1997"`
- `e2e/smoke.spec.ts` — boot → GameScene → move right → screenshot
- `package.json` — scripts: `dev`, `build`, `check`, `test`, `test:e2e`, `verify`

## File map (this handoff + pertinent files on disk)

- THIS file: `/Users/danielkirkpatrick/GAMES/NOT_GTA_1/docs/HARBORLINE-SCAFFOLD-HANDOFF-20260720.md`
- Revised build prompt: `/Users/danielkirkpatrick/GAMES/NOT_GTA_1/docs/REVISED-AUTONOMOUS-BUILD-PROMPT.md`
- Prompt audit: `/Users/danielkirkpatrick/GAMES/NOT_GTA_1/docs/PROMPT-AUDIT-20260720.md`
- Build log: `/Users/danielkirkpatrick/GAMES/NOT_GTA_1/AUTONOMOUS_BUILD_LOG.md`
- README: `/Users/danielkirkpatrick/GAMES/NOT_GTA_1/README.md`
- Vault: `/Users/danielkirkpatrick/Documents/VAULT/projects/not-gta-1/`

## Open questions

- Persist “Grok codes in Cursor” as a Cursor **User Rule**? (Recommended yes — still pending Daniel confirm)
- First commit when ready? (Recommended after he eyes `npm run dev` once)

## Operating context / rules to preserve (boot packet)

- In Cursor: Grok implements code unless Daniel says otherwise.
- Never commit/merge/push without explicit ask.
- Clean-room: no GTA IP.
- Evidence-first: commands + output in the build log.
- Stage + log milestones OK; autocommit is forbidden.
