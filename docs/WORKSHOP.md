# WORKSHOP.md — the project's face, from first atom to shipped game

Hayao proves almost everything by machine — winnability, determinism, ramp,
feel floors. The one channel no headless gate can close is **taste**, and that
takes a human. Workshop is the instrument for that channel — and it is the
project's **single workspace for its whole life**: the same pane where you
playtest a finished game is where, weeks earlier, you looked at the first
sprite, listened to the first motif, and read the original concept. Pico-8's
insight, kept: the workspace's table of contents *is* the project's anatomy.
Crafting an atom — a sound, a sprite, a scene, or just a concept — is exactly
where the Workshop is used for the *first* time in a project.

## The tabs — a UI that grows with the project

The Workshop shell shows a tab per kind of content, and **a tab exists only
when its content does** — a day-zero project is one tab; the UI grows as the
project grows. The tabs, in vocabulary order:

| Tab | Shows | Appears when |
|---|---|---|
| **Timeline** | the project's `TIMELINE.md` — Original Concept, pivots, `## Present` (what's being worked on, what feedback is awaited) + a derived session clock | the file exists |
| **Visual** | `kind: 'visual'` atoms — sprites, rigs, animation catalog sheets | first visual atom |
| **Scene** | `kind: 'scene'` atoms — backgrounds, cards-on-table, palette moods | first scene atom |
| **Audio** | `kind: 'audio'` atoms — cues and tracks, play-on-demand, quality scores | first audio atom |
| **Play** | the running game (everything below this section) | `game.ts` exists |
| **Test** | recorded sessions, reports, tapes, knob accept, A/B, phone play | first session |

Atoms ride the same machinery as games: `defineAtom` compiles to a miniature
world, so knobs, HMR carryover, scrubbing, and session recording work on a
lone sprite sheet exactly as they do on a shipped game. **Pico's tabs edit;
hayao's tabs behold** — every tab is a viewer with knobs, never an editor.
The agent writes code; the pane is where human and agent look at the same
thing. See `docs/CONVENTIONS.md` → *Project anatomy* for the file layout
(`TIMELINE.md`, `atoms/`, optional `game.ts`).

The design doctrine, in one line each:

- **Text is the source of truth.** The Workshop UI and its knob panel are
  observers; accepted values become code only when the agent edits the declared
  defaults. `.workshop/` is session data, never config.
- **Filesystem is the bus.** The browser posts artifacts to the dev server; the
  agent reads the same files via the MCP sidecar. The two never hold a socket
  to each other, so everything works across restarts and from cloud agents.
- **A session is a re-executable, not a recording.** `(seed, tuning, inputLog,
  axesLog, knobEvents)` re-simulate the entire run in Node — any metric is
  computable retroactively, any tick re-inspectable.
- **Telemetry describes, the human directs.** Metrics and reports feed the
  human's decisions; nothing is auto-"fixed" from data alone.
- **The human's job is taste, not construction.** Knobs are taste over a
  continuum; variants — and, next, candidate picks — are taste over discrete
  alternatives. The pane presents, the human picks, the agent writes the pick
  into source. Workshop never grows a construction UI.

## Pieces

| Piece | Where | Role |
|---|---|---|
| Tuning knobs | `tuning:` on `defineGame` (see `src/app/tuning.ts`) | declared live-adjustable params; resolved values are hashed sim state read via `world.tune(key)` |
| `runWorkshop()` | game `main.ts` (instead of `runBrowser`) | records the session, applies `?seed=`/`?tuning=` URL overrides, exposes `window.__workshop` (setKnob / annotate / flush) |
| Dev middleware | `hayaoWorkshop()` plugin in `vite.config.ts` | persists sessions + knob values under `.workshop/`, serves `/__workshop/state`, implements `/__shot` |
| MCP sidecar | `bin/hayao-mcp.ts`, registered in `.mcp.json` | the agent's verbs: `list_games`, `list_sessions`, `inspect_moment`, `get_knob_state`, `run_verify` |
| `/workshop` skill | `.claude/skills/workshop/` | the two loops: knob write-back and playtest reading |

## The session artifact

`.workshop/sessions/<id>.json` (`PlaytestSession` in `src/workshop/session.ts`):
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
`src/workshop/session.test.ts`.

## Scrub semantics (time travel in the play pane)

The timeline strip under pane A freezes the sim and drags to any recorded
frame — exact, not approximate: the engine restores the nearest periodic
snapshot (`SnapshotRing`, every 30 frames) and re-steps the session's own
recorded inputs (actions, axes, knob events) to the target. The ⌖ button shows
the live probe at the scrubbed frame. **Resuming after a rewind FORKS the
timeline**: the discarded future is truncated from the session (frames, axes,
knob/screen events, annotations past the fork), so the artifact always replays
as exactly what the player kept — a `scrub` screen event marks the fork frame.

## Tape mode (watch any past session)

A game page opened with `?session=<id>` (`&at=<frame>` optional) becomes a
read-only player for that artifact: the exact starting world is rebuilt, the
whole recording is fast-replayed once to fill an adaptively-strided snapshot
ring, and the full tape is scrubbable end to end — playback steps recorded
frames at real time (elapsed-time accumulator, so throttled background timers
can't slow it). The Workshop drawer's report links each moment ("longest pause @
frame N", your annotations, the quit frame) straight into the tape at that
frame. Knobs and annotation are disabled; nothing records.

## Hot-swap semantics (play across code edits)

A game entry that passes `hot: import.meta.hot` to `runWorkshop` AND contains the
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

## The selection surface (the next thesis — designed, not yet built)

Knob write-back proved the loop for *continuous* taste: the agent declares,
the human tweaks live, the accepted value flows back into `tuning:` defaults.
The selection surface is the same loop for **discrete** taste — and it is an
increment on the seams above, not a new product.

The loop:

1. **The agent generates N candidates of ONE dimension** — four soundtracks,
   three hero sprite sets, two palettes, a pair of feel presets — each
   expressed as a module variant (`variants:` on `runWorkshop`: a `patch` that
   rewrites the definition plus optional `tuning` seeds).
2. **The pane presents them side-by-side in the running game.** Not
   thumbnails in a gallery — the actual game, hot-swapping candidates on the
   live world via the same rebuild-with-carryover contract knobs use
   (snapshot → patched def → restore → `attach`). Hearing soundtrack B over
   the level you were just playing is the comparison; a preview grid is not.
3. **The human picks.** The pick is recorded in the session artifact as an
   event (which candidates were compared, which won, at what frame) — session
   data, never config.
4. **The agent writes the pick into source.** Same doctrine as knobs: the
   winning candidate's code becomes the game's code via an agent edit; the
   losers are deleted or kept as named variants. `.workshop/` remembers *that*
   a choice happened; the repo owns *what* was chosen.

What already exists for this: module variants + `?variant=<name>`, worktree
variants for whole-build A/B (`build_variant` / `list_variants` MCP verbs,
sessions stamped with their variant), the carryover contract, and the session
artifact. What's genuinely missing: a picker UI that swaps ONE dimension
in-place (today a variant is a whole definition patch picked per page load),
a `pick` event in the session schema, and an MCP verb for the agent to read
picks (the discrete sibling of `get_knob_state`).

Two guards, so this stays hayao and not a no-code editor:

- **Cosmetic candidates must be hash-invariant.** Swapping art or audio
  candidates may never change `world.hash()` — the comparison is looks and
  sound over an identical sim, so any candidate can be swapped mid-session
  without forking the timeline. A candidate that *does* touch the sim (a feel
  preset, a rule change) is a tuning/variant compare and lives under the
  existing determinism rules: tuning is hashed, the swap forks like any knob
  event.
- **Selection is the ceiling of the UI's ambition.** The pane presents
  choices the agent authored; it never becomes a construction surface —
  no asset editors, no node inspectors, no drag-and-drop. "No-code" is an
  acceptable emergent property of a good choice surface, never the goal:
  the agent is the code layer, and the human directs it in text.

## Working on Workshop itself

Browser-safe parts (`session.ts`, `record.ts`, `run.ts`) export through the
`@hayao` barrel; the Vite plugin and MCP sidecar are Node-only and must never
enter the barrel. Wall-clock use in `run.ts`/`record.ts` is sanctioned by the
invariants scanner alongside the browser drivers — timestamps go to session
artifacts (observer data), never into the sim.
