# STUDIO.md — the human/AI playtest loop

Hayao proves almost everything by machine — winnability, determinism, ramp,
feel floors. The one channel no headless gate can close is **fun**, and that
takes a human. Studio is the instrument for that channel: it turns every human
playtest into a machine-legible, bit-exactly replayable artifact, and gives the
agent sanctioned verbs to act on it.

The design doctrine, in one line each:

- **Text is the source of truth.** The Studio UI and its knob panel are
  observers; accepted values become code only when the agent edits the declared
  defaults. `.studio/` is session data, never config.
- **Filesystem is the bus.** The browser posts artifacts to the dev server; the
  agent reads the same files via the MCP sidecar. The two never hold a socket
  to each other, so everything works across restarts and from cloud agents.
- **A session is a re-executable, not a recording.** `(seed, tuning, inputLog,
  axesLog, knobEvents)` re-simulate the entire run in Node — any metric is
  computable retroactively, any tick re-inspectable.
- **Telemetry describes, the human directs.** Metrics and reports feed the
  human's decisions; nothing is auto-"fixed" from data alone.

## Pieces

| Piece | Where | Role |
|---|---|---|
| Tuning knobs | `tuning:` on `defineGame` (see `src/app/tuning.ts`) | declared live-adjustable params; resolved values are hashed sim state read via `world.tune(key)` |
| `runStudio()` | game `main.ts` (instead of `runBrowser`) | records the session, applies `?seed=`/`?tuning=` URL overrides, exposes `window.__studio` (setKnob / annotate / flush) |
| Dev middleware | `hayaoStudio()` plugin in `vite.config.ts` | persists sessions + knob values under `.studio/`, serves `/__studio/state`, implements `/__shot` |
| MCP sidecar | `bin/hayao-mcp.ts`, registered in `.mcp.json` | the agent's verbs: `list_games`, `list_sessions`, `inspect_moment`, `get_knob_state`, `run_verify` |
| `/studio` skill | `.claude/skills/studio/` | the two loops: knob write-back and playtest reading |

## The session artifact

`.studio/sessions/<id>.json` (`PlaytestSession` in `src/studio/session.ts`):
seed, initial tuning, per-frame action log, delta-encoded analog axes
(pointer is grid-quantized at the source so replay is exact), mid-play knob
events (replayed via rebuild-with-carryover at their exact frame), DOM screen
events (pause/overlay — menu time the sim can't see), wall-clock marks (tab
hidden ≠ hesitation), human annotations ("felt-bad @ frame N"), end reason,
and the git build ref. `playerId`/`consent` fields exist for future invited
playtesters; creator sessions leave them unset. **Production players are never
recorded** — this is a dev-server instrument only.

`replaySession(def, session, toFrame?)` reconstructs the world at any tick;
`assertSnapshotStable`-grade hash equality is covered in
`src/studio/session.test.ts`.

## Hot-swap semantics (play across code edits)

A game entry that passes `hot: import.meta.hot` to `runStudio` AND contains the
literal line `import.meta.hot?.accept();` keeps its live world across code
edits: on swap the old run snapshots into `hot.data`, the re-executed module
restores it (new module's tuning wins), and the session splits into segments —
the old one flushes as `hot-swap`, the new one records the restored snapshot as
its `startSnapshot`, so **every segment stays bit-exactly replayable** despite
the code change. Both lines are required: Vite marks HMR boundaries by
statically scanning module source, so an `accept()` call inside the engine
cannot mark your entry self-accepting — only the literal in your file can.

## Knob-change semantics

Changing a knob mid-play is a **rebuild-with-carryover**: snapshot → new
tuning → restore → `def.attach?.(world)`. Behaviors are closures and die on
restore, so games whose nodes hold closures re-wire them in `attach` — the
same contract rollback netplay uses. Tuning values live in `world.hash()`, so
a knob change can never silently escape determinism checks.

## Working on Studio itself

Browser-safe parts (`session.ts`, `record.ts`, `run.ts`) export through the
`@hayao` barrel; the Vite plugin and MCP sidecar are Node-only and must never
enter the barrel. Wall-clock use in `run.ts`/`record.ts` is sanctioned by the
invariants scanner alongside the browser drivers — timestamps go to session
artifacts (observer data), never into the sim.
