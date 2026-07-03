---
name: retro
description: End-of-session process retrospective — capture what fought you into docs/FRICTION.md and patch the doc/check that would have prevented it. Use at the end of a working session, or whenever a process trap is worth recording.
---

# /retro — feed session friction back into the repo

The engine's docs are prompts: every session either sharpens them or silently
pays the same tax again. This skill closes that loop. It is about PROCESS
lessons — engine/design lessons go to `docs/LESSONS.md` via the BUILDLOG loop.

## 1. Mine the session

Scan the conversation for friction, specifically:
- API names you guessed wrong before grepping `docs/API.md`.
- Invariants you violated (or nearly did) and what error actually surfaced —
  was the message proximate to the cause, or baffling?
- Steps from AGENTS.md / CONVENTIONS.md you skipped or misread, and why.
- Anything you had to rediscover that a doc should have told you.

If the session had no real friction, say so and stop — do not invent entries.

## 2. Log it

Append each finding to `docs/FRICTION.md` (newest first) in its three-line
format: **Happened / Surfaced as / Fix landed**.

## 3. Land the fix, not just the log

An entry whose fix is "unfixed" is a debt. Prefer, in order:
1. A machine check — extend `scripts/invariants.ts` or a `verify.ts` so the
   mistake fails loudly and proximately.
2. A doc edit — the sentence in AGENTS.md / CONVENTIONS.md / VERIFICATION.md
   that would have prevented it, placed where the next session will read it.
3. A skill edit — if the trap lives in a workflow, patch `/new-game` or this
   skill.

Then run `npm run check` and `npm run invariants` to confirm the repo is
still green, and report what was logged and what was patched.
