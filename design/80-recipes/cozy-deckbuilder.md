---
id: recipe-cozy-deckbuilder
title: Cozy Deckbuilder
kind: recipe
tags: [deckbuilder, cozy, no-fail, recipe, composition]
summary: Slay-the-Spire's draft-and-build with the stakes removed — a gentle, no-death deckbuilder about tending, not surviving.
use-when: You want deckbuilding depth in a calm, no-fail wrapper.
composes-with: [anchor-slay-the-spire, genre-deckbuilder, genre-farming-sim, process-the-twist, process-the-spine]
anchors: [anchor-slay-the-spire, anchor-stardew-valley]
spine: "Grow a blooming engine before a gentle season closes — no death, but every hand is a turn you can't get back, so the calm scarcity is time itself."
verify-with: design/FUN.md#11-·-deckbuilder
---

# Cozy Deckbuilder

**What it is.** A [[genre-deckbuilder]] where you never die and nothing attacks
you. You draft cards and play hands, but the target of every card is a **garden**
you're growing — not an enemy you're killing. The draft has teeth; the loop has
no fangs.

**Player fantasy / why it's fun.** *"I built a little engine, and now my garden is
blooming because of it."* The dopamine of a synergy clicking into place, minus the
dread of a boss that undoes your run. You play to make something grow, and the
worst outcome is *slower*, never *dead*.

## The brief

**Slay the Spire but cozy.** Same draft-and-build spine — a weak starter deck that
becomes a strategy one card at a time — bent so the pressure test is *tending*, not
*surviving*. Cards feed a board that only ever improves.

## The spine

*Grow a blooming engine before a gentle season closes — no death, but every hand
is a turn you can't get back, so the calm scarcity is time itself.*

This is a **low-tension** spine, which makes naming it harder and more instructive:
strip the death and the timer-that-fails, and the scarcity leaks out unless you find
the honest soft one. It's here — the *season*. The garden only ever improves, but it
does not improve *forever*: a season holds a finite number of hands, and a turn spent
on a weak line is bloom you'll never bank. The tension is deck-engine growth racing a
soft deadline, not combat lethality. See [[process-the-spine]].

| Part | This game |
|---|---|
| **Objective** | Bring the garden to full bloom — fill the board before the season closes |
| **Superpower** | **Draft-and-play** — take 1-of-3, spend a hand of cards to plant, tend, and grow the board |
| **Scarcity** | **Hands per season** (a soft clock — finite turns, no punishment) **+ water/sun/soil** the cards spend each turn; a hand spent on a weak line is bloom you can't get back |
| **Obstacle** | The garden's own soft goals — bloom *this* before *that*, plots that want a synergy you haven't drafted yet — resisting a lazy dominant line, never attacking you |
| **Renewal** | Each hand re-poses "which line advances the most bloom now?"; a new draft-of-3, a filling board, and procgen'd garden layouts keep the trade fresh |

## Resonance

Every element traces to the spine — the coherence proof (see [[process-the-spine]]).
The instructive case: a purely cozy element that relieved *all* pressure would be
[[antipattern-dissonance]] — so watch that the soft clock keeps stakes present
*without* punishing. Death-handling here is a third answer, different from both
[[recipe-emberfall]] (cheap respawn) and [[recipe-waterline]] (loss that stings):
the spine *derives* "no loss at all, only slower," and the season is what keeps that
from going slack.

| Element | Arrow back to the spine |
|---|---|
| Verb: draft-and-play a hand onto the garden | The single agency; every card targets the board you're racing to bloom, never an enemy |
| **Power creates the problem** | Every hand you play *is* a hand off the season's finite clock and *is* the water/sun/soil spent — advancing one bloom line is exactly what defers the others → tending well is what makes "which line, now?" the standing decision *(passes the gate)* |
| Scarcity: hands per season + water/sun/soil | The soft clock turns a no-death loop into a real trade — a turn spent is a turn you can't get back, so the draft still *costs* ([[system-resource-loops]]) |
| Renewal: fresh draft-of-3, filling board, procgen'd layouts | Re-poses "advance the most bloom now" against a new hand and a new garden each beat ([[system-build-diversity]]) |
| Death-handling: no fail state; floor is "slower," never "over" | Spine is *cozy growth under a soft deadline*; a punishing death or a run-wipe would be **dissonant** — it's derived *out*, and the season carries the stakes in its place ([[system-grace]]) |
| The soft clock: a season that closes gently and banks progress | The honest cozy scarcity — it keeps every hand load-bearing *without* threatening the player; remove it and the spine goes slack ([[pattern-pacing-and-tension]]) |
| Garden's soft goals (bloom *this* before *that*) | The obstacle that makes the draft trade off; without it a dominant line goes unpunished ([[antipattern-boring-optimal]], [[pattern-risk-reward]]) |
| Setting: a garden as the target of every card | The objective made physical — growth numbers on a plot, not damage numbers on a monster; the bloom *is* the progress bar ([[system-progression]], [[pattern-readability]]) |
| Theme: *"blooming because of me"* — tending, not surviving | The mechanic (spend hands to grow) is the metaphor (a place getting nicer by your hand), and the no-death floor is that meaning made mechanical |
| Feel: legible growth beats, choreographed after every hand | Makes the soft scarcity *rewarding* rather than dreadful — the season's pressure reads as momentum, not threat ([[system-reward-schedules]], [[pattern-juice-choreography]]) |
| System: [[genre-deckbuilder]] draft/deck-as-build | The engine you're growing; the 1-of-3 is where a hand's opportunity cost is chosen |
| System: [[genre-farming-sim]] persistent, improving board | The calm register and the goal shape — a place, not a bar; keeps the clock *soft* |
| System: [[system-collectibles]] cards, seeds, tiles | The pull to keep drafting *is* the pull to spend another finite hand — gathering feeds the race |

No row is decoration; no row fights the spine. The gate holds: **every hand that
grows the garden is a hand off the season you can't get back — tending well is what
makes the next choice matter**, and the soft clock keeps that true without ever
punishing.

## Anchors

- **[[anchor-slay-the-spire]]** — the load-bearing structure: draft-1-of-3, energy
  economy, deck-as-build, a run that compounds. Steal the *engine*, drop the death.
- **[[anchor-stardew-valley]]** — the tonal register and the goal shape: a warm,
  open-ended tend loop where progress is a place getting nicer, not a bar hitting
  zero. Steal the *calm* and the *because-of-me* growth.

## Genre + systems pulled

Compose, don't restate — each link carries the mechanics.

| Module | What it contributes |
|---|---|
| [[genre-deckbuilder]] | The draft, the deck-as-build, the hand-per-turn loop, the synergy hunt. |
| [[genre-farming-sim]] | The calm core loop: a persistent board you improve, seasons, no clock forcing you. |
| [[system-collectibles]] | Cards, seeds, and garden tiles as the thing you *gather* — the pull to keep drafting. |
| [[system-resource-loops]] | Water / sun / soil as the currencies cards spend and generate — the engine's fuel. |
| [[system-reward-schedules]] | Steady, legible growth beats after every hand; no dry stretches, no punishment beats. |
| [[system-progression]] | The garden itself is the progress bar — new plots, new card tiers, new synergies unlock as it fills. |

## The twist applied

Primary vector: **tonal** (per [[process-the-twist]] — horror→cozy is the classic;
here it's roguelike-survival→cozy-tending). One flip — *remove the opponent* — and
every system reorganizes around growth instead of attrition. Secondary vector:
**mechanic-swap** — the "attack" verb becomes a "plant/tend" verb, and "block"
becomes "protect from frost."

The signature mechanic is **the garden board as the target of every card.** No
damage numbers on a monster; there are *growth* numbers on a plot. Make that legible
in one screenshot (see [[pattern-readability]]) and the pitch reads itself.

Twist seams to reach for:

- **Slay the Spire but you never die** *(constraint: remove the fail state)* — a run
  that only ends when *you* decide the garden is done, or a season closes gently.
- **Balatro but the score is a blooming meadow** *(tonal + mechanic-swap)* — poker-hand
  scoring recolored as watering; the number going up *is* the garden filling in.
- **Stardew Valley but a whole day is one hand of cards** *(structure)* — the farming
  loop compressed into deckbuilding turns, so a session is short and complete.

Guardrails — a no-fail loop is where tension usually leaks out, so watch:

- **[[antipattern-boring-optimal]]** — with no threat, a single dominant card line
  goes unpunished. Give the *garden* soft goals (bloom this before that) so draft
  choices still trade off. See [[pattern-risk-reward]] for stakes without death.
- **[[antipattern-content-desert]]** — cozy games live long; a thin card pool
  exposes fast. Lean on [[system-build-diversity]] and procgen'd garden layouts.
- **[[antipattern-currency-spaghetti]]** — three cozy resources max. Water, sun,
  soil. No fourth.

## The 3 pillars

Per [[process-pillars]] — every card, tile, and season must serve one of these:

1. **Draftable depth.** The 1-of-3 draft *matters* — synergies, tiers, and payoffs
   that reward planning. The deck is a real build, not a slideshow.
2. **Zero punishment.** No death, no timer that fails you, no run wiped by a bad
   draw. The floor is "slower," never "over." Assist and grace are the default
   (see [[system-grace]], [[system-accessibility]]).
3. **Satisfying growth.** Every hand visibly nudges the board — a plot greens, a
   flower opens, a plot unlocks. Progress you can *see*, choreographed (see
   [[pattern-juice-choreography]]).

If a proposed feature serves none of the three, cut it ([[antipattern-feature-soup]]).

## Scope & first playable

The smallest thing that proves the fantasy — build *this*, then widen.

| Slice | First playable |
|---|---|
| Deck | One starter deck, ~12 cards, ~2 synergy lines (e.g. *water-engine* vs *pollinator*). |
| Board | One garden, ~9 plots, 3 growth stages per plot. |
| Resources | Two currencies to start (water, sun); add soil only if depth demands it. |
| Draft | Draft-1-of-3-with-skip after each hand; ~20-card unlockable pool. |
| Win | **Win by tending** — fill the board to full bloom. No lose condition; a season may end softly and bank progress. |
| Session | One garden = one sitting (~10 min). Complete, calm, repeatable. |

First-playable test: a new player finishes one garden, *smiles*, and immediately
wants a second run with a different draft. That's the loop working
([[process-core-loop]]). Everything past that — seasons, a village, more decks — is
[[process-refine-and-handoff]] territory.

## Handoff

Prove it where the mechanics get judged, don't re-argue it here:

- **[design/FUN.md#11-·-deckbuilder](../FUN.md)** — the deckbuilder fun-gate:
  is the draft delta real, is every hand a decision, does the deck become a build?
  A cozy deck still has to pass this — *calm is not an excuse for a flat draft.*
- **The no-fail loop** — verify the reward cadence never dries and the floor is
  always "slower, not dead." Lean on [[system-reward-schedules]] and
  [[pattern-pacing-and-tension]] to keep tension present without a threat.

## Composes with

- [[genre-deckbuilder]] — the spine; this recipe *is* it, wrapped in calm.
- [[genre-farming-sim]] — the tend loop and the tone the twist borrows.
- [[process-the-twist]] — the tonal flip that makes it yours, not a Spire reskin.
- [[system-grace]] — the no-punishment stance, made a first-class system.
- [[pattern-feedback-loops]] — the growth engine that keeps the garden climbing.

## See also

- `examples/sokoban/` — the reference for the pure-logic / view split; a cozy
  deckbuilder's card rules want the same clean seam.
- `design/FUN.md` §11 (deckbuilder) and the no-fail loop notes — the fun-gate this
  recipe hands off to.
