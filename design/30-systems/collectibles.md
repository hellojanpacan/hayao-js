---
id: system-collectibles
title: Collectibles — Sets, Completion & Optional Pull
kind: system
tags: [collectibles, sets, completion, cosmetics, optional-goals, 100-percent, checklist]
summary: Optional goals that pull without shoving — sets to complete, cosmetics to earn; the compulsion of the almost-full grid, kept honest.
use-when: You want optional content that rewards thoroughness and gives self-directed players a goal, without gating the main game behind it.
composes-with: [system-reward-schedules, system-meta-progression, system-economy, system-mastery-curve, system-collectibles]
anchors: [anchor-stardew-valley, anchor-dead-cells, anchor-vampire-survivors]
verify-with: design/FUN.md#15-farminglife-sim
---

# Collectibles — Sets, Completion & Optional Pull

**What it is.** **Optional goals with pull.** Things to find, fill, and complete —
a bestiary, a museum, a costume rack, a map's every corner. Collectibles give
self-directed players a *reason to keep going* after the critical path ends,
without making that content mandatory.

**Player fantasy / why it's fun.** "Just one more, and the set's complete." The
almost-full grid is a magnet; the empty slot is an itch. The pull is *closure* —
the collector's satisfaction of a thing made whole.

## When to use / when NOT

| Use it when | Skip it when |
|---|---|
| You want optional long-tail goals for completionists | It would pad a tight, focused game with busywork |
| Exploration/thoroughness deserves a reward channel | The reward is required progress (then it's not optional) |
| Cosmetics give a low-power, high-pull earn | Everything must matter mechanically |

The discipline: collectibles are **optional**. The moment a set gates *required*
power or the ending, it stops being a pull and becomes a tax. Keep the rewards
*expressive* (cosmetics, lore, bragging rights) or *modest* (small bonuses) —
never the only path to core power.

## Variants

| Variant | The pull is | Reward | Example |
|---|---|---|---|
| **Sets to complete** | Closure of a grid | Completion bonus / status | Bestiary, card album, museum |
| **Cosmetics** | Expression, status | Looks, zero power | Skins, dyes, titles |
| **Map completion** | Thoroughness | Reveal, %, secret | "100% map" ; hidden rooms |
| **Cumulative unlocks** | Milestone counting | New content at N | "Kill 100 → unlock weapon" ([[system-meta-progression]]) |
| **Lore/knowledge** | Curiosity | Story, world depth | Codex entries; audio logs ([[world-narrative-delivery]]) |
| **Living dex / catch-em-all** | The complete roster | Prestige, function | Pokédex; VS character unlocks |

## Tuning levers

| Lever | What it controls | Healthy range / rule |
|---|---|---|
| **Set size** | Effort to complete | Big enough to be a journey, small enough to finish. Subdivide huge sets |
| **Progress visibility** | The itch | *Show the empty slots* — the grid with gaps IS the pull |
| **Acquisition clarity** | Fair vs guessy | The player should know *how* to get a missing one (or where to look) |
| **Reward weight** | Power vs cosmetic | Keep low-power / expressive; optional means optional |
| **Completion payoff** | The reason to finish | Give the 100% a *real* moment — a costume, a title, a secret |
| **Missable density** | Anxiety | Minimise permanently-missable items, or players stress-play |

## How it wires to Hayao

- **Collection is state; the grid is chrome.** Owned/seen flags live in
  `world.state` (or the meta slice via `SaveManager` for cross-run dexes); the
  collection *screen* is `showScreen()` DOM, `cosmetic` where it renders in-world
  (CLAUDE.md invariant 4, **[[FUN.md law 6]]**).
- **Prove completability.** Assert every collectible is *reachable/obtainable* —
  no item stranded behind a cut path or an impossible drop. This is the same
  connectivity sweep the roguelike runs on loot (**[[FUN.md §10]]**), and it
  catches the cruelest bug: a 99%-completable set.
- **Show the player-critical number.** "3 of 12 found", "2 nights left to catch it"
  — surface it, the way farming surfaces nights-in-season (**[[FUN.md §15]]**).
  Knowledge the completionist needs, made visible.
- **Persist across runs** with `SaveManager` + `SAVE_FORMAT_VERSION` for meta
  dexes; the collection round-trips and hashes.

## Fails when…

- **99% completable.** One item unreachable (a cut spawn, a bugged drop) poisons the
  whole set. The reachability sweep is non-negotiable.
- **Mandatory sets.** A collectible gating the ending or core power isn't optional —
  it's a chore with extra steps.
- **Invisible progress.** No visible grid, no "N of M" — the pull evaporates.
- **Missable minefield.** Many permanently-missable items → anxious, guide-dependent
  play. Minimise or make everything re-obtainable.
- **Hollow 100%.** Completing the set gives nothing — the payoff must *land*.

## Verify

- Every collectible reachable/obtainable — connectivity sweep across seeds:
  **[[FUN.md §10]]**.
- Surface the completion number (found/total, time-left): **[[FUN.md §15]]**.
- Collection state persists & hashes (save round-trip): **[[FUN.md law 7]]**.
- The main game clears without completing any set (optional-means-optional):
  **[[FUN.md law 4]]**.

## Composes with

- [[system-reward-schedules]] — variable-ratio drops feed set completion.
- [[system-meta-progression]] — cross-run dexes and cosmetic unlocks.
- [[system-economy]] — cosmetics as a currency sink with no power creep.
- [[system-mastery-curve]] — hard-to-get collectibles reward skill, not just time.
- [[world-narrative-delivery]] — lore collectibles deliver story with little text.

## See also

- [`design/FUN.md`](../FUN.md) §10 (reachability) · §15 (surfaced number) —
  the collectible proofs.
- **[[anchor-stardew-valley]]** (museum/bundles) · **[[anchor-vampire-survivors]]**
  (character unlock roster).
