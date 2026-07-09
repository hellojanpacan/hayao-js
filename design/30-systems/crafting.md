---
id: system-crafting
title: Crafting — Recipes & Combinatorial Depth
kind: system
tags: [crafting, recipes, combination, discovery, lookup, depth, materials]
summary: Combining inputs into outputs by recipe; combinatorial depth as content, and the discovery-vs-lookup axis that decides how the player learns it.
use-when: The design lets players combine materials/items into new ones and you need the recipe space to be deep, legible, and worth exploring.
composes-with: [system-resource-loops, system-economy, system-build-diversity, system-collectibles, system-tech-tree]
anchors: [anchor-factorio, anchor-stardew-valley]
verify-with: design/FUN.md#1-grid-puzzle-sokoban
---

# Crafting — Recipes & Combinatorial Depth

**What it is.** A **recipe system**: inputs (materials, items, ingredients) combine
by rule into outputs. The depth is combinatorial — a modest set of inputs and
recipes yields a large possibility space. The design choice is how the player
*learns* the space: handed the recipe (**lookup**) or finding it (**discovery**).

**Player fantasy / why it's fun.** "I turned these scraps into *that*." Crafting
rewards planning and packrat instinct; discovery crafting adds the "what if I
combine…" curiosity. The pull is the recipe you don't have yet — and the hunch
about what makes it.

## When to use / when NOT

| Use it when | Skip it when |
|---|---|
| Combining things is a core verb (survival, sim, alchemy) | Items are found whole; no combination step |
| You want depth from few pieces via combinatorics | A flat shop ([[system-economy]]) covers acquisition |
| Recipe *discovery* can carry curiosity | Recipes would just be an inventory tax |

Crafting is the **convert** node of a **[[system-resource-loops]]** made
*combinatorial*. If there's exactly one useful recipe per material, you don't have
crafting — you have a conversion. Crafting earns its name when *choices between
recipes* exist.

## Variants

| Variant | How the player learns | Depth from | Example |
|---|---|---|---|
| **Recipe list (lookup)** | Given the recipe book | Resource management | Minecraft (known), Stardew |
| **Discovery** | Experiment to find combos | Curiosity, "what if" | Little Alchemy; Doodle God |
| **Grid/shape** | Spatial arrangement matters | Pattern puzzles | Minecraft crafting grid |
| **Modifier/affix** | Base + modifiers roll | Build optimization | Diablo runewords; PoE crafting |
| **Emergent (systemic)** | Rules interact, no explicit recipes | Second-order surprise | Breath of the Wild elixirs; Noita |

The **discovery** and **emergent** variants trade legibility for wonder — powerful,
but they need a fallback so the player is never *stuck* (a hint, a partial reveal).

## Tuning levers

| Lever | What it controls | Healthy range / rule |
|---|---|---|
| **Recipe count** | Breadth of the space | Enough to explore; each recipe must *do* something distinct |
| **Combinatorial fan-out** | Outputs per input set | High fan-out = deep from few pieces (the whole point) |
| **Discovery vs lookup** | How recipes are learned | Discovery for wonder; lookup for planning games. Mixing: teach basics, hide the exotic |
| **Ingredient scarcity** | Cost of a craft | Ties crafting to the economy — scarce inputs make recipes decisions |
| **Legibility** | Can the player *plan*? | Show what a recipe needs before they commit ingredients |
| **Dead-end density** | Useless recipes | Keep low — a discovered recipe that does nothing punishes curiosity |

## How it wires to Hayao

- **Recipes are pure data + pure logic.** A recipe is `{inputs, output}`; crafting
  is a **pure function** over inventory state in `world.state`, invoked by an
  **input action**. This makes the recipe space *machine-checkable*: it's the same
  shape as a `Puzzle<State, Move>` — you can solver-search "is item X craftable
  from starting materials?" the way the grid-puzzle solver proves reachability
  (**[[FUN.md §1]]**).
- **Prove reachability.** Assert every *intended* output is craftable from
  obtainable inputs — a connectivity proof over the recipe graph, mirroring the
  roguelike "all loot reachable" sweep (**[[FUN.md §10]]**). No orphan recipes.
- **The crafting UI is chrome.** The recipe book / bench menu is `showScreen()`
  DOM; inventory *counts* are sim state, the panel is `cosmetic` (CLAUDE.md
  invariant 4, **[[FUN.md law 6]]**).
- **Generate the recipe set as content.** Lean on `src/content/` to *generate*
  balanced recipe trees and prove them reachable, rather than hand-authoring a
  hundred recipes and hoping.

## Fails when…

- **Orphan recipes.** An output nothing reaches, or an ingredient nothing uses —
  dead weight. Prove the graph connected.
- **One true recipe.** If every craft has a single obvious answer, it's conversion
  cosplaying as crafting. Add meaningful alternatives.
- **Discovery with no floor.** Pure discovery + no hints = players stuck, guessing.
  Always give a nudge before frustration.
- **Illegible cost.** Committing ingredients before seeing the recipe wastes scarce
  materials — feels like a trap.
- **Inventory tax.** Crafting that's mandatory busywork (craft to progress, no
  choice) — cut it or make it optional.

## Verify

- Recipe reachability as a connectivity/solver proof (every intended output
  craftable): **[[FUN.md §10]]** (connectivity) and **[[FUN.md §1]]** (solver over
  a `Puzzle`-shaped state).
- Determinism: same inputs → same output, replay-hash identical: **[[FUN.md law 7]]**.
- Ingredient economy stays in a pacing window: **[[FUN.md §14]]**.

## Composes with

- [[system-resource-loops]] — crafting is the combinatorial *convert* step.
- [[system-economy]] — ingredients are currency; recipes are structured sinks.
- [[system-build-diversity]] — modifier/affix crafting is a build engine.
- [[system-collectibles]] — a recipe book is a set to complete.
- [[system-tech-tree]] — research unlocks new recipes.

## See also

- [`design/FUN.md`](../FUN.md) §1 (solver over pure state) · §10
  (connectivity) — recipe reachability rides both.
- `src/content/generate.ts` — generate & prove a recipe/level space instead of
  hand-authoring it.
- **[[anchor-factorio]]** — recipes as the production spine.
