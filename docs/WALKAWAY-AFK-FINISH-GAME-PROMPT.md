# Harborline — One-Paste Mega AFK: Finish The Game

**Paste the fenced block below as the entire first message** in a fresh Cursor Agent chat.

**What this is:** one walk-away run that pushes Grok 4.5 to take Harborline from “playable sandbox” to **fully polished product** — interesting missions, living city, beautiful presentation (art-director loop), music slots for Daniel’s Suno exports, verify green. Not perfection forever; honest remaining limits OK after the DoD.

**Prereqs already on `main`:** Build Order 1–10 (`v0.1.0`) + systems polish P1–P5. You are finishing, not rebuilding.

Settings before you walk away:
- Model: **Grok 4.5** · Reasoning: **High** · Speed: **Fast**
- Run Mode: **Run Everything** (Settings → Agents → Approvals & Execution), then switch back to Auto-review when done
- External-file protection: leave **on** (stay inside this repo)
- Optional before/during run: drop Suno MP3/OGG into `public/audio/` using names in [`docs/SUNO-INSTRUMENTAL-PROMPTS.md`](/Users/danielkirkpatrick/GAMES/NOT_GTA_1/docs/SUNO-INSTRUMENTAL-PROMPTS.md) — agent must wire slots either way (silent fallback if files missing)

Companion phase contracts: [`docs/GROK-FINISH-SLICE-PROMPTS.md`](/Users/danielkirkpatrick/GAMES/NOT_GTA_1/docs/GROK-FINISH-SLICE-PROMPTS.md)

---

```text
You are Grok 4.5 in Cursor. Implement Harborline yourself — do not delegate coding to Codex.

WALK-AWAY MEGA AFK — FINISH THE GAME (Daniel-approved 2026-07-20).
Goal: push your limits. Produce a fully polished Harborline end-to-end without asking Daniel questions or waiting for confirmation. Keep going until Finish-Game Definition of Done or a true BLOCKED stop.
Daniel will reiterate after if needed — your job is maximum polish in one autonomous run, with honest evidence.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Remote: origin → https://github.com/Drake21339/harborline (branch main)
Baseline: tag v0.1.0 = first playable DoD. Systems polish P1–P5 already on main. Do NOT rewrite history; do NOT move/retag v0.1.0.
Read first: AUTONOMOUS_BUILD_LOG.md, README.md, docs/VERSIONS.md, docs/ART-DIRECTION.md, docs/GROK-FINISH-SLICE-PROMPTS.md, docs/SUNO-INSTRUMENTAL-PROMPTS.md, docs/REVISED-AUTONOMOUS-BUILD-PROMPT.md (Spec Appendix on demand).

CONTEXT: This is NOT a rebuild. Prefer surgical depth over rewrites. You are finishing product quality: mission soul, city feel, drive/combat juice, beautiful interim→top-down-3D-read presentation, music integration, performance, docs truth.

SUPERSEDES ADR-007 FOR THIS RUN ONLY:
- Art-director loop is REQUIRED for presentation surfaces (screenshot → judge → fix → reshoot) until the rubric passes or the per-surface budget is exhausted.
- Still no fake “looks great” without a screenshot you actually inspected via the Read tool (images).
- True Three.js/Babylon full engine migration is OPTIONAL last resort only if Phaser faux top-down 3D cannot hit the beauty rubric after budget — prefer finishing beautiful Phaser faux-3D (height, lighting, facades, readable silhouettes) under a LOCKED top-down camera (ADR-005).

Pinned (do not change unless F6 FPS forces city shrink toward 96×96 — then document): title Harborline · seed harborline-1997 · tile 32 · city 128×128 · TS strict + Phaser 3 + Vite · clean-room original only (no GTA/Rockstar/DMA IP names, maps, audio, assets) · Canvas renderer + window key-state input unless e2e re-proven · keyboard-only fully playable (mouse optional) · Baseline bookmark is tag v0.2.0 (systems polish). GAME_VERSION: bump to 0.3.0 in src/config/version.ts + package.json when Finish DoD is met (do not git-tag unless Daniel’s paste says to tag — default: bump version strings only; Daniel tags later).

OUT OF SCOPE (never start): multiplayer, second city, 7th vehicle archetype, new mission TYPE ids beyond the existing five, external paid asset stores, licensed music downloads, claiming “fun” without playable evidence, force-push, amend of pushed commits, git config changes.

GIT APPROVAL (this mega AFK only): After EVERY green phase F1–F6 you MUST:
1) update AUTONOMOUS_BUILD_LOG.md with milestone + verify evidence (commands + observed output)
2) git add relevant files
3) git commit -m "concise why-focused message for the finish phase"
4) git push origin HEAD
Never force-push, never amend already-pushed commits, never change git config, no empty commits. Do not retag/move v0.1.0.

Process:
1) Inspect repo + build log. Confirm prior polish state. Start at first incomplete finish phase F1–F6 in AUTONOMOUS_BUILD_LOG.md (start F1 if none logged).
2) For each phase: follow Goal/Constraints/Process/Done/Stop in docs/GROK-FINISH-SLICE-PROMPTS.md exactly.
3) Verify before advancing. Fix until green. Log → commit → push → next phase.
4) Art-director surfaces (F3/F4): for each listed surface, loop screenshot→Read image→critique against rubric→patch→reshoot until PASS or budget exhausted (document FAIL leftovers honestly).
5) Music (F5): wire public/audio/* per docs/SUNO-INSTRUMENTAL-PROMPTS.md; if files absent, keep synthesized fallbacks and leave drop-in working.
6) BLOCKED only if: tools fail after documented fallback, need writes outside project, or clean-room risk stays ambiguous — then write BLOCKED + evidence in build log, commit+push that note, and stop.

Finish Order (phases):
F1 Mission soul — five types feel distinct (fail drama, hot parcel, cab health, hide-to-cool, contested hops, smash with heat); not “E → circle → cash” only
F2 City + drive + combat depth — AI bias/readability, vehicle↔world impacts, combat feedback, heat pressure readable
F3 Art-director world/title/vehicles — beauty loop under locked top-down camera (budgets in slice file)
F4 Art-director HUD/UI/minimap/pause/help — readable hierarchy, late-90s arcade, no purple-glow AI slop
F5 Audio productize — buses + Suno file slots + SFX variety; title/city/heat beds when files present
F6 Performance + full npm run verify + README/VERSIONS truth + completion report + version bump to 0.3.0 strings

Finish-Game Done when ALL are true:
- Every F1–F6 Done-when line is true (or honest budget-exhausted art FAIL listed with screenshots)
- No mission type is only “walk to marker for cash” without a distinct verb/fail
- Art rubrics for title + in-game world + HUD passed OR leftovers explicitly listed
- public/audio drop-in contract works (files optional at runtime)
- npm run verify green with pasted output
- README matches reality; AUTONOMOUS_BUILD_LOG has F1–F6 evidence
- Completion report: SHA on origin/main, what is polished, honest limits, how Daniel drops Suno files

Evidence rules:
- Never claim beauty or fun without screenshot (Read tool on the PNG) and/or unit/e2e/debug proof.
- Art loop: max budgets in GROK-FINISH-SLICE-PROMPTS.md — do not infinite-loop.
- Paste real command output into AUTONOMOUS_BUILD_LOG.md per phase.
- If uncertain, say so and add a test — do not bluff.

Final return (only after Finish-Game DoD): title, path, npm run dev, npm run verify (pasted), mission/soul highlights, art pass summary (what passed / what hit budget), audio slot status, tests, honest limits, latest commit SHA on origin/main, reminder Daniel can tag v0.3.0 when happy.

Begin now. No planning-only turn. Execute F1 (or first incomplete finish phase) immediately.
```

---

### Quality Gate
Status: mega finish AFK; art-director loop authorized with hard budgets; Phaser faux top-down 3D preferred; Suno drop-in contract; supersedes ADR-007 split for this run only (see vault ADR-008).  
Companions: `docs/GROK-FINISH-SLICE-PROMPTS.md`, `docs/SUNO-INSTRUMENTAL-PROMPTS.md`.
