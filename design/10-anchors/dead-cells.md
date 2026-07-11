---
id: anchor-dead-cells
title: Dead Cells
kind: anchor
tags: [metroidvania, roguelite, permanence, run-based, combat, unlock-pool, biome-branch]
summary: Metroidvania fused with roguelite — runs are impermanent, but permanent unlocks fold discoveries into the pool, so the world persists even when the run doesn't.
use-when: Designing a run-based action game that still wants a growing, permanent sense of world and mastery across deaths.
composes-with: [genre-metroidvania, genre-roguelike, system-meta-progression, system-combat-model]
anchors: [anchor-dead-cells]
verify-with: design/FUN.md#3-·-metroidvania
---

# Dead Cells

**What it is.** A fast, weighty 2D action game where each run threads a
randomised sequence of biomes toward a boss — you die and lose the run, but
the *permanent* layer (unlocked weapons, blueprints, shortcuts, mutations)
grows every time.

**Player fantasy / why it's fun.** *The run is temporary; my mastery and my
arsenal are forever.* The pull is **permanence over impermanence**: roguelites
reset you, Dead Cells lets you *keep the map of possibility*. Combat is the
tight loop; the expanding unlock pool is the reason a loss still feels like a
step forward.

## Design DNA

Take the **metroidvania's locked-door promise** and the **roguelite's fresh
run** and reconcile them: the *layout* resets, but *access* accretes.
Permanent ability-gates (the metroidvania spine) unlock new biome branches; a
**blueprint pool** folds every rare drop you carry to the end into all future
runs. So the world map is roguelike (never the same twice) while the *world of
options* is metroidvania (only ever grows).

The reconciliation is the whole insight: these two genres seem opposed — one
is about *permanence and mastery of a fixed space*, the other about
*impermanence and fresh variance* — and Dead Cells resolves the tension by
splitting *what resets* from *what accretes*. Geometry is disposable;
capability is forever. A losing run still expands the pool of what *can* drop,
so the sense of loss is real but never total. That single split is more
portable than any specific mechanic in the game.

Combat is the second engine: fluid, roll-cancellable, weapon-defined,
punishing but readable. It's what makes the moment-to-moment worth the
disposable runs — a great feel is the price of admission for a structure this
loss-heavy.

## Load-bearing structures

| Structure | Why it works |
|---|---|
| **Impermanent run, permanent pool** | Layout resets each run; the *set of things that can appear* only grows. A loss still advances the account. [[system-meta-progression]]. |
| **Permanent ability-gates unlock branches** | Metroidvania traversal powers (vine, teleport) are meta-unlocks that open new biome *routes* — the roguelite map has a metroidvania skeleton. [[genre-metroidvania]]. |
| **Blueprint economy** | Rare recipes drop mid-run but only *bank* if you survive the exit — carry-it-out risk gates the pool's growth. [[pattern-risk-reward]]. |
| **Roll-cancellable weighty combat** | Every attack commits, but the roll's i-frames let skilled play cancel — the skill ceiling is timing, not spam. [[system-combat-model]] + [[system-grace]]. |
| **Branching biome routes with tradeoffs** | Choose the harder path for better loot / a timed-door bonus — spatial [[pattern-risk-reward]] baked into the map. |
| **Mutations = per-run build** | Run-scoped modifiers layered on permanent gear give each descent an identity. [[system-build-diversity]]. |
| **Scaling-stat commitment (colours)** | Investing in one damage stat scales your matching gear — soft build-locking that makes drafts matter. |

## What to steal

- **Separate what resets from what accretes.** The layout can be fully
  roguelike while the *pool of possibilities* is strictly monotonic. This is
  the whole trick — a loss must grow the account.
- **Meta-unlock traversal powers that open new routes**, not just stat boosts
  — the metroidvania gate as a roguelite reward.
- **Carry-it-to-the-exit banking.** Make pool-growth resources survive only if
  you do — risk that gates permanence.
- **Roll-cancel combat:** committed attacks + a graceful escape verb. Weight
  and readability without stiffness. Wire via [[system-grace]].
- **Branching routes with explicit risk/reward** (harder biome = better loot,
  timed doors that reward speed). Spatial risk/reward baked into the map means
  the choice happens *before* the fight, not just during it.
- **Soft build-locking via a scaling stat.** Let investing in one damage
  colour scale the matching gear, so drafts commit the player to an identity
  without hard class walls — a lighter [[system-build-diversity]] lever than
  fixed classes.

## What's just theme (drop it)

- **The prisoner-island / headless-body fiction.** Minimal and cosmetic; the
  loop needs no story.
- **The specific biomes.** *Branch-with-tradeoff* is structural; "Toxic Sewers
  vs Promenade" is flavour.
- **Cells-as-currency naming.** A meta-currency by any name; see
  [[system-economy]].
- **The exact weapon list.** Weapon *archetypes* (fast/heavy/ranged/trap) are
  structural; the specific gear is content — [[system-build-diversity]].

## Composes into

- [[genre-metroidvania]] — supplies the gate-and-branch spine.
- [[genre-roguelike]] — supplies the fresh-run layout.
- [[system-meta-progression]] — the accreting blueprint pool is the exemplar
  of "loss still advances."
- [[system-combat-model]] — roll-cancel weighty combat.
- [[system-build-diversity]] — mutations + stat-scaling commitment.

## Twist seams

- **Dead Cells but the *world* is permanent and only *you* reset**
  *(structure)* — invert it: the map persists metroidvania-style, and
  roguelite variance lives in your loadout. Now it's Metroid with disposable
  builds.
- **Dead Cells but banking is social** *(mechanic-swap)* — blueprints you
  carry out drop into a *shared* pool other runs (or players) inherit;
  permanence becomes communal. Feeds [[system-coop-and-competition]].
- **Dead Cells but pacifist** *(constraint / tonal)* — the roll-cancel verb
  becomes evasion-only; biomes are navigated, not cleared; the pool grows with
  *routes discovered*, not weapons. Bends combat out entirely and pulls toward
  [[genre-exploration]].
- **Dead Cells but the biomes are a deck you draft the run's route from**
  *(mechanic-swap)* — instead of walking a randomised map, you play
  biome-cards to *assemble* the descent; the accreting pool becomes a growing
  card collection. Pulls in [[genre-deckbuilder]] over the traversal.

## See also

- [[genre-metroidvania]] · [[genre-roguelike]] · [[system-meta-progression]] ·
  [[system-combat-model]]
- `design/FUN.md#3-·-metroidvania` — negative gate proofs (ungated maneuver must
  fail).
- `examples/sokoban/` — the logic/view split for modeling a gate-and-branch
  world graph as a proven pure structure.
- `sandboxes/procgen-lab/` — seeded biome-branch generation.
