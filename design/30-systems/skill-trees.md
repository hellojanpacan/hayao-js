---
id: system-skill-trees
title: Skill Trees — Branching Unlocks & Builds
kind: system
tags: [skill-tree, builds, unlocks, branching, exclusivity, respec, specialization]
summary: Branching unlock graphs that turn flat power into a build; meaningful exclusivity is what makes the choice a choice, and respec is its grace.
use-when: Progression should let the player CHOOSE a shape — a build, a specialization — not just accumulate the same power everyone gets.
composes-with: [system-progression, system-build-diversity, system-tech-tree, system-economy, system-collectibles]
anchors: [anchor-dead-cells, anchor-slay-the-spire]
verify-with: design/FUN.md#2-skill-delta-proofs
---

# Skill Trees — Branching Unlocks & Builds

**What it is.** A **graph of unlocks** the player buys with a progression
currency (points, cells, essence). The graph's *branches* — and the fact that you
can't afford all of them — turn "get stronger" into "become a *kind* of strong."

**Player fantasy / why it's fun.** "This build is *mine*." The tree is a canvas;
the player paints a strategy and then gets to test it. The pull is the road not
taken — every point spent is a small identity claim.

## When to use / when NOT

| Use it when | Skip it when |
|---|---|
| You want players to express strategy through pre-commitment | There's no meaningful choice — every node is strictly good |
| Replay value comes from "try a different build" | One optimal path exists; the tree is a formality |
| Power is horizontal ([[system-progression]]) and needs structure | A flat list of upgrades reads clearer (small games) |

A tree with no **exclusivity** is just a shopping list. If the player will
eventually own every node, the branches are decoration — either add scarcity
(can't afford all) or opposition (this node locks that one).

## Variants

| Variant | Structure | The choice is | Example |
|---|---|---|---|
| **Prerequisite web** | Nodes gate deeper nodes | *Order & reach* | Path of Exile's lattice |
| **Point-buy, no gates** | Flat pool, scarce points | *What to skip* | Classic RPG stat spend |
| **Mutually-exclusive forks** | Pick A xor B at each fork | *Identity* | "Fire OR frost, never both" |
| **Class/archetype trees** | Separate trees per role | *Which fantasy* | Diablo class trees |
| **Draft-as-tree** | The run's picks form an implicit build | *Emergent shape* | Hades boons; StS deck |

The **fork** variant carries the most meaning per node and the most respec
pressure — see levers.

## Tuning levers

| Lever | What it controls | Healthy range / rule |
|---|---|---|
| **Point scarcity** | How much you must skip | You should afford ~40–70% of a tree per playthrough — enough to specialise, not complete |
| **Branch exclusivity** | Whether a choice costs another | At least the *capstones* should be exclusive, or builds converge |
| **Node granularity** | Fewer big nodes vs many small | Big nodes = legible builds; tiny nodes = fiddly filler |
| **Capstones** | The payoff that defines a build | Each branch needs a "this is why you went here" node |
| **Respec cost** | Reversibility | Free in experimental games; costed where commitment is the point |
| **Gating depth** | Prereqs before the good stuff | Shallow — burying power behind 8 filler nodes reads as grind |

**Respec is grace** (**[[FUN.md law 5]]**, the anti-frustration mindset). A tree
the player is afraid to touch is a tree they don't engage with. Default to
generous respec unless *permanent commitment* is an explicit pillar.

## How it wires to Hayao

- **The tree is data.** A node graph (id, cost, prereqs, effect) in `world.state`;
  unlocking is an **input action** that spends a currency and flips a flag. The
  effect is applied by pure logic reading owned-node flags — so a build is a
  reproducible input sequence, and clone-and-score bots can *pilot* builds to
  measure them (**[[FUN.md law 7]]**).
- **Exclusivity is a solver constraint.** "Can't own A and B" is a rule the pure
  logic enforces and a test asserts. Prove *every* branch is viable by piloting
  each and asserting it beats a null build — the skill-delta proof
  (**[[FUN.md law 2]]**), applied per branch, is your balance instrument for
  [[system-build-diversity]].
- **The tree UI is chrome.** Draw it with `showScreen()` (DOM menu) — it's not
  sim, so it doesn't belong in `world.hash()`. Grep `docs/API.md`; per CLAUDE.md
  invariant 4, menus are DOM.
- **Persist unlocks** via `SaveManager` when the tree is meta
  ([[system-meta-progression]]).

## Fails when…

- **A trap node.** A branch that's strictly worse wastes the player's one
  irreversible choice — punishing, not deep. Prove each branch viable.
- **A God node.** One branch dominates; everyone funnels to it and the tree
  collapses to a line. The win-rate *window* per build catches this.
- **No exclusivity.** Own-everything trees have no decisions. Add scarcity or forks.
- **Filler gating.** Prereq chains of dead nodes to reach the good one — grind
  wearing a tree costume.
- **Respec you fear.** No respec + a trap node = a bricked character. Give an out.

## Verify

- Per-branch skill delta — each build beats a null build: **[[FUN.md law 2]]**.
- Build viability as a win-rate *window*, both edges break CI:
  **[[FUN.md §11]]** (deckbuilder's balance instrument).
- Build as a reproducible pilot (clone-and-score): **[[FUN.md law 7]]**.

## Composes with

- [[system-progression]] — the tree spends what progression earns.
- [[system-build-diversity]] — the tree is the machinery that makes many builds real.
- [[system-tech-tree]] — the same graph shape at the *strategy* scale (a whole faction).
- [[system-meta-progression]] — persistent trees between runs.
- [[system-economy]] — skill points are a currency; the tree is a sink.

## See also

- [`design/FUN.md`](../FUN.md) §11, law 2 — build deltas and win-rate windows.
- `examples/slay-the-spire`-style drafting (**[[anchor-slay-the-spire]]**) — the
  deck IS the tree, built one card at a time.
