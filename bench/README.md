# bench/ — the LLM-authoring eval harness

hayao.js claims that a **fresh LLM session** can author, test, and prove
correct a whole game **from the repo docs alone**. This directory measures
that claim instead of asserting it.

A bench run is: one spec + one clean agent session + a throwaway git
worktree. The agent gets the repo as it is (docs, src, examples) and the
spec — nothing else: no conversation history, no hints, no human steering.
Whatever it ships is scored mechanically.

**Every failure is a bug report against the docs/API, not against the
agent.** If the agent hallucinates an API name, the API digest wasn't
greppable enough or the docs invited the guess. If it loops on `verify`,
the error message wasn't actionable. Each batch of runs must end with a
"doc/API fixes" list in [RESULTS.md](RESULTS.md) — that list is the
product; the games are a byproduct.

## Layout

```
bench/
  README.md        this file
  prompt.md        the fixed session prompt (spec gets appended; no other input)
  specs/           graduated game briefs, 01 (easiest) → 06 (hardest)
  run.sh           spawn one full run: worktree → claude -p → collect
  collect.ts       score a finished worktree (works regardless of how the agent ran)
  RESULTS.md       aggregated results + the doc-fix lists
  runs/            per-run JSON metrics + raw stream-json transcripts (gitignored ok)
```

## Running a benchmark

Requires the `claude` CLI, logged in (`claude /login` once, interactively).

```sh
bench/run.sh bench/specs/01-beatgate.md            # one spec, one session
BENCH_MODEL=opus bench/run.sh bench/specs/03-glidegrove.md
CLAUDE_BIN=/path/to/claude bench/run.sh ...        # CLI not on PATH
```

What `run.sh` does:

1. `git worktree add --detach` a throwaway copy of HEAD under
   `/tmp/hayao-bench/<run-id>/`, symlinks `node_modules` in.
2. Composes the prompt: `bench/prompt.md` + the spec file. Nothing else.
3. Runs `claude -p` headless in the worktree with
   `--output-format stream-json` (full transcript → `bench/runs/<id>.stream.jsonl`)
   and `--dangerously-skip-permissions` (safe: the worktree is disposable and
   the session is told to commit nothing).
4. Scores the worktree with `collect.ts` → `bench/runs/<id>.json`, and prints
   a RESULTS.md table row to paste in.

If the CLI is unavailable, any other way of giving a **fresh** agent session
the composed prompt with cwd = the worktree is a valid run (e.g. the Agent
SDK, or a subagent) — `collect.ts` scores the worktree independently of how
the agent ran; only the token/iteration counts degrade to the agent's
self-report in `examples/<slug>/SESSION.md`.

## Metrics per run (collect.ts)

- `check` / `test` / `invariants` / `verify` — did each gate pass, run fresh
  by the collector (never trust the agent's claim).
- `verifyIterations` / `checkIterations` — how many times the agent ran the
  gate before green (counted from the stream-json transcript; falls back to
  SESSION.md self-report).
- `wallSeconds`, `tokens`, `costUsd`, `numTurns` — from the CLI result event.
- `hallucinatedApis` — every name imported from `'@hayao'` in the shipped
  game that does not exist in `docs/API.md`, plus every
  "has no exported member 'X'" error in the transcript (names the agent
  guessed and later fixed — those count too: each one cost an iteration).
- `contamination` — failures in OTHER examples' verify sections, or diffs
  outside `examples/<slug>/` + root `index.html` (the run is void if the
  agent had to touch src/ — unless that turns out to be a real engine bug,
  which is the most valuable outcome a run can produce).

## Scoring philosophy

- A run is **done** only if check + test + invariants + verify are all green
  under the collector AND the spec's definition of done holds.
- A run that goes green after N>1 verify iterations is a success with
  friction — the friction list is the finding.
- A run that never goes green is triaged into: doc gap (docs never said it),
  doc lie (docs said something wrong), API trap (the API invited misuse), or
  genuine agent error (rare by hypothesis — if it's common, the claim is
  false and that's the finding).
- Do not modify `src/` from a bench session. If a failure proves an API
  defect, the fix lands as a normal engineering change with its own test,
  referenced from RESULTS.md.

## Adding specs

Specs live in `bench/specs/NN-slug.md`, front-matter line `slug: <slug>`
first. Keep the brief short (the point is what the docs teach, not what the
spec spells out) and the definition of done mechanical — every item must be
checkable by `collect.ts` or by reading the shipped `verify.ts`. Difficulty
should come from the genre's demands, not from spec vagueness.
