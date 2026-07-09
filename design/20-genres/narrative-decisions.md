---
id: genre-narrative-decisions
title: Narrative Decisions
kind: genre
tags: [narrative, decisions, reigns, swipe, meters, stewardship, choice, cards]
summary: Impossible stewardship — every choice double-edged, meters balanced between two ditches; judgement beats any fixed policy.
use-when: The design is a choice-driven game where balancing competing meters via double-edged decisions IS the gameplay (Reigns-like).
composes-with: [system-economy, system-emergent-systems, pattern-risk-reward, pattern-feedback-loops, pattern-pacing-and-tension]
anchors: [anchor-reigns]
verify-with: design/FUN.md#21-·-narrative-decisions-reigns-like
---

# Narrative Decisions

**What it is.** You steward something fragile — a kingdom, a ship, a life — through
a stream of decisions, each with two edges. Every choice moves competing meters; let
any meter hit a ditch and you lose. The content is the game.

**Player fantasy.** *"I'm holding it together by judgement alone."* The weary,
compulsive pull of one-more-decision, of keeping every plate spinning when every
plate-spin tips another.

## Pillars

1. **Every choice is double-edged.** No free wins. A decision that helps one meter
   must cost another — the tension is the point. A no-op choice is a dead choice.
2. **Meters live between two ditches.** Each meter loses at *both* extremes (too
   little AND too much). You're threading, not maximising. Judgement, not a fixed
   policy, must win (19/20 vs 0/20 in the campaign).
3. **Content is the level.** Difficulty, pacing, and voice all live in the card
   deck. When content is data, editorial judgement becomes CI (see below).

## The loop stack

| Scale | The beat |
|---|---|
| **Moment** | Read a card, weigh two edges, commit; watch the meters twitch. |
| **Encounter** | A chain of related cards — an arc that pays off or backfires. |
| **Session** | A reign/run: survive until a doom fires or you reach an ending. |
| **Meta** | Unlocked arcs/characters/endings; flags carried between runs; the map of what-ifs. |

## Essential systems

| System | Why it's load-bearing |
|---|---|
| [[world-narrative-delivery]] | Story is told *through* the choices and meters — embedded, not narrated at you. |
| [[system-economy]] | Meters are currencies with faucets and sinks; the whole game is balancing them. |
| [[system-emergent-systems]] | Flags/relationships that remember past choices turn a deck into a personal history. |
| [[pattern-risk-reward]] | Every double-edged card is a push-your-luck bet on which meter can afford the hit. |
| [[pattern-feedback-loops]] | Meters that feed each other (low treasury → unrest → worse options) create the death spiral. |

## Content & difficulty model

- **Editorial judgement is CI.** When choices are data, lint them: unique ids,
  bounded effects (|Δ| ≤ 20), every needs-flag actually settable somewhere, no
  no-op choices, no unreachable cards. The content lint *is* the balance test
  (FUN.md §21).
- **Doom attribution matters.** Each ending must fire from ITS meter at ITS edge —
  a swapped ending string wrecks the fiction invisibly. Assert every doom fires its
  own ending, at its own edge.
- **Arcs terminate both ways.** A multi-card arc must be able to resolve well *and*
  badly; a one-way arc is a cutscene.
- **Prove judgement beats policy.** A balanced-policy bot survives; an
  always-swipe-one-way bot loses (0/20). If a fixed policy wins, the meters aren't
  really ditched on both sides.
- **Pacing lives in the deck order.** A calm-cards-only stretch is a desert; a
  crisis-cards-only stretch is a death march. Weight the draw so tension breathes —
  a scare, then a reprieve, then the arc's payoff (see [[pattern-pacing-and-tension]]).
- **Every card is a small risk-reward bet.** The player is betting which meter can
  absorb the hit *this* turn; the fun is that the safe-looking edge is often the
  slow poison. Author both edges to bite differently, never symmetrically.

## Signature-mechanic seeds

- **Reigns *but* the advisors lie, and trust is a hidden meter** — you're weighing
  the source, not just the choice (mechanic-swap; composes [[system-emergent-systems]]).
- **Reigns *but* one deck, played by two rulers taking turns** — competitive or
  co-op stewardship (structure; composes [[genre-coop-chaos]], [[system-coop-and-competition]]).
- **Reigns *but* your past selves' choices become cards for your heir** — the reign
  is a run in a roguelite dynasty (structure; composes [[system-meta-progression]]).
- **Reigns *but* the meters are people, and each ditch is a character leaving**
  (theme/tonal — reframes numbers as relationships).
- **Reigns *but* time-pressured — a card auto-resolves badly if you stall** (constraint;
  adds a real-time clock over the turn-based deck).

## Common pitfalls

- **Dominant strategy.** If "always favour treasury" survives, a meter isn't ditched
  on both sides — the balanced-policy proof is passing while the game is broken.
  Fix the ditches, not the bot.
- **Unbounded effects.** A card that swings a meter 60 points makes planning
  impossible and the arc a coin flip. Cap |Δ| and assert it.
- **Ending soup.** Dooms that fire from the wrong meter, or generic "you lost"
  strings, gut the fiction. Attribute each ending to its own edge.
- **Content that isn't data.** Hand-coded branches can't be linted and rot silently.
  Keep choices in a pure data deck (FUN.md law 7) so editorial checks run in CI.

## Anchors

- [[anchor-reigns]] — swipe-choice narrative; meters between two ditches;
  stewardship as the whole verb.

## Verify

Prove it against [FUN.md §21 — Narrative decisions](../FUN.md#21-·-narrative-decisions-reigns-like):
balanced-policy bot survives; always-left loses 0/20; content lint (unique ids,
|Δ| ≤ 20, settable flags, no no-ops); every doom fires its own ending; arcs
terminate both ways. Chrome/menus via `showScreen()`; the card view is `cosmetic`.

## Composes with

- [[world-narrative-delivery]] — the story is delivered through choices; this genre
  is its purest engine.
- [[system-economy]] — treat meters as currencies and the balance problem becomes a
  faucet/sink problem.
- [[pattern-feedback-loops]] — inter-meter loops author the death spiral and the
  comeback.

## See also

- [`design/FUN.md`](../FUN.md) §21 — the content-lint recipe in full.
- [[world-narrative-delivery]] — techniques for telling story with little text.
