# Harborline — One-Paste Walk-Away AFK Build

**Paste the fenced block below as the entire first message** in a fresh Cursor Agent chat.

Settings before you walk away:
- Model: **Grok 4.5** · Reasoning: **High** · Speed: **Fast**
- Run Mode: **Run Everything** (Settings → Agents → Approvals & Execution), then switch back to Auto-review when done
- External-file protection: leave **on** (stay inside this repo)

---

```text
You are Grok 4.5 in Cursor. Implement Harborline yourself — do not delegate coding to Codex.

WALK-AWAY AFK BUILD (Daniel-approved 2026-07-20). Do not ask questions. Do not wait for confirmation between slices. Keep going until Definition of Done or a true BLOCKED stop.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Remote: origin → https://github.com/Drake21339/harborline (branch main)
Read first: docs/HARBORLINE-SCAFFOLD-HANDOFF-20260720.md, AUTONOMOUS_BUILD_LOG.md, docs/GROK-SLICE-PROMPTS.md, docs/REVISED-AUTONOMOUS-BUILD-PROMPT.md (Spec Appendix on demand).

Pinned: title Harborline · seed harborline-1997 · tile 32 · city 128×128 (shrink toward 96×96 only if FPS forces) · TS strict + Phaser 3 + Vite · clean-room original content only (no GTA/Rockstar/DMA IP).

GIT APPROVAL (this AFK only): After EVERY green slice you MUST:
1) update AUTONOMOUS_BUILD_LOG.md with milestone + verify evidence
2) git add relevant files
3) git commit -m "concise why-focused message for the slice"
4) git push origin HEAD
Never force-push, never amend already-pushed commits, never change git config, no empty commits.

Process:
1) Inspect repo; find first incomplete Build Order slice in AUTONOMOUS_BUILD_LOG.md (start at slice 2 World if scaffold-only).
2) For each slice 2→10: follow that slice's Goal/Constraints/Process/Done/Stop in docs/GROK-SLICE-PROMPTS.md exactly.
3) Verify before advancing. Fix until green. Then commit+push. Then next slice.
4) Extend scaffold (Canvas renderer + window key-state input). Re-prove e2e if you change those.
5) Shrink visuals/world size before cutting core loops.
6) BLOCKED only if: tools fail after documented fallback, need writes outside project, or clean-room risk stays ambiguous — then write BLOCKED + evidence in the build log, commit+push that note, and stop.

Build Order: (1 boot mostly done) 2 world → 3 on-foot → 4 vehicles×6 → 5 civilians → 6 combat/pickups → 7 heat/police → 8 five distinct missions → 9 HUD/audio/persistence → 10 harden + full verify.

Whole-game Done when Spec Appendix Definition of Done in docs/REVISED-AUTONOMOUS-BUILD-PROMPT.md is true, including npm run verify green (or documented strongest e2e fallback with evidence).

Final return (only after DoD): title, path, npm run dev, npm run verify, controls blurb, systems+mission types, tests with pasted results, minor non-blocking limits, latest commit SHA on origin/main.

Begin now. No planning-only turn. Execute slice 2 (or the first incomplete slice) immediately.
```
