# Harborline — One-Paste Walk-Away AFK Systems Polish

**Paste the fenced block below as the entire first message** in a fresh Cursor Agent chat.

Use this **after** `v0.1.0` is tagged (Build Order DoD green). This is **systems polish**, not artwork polish.

Settings before you walk away:
- Model: **Grok 4.5** · Reasoning: **High** · Speed: **Fast**
- Run Mode: **Run Everything** (Settings → Agents → Approvals & Execution), then switch back to Auto-review when done
- External-file protection: leave **on** (stay inside this repo)

---

```text
You are Grok 4.5 in Cursor. Implement Harborline systems polish yourself — do not delegate coding to Codex.

WALK-AWAY AFK SYSTEMS POLISH (Daniel-approved 2026-07-20). Do not ask questions. Do not wait for confirmation between slices. Keep going until systems-polish Definition of Done or a true BLOCKED stop.

Repo: /Users/danielkirkpatrick/GAMES/NOT_GTA_1
Remote: origin → https://github.com/Drake21339/harborline (branch main)
Baseline tag: v0.1.0 (first playable DoD — do not rewrite history; load via ./scripts/play-version.sh v0.1.0 if you need a reference)
Read first: AUTONOMOUS_BUILD_LOG.md, README.md, docs/VERSIONS.md, docs/ART-DIRECTION.md, docs/GROK-POLISH-SLICE-PROMPTS.md, docs/REVISED-AUTONOMOUS-BUILD-PROMPT.md (Spec Appendix on demand).

CONTEXT: Build Order 1–10 is DONE and registered as v0.1.0. You are NOT rebuilding from scratch. You are deepening feel, mission playability, city AI, drive/combat juice, and light presentation readability. Prefer surgical edits to existing modules over rewrites.

TRACK SPLIT (ADR-007 — mandatory):
- THIS AFK = systems polish only (P1–P5).
- Evidence screenshots are OK for Done-when proof (districts/HUD). Do NOT run an art-director loop (no screenshot→redraw→reshoot until “perfect”).
- Deep artwork / top-down 3D presentation AFK comes LATER in a separate prompt Daniel will run after this systems polish DoD. Do not author or start that track here.

ART DIRECTION (ADR-005 / docs/ART-DIRECTION.md): Final look target is **top-down 3D** (3D presentation, locked top-down camera). Current Phaser flats are interim. Improve interim readability lightly in P4 — do NOT migrate to a full 3D engine in this AFK.

Pinned (do not change unless P5 FPS forces city shrink — then document): title Harborline · seed harborline-1997 · tile 32 · city 128×128 · TS strict + Phaser 3 + Vite · clean-room original content only (no GTA/Rockstar/DMA IP) · keep Canvas renderer + window key-state input unless e2e re-proven · **fully playable with keyboard only (mouse optional)** — never require mouse for start, move, aim, fire, vehicles, missions, pause, or help · show GAME_VERSION on title (bump only if Daniel’s slice pack says so; default leave 0.1.0 until a new tag is requested).

OUT OF SCOPE (never start): new mission types, 7th vehicle, multiplayer, second city, external art/audio downloads, physics engine rewrite, full top-down 3D engine migration, artwork AFK / iterate-until-perfect visuals, “fun” claims without evidence.

GIT APPROVAL (this AFK systems polish only): After EVERY green polish slice you MUST:
1) update AUTONOMOUS_BUILD_LOG.md with milestone + verify evidence (commands + observed output)
2) git add relevant files
3) git commit -m "concise why-focused message for the polish slice"
4) git push origin HEAD
Never force-push, never amend already-pushed commits, never change git config, no empty commits. Do not retag/move v0.1.0.

Process:
1) Inspect repo + build log. Confirm v0.1.0 exists and build DoD is green. Find first incomplete polish slice P1–P5 in AUTONOMOUS_BUILD_LOG.md (start at P1 if none logged).
2) For each slice P1→P5: follow that slice’s Goal/Constraints/Process/Done/Stop in docs/GROK-POLISH-SLICE-PROMPTS.md exactly.
3) Verify before advancing. Fix until green. Then log → commit → push → next slice.
4) If a change risks movement/vehicle/mission e2e, re-run npm run test:e2e before calling the slice done.
5) Triage: shrink visual cost / cull before cutting core loops or entity caps below Spec minima.
6) BLOCKED only if: tools fail after documented fallback, need writes outside project, or clean-room risk stays ambiguous — then write BLOCKED + evidence in the build log, commit+push that note, and stop.

Polish Order:
P1 mission depth (all five startable/completable in-world)
P2 living city feel (AI tile bias + district read)
P3 drive/combat juice (vehicle↔world collision + feedback)
P4 presentation (title/HUD/audio/map) — light interim readability only, not art AFK
P5 performance + full npm run verify + README truth + completion report

Systems-polish Done when all P1–P5 Done-when lines are true AND npm run verify is green with pasted output (or documented strongest e2e fallback with evidence).

Evidence rules:
- Never claim “feels better” without a screenshot in test-results/ and/or __GAME_DEBUG__ / unit / e2e proof.
- At most one evidence screenshot per Done-when claim that needs it — then move on (no iterate-until-pretty loops).
- Paste real command output into AUTONOMOUS_BUILD_LOG.md per slice.
- If uncertain whether a behavior is proven, say so and add a test — do not bluff.

Final return (only after systems-polish DoD): title, path, npm run dev, npm run verify (pasted), what got deeper (missions/AI/drive/UI/audio), tests with results, honest remaining limits, note that artwork/top-down-3D AFK is still pending, latest commit SHA on origin/main. Do not invent the artwork AFK prompt unless asked.

Begin now. No planning-only turn. Execute P1 (or the first incomplete polish slice) immediately.
```

---

### Quality Gate
Status: systems-polish AFK; ADR-007 art split explicit; v0.1.0 baseline protected; evidence screenshots capped.  
Companion slices: `docs/GROK-POLISH-SLICE-PROMPTS.md`.  
Later track: dedicated artwork / top-down 3D AFK (not this paste).
