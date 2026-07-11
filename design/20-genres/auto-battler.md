---
id: genre-auto-battler
title: Auto-Battler
kind: genre
tags: [auto-battler, autochess, prep-then-watch, economy, synergy, positioning, rounds, shared-pool]
summary: Prep-then-watch — spend an economy on units, position and synergise them, then watch the round resolve itself.
use-when: "The design is a prep-phase-then-auto-combat game (autochess-like): economy + positioning + synergy across rounds."
composes-with: [system-economy, system-build-diversity, system-unit-rosters, system-counter-systems, system-reward-schedules]
anchors: [anchor-loop-hero]
verify-with: design/FUN.md#12-·-turn-based-tactics
---

# Auto-Battler

**What it is.** In a prep phase you buy units from a shared pool, arrange them, and
stack synergies; then combat resolves *without your input* and you watch your build
prove itself. Win or lose the round, adjust, and buy again. **Extension** beyond
FUN.md's 21 genres.

**Player fantasy.** *"I built the machine; now I watch it work."* The pleasure of
composition — of finding the synergy that snowballs — plus the tension of a fight
you set up but can no longer touch.

## Pillars

1. **Prep is the game; combat is the reveal.** All agency lives in the shop and the
   board. The auto-resolved fight is *feedback on a decision*, choreographed, not a
   thing you play. (This is law 6 taken literally: the sim resolves, the view replays.)
2. **Economy is the spine.** Gold, interest, roll-vs-save, level-vs-power — the
   push-your-luck of the shop is where skill lives. Faucets and sinks must breathe.
3. **Synergy over stats.** Power comes from combinations (traits, tiers, positions),
   so many builds stay viable and no single unit is a solve.

## The loop stack

| Scale | The beat |
|---|---|
| **Moment** | Buy / sell / reroll / reposition one unit; a shop decision. |
| **Encounter** | One round: prep, then the auto-fight resolves and scores the build. |
| **Session** | A match: survive rounds vs a ladder/opponents until one economy wins. |
| **Meta** | Unlocked rosters/traits/heroes; MMR; the meta-of-comps players learn. |

## Essential systems

| System | Why it's load-bearing |
|---|---|
| [[system-economy]] | Gold, interest, and the roll-vs-save tension are the primary decision layer. |
| [[system-build-diversity]] | Many viable comps is the replay engine; synergy makes builds, not stats. |
| [[system-unit-rosters]] | A legible roster of roles/tiers is what players draft and read. |
| [[system-counter-systems]] | Comp-vs-comp near-hard counters keep the meta from converging on one build. |
| [[system-reward-schedules]] | The shared-pool draw and reroll are variable-ratio; tune the odds. |

## Content & difficulty model

- **The shared pool is a constraint, not a faucet.** Contested units mean your comp
  affects opponents' options; model the pool as finite (draining it is a real play).
- **Balance is a win-rate window over comps**, borrowing the deckbuilder instrument:
  no comp should win too often or never — assert a band, and check both edges break.
- **Economy solvency is a law-3 inequality.** Interest breakpoints, level costs, and
  round income must let a disciplined build power-spike on schedule; state and assert
  the payback curve so no tier strangles the mid-game.
- **Positioning must matter provably.** The same units in a bad formation must lose
  to the same units well-placed — that's the proof the board is a real decision.

## Signature-mechanic seeds

- **Autochess *but* you place units on a hero's looping path and combat auto-runs
  as they walk it** — the board becomes a track (structure; the Loop Hero bend,
  composes [[anchor-loop-hero]]).
- **Auto-battler *but* the shared pool is literally shared — one deck, drafted
  competitively** (constraint; sharpens [[system-counter-systems]] denial).
- **Auto-battler *but* you can interrupt the fight once, at a cost** — a single
  spent moment of agency in a watch-only genre (mechanic-swap; [[pattern-risk-reward]]).
- **Auto-battler *but* co-op: two players share one economy and one board**
  (structure; composes [[genre-coop-chaos]], [[system-coop-and-competition]]).
- **Auto-battler *but* units level by *surviving* rounds, not by gold** — the board
  is a persistent roster you nurture (mechanic-swap; composes [[system-progression]]).

## Common pitfalls

- **Dominant comp.** If one synergy wins regardless, build diversity is a lie; the
  win-rate window catches it — widen counters, not nerf-hammer a single unit.
- **Economy with no tension.** If saving always beats rolling (or vice versa), the
  core decision evaporates. Interest and power-spikes must trade off honestly.
- **Combat you must watch but can't read.** If the auto-fight is illegible, players
  can't learn from the reveal. Choreograph it so the *reason* a build won is visible.
- **Non-deterministic resolution.** The fight must be a pure function of board +
  `world.rng` seed; then goldens, clone-and-score comp bots, and replays are free
  (FUN.md law 7). No `Math.random` in the fight.

## Anchors

- [[anchor-loop-hero]] — composing placement + auto-combat + deck into one novel
  loop; the reference for "arrange, then watch it resolve."

## Verify — extension note

Auto-battler is an **extension**; with no dedicated FUN.md section it *composes its
parents' verify patterns*:

- **Auto-resolved combat honesty** → [FUN.md §12 — Tactics](../FUN.md#12-·-turn-based-tactics):
  the fight is a pure sim returning choreography; 1-ply/clone-and-score comp bots are
  real baselines; golden end-state per board. **This is the primary proof.**
- **Draft/economy balance** → [FUN.md §11 — Deckbuilder](../FUN.md#11-·-roguelike-deckbuilder):
  win-rate *window* over comps; a "never-synergise" pilot loses well below it.
- **Pacing solvency** → [FUN.md §14 — Incremental](../FUN.md#14-·-incrementalidle):
  assert flat-ish payback curves across economy tiers; no power desert.
- Determinism and cosmetic-view (laws 6–7) apply unchanged — the watch phase is the
  clearest case of "sim resolves, view replays."

## Composes with

- [[system-economy]] — the shop is the game; borrow its faucet/sink and interest tuning.
- [[system-build-diversity]] — synergy space is the replay value.
- [[system-counter-systems]] — comp-vs-comp counters keep the meta honest.

## See also

- [`design/FUN.md`](../FUN.md) §11–12 — the deckbuilder window + tactics
  clone-and-score bots this genre borrows wholesale.
- [[anchor-loop-hero]] — the three-genre composition reference.
