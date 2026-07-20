# Prompt Audit — Autonomous Build Spec (2026-07-20)

**Target model / harness:** Cursor coding agent (originally labeled “Grok 4.5”; audit treats harness capability, not a branded model card).  
**Artifact audited:** user-supplied autonomous GTA-formula game build prompt.  
**Outcome:** v1 rails in `docs/REVISED-AUTONOMOUS-BUILD-PROMPT.md`, then **v2 Grok 4.5 high+fast** rewrite (same file) + `docs/GROK-SLICE-PROMPTS.md` (conductor + per-slice Goal/Constraints/Process/Done/Stop).

## Top issues (by impact)

1. **Commit policy fights standing user rules** (`Repository Handling`)  
   Prompt says “make small logical commits after major milestones.” Standing rule: never commit/merge/push unless Daniel explicitly asks. An AFK agent that commits will violate the house rule; one that obeys the house rule “fails” the prompt.  
   **Fix:** stage-only + log milestones; commit only on explicit instruction.

2. **Single-shot DoD is larger than one reliable agent session** (`Autonomy Contract` + `Definition of Done`)  
   Full city sim + heat + 5 mission types + audio + Playwright + polish in one uninterrupted loop invites truncated context, fake “done,” or abandoned mid-systems.  
   **Fix:** require ordered vertical slices with a hard persistence file; allow multi-session resume from `AUTONOMOUS_BUILD_LOG.md` without re-planning from zero.

3. **“Do not ask questions” removes the only brake on irreversible taste/legal forks** (`Autonomy Contract`)  
   Title tone, violence framing, and “spiritual recreation” boundaries need pinned defaults, not silent invention—or a single stop rule for out-of-scope legal risk.  
   **Fix:** pin defaults (title, palette, violence level, seed); stop only for true external blockers.

4. **DoD mixes objective gates with subjective feel** (`Definition of Done`)  
   “Enjoyable,” “visibly active,” “police visibly pursue” are not machine-checkable as written. Agents will claim success from unit tests alone.  
   **Fix:** bind visibility claims to `__GAME_DEBUG__` assertions + Playwright steps + screenshot artifacts; keep “feel” as non-blocking polish after gates.

5. **Mission requirements contradict themselves** (`Missions`)  
   “≥5 missions across ≥3 mechanically distinct types” vs five *required* type bullets. Agents can ship 5 courier variants and claim “3 types.”  
   **Fix:** require five missions, one of each listed type (no duplicates counting as distinct).

6. **Vehicle count waffle** (`Vehicle Gameplay`)  
   “At least six” then lists seven with one “optional.”  
   **Fix:** ship exactly six required archetypes; seventh optional.

7. **No escalate/stop for true environment blockers** (`Preferred Technology` / e2e)  
   Infinite retry on Playwright binary failure or sandbox GUI denial wastes the session.  
   **Fix:** after documented fallbacks, write BLOCKED with evidence and stop—do not thrash.

8. **Hardcoded “You are Grok 4.5”** (opening)  
   Breaks if the next window is Claude/Composer/Codex.  
   **Fix:** role = Cursor principal game engineer; model-agnostic.

9. **localStorage + e2e not specified** (`Persistence` / Playwright)  
   Stale saves make smoke tests flaky.  
   **Fix:** clear storage in Playwright `beforeEach`; pin seed via query/debug flag.

10. **Audio DoD without unlock strategy in automation** (`Audio` / e2e)  
    Browsers block autoplay; smoke test must click/tap before asserting SFX hooks.  
    **Fix:** explicit gesture in e2e; assert audio graph created, not that speakers played.

## What the prompt does well

- Clean-room legal boundary is explicit and load-bearing.
- Prefer Phaser stack with zero-dependency Canvas fallback.
- `__GAME_DEBUG__` + Playwright path is the right verification spine.
- “Simplify visuals before cutting gameplay loops” is the correct triage rule.

## What was removed / changed and why

| Removed / changed | Why |
|---|---|
| “You are Grok 4.5” | Harness-portable role |
| Autocommit mandate | Conflicts with standing no-commit rule |
| “Do not ask questions” absolute | Replaced with pinned defaults + narrow stop rule |
| Subjective “enjoyable” as DoD gate | Moved to non-blocking polish |
| Ambiguous 3-of-5 mission types | Exactly one mission per required type |
| Unbounded single-session thrash | Slice order + BLOCKED escalate |

## Open questions (resolved for this bootstrap with defaults)

| Question | Default used |
|---|---|
| Working title | **Harborline** |
| Vault/project id | `not-gta-1` |
| Violence level | Arcade cartoon (no gore, no real crime branding) |
| World seed | `harborline-1997` |
| Commit during AFK build | **No** — stage + log only |

## Effort recommendation

- Prompt audit / rewrite: already done (this doc).
- Full autonomous build (next session): **high / xhigh** agent effort; expect multi-hour wall clock; prefer slice-by-slice with verify after each slice.
- Optional follow-up: `blind-audit-three-models` on the revised prompt if you want triangulation before the long run.

### Quality Gate
Status: inline self-review complete; final audit + revised prompt below (separate file).  
Key checks: commit conflict fixed; mission/vehicle counts unambiguous; DoD machine-checkable spine; target harness-portable; revision shorter than original wall of negatives.  
Separate audit-only companion: optional blind-audit if spending a long AFK build session.
