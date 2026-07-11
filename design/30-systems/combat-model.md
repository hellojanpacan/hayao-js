---
id: system-combat-model
title: Combat Model — the shape of a hit
kind: system
tags: [combat, damage, resolution, timing, real-time, turn-based, hit]
summary: The spine every fight sits on — how damage is computed, when it resolves, and whether the clock is frames or turns.
use-when: You have any fight — melee, ranged, tactical, brawler — and need to decide how a hit is computed and when it lands.
composes-with: [system-telegraphs, system-status-effects, system-counter-systems, system-grace, system-enemy-ai]
anchors: [anchor-into-the-breach, anchor-hades, anchor-slay-the-spire]
verify-with: design/FUN.md#4-top-down-action-adventure-zelda-like
---

# Combat Model — the shape of a hit

**What it is.** The **resolution rule** underneath every fight: the function that
turns *attacker + defender + context* into *a number and a moment*. Pick it before
you design a single enemy — the model decides whether combat is read-and-react,
plan-and-commit, or math-and-optimize, and every other combat system ([[system-telegraphs]],
[[system-status-effects]], [[system-counter-systems]]) hangs off it.

**Player fantasy / why it's fun.** A hit that *lands* — weight, consequence, a clean
line from your input to the enemy's flinch. Fun combat is legible cause and effect;
the model is where that legibility is either won or lost.

## When to use / when NOT

| Use a formal combat model when… | Skip / simplify when… |
|---|---|
| Damage varies by matchup, position, or state | One-hit-kill or binary contact (a pure platformer) |
| The player makes per-hit decisions | Combat is a garnish, not a pillar |
| You need counters, statuses, or crits to interact | The "fight" is really a puzzle ([[genre-grid-puzzle]]) |

Don't bolt a deep damage formula onto a game whose fun is elsewhere. A Celeste-like
spike is `contact → death`; that *is* the model, and it's correct.

## Variants

| Model | Clock | Damage shape | Anchor | Feels like |
|---|---|---|---|---|
| **Real-time reactive** | frames | fixed per-hit, telegraph-gated | [[anchor-shadow-of-mordor]], Zelda | read the tell, punish the gap |
| **Real-time attrition** | frames | many small ticks, DPS math | [[anchor-vampire-survivors]] | the tide vs your build |
| **Turn-based deterministic** | turns | shown = resolved, no rolls | [[anchor-into-the-breach]] | perfect-information chess |
| **Turn-based stochastic** | turns | dice / hit-chance | XCOM, roguelikes | budgeted luck, hedged plays |
| **Deckbuilt** | turns | numbers from cards + scaling | [[anchor-slay-the-spire]] | the deck *is* the weapon |
| **Combo / string** | frames | escalating multipliers per chain | [[anchor-hades]], brawlers | flow and cancels |

Blends are normal: Hades is reactive + combo; Slay the Spire is deckbuilt +
deterministic. Satisfy each parent's verify pattern ([[process-composition]]).

## Tuning levers

| Lever | Does | Healthy range |
|---|---|---|
| **Time-to-kill (TTK)** | hits to drop a basic foe | 2–5 for reactive; the whole session for attrition |
| **Time-to-death (TTD)** | hits *you* survive | ≥ 2 before a wound; instadeath only with heavy telegraph |
| **Hit-stop** | freeze on impact — the weight | 3–8 frames; > 12 reads as a hitch (JUICE Part 2) |
| **i-frames** | invulnerable window after a hit | specced in frames, proven edge-in/edge-out |
| **Variance** | roll spread (stochastic only) | tight enough that plans hold; ≤ ±15% or shown-as-chance |
| **Crit rate / mult** | spike layer | rare + big, or frequent + small — not both |

Derive TTK/TTD from the fight length you want, not by eyeballing (FUN.md law 3).

## How it wires to Hayao

- **Pure resolution.** Combat is a function over `world.state`; all rolls through
  `world.rng`. The sim resolves *instantly* and returns choreography for the view
  to replay (FUN.md law 6) — hit-stop and flash are cosmetic, never in `world.hash()`.
- **Reactive combat is telegraph-gated.** Every threat activation is preceded by a
  tell; prove it with `telegraphIssues(timeline, minFrames)`. See [[system-telegraphs]].
- **Feel is a contract.** Declare a `FeedbackContract` (in `@hayao`) for `hit`,
  `land`, `death`; gate hit-stop/shake with `feedbackIssues` (design/JUICE.md Part 3).
- **Turn-based reuses the real-time stack** — an input edge is one world step
  (FUN.md §10). Pure state gives clone-and-score bots for free: run the intended
  line vs a null line and assert the gap (FUN.md law 2).
- Reference wiring: [`examples/small-flame`](../../examples/small-flame) for reactive feel;
  the top-down §4 pattern for hit-stop + i-frames buffering inputs through the freeze.

## Fails when…

- **Hit-stop eats inputs.** A freeze that doesn't buffer intent across it makes
  attacks "randomly" vanish (FUN.md §4). Any pause must re-emit buffered input.
- **TTK too low both ways.** If you and the foe both die in one hit, there's no
  combat — there's a coin flip. Give the loop room to *be* a loop.
- **Variance drowns skill.** Big rolls on top of a reactive read punish the correct
  play. If it's stochastic, *show* the chance (intent honesty, FUN.md §11/§12).
- **Damage numbers with no resolution moment.** A number that ticks with no impact
  frame reads as a spreadsheet, not a hit. Answer every hit on ≥ 2 senses (JUICE).

## Verify

- Reactive: kiting-bot telemetry — win time, hp floor, 0 deaths; every threat
  telegraphed → **[FUN.md §4](../FUN.md)**, `telegraphIssues`.
- Skill-delta: intended combat beats null (do-nothing / flail) by a margin →
  **[FUN.md law 2](../FUN.md)**.
- Feel: `feedbackIssues` for hit/death; hit-stop ≤ 12 frames →
  **[JUICE.md Part 3](../JUICE.md)**, **[VERIFICATION Channel 4](../../docs/VERIFICATION.md)**.
- Determinism: golden hash of a scripted fight; view-on == view-off hash.

## Composes with

- [[system-telegraphs]] — reactive combat is *only* fair if threats announce; the
  telegraph is half the model.
- [[system-status-effects]] — DoT/buffs/debuffs are damage that resolves over time;
  they layer on the resolution rule.
- [[system-counter-systems]] — the matchup table that makes one hit mean more.
- [[system-grace]] — i-frames, hit-stop buffering, wound-before-death live here.
- [[system-boss-design]] — a boss is a combat model with phases and spectacle.

## See also

- [`design/FUN.md`](../FUN.md) §4, §6, §12 — the mechanical truths per clock.
- [`design/JUICE.md`](../JUICE.md) — hit-stop/shake envelopes; the 2-senses contract.
- [`sandboxes/juice-lab`](../../sandboxes/juice-lab) — easing/spring feel for impacts.
