---
id: system-session-structure
title: Session Structure
kind: system
tags: [session, run, campaign, level, world, pacing, length, structure, container]
summary: The nesting of play — run / campaign / level / world — and how session length and shape set the game's rhythm and stakes.
use-when: You need to decide how long a sitting is, what a "run" contains, and how sessions nest into a longer arc.
composes-with: [system-procgen-design, system-meta-progression, system-save-and-checkpoint, pattern-pacing-and-tension]
anchors: [anchor-hades, anchor-slay-the-spire]
verify-with: design/FUN.md#14-incrementalidle
---

# Session Structure

**What it is.** The **containers** play nests into — a *moment*, a *level* or
*encounter*, a *run* or *session*, and the *meta* arc across them — and the
**length and shape** of each. Session structure decides "how long is one sitting,
what does it contain, and how do sittings add up?" A 3-minute Vampire Survivors
push and a 40-turn Slay the Spire climb are the same genre-family with wildly
different session shapes.

**Player fantasy / why it's fun.** *A satisfying unit of time.* A good session has
a clean arc — start, build, climax, resolution — that fits a real sitting and
leaves a hook. The pull is closure-plus-appetite: "one more run" works because each
run *finishes* something and *promises* something.

## When to use / when NOT

This is a **framing** system — every game has a session shape whether or not you
design it. Reach for it explicitly when:

| Design it deliberately when | It's near-trivial when |
|---|---|
| Runs/campaigns/roguelite structure is core | A single continuous level (endless arcade) |
| You're deciding meta vs. per-run persistence | A one-sitting puzzle box |
| Session length is a selling point (coffee-break vs. epic) | — |

## The nesting

| Tier | Span | Owns | Ends when |
|---|---|---|---|
| **Moment** | seconds | one verb → feedback | the input resolves ([[process-core-loop]]) |
| **Encounter / level** | 1–5 min | one fight or room | cleared / failed |
| **Run / session** | 5–60 min | a sequence of encounters + choices | win / death / objective |
| **Meta / campaign** | many runs | persistent progress, unlocks, story | the long goal ([[system-meta-progression]]) |

The two big shape decisions:

| Decision | Options | Consequence |
|---|---|---|
| **Session length** | coffee-break (3–10 min) · sitting (20–60) · epic (hours) | sets stakes per run and save granularity |
| **Persistence** | fully reset · roguelite carry-over · fully persistent | resets make death cheap; persistence makes it heavy |

## Tuning levers

| Lever | Effect | Watch for |
|---|---|---|
| **Run length** | stakes & commitment per session | too long = quitting mid-run loses progress; own it in [[system-save-and-checkpoint]] |
| **Encounters per run** | the run's internal pacing arc | too few = no arc; too many = a slog |
| **Meta gain per run** | how much a failed run still *earns* | zero = punishing; too much = trivial |
| **Hook strength** | the pull into the next session | none = the loop doesn't restart |

## How it wires to Hayao

- **A run is a seed + a snapshot.** Because state is pure JSON in `world.state`
  with `world.rng`, one run is fully described by `(seed, tuning, inputLog)` and
  restorable from a snapshot — this is exactly the Studio session artifact
  ([`docs/STUDIO.md`](../../docs/STUDIO.md), FUN.md law 7). Session structure and
  the replay artifact are the *same* nesting.
- **Runs are generated.** A roguelite run is a `generateLevels`/`generateDungeon`
  sequence over a per-run seed ([[system-procgen-design]],
  [`src/content/generate.ts`](../../src/content/generate.ts)) — the campaign that
  ships is a list of seeds.
- **Campaigns compose.** `composeCampaign(spec)` (grep `docs/API.md`,
  [`src/content/campaign.ts`](../../src/content/campaign.ts)) assembles proven
  levels into an ordered arc — the meta tier as data.
- **Between-run persistence** is meta-progression saved across sessions
  ([[system-meta-progression]], [[system-save-and-checkpoint]]).

## Fails when…

- **Length ≠ save granularity.** A 45-minute run with no checkpoint punishes anyone
  who has to stop — respect the player's time ([[system-save-and-checkpoint]]).
- **No arc per session.** A run with no build-and-climax is texture, not an
  experience ([[pattern-pacing-and-tension]]).
- **Failed runs earn nothing.** In roguelites, a death that advances *nothing*
  feels like theft — grant meta or knowledge ([[anchor-hades]]).
- **No hook.** A run that finishes and dead-ends stops the "one more" loop.
- **Deserts in the meta.** Long stretches with no unlock or new goal
  ([FUN.md §14](../FUN.md#14-incrementalidle) unlock-desert lint).

## Verify

- **The whole arc paces:** balance-sim the run/campaign; assert pacing windows and
  **no unlock deserts** across the arc ([FUN.md §14](../FUN.md#14-incrementalidle)).
- **A run is reproducible:** golden-hash a full scripted run; snapshot→restore→hash
  round-trips (FUN.md law 7; [`docs/STUDIO.md`](../../docs/STUDIO.md)).
- **Every level in the campaign is winnable:** solver proof per level via the
  generator (FUN.md §10, [`src/content/generate.ts`](../../src/content/generate.ts)).

## Composes with

- [[system-procgen-design]] — a run's content is generated from its seed.
- [[system-meta-progression]] — the tier that persists across sessions.
- [[system-save-and-checkpoint]] — session length dictates save granularity.
- [[pattern-pacing-and-tension]] — each session tier needs its own arc.
- [[system-difficulty-and-dda]] — the curve spans a run and the campaign both.

## See also

- [`src/content/campaign.ts`](../../src/content/campaign.ts) — `composeCampaign` (the meta tier as data).
- [`docs/STUDIO.md`](../../docs/STUDIO.md) — a session as a replayable artifact.
- [[anchor-hades]] · [[anchor-slay-the-spire]] — the run as the fundamental unit.
