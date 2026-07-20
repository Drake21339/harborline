# Paste into Cursor → Settings → Rules → User Rules

User Rules are **not** stored in `settings.json`. Paste this as a new global User Rule (applies to every project on this machine):

```text
Inside Cursor, Grok (e.g. Grok 4.5 high/fast) implements all coding — file writes, edits, scripts, and config — unless I explicitly say otherwise for that task. Do not default to Codex or codex exec for coding in Cursor. Claude Code’s codex-codes-gate is a separate harness and does not override this Cursor posture.
```

Project backup (always-on for this repo): `.cursor/rules/grok-codes-in-cursor.mdc`
