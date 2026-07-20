# Harborline (not-gta-1)

Browser top-down urban action sandbox. Clean-room gameplay formula inspired by 1997 GTA — original content only.

Run `scripts/preflight.sh` at session start; the done-bar for artifacts is `docs/DEFINITION-OF-DONE.md`.

## Docs
These seven durable project-memory docs belong in the matching vault project folder under `/Users/danielkirkpatrick/Documents/VAULT/projects/not-gta-1/`, not in the repo:

SPEC.md, SESSION-LOG.md, BUGS.md, DECISIONS.md, PATTERNS.md, GLOSSARY.md, ROADMAP.md

Everything else that is active and project-specific belongs in the active repo's `docs/` folder unless the active repo's own `AGENTS.md` or `CLAUDE.md` explicitly names another in-repo path. This includes implementation plans, handoffs, audits/review notes, research packets, prompts, build notes, artifact manifests, test evidence, generated reports, migration notes, release notes, and other working docs.

Feature PRDs and their issues are the one exception: they live in the vault `project-issues-tracker/` (PRDs `type: prd` from `to-prd`, issues `type: issue` from `to-issues`; `status:` frontmatter; `TRACKER.md` Dataview board), not repo `docs/`. ROADMAP.md points into that tracker; BUGS.md stays separate. Implementation plans/handoffs derived from a PRD/issue still go in repo `docs/`.

Repo root should contain only repo-control files that naturally belong there, such as `README.md`, `AGENTS.md`, `CLAUDE.md`, build configs, package manifests, and source-of-truth files the repo already names explicitly.

The vault is also the place for cross-project knowledge, reusable cross-project patterns, templates, prompt libraries, transcripts, indexes/pointers, and archived/reference copies.

If older instructions or memory say the seven durable docs belong in repo `docs/`, treat them as stale. Never leave project-specific docs only in chat: put the seven durable docs in the vault project folder, feature PRDs and their issues in the vault `project-issues-tracker/`, and all other project docs in repo `docs/`.

## Operating rules
- Never commit/merge/push without Daniel's explicit instruction.
- Clean-room: no GTA IP assets, maps, names, audio, or reverse-engineered source.
- Build prompt (revised): `docs/REVISED-AUTONOMOUS-BUILD-PROMPT.md`
- Prompt audit: `docs/PROMPT-AUDIT-20260720.md`
