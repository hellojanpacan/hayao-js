---
name: workshop
description: Work with Hayao Workshop playtest data — read human sessions, inspect stuck moments, apply accepted knob values back to source, and iterate on feel. Use after a human has playtested in the Workshop (dev server) and you need to act on what they experienced.
---

# /workshop — act on human playtests

The Workshop records every dev-server playtest as a re-executable artifact under
`.workshop/sessions/` (gitignored). The `hayao-workshop` MCP server (in `.mcp.json`)
is your window into them — it replays sessions headlessly through the engine, so
you can inspect any tick without a browser. **Telemetry describes, the human
directs**: reports and metrics inform your proposals; never wire a metric
directly to a code change, and never "fix" friction the human didn't flag
without asking.

## The verbs

- `list_games` — slugs + declared knobs (examples and sandbox gyms).
- `list_sessions` — recorded playtests: frames, end reason, knob events,
  annotation counts, build ref.
- `inspect_moment(sessionId, tick?)` — replay to a tick; returns probe, hash,
  and a PNG of exactly what the human saw. Annotation and knob-event frames are
  the interesting ticks; default is the final frame (where they stopped).
- `get_knob_state(game)` — declared tuning spec + values the human accepted in
  the panel.
- `run_verify(game?)` — the machine-proof gate.

## Loop 1 — knob write-back (the human tuned something)

1. `get_knob_state(<slug>)` → diff `accepted` against the spec's declared
   defaults.
2. Apply accepted values to the SOURCE defaults (the `tuning:` block in
   `defineGame`, and any mirrored consts like updrift's `CONFIG`). Code is the
   single source of truth — `.workshop/knobs.json` is session data, never config.
3. `run_verify(<slug>)` — a knob change can break a solver proof or feel gate
   (e.g. a jump that no longer clears the designed envelope). If red, tell the
   human what the new value breaks instead of silently reverting.

## Loop 2 — read a playtest (no verbal feedback needed)

1. `list_sessions` → pick the human's latest session(s).
2. `inspect_moment` at: each annotation frame, then the final frame if
   `endReason` is `quit` (the last frame of an unfinished run IS the churn
   point).
3. Present findings as claims with evidence ("you died 6× at the third gap;
   here's the frame"), propose the smallest fix, and ask which direction to
   take. Hesitation ≠ confusion — treat inferred signals as hypotheses to put
   to the human, not verdicts.

Full architecture and artifact format: `docs/WORKSHOP.md`.
