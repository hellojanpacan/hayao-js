---
id: genre-city-builder
title: City / Colony Builder
kind: genre
tags: [city-builder, colony, placement, adjacency, synergy, score, zoning, optimization]
summary: Placement-optimization builder where the exposed live score under the cursor IS the UI, and negative synergies make the only real decisions.
use-when: Designing a city/colony builder where the fun is placing tiles for adjacency payoff, guided by a live score and real tradeoffs.
composes-with: [system-economy, system-resource-loops, pattern-feedback-loops, system-procgen-design]
anchors: [anchor-factorio, anchor-rimworld]
verify-with: docs/FUN.md#17--citycolony-builder
---

# City / Colony Builder

**What it is.** A grid or map you fill with buildings whose value depends on what
sits next to them. Placement is the whole verb: each tile scores from its neighbours,
and a live **"+N" under the cursor** tells you exactly what a spot is worth before you
commit. You optimize a growing layout against its own synergies.

**Player fantasy / why it's fun.** *"That corner is worth +7 — but it'd waste the river
tile."* The pull is a legible optimization space where good placement is visibly
rewarded and greed has a cost. Fun is **the exposed score**: the decision is on screen,
quantified, and yours.

## Pillars

1. **The exposed score is the UI.** One pure `placementScore` serves the sim, the bot,
   the tests, *and* the "+N" label under the cursor. The live number is not decoration —
   it's the entire interface between intent and system.
2. **Negative synergies create the only real decisions.** If every placement is
   strictly additive, the greedy move is always right and there's no game. Tradeoffs —
   this bonus costs that one — are what make a layout a puzzle.
3. **The layout is a standing feedback loop.** Each building reshapes the value of its
   neighbours, so the map's optimum drifts as it grows. You're steering a system, not
   filling a form.

## The loop stack

| Layer | The beat |
|---|---|
| **Moment** | Hover a tile → read the "+N" → place for the payoff (or the tradeoff). |
| **Encounter** | A wave/queue of buildings to place well before space or budget runs out. |
| **Session** | A map/island: raise the total score against its synergy constraints. |
| **Meta** | Unlocks, larger/varied maps, new building types with new adjacency rules. |

## Essential systems

| System | Why this genre needs it |
|---|---|
| [[system-economy]] | Resources produced and consumed by buildings; the sinks that stop pure additive sprawl. |
| [[system-resource-loops]] | Extract→process→consume chains give buildings reasons to cluster and compete for space. |
| [[pattern-feedback-loops]] | Adjacency synergies are the loop; negative synergies are the damping that keeps it a decision. |
| [[system-procgen-design]] | Varied maps/queues as content; seeds give replay and a fairness sweep (queue always fits). |
| [[system-onboarding]] | Teach one adjacency rule at a time; the "+N" label is itself the tutorial. |
| [[system-collectibles]] | Milestones, cosmetics, layout goals — optional pull past hitting the target. |

## Content & difficulty model

- **One pure scorer, four consumers.** `placementScore` must be the *single* source of
  truth for sim, bot, tests, and the on-screen "+N". A score the label computes
  differently from the sim is a lie the audit must catch (score-honesty audit).
- **Prove the greedy bot faces tradeoffs.** Assert **greedy ≈ 2× random** — skill
  separates from luck. If greedy never faces a negative synergy, neither does the
  player; the tradeoffs aren't real.
- **Queue-always-fits sweep.** Over N maps/seeds, assert the placement queue can always
  be legally placed — the builder's connectivity/fairness proof (a solvability guarantee
  like the match-3 board's).
- **Difficulty = tighter space / sharper tradeoffs.** Harder maps give less room or
  stronger negative synergies, not just bigger targets. The optimization gets meaner,
  the score honest.
- **Content is building vocabulary.** Each new building type should add an adjacency
  *relationship* (a new synergy or anti-synergy), not just a new sprite.

## Signature-mechanic seeds

- **City builder but it's a colony of people with needs and moods** — placement serves a
  simulated populace and an AI director authors drama around it (mechanic-swap +
  structure toward [[anchor-rimworld]]; the score becomes lives).
- **City builder but the layout is a factory graph** — buildings are machines, adjacency
  is throughput, the bottleneck is the puzzle (mechanic-swap toward [[anchor-factorio]]).
- **City builder but you place from a drafted hand** — each turn deals building options;
  the bend fuses [[genre-deckbuilder]] draft-of-N onto placement (structure).
- **City builder but every tile is one screen and permanent** — a hard spatial + no-undo
  constraint makes each "+N" a commitment (constraint).
- **City builder but it's a garden, not a metropolis** — tonal bend toward
  [[genre-farming-sim]] calm; adjacency is companion planting, growth is the score.

## Common pitfalls

- **Two scores.** A label that computes value differently from the sim breaks trust
  invisibly; enforce one pure `placementScore`.
- **All-additive synergies.** With no tradeoffs the greedy move always wins and the game
  is a formality. Negative synergies are non-optional.
- **A queue that can't fit.** An unplaceable building is an unfair softlock; the
  queue-fits sweep exists to forbid it.
- **Score with no meaning.** A number that doesn't gate anything is wallpaper; tie it to
  progression or a target the player is chasing.
- **Building bloat.** New types that don't add a relationship dilute the read; every one
  should change an adjacency decision.

## Anchors

- [[anchor-factorio]] — adjacency-as-throughput, the layout as the toy, complexity
  scaling with the build; the factory-graph seed's reference.
- [[anchor-rimworld]] — the colony sim as a story generator, an AI director over the
  placement; the reference for the people-with-needs bend.

## Verify

N-island queue-always-fits sweep; greedy ≈ 2× random skill delta; scoring-honesty
audit; golden → **[docs/FUN.md §17 · City/colony builder](../../docs/FUN.md#17--citycolony-builder)**.
Design the synergy space and the exposed score here; prove the delta and the audit there.

## Composes with

- [[system-economy]] — the sinks and resources that keep placement from pure sprawl.
- [[system-resource-loops]] — the extract→process→consume chains that make buildings compete for space.
- [[pattern-feedback-loops]] — the adjacency loop and the negative-synergy damping.

## See also

- [docs/FUN.md §17](../../docs/FUN.md#17--citycolony-builder) — mechanical truth + verify recipe.
- [`sandboxes/`](../../sandboxes/) — the procgen/economy lab to prototype a scorer and a
  queue-fits sweep before authoring buildings.
