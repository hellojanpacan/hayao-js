---
id: pattern-emergence
title: Emergence
kind: pattern
tags: [emergence, second-order, systemic, interaction, depth, combinatorics, rules, synergy]
summary: Depth from few pieces — design rules that interact, not content that stacks, so the game generates situations you never authored.
use-when: You want combinatorial depth without infinite content; deciding between more rules or more interactions between rules.
composes-with: [pattern-feedback-loops, pattern-risk-reward, system-emergent-systems, system-build-diversity]
verify-with: design/FUN.md#12-·-turn-based-tactics-into-the-breach-like
---

# Emergence

**What it is.** **Emergent** depth comes from a small set of rules that *interact*,
producing situations the designer never explicitly authored. The opposite of
content-stacking (a thousand bespoke levels) is second-order design: a dozen verbs
that combine into millions of states. Baba Is You has a handful of word-rules;
Into the Breach has push, damage, and terrain — the *combinations* are the game.

**Player fantasy.** *"I did something the designers didn't plan."* The improvised
solution, the synergy you discovered, the story only your run could tell. Ownership
of the *how*, not just the outcome.

## Why it works

- **Few pieces, deep space.** N interacting rules give ~N² interactions and far more
  states — depth scales combinatorially while your content budget stays flat. This
  is how a tiny game reads as vast.
- **Discovery is the reward.** An interaction *you* found feels earned in a way a
  handed-to-you unlock never does; it's the [[pattern-mastery-and-flow]] ceiling
  with no assets attached.
- **Systemic story beats scripted story** ([[system-emergent-systems]]) — the
  nemesis who killed you twice and now taunts you is more memorable than any cutscene
  because *you* co-authored it.

## Levers

| Lever | Effect | Example |
|---|---|---|
| **Rule orthogonality** | More rules combine cleanly | Push, fire, and water are independent → they interact |
| **Shared state** | Systems that read each other | Water conducts electricity *and* extinguishes fire |
| **Verb reuse** | One verb, many contexts | "Push" affects enemies, allies, terrain alike (ItB) |
| **Consistency** | Interactions are predictable | Same rule everywhere; no exceptions to memorise ([[pattern-readability]]) |
| **Legibility** | Players can *see* the interaction coming | Perfect-information telegraphs (FUN.md §12) |
| **Feedback loops** | Interactions cascade | One rule feeds another ([[pattern-feedback-loops]]) |

## Applied across genres

| Genre | The interacting pieces | The emergence |
|---|---|---|
| **Rule-puzzle** ([[anchor-baba-is-you]]) | Word-rules you rewrite | Break "wall is stop" and the whole board reinterprets |
| **Tactics** ([[anchor-into-the-breach]], [[genre-tactics]]) | Push · damage · terrain · fire | A shove that turns an enemy's attack onto its ally |
| **Immersive-sim / exploration** ([[genre-exploration]]) | Systemic verbs (fire, water, gravity) | The unintended path through a level |
| **Deckbuilder** ([[genre-deckbuilder]], [[anchor-balatro]]) | Cards/jokers that read each other | The synergy engine you drafted into existence |
| **Colony / sim** ([[anchor-rimworld]]) | Needs · relationships · events | The AI director authoring drama from rule collisions |
| **Systemic memory** ([[anchor-shadow-of-mordor]]) | Rivals with persistent state | The nemesis arc no writer scripted |
| **Auto-battler** ([[genre-auto-battler]]) | Synergies + positioning | The comp that only works because two traits overlap |

## Overdone when…

- **Emergent chaos, not depth.** Interactions so tangled the player can't predict
  them — that's noise, not systemic play. Legibility is the price of emergence
  ([[pattern-readability]]): Into the Breach shows you *exactly* what every
  interaction resolves to (FUN.md §12).
- **Degenerate dominant combo.** One interaction is so strong it eats the space —
  the emergent tree collapses to a single branch ([[system-build-diversity]] dead).
- **Unfair emergence.** A rule collision that softlocks or one-shots the player
  through no readable cause. Emergence must stay *fair*: the losing state should
  have been foreseeable.
- **Second-order for its own sake.** Interactions no player will ever hit aren't
  depth, they're untested edge cases. Depth is the *reachable* combination space.
- **Inconsistent rules.** An interaction that fires here but not there ("fire spreads
  on grass, except this grass") breaks the mental model emergence depends on — the
  player stops predicting and starts guessing. One rule, everywhere, no exceptions.

## Verify / feel-gate link

Emergence is where **perfect honesty** and **pure-state bots** earn their keep:

- **Perfect information / intent honesty (FUN.md §12).** For emergent tactics, what
  is shown must be exactly what resolves — store telegraphs as *directions* so a
  push *rewrites* the outcome, and audit that the resolved state matches the shown
  one. An interaction the player can't foresee is a bug.
- **Mechanic-in-isolation proofs (FUN.md §12).** Prove each verb (push, bump,
  redirect) alone, *then* trust the combinations — you can't unit-test N² states,
  so you test the N rules and the pure sim guarantees the rest.
- **Clone-and-score bots (FUN.md law 7).** Plain-JSON `world.state` lets a 1-ply
  greedy bot explore the interaction space — it finds the degenerate combo before a
  player does.
- **Determinism (law 6/7).** Emergent cascades must be reproducible from the seed or
  the systemic story can't be replayed or debugged.

## Worked micro-example

*"A tiny tactics game that feels vast on a four-verb budget."* Don't author a hundred
bespoke enemies — author four **orthogonal** verbs (push, damage, fire-spread,
water-conduct) and one **shared state** (tiles carry fire/water). The depth is in the
collisions: shove an enemy into water to douse a fire, or into fire to burn it, or
into *another enemy* to turn its telegraphed attack onto its ally. Nobody scripted
"redirect a spider's web onto the tank" — the rules produced it. Keep it *fair* with
legibility: show exactly what each interaction resolves to before the player commits
([[pattern-readability]], FUN.md §12). Prove the verbs in isolation, then trust the
N² space; run a greedy clone-bot to surface the degenerate combo before a player does.

## Composes with

- [[system-emergent-systems]] — this pattern is the *principle*; that system is the
  concrete nemesis/reputation/relationship machinery. Read them together.
- [[pattern-feedback-loops]] — the loops *between* interacting rules are what make
  emergence cascade instead of fizzle.
- [[system-build-diversity]] — emergence is only alive while many combinations stay
  viable; a dominant combo kills it.
- [[pattern-risk-reward]] — the best emergent moments are risky improvisations that
  paid off.

## See also

- [`design/FUN.md`](../FUN.md) §12 & law 7 — perfect-information honesty and
  pure-state bots, the proofs that keep emergence *fair* and *explorable*.
- [[anchor-baba-is-you]] · [[anchor-into-the-breach]] — the two clearest "the
  mechanic IS the content" anchors.
