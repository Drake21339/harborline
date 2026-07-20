# Harborline — Scaffold Handoff / Boot Packet (2026-07-20)

Resume packet for a FRESH chat. Self-sufficient; read top-to-bottom. Assume zero memory of the prior conversation.

## TL;DR / current state

Plain English: runnable **Harborline** scaffold exists — title, placeholder city, WASD move, verify green. Full game not built. Build prompts were retargeted for **Grok 4.5 high+fast** (conductor + slice pack).

Technical: Vite + Phaser 3 + TS at `/Users/danielkirkpatrick/GAMES/NOT_GTA_1`. GitHub: `https://github.com/Drake21339/harborline`. Baseline: `main` @ `f72a7ec` (then local doc updates may be dirty). Vault: `/Users/danielkirkpatrick/Documents/VAULT/projects/not-gta-1/`.

## The arc (what happened, in order)

1. Audited mega prompt → v1 revised rails; then **v2 Grok-optimized** conductor + `docs/GROK-SLICE-PROMPTS.md` (tight Goal/Constraints/Process/Done/Stop per slice).
2. Bootstrapped vault + repo docs/preflight; scaffold implemented by Grok in Cursor (not Codex).
3. e2e: Phaser.CANVAS + window key state (Phaser keyboard missed Playwright).
4. GitHub repo created: Drake21339/harborline; initial commit pushed.

## Current state of the work / live decision

- Scaffold “boot + move” proven via `npm run verify`.
- Full game walk-away: paste **only** the fenced block in `docs/WALKAWAY-AFK-BUILD-PROMPT.md`.
- AFK git: commit+push after each green slice is **approved** for that prompt (ADR-004). No force-push.

## The decisive next requirement / core open work

Implement Build Order slice 2–10 from the revised prompt until full Definition of Done. Silent failure mode: claiming missions/heat “done” without Playwright/`__GAME_DEBUG__` evidence.

## Next steps (in order)

1. If this is the AFK agent: execute `docs/WALKAWAY-AFK-BUILD-PROMPT.md` immediately (no wait).
2. Else: confirm state; wait for go; then slices from `docs/GROK-SLICE-PROMPTS.md`.
3. Per slice: verify → log → commit → push (AFK-approved).

## Verified code facts / anchors (uncommitted tree)

- `src/main.ts` — Phaser.CANVAS game; Boot/Title/Game scenes; input guard
- `src/scenes/TitleScene.ts` — sets `__GAME_DEBUG__.bootCompleted = true`
- `src/scenes/GameScene.ts` — window key Set for WASD/arrows; player physics; debug patch each frame
- `src/config/gameConfig.ts` — `GAME_TITLE = "Harborline"`, `WORLD_SEED = "harborline-1997"`
- `e2e/smoke.spec.ts` — boot → GameScene → move right → screenshot
- `package.json` — scripts: `dev`, `build`, `check`, `test`, `test:e2e`, `verify`

## File map (this handoff + pertinent files on disk)

- THIS file: `/Users/danielkirkpatrick/GAMES/NOT_GTA_1/docs/HARBORLINE-SCAFFOLD-HANDOFF-20260720.md`
- Walk-away one-paste: `/Users/danielkirkpatrick/GAMES/NOT_GTA_1/docs/WALKAWAY-AFK-BUILD-PROMPT.md`
- Grok conductor + appendix: `/Users/danielkirkpatrick/GAMES/NOT_GTA_1/docs/REVISED-AUTONOMOUS-BUILD-PROMPT.md`
- Grok slice pack: `/Users/danielkirkpatrick/GAMES/NOT_GTA_1/docs/GROK-SLICE-PROMPTS.md`
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
