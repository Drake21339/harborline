# Harborline — One-Paste Walk-Away AFK Polish

**Paste the fenced block below as the entire first message** in a fresh Cursor Agent chat.

Use this **after** the Build Order DoD is already green on `main` (systems exist; they need depth/feel).

Settings before you walk away:
- Model: **Grok 4.5** · Reasoning: **High** · Speed: **Fast**
- Run Mode: **Run Everything** (Settings → Agents → Approvals & Execution), then switch back to Auto-review when done
- External-file protection: leave **on** (stay inside this repo)

---

```text
You are Grok 4.5 in Cursor. Implement Harborline polish yourself — do not delegate coding to Codex.

WALK-AWAY AFK POLISH (Daniel-approved 2026-07-20). Do not ask questions. Do not wait for confirmation between slices. Keep going until polish Definition of Done or a true BLOCKED stop.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Remote: origin → https://github.com/Drake21339/harborline (branch main)
Read first: AUTONOMOUS_BUILD_LOG.md, README.md, docs/GROK-POLISH-SLICE-PROMPTS.md, docs/REVISED-AUTONOMOUS-BUILD-PROMPT.md (Spec Appendix on demand).

CONTEXT: Build Order 1–10 is already DONE (playable DoD). You are NOT rebuilding from scratch. You are deepening feel, mission playability, city AI, drive/combat juice, and presentation. Prefer surgical edits to existing modules over rewrites.

ART DIRECTION (ADR-005 / docs/ART-DIRECTION.md): Final look target is **top-down 3D** (3D presentation, locked top-down camera). Current Phaser flats are interim. This polish pass improves the interim read + systems — do NOT migrate to a full 3D engine in this AFK unless a slice explicitly says so (none do).

Pinned (do not change unless P5 FPS forces city shrink — then document): title Harborline · seed harborline-1997 · tile 32 · city 128×128 · TS strict + Phaser 3 + Vite · clean-room original content only (no GTA/Rockstar/DMA IP) · keep Canvas renderer + window key-state input unless e2e re-proven · **fully playable with keyboard only (mouse optional)** — never require mouse for start, move, aim, fire, vehicles, missions, pause, or help.

OUT OF SCOPE (never start): new mission types, 7th vehicle, multiplayer, second city, external art/audio downloads, physics engine rewrite, full top-down 3D engine migration, “fun” claims without evidence.

GIT APPROVAL (this AFK polish only): After EVERY green polish slice you MUST:
1) update AUTONOMOUS_BUILD_LOG.md with milestone + verify evidence (commands + observed output)
2) git add relevant files
3) git commit -m "concise why-focused message for the polish slice"
4) git push origin HEAD
Never force-push, never amend already-pushed commits, never change git config, no empty commits.

Process:
1) Inspect repo + build log. Confirm build DoD already green. Find first incomplete polish slice P1–P5 in AUTONOMOUS_BUILD_LOG.md (start at P1 if none logged).
2) For each slice P1→P5: follow that slice’s Goal/Constraints/Process/Done/Stop in docs/GROK-POLISH-SLICE-PROMPTS.md exactly.
3) Verify before advancing. Fix until green. Then log → commit → push → next slice.
4) If a change risks movement/vehicle/mission e2e, re-run npm run test:e2e before calling the slice done.
5) Triage: shrink visual cost / cull before cutting core loops or entity caps below Spec minima.
6) BLOCKED only if: tools fail after documented fallback, need writes outside project, or clean-room risk stays ambiguous — then write BLOCKED + evidence in the build log, commit+push that note, and stop.

Polish Order:
P1 mission depth (all five startable/completable in-world)
P2 living city feel (AI tile bias + district read)
P3 drive/combat juice (vehicle↔world collision + feedback)
P4 presentation (title/HUD/audio/map)
P5 performance + full npm run verify + README truth + completion report

Polish Done when all P1–P5 Done-when lines are true AND npm run verify is green with pasted output (or documented strongest e2e fallback with evidence).

Evidence rules:
- Never claim “feels better” without a screenshot in test-results/ and/or __GAME_DEBUG__ / unit / e2e proof.
- Paste real command output into AUTONOMOUS_BUILD_LOG.md per slice.
- If uncertain whether a behavior is proven, say so and add a test — do not bluff.

Final return (only after polish DoD): title, path, npm run dev, npm run verify (pasted), what got deeper (missions/AI/drive/UI/audio), tests with results, honest remaining limits, latest commit SHA on origin/main.

Begin now. No planning-only turn. Execute P1 (or the first incomplete polish slice) immediately.
```

---

### Quality Gate
Status: one-paste AFK polish; deepen-only scope; git approval explicit for this paste; evidence anti-bluff.  
Companion slices: `docs/GROK-POLISH-SLICE-PROMPTS.md`.
