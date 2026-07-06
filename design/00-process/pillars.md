---
id: process-pillars
title: The Three Pillars
kind: process
tags: [pillars, vision, decision-filter, scope-guard, priorities, focus, scoring]
summary: Derive exactly three design pillars — evocative but testable — and use them as the scoring function for every later choice, including the twist.
use-when: You have a brief and need a decision filter that resolves every downstream "should we?" including the twist and the cut list.
composes-with: [process-intent-to-brief, process-the-twist, process-core-loop, process-composition]
verify-with: none
---

# The Three Pillars

**What it is.** Three short statements of what this game **is about** — the
feelings and truths every later decision must serve. Not features, not a to-do
list. The pillars are the **scoring function** you run every candidate mechanic,
twist, and level through.

**Why it's fun.** Focus is fun's precondition. A game that's about three things is
about *something*; a game about ten is about nothing. When two ideas conflict, the
pillars decide — that's the whole point of writing them down.

## The step

Brief → exactly three pillars. Then everything downstream is scored, not
debated: [[process-the-twist]]'s candidate bends, [[process-composition]]'s system
list, and the cut list all resolve against these three.

## Why exactly three

Two under-constrains — you can't triangulate a decision. Four+ dilutes: a fourth
pillar is almost always a *feature* masquerading as a value, or a restatement of
one you already have. Three forces prioritisation and still fits in your head at
every choice. If you have five candidates, two are subordinate — demote them.

## Inputs → outputs

| In | Out |
|---|---|
| The brief's **fantasy** + **hook** ([[process-intent-to-brief]]) | Exactly 3 pillars |
| The named anchor(s) | Each pillar phrased **evocative + testable** |
| Nothing else — resist adding features | A one-line **test** per pillar |

## How to phrase a pillar

Each pillar is **two halves**: an evocative name you can say out loud, and a
testable clause that a design decision can pass or fail.

| Bad (vague / feature) | Good (evocative + testable) |
|---|---|
| "Fun combat" | **Readable violence** — *a player can name the threat that killed them.* |
| "Deep progression" | **Every run rewrites the deck** — *no two victories share a build.* |
| "Nice graphics" | **The screen reads at a glance** — *the avatar is the brightest thing on it.* |
| "Hard but fair" | **Your fault, never the game's** — *every death traces to an input, not a frame.* |

The testable clause is what makes a pillar a *filter*. "Readable violence" alone
is a mood; the clause *"can name the threat that killed them"* you can hold a
telegraph design up against and get a yes/no.

## How to run it

1. **Mine the brief.** The fantasy usually contains one pillar almost verbatim.
   The hook's **X** (anchor) contributes one — its load-bearing structure. The
   twist-to-be contributes the third (its differentiator).
2. **Draft five, cut to three.** Write candidates freely, then merge and demote
   until exactly three remain. If two overlap, they're one pillar.
3. **Add the test clause.** For each, write the one-line predicate a decision must
   pass. If you can't write a test, it's a mood — sharpen or cut it.
4. **Rank them.** Order matters: when pillars conflict (they will), the higher one
   wins. Pillar 1 is the hill you die on.
5. **Sanity-check coverage.** Between them, the three should touch *feel*,
   *depth/structure*, and *the twist*. A gap there means a missing pillar or a
   wrong cut.

## Using pillars as the decision filter

This is the payoff. Every downstream question becomes a **score**, not an argument:

- **The twist.** In [[process-the-twist]] step 3 you score six candidate bends
  against the pillars and keep the one that *most sharpens* a pillar. A twist that
  fights pillar 1 is a different game — drop it.
- **System inclusion.** In [[process-composition]], a system earns its place only
  if it serves a pillar. "Does crafting serve any pillar? No → cut it."
- **The cut list.** When scope must shrink, cut the content that serves the
  *lowest-ranked* pillar first.
- **Content & difficulty.** A level or encounter that expresses no pillar is
  filler. Every encounter should be a pillar, dramatised.

> **The filter test.** If a proposed feature passes zero pillars, it's out — no
> discussion. If it passes one, it's optional. If it passes two, it's core. This
> is the entire value of writing them down.

## Worked example

**Brief (from [[process-intent-to-brief]] example B):** an RTS with faction
asymmetry and impressive battles; X = [[anchor-starcraft]].

**Five candidates → three pillars:**

1. **Three armies, one balance** — *every faction shares zero units and still wins
   its share of mirrorless matchups.* (from the hook; the twist lives here)
2. **A hundred hands, one will** — *mass answers a single order and paths around
   walls without micro.* (from the fantasy + FUN.md §9's mechanical truth)
3. **The order you gave is the battle you get** — *unit behaviour is legible and
   deterministic; no surprise from the sim.* (an inherited-constraint pillar)

*Cut:* "deep tech tree" (demoted — it serves pillar 1, not its own thing) and
"cinematic camera" (a JUICE.md feel goal, not a pillar).

**Filter in action:** a proposed hero-unit mechanic — does it serve a pillar? It
sharpens pillar 1 (faction identity) *only if* each faction's hero is distinct;
generic heroes serve nothing and are cut. Pillar-scoring made the call in one line.

## Traps

- **Pillars that are features.** "Has a skill tree" is a feature; *"builds diverge
  by hour two"* is a pillar. Features are downstream of pillars.
- **Untestable moods.** "Epic", "immersive", "juicy" with no clause can't filter
  anything. Every pillar needs a predicate.
- **Four pillars.** The fourth is usually a demoted feature or a dupe. Force three.
- **Unranked pillars.** If they never conflict, they're too vague; if they conflict
  and you haven't ranked them, the next hard call stalls.
- **Pillars nobody enforces.** Written and forgotten is worse than none. Re-score
  against them at every stage — they are only worth the decisions they make.

## Composes with

- [[process-intent-to-brief]] — the brief is the ore; pillars are the refined metal.
- [[process-the-twist]] — pillars are literally the scoring function for the bend.
- [[process-core-loop]] — the loop must express the pillars beat by beat.
- [[process-composition]] — every included system must pass the pillar filter.

## See also

- [`design/00-process/the-twist.md`](the-twist.md) — where pillars do their most
  important work: choosing the twist.
- [docs/FUN.md](../../docs/FUN.md) Part 1 — the mechanical truths a testable pillar
  clause often points straight at (a pillar clause is frequently a FUN.md law,
  named for *your* game).
