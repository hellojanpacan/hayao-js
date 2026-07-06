---
id: genre-exploration
title: Exploration
kind: genre
tags: [exploration, discovery, immersive-sim, outer-wilds, obra-dinn, curiosity, knowledge, deduction]
summary: Discovery as the reward — knowledge is the only progression; curiosity gates the world and understanding is the win.
use-when: The design gates progress on player knowledge/deduction rather than stats or items (Outer Wilds / Obra Dinn-like).
composes-with: [system-emergent-systems, system-onboarding, pattern-emergence, genre-narrative-decisions, genre-metroidvania]
anchors: [anchor-outer-wilds, anchor-return-of-the-obra-dinn]
verify-with: docs/FUN.md#10-·-traditional-roguelike
---

# Exploration

**What it is.** The world is a knowledge-locked space: nothing bars you but
*understanding*. You wander, notice, connect clues, and the "unlock" is a
realisation in your head, not an item in a bag. **Extension** beyond FUN.md's 21
genres — discovery / immersive-sim-lite, where curiosity is the whole engine.

**Player fantasy.** *"I figured it out."* The rare, clean high of deduction — the
world trusted you to reason, and you did. Progress you can't buy, only earn by
paying attention.

## Pillars

1. **Knowledge is the only progression.** No stat gates, no keys — what you *know*
   is what lets you proceed. The player, not the avatar, levels up. A gate opens
   the moment you understand it (Outer Wilds); it never opens by grinding.
2. **Curiosity is the pull.** Every vista, anomaly, and half-answer plants a
   question. The design's job is a horizon of "what's *that*?" that keeps refilling.
3. **The world is internally honest.** It rewards reasoning only if it obeys its own
   rules perfectly. What you observe must always mean what it seems to — deduction
   dies on a single lie (Obra Dinn's fates are ground truth).

## The loop stack

| Scale | The beat |
|---|---|
| **Moment** | Notice → question → probe; a single observation logged. |
| **Encounter** | A site/puzzle: gather clues, form a hypothesis, test it. |
| **Session** | A thread pulled to a realisation that reframes the map. |
| **Meta** | The web of understanding; the endgame that only *knowledge* unlocks. |

## Essential systems

| System | Why it's load-bearing |
|---|---|
| [[system-emergent-systems]] | A world that remembers and interlocks turns wandering into a personal investigation. |
| [[world-narrative-delivery]] | Story lives in the environment/artefacts/systems — embedded, not narrated at you. |
| [[system-onboarding]] | Teaching *how to notice* without hand-holding is the hardest first-ten-minutes problem. |
| [[pattern-emergence]] | Interlocking rules let players deduce consequences you didn't script. |
| [[system-save-and-checkpoint]] | A knowledge journal / clue log is the save state that respects the player's reasoning. |

## Content & difficulty model

- **Gate on understanding, not stats.** For each gate, name the *piece of knowledge*
  that opens it and prove the world teaches it somewhere reachable. This is a
  connectivity problem: is every required clue reachable before the gate that needs
  it? (Borrow the roguelike connectivity sweep — see Verify.)
- **A clue log is the progression track.** Surface what the player has deduced (Obra
  Dinn's confirmed-in-threes). The journal is player-critical knowledge, exposed —
  the same discipline as showing "nights left" in a farming sim.
- **Difficulty is inference distance**, not enemy stats — how many clues must chain,
  how obliquely. Ramp by lengthening the chain, never by hiding a required clue.
- **Non-linearity is the point.** Multiple threads open at once; author a *web*, not
  a corridor, and prove several valid orders of discovery reach the end.

## Signature-mechanic seeds

- **Outer Wilds *but* the loop is a single tide, not a supernova — the world resets
  on a rhythm you must learn** (mechanic-swap; composes [[genre-rhythm]] for the
  clock).
- **Obra Dinn *but* the deductions are social — who lied, not who died** (theme;
  composes [[genre-narrative-decisions]] for the trust meters).
- **Exploration *but* every ability you'd expect to *find* is instead something you
  *realise you could always do*** — knowledge as the "power-up" (mechanic-swap;
  composes [[genre-metroidvania]]).
- **Exploration *but* co-op: two investigators with different senses must share
  what only they can perceive** (structure; composes [[genre-coop-chaos]]).
- **Exploration *but* the map is procedural yet its *rules* are fixed — you learn a
  grammar, not a layout** (structure; composes [[system-procgen-design]]).

## Common pitfalls

- **A single lie.** If one observed thing doesn't mean what it shows, deduction
  becomes guessing and trust collapses. The world must be honest to the frame
  (the Obra Dinn / tactics perfect-information discipline).
- **Fake curiosity (fetch quests).** Markers and checklists replace wonder with
  chores. Let the *question* pull, not a waypoint.
- **Unreachable required knowledge.** A gate whose clue spawns behind that same gate
  is a softlock. Run the connectivity sweep on *knowledge*, not just geometry.
- **Over-narration.** Cutscenes that hand you the answer steal the deduction. Deliver
  through the world; let the player assemble it (see [[world-narrative-delivery]]).

## Anchors

- [[anchor-outer-wilds]] — knowledge as the only progression; a curiosity-gated open
  world that never gates on items.
- [[anchor-return-of-the-obra-dinn]] — deduction as the core loop; the game trusts
  your reasoning and confirms it honestly.

## Verify — extension note

Exploration is an **extension**; with no dedicated FUN.md section it *composes its
parents' verify patterns*:

- **Reachability/connectivity of required knowledge** → [FUN.md §10 — Roguelike](../../docs/FUN.md#10-·-traditional-roguelike):
  assert every required clue/gate is reachable across seeds/orders BEFORE tuning
  difficulty. Full-knowledge bots prove a *line exists*, not player experience —
  exactly the right claim here. **This is the primary proof.**
- **Content honesty/lint** → [FUN.md §21 — Narrative decisions](../../docs/FUN.md#21-·-narrative-decisions-reigns-like):
  clues are data — lint for unique ids, every gate's needs-flag settable, no
  dangling/contradictory clues, no unreachable content.
- **Perfect-information honesty** → [FUN.md §12 — Tactics](../../docs/FUN.md#12-·-turn-based-tactics):
  what's shown resolves exactly as shown; deduction demands it.
- Determinism + pure-data state (laws 6–7) make the clue web replayable and
  clone-and-score deducible.

## Composes with

- [[system-emergent-systems]] — interlocking, remembering systems are what make a
  world worth investigating.
- [[world-narrative-delivery]] — the delivery half; exploration is its most demanding
  client.
- [[genre-metroidvania]] — swap its ability-gates for knowledge-gates and you're here.

## See also

- [`docs/FUN.md`](../../docs/FUN.md) §10 — the connectivity sweep, repurposed for
  knowledge reachability.
- [[genre-narrative-decisions]] — shares the content-lint discipline for clue data.
