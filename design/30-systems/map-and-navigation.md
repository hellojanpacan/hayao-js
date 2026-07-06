---
id: system-map-and-navigation
title: Map & Navigation
kind: system
tags: [wayfinding, minimap, fast-travel, exploration, space]
summary: How players know where they are and get where they're going — wayfinding, minimaps, fast-travel, and the cost of a return trip.
use-when: Players get lost, or backtracking is padding the runtime.
composes-with: [genre-metroidvania, antipattern-backtracking-tax, world-level-as-story]
verify-with: docs/FUN.md#3-·-metroidvania
---

# Map & Navigation

**What it is.** The system that answers two questions at all times — *where am I*
and *how do I get there*. **Wayfinding** (landmarks, breadcrumbs, the minimap) plus
**travel** (walk, unlock, warp). The map is a promise about the space; navigation is
how cheaply the player cashes it.

**Player fantasy / why it's fun.** The world becomes **legible**. Early on you're
lost in a tangle; later you glance at the map and *know* the whole thing — that
mastery-of-space feeling is the exploration reward. Getting there fast, on your own
route, is the payoff for having learned it.

## When to use / when NOT

| Design it carefully when | Keep it minimal when |
|---|---|
| The space is large, connected, revisited ([[genre-metroidvania]]) | A single arena or linear level — no wayfinding needed |
| Backtracking is *intended* content, not padding | Every screen is new; you never return |
| Players choose their own route | The path is a corridor with one exit |
| Locking then re-opening a region is the core loop | A run resets the map every time ([[genre-roguelike]]) |

> The map exists to make a big space feel **small in the mind**. If it makes the
> space feel *tediously large* — long walks to nowhere new — you built a chore, not
> a tool. That's the [[antipattern-backtracking-tax]].

## Variants

| Variant | Player always knows | The pull is | Example |
|---|---|---|---|
| **Full map** | Whole layout from the start | Route optimization | strategy overworlds, [[anchor-civilization]] fog aside |
| **Discovered map** | Only what they've seen | Filling the blank | metroidvania, [[anchor-terraria]] |
| **Landmarks only** | What's on screen + memory | Reading the world itself | [[anchor-outer-wilds]], early Souls |
| **Fog-of-war** | Explored tiles; enemies hidden | Scouting the unknown | [[anchor-age-of-empires]], [[anchor-starcraft]] |
| **Diegetic map** | An in-world object they read | Grounded, no HUD | [[anchor-dark-souls]] (none), sea charts |
| **No map** | Nothing — pure spatial memory | Earned mastery of place | [[anchor-minecraft]] vanilla, roguelites |

**Travel rules** layer on top of any variant:

| Travel | Cost | Feels like | Watch |
|---|---|---|---|
| **Walk everywhere** | Time | The world has weight | Return trips become tax |
| **Fast-travel (free)** | None | Convenience | Erodes the space's meaning |
| **Fast-travel (nodes)** | Reach a beacon first | Earned shortcut | Node density is the whole tuning |
| **One-way shortcuts** | Unlock the door once | The map folding shut | [[anchor-dark-souls]] — a masterclass |
| **Costed warp** | Currency / risk | A decision, not a reflex | See the twist below |

## Tuning levers

| Lever | Controls | Healthy rule |
|---|---|---|
| **Map fidelity** | How much the map tells you | Enough to plan, not so much it plays for you. Discovered > handed-over for exploration |
| **Travel friction** | Cost of a return trip | Match it to whether the trip *is* content. Zero friction only when the walk adds nothing |
| **Breadcrumbs** | How hard to get lost | A waypoint or objective marker rescues the lost; too many kill the wayfinding skill ([[system-quests-and-objectives]]) |
| **Landmark distinctness** | Self-location without a HUD | Every region needs a silhouette you'd recognize blind ([[pattern-readability]]) |
| **Reveal grain** | Room-at-a-time vs. wide | Fine grain rewards thoroughness; coarse keeps the mystery |
| **Fast-travel unlock pace** | When the map "opens up" | Gate it behind exploration so walking teaches the space *first* |

## Twist seams

- **Navigation but no map — landmarks only** *(constraint).* Strip the minimap;
  make the *world* the map. Each region gets an unmistakable silhouette, a distant
  spire, a color grade — the player self-locates by looking, not by HUD. Forces
  memorable [[world-level-as-story]] and hard [[pattern-readability]]; punishes
  samey corridors. See [[anchor-outer-wilds]]: no waypoint, only a solar system you
  come to know by heart.
- **Fast-travel but each use ages the world** *(risk-reward).* Warping is instant
  but *costs the world* — a day passes, a faction advances, a resource depletes, an
  enemy camp respawns tougher. Now travel is a [[pattern-risk-reward]] decision, not
  a menu reflex: is the shortcut worth the drift? Ties navigation to
  [[system-weather-and-time]] and the [[system-economy]]; walking becomes the
  *conservative* play again.

## How it wires to Hayao

- **The map is discovered *state*, drawn as *chrome*.** Which rooms are seen, which
  beacons unlocked — that lives in world state and belongs in the world hash. The
  minimap *rendering* is a pure view: cosmetic nodes / a `showScreen()` panel, out
  of `world.hash()` (CLAUDE.md invariants 4–5).
- **Connectivity is a graph — prove it.** Model the space as rooms + edges (locked,
  one-way, warp). Treat traversability as pure logic and *machine-verify* every
  intended destination is reachable given the player's gates — the same
  progression-as-graph spine the metroidvania flagship uses (see
  `examples/` metroidvania worldgraph). A stranded region is the cruelest bug.
- **Prove no soft-locks.** After any warp or one-way door, the player must still be
  able to reach every remaining objective. Sweep it across the ability set, not just
  the happy path ([[system-save-and-checkpoint]] for the resume side).
- **Determinism holds fast-travel honest.** Warp resolves to a fixed spawn; any
  "world ages on travel" effect draws from `world.rng`, never wall-clock — so a
  replay warps identically (CLAUDE.md invariant 2).

## Fails when…

- **Backtracking tax.** The map sends you on long, empty return trips for a single
  pickup. If the walk teaches nothing new, it's padding — [[antipattern-backtracking-tax]].
- **Handed-over map.** A full, marked, objective-arrowed map with zero fog turns
  exploration into following a line. The blank *is* the content.
- **Breadcrumb overload.** A waypoint on everything trains the player to watch the
  marker, not the world — wayfinding as a skill dies ([[antipattern-boring-optimal]]).
- **Free warp everywhere from turn one.** The space stops mattering; distance is
  meaningless, so [[world-level-as-story]] evaporates.
- **Sameness.** No distinct landmarks → the player is lost even *with* a map,
  because nothing on it maps to what they see ([[antipattern-content-desert]]).
- **Stranded region.** A locked door with no key on the reachable side — the
  unshippable soft-lock the connectivity sweep exists to catch.

## Verify

- Every intended destination is reachable given the gate set; no stranded region,
  no post-warp soft-lock — the metroidvania connectivity proof: **[[FUN.md §3]]**.
- Discovered-map and beacon state round-trips through save/hash: **[[FUN.md law 7]]**.
- Fast-travel and any world-aging effect are deterministic (same seed, same
  outcome): **[[FUN.md law 6]]**.
- The map is cosmetic — the view never enters the world hash: **[[FUN.md law 6]]**.

## Composes with

- [[genre-metroidvania]] — the genre *is* map-as-progression; this is its nervous system.
- [[antipattern-backtracking-tax]] — the failure mode navigation is built to prevent.
- [[world-level-as-story]] — distinct places make the map readable and worth learning.
- [[system-quests-and-objectives]] — objective markers are the breadcrumb dial.
- [[system-weather-and-time]] — the substrate for a fast-travel-ages-the-world twist.
- [[genre-exploration]] — discovery-first design where the blank map is the game.

## See also

- [`docs/FUN.md`](../../docs/FUN.md) §3 (metroidvania reachability) — the navigation proof.
- **[[anchor-dark-souls]]** (interlocking shortcuts, no minimap) ·
  **[[anchor-outer-wilds]]** (landmark-only wayfinding) ·
  **[[anchor-age-of-empires]]** (fog-of-war scouting).
