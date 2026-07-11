---
id: antipattern-decoration
title: Decoration
kind: antipattern
tags: [coherence, spine, scope, restraint, feature-bloat]
summary: An element that doesn't trace back to the spine — present, but expressing no tension. Weight, not depth.
use-when: You are filling the resonance table and a row's arrow-to-the-spine cell comes up empty.
composes-with: [process-the-spine, antipattern-feature-soup, antipattern-false-depth, pattern-restraint-and-negative-space]
verify-with: design/FUN.md
---

**What it is.** A system, mechanic, or feature that has **no arrow back to the
spine** — you can't say *how it expresses the core tension*, only that it's there.
In a [[process-the-spine]] resonance table it's the row you can't fill. It isn't
wrong, exactly; it's *inert*. Depth would couple to the tension; decoration just
sits beside it.

**Why it hurts.** Nothing is free. Every inert element costs build time, UI space,
a tutorial line, and — worst — a share of the player's attention that should be on
the spine. A game reads as *one thing* only when every part points the same way;
decoration blurs that focus and makes the real tension harder to feel. Ten inert
features don't add up to depth — they add up to noise around a signal.

## The smell

The **"and also" feature**: you describe the game as "it's about *[spine]* — and
also there's crafting, and also a day/night cycle, and also a reputation meter."
Every "and also" with no "*because it sharpens the tension by…*" is a decoration.
Contrast a coupled element, which you describe as "*and the flare burns fuel
**because** looking has to cost life.*"

## How it happens

| Origin | What you did |
|---|---|
| Genre checklist | "Survival games have crafting, so I added crafting" — a convention imported without asking if *this* spine wants it. |
| Corpus mimicry | You surveyed similar games and copied their feature list instead of deriving from the mechanic — exactly what [AGENTS.md](../../AGENTS.md) warns against. |
| Sunk cost | You built it early, before the spine was clear, and kept it because it exists. |
| Fear of thinness | A tight, coupled game *looks* small on a feature list, so you padded it to seem substantial — the [[antipattern-false-depth]] reflex. |
| Feature soup | Each addition was individually defensible; the sum has no center — see [[antipattern-feature-soup]]. |

## The tell (check YOUR OWN design)

- **The resonance-row test.** Write the element's row in the [[process-the-spine]]
  table. Fill the "arrow back to the spine" cell in one sentence. If you can't, it's
  decoration.
- **The subtraction test.** Delete it in your head. Does the core tension get
  *weaker*? If the spine plays identically without it, it was never load-bearing.
- **The "why, not what" test.** Can you say *why* it exists in terms of the tension,
  not just *what* it does? "It lets you craft tools" is a what. "Crafting is how you
  convert the master resource, so it's on the spine" is a why — that one's coupled.

## The fix

**Cut it, or couple it.** Two honest moves, no third:

- **Cut.** Restraint is a feature. A game of three deeply-coupled systems beats one
  of ten inert ones — route through [[pattern-restraint-and-negative-space]]. The
  freed attention goes back to the spine.
- **Re-couple.** If the element is worth keeping, give it a *real* arrow: rework it
  so it spends the scarcity, sharpens the obstacle, or renews the tension. A
  day/night cycle is decoration in most games; in one whose spine is "hide in the
  dark, hunt in the light," it's the whole engine. Same feature, opposite verdict —
  the difference is the arrow.

## Twist seams

- **A crafting system but every recipe spends the one master resource** (twist:
  *re-couple to scarcity*) — now crafting is on the spine, not beside it. See
  [[recipe-waterline]].
- **A cosmetic day/night cycle but light is your movement and your life** (twist:
  *make the backdrop load-bearing*) — see [[recipe-emberfall]], where the dark is
  the game, not the ambience.

## Seen in…

| Symptom | The inert element |
|---|---|
| "It has a fishing minigame" (in a game not about fishing) | A mode with its own systems that touches the spine nowhere. |
| A reputation meter that never changes what you *do* | A number that displays but doesn't feed a decision — cousin of [[antipattern-false-depth]]. |
| A skill tree of passive +% nodes | Growth that doesn't change *how* you play, only the magnitudes — drifts toward [[antipattern-boring-optimal]]. |
| A crafting tree in a combat game where you just buy the same gear | A parallel economy that resolves to the shop anyway. |

## Composition notes

- Decoration is the *neutral* coherence failure. Its meaner sibling is
  [[antipattern-dissonance]] — an element that doesn't just fail to help but
  actively *fights* the spine. Decoration is dead weight; dissonance is a leak.
- Piling decorations produces [[antipattern-feature-soup]]; the cure is the same —
  a spine to cut against.
- The habit that prevents it is deriving from [[process-the-spine]] instead of
  assembling from a corpus feature list.

## Verify / guard

Before handoff, complete the resonance table: **every element gets a row, every row
names its arrow.** Any unfillable row is a decoration — cut it or couple it, don't
ship it. `scripts/build-design-index.mjs` enforces that a recipe declaring a `spine`
carries the table at all; *you* enforce that the table has no empty cells.

Once the game runs, decoration is **mechanically detectable**: the ablation proof
([[design/FUN.md]] law 8, `assertLoadBearing` from `@hayao`) neutralizes the suspect
coupling and checks whether the skilled-vs-lazy gap collapses. A coupling you can
ablate *without* flattening the skill-gap is carrying no tension — that is
decoration, proven, not argued. A feature that appears in no fun-claim is a feature
the game doesn't need to prove, which usually means one it doesn't need.
