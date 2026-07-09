---
id: anchor-loop-hero
title: Loop Hero
kind: anchor
tags: [genre-fusion, placement, auto-combat, deckbuilder, roguelite, novel-loop, indirect-control]
summary: Three genres fused into one loop — you place tiles from a deck around a fixed track, an auto-battling hero walks it, and the terrain you build both feeds and threatens you.
use-when: Designing a novel loop by fusing genres, or an indirect-control game where the player shapes the world and watches consequences unfold.
composes-with: [genre-auto-battler, genre-deckbuilder, system-resource-loops, pattern-risk-reward]
anchors: [anchor-loop-hero]
verify-with: design/FUN.md#11-·-roguelike-deckbuilder
---

# Loop Hero

**What it is.** Your hero auto-walks a looping track and auto-fights
whatever's on it. You don't control the hero — you place **terrain cards**
(meadows, rocks, vampire mansions) around the loop from a hand you drew, each
of which spawns loot, resources, *and* stronger enemies. Build up, cash out at
camp, go again.

**Player fantasy / why it's fun.** *I author the world; the hero lives in it.*
The pull is a **genuinely novel loop** stitched from three familiar genres —
placement, auto-battler, and deckbuilder — where your only lever is *the map
itself*, and every tile is a double-edged bet: more reward always means more
danger.

## Design DNA

Fuse three solved cores into one: the **auto-battler's** watch-don't-touch
combat, the **deckbuilder's** draft-and-play hand, and a **placement** puzzle
where the board is a fixed loop. Then bind them with one rule — **everything
you build both helps and threatens you.** A rock gives HP but a mountain
spawns harpies; a road-side spider farm is loot *and* a death trap. The
player's whole agency is *indirect*: you don't fight, you *cultivate the
conditions* of the fight, then decide when to flee to camp with your spoils.

The lesson Loop Hero teaches about *composition* is the most valuable thing to
extract: **fusing genres is not stapling them together — it's finding the one
rule that makes them the same game.** Three loops that would each be complete
on their own are welded by the single principle that every placement raises
reward and danger *together*. That binding rule is what stops the fusion from
feeling like three minigames in a trench coat; it makes the deckbuilder's
draft, the placement puzzle, and the auto-battle all *about the same
decision*. When you fuse genres (see [[process-composition]]), your real
design work is discovering that rule.

The novelty isn't a new verb — it's the *combination*, and the discipline of
satisfying all three parent genres at once. Indirect control is the delivery
vehicle: because you shape conditions rather than act, the placement, the
draft, and the fight are naturally one continuous authored consequence.

## Load-bearing structures

| Structure | Why it works |
|---|---|
| **Indirect control** | You never move the hero; you shape the world and watch. Agency lives in placement + when-to-retreat, not in reflexes. [[system-emergent-systems]]. |
| **Every tile is double-edged** | Each card raises reward *and* danger together — pure [[pattern-risk-reward]] baked into placement; there are no free builds. |
| **Fixed loop as the board** | The track never changes shape, so the puzzle is *what you add to it* — a bounded, legible placement space. |
| **Deck-drawn placement hand** | You play from a drawn hand of tiles, so runs vary and building is a draft. [[genre-deckbuilder]] / [[system-build-diversity]]. |
| **Auto-combat resolves the bets** | Watch-don't-touch fights turn your placement decisions into visible outcomes — the auto-battler's prep-then-watch. [[genre-auto-battler]]. |
| **Push-your-luck retreat** | Leave the loop to *keep* resources; die and you lose most of them — the tension of when to cash out. [[pattern-risk-reward]] / [[system-session-structure]]. |
| **Two economies (run vs base)** | Run resources feed a persistent base that unlocks new cards — meta-progression across loops. [[system-meta-progression]] / [[system-resource-loops]]. |

## What to steal

- **Fuse genres by binding them with one rule.** The parts (place / draft /
  auto-fight) are borrowed; the invention is "everything you build both helps
  and threatens you." A single binding rule turns three genres into one game.
  See [[process-composition]].
- **Indirect control.** Let the player author *conditions* and watch
  consequences — agency through the world, not the avatar. Distinct,
  low-input, deeply strategic.
- **Double-edged placement.** Make every build-choice raise risk and reward
  together, so there are no dominant plays — only bets.
  [[pattern-risk-reward]].
- **Push-your-luck cash-out.** A "retreat to keep your spoils vs push for
  more" decision gives every run a self-authored climax.
- **Two economies (run/base)** so loops feed a persistent unlock tree —
  [[system-meta-progression]]. Run resources are volatile (lost on death
  unless you retreat); base resources are permanent — the same
  ephemeral/persistent split [[anchor-hades]] uses, here gating the card pool
  itself.
- **Bound the board so placement is legible.** A fixed loop (rather than an
  open map) keeps the placement space small enough that every tile's effect is
  readable and every bet is comprehensible — the constraint is what makes
  indirect control *strategic* rather than fiddly.

## What's just theme (drop it)

- **The pixel-fantasy / "the world was erased" fiction.** Cosmetic framing.
- **The specific tiles.** *Terrain cards that spawn paired reward+threat* is
  structural; "vampire mansion vs oblivion" is flavour —
  [[system-build-diversity]].
- **The hero classes.** Loadout variants; the loop is class-agnostic.
- **The retro aesthetic.** Aesthetic, not structure.

## Composes into

- [[genre-auto-battler]] — supplies the prep-then-watch combat.
- [[genre-deckbuilder]] — supplies the draft-and-play hand.
- [[system-resource-loops]] — the gather-during-loop, spend-at-base cycle.
- [[pattern-risk-reward]] — double-edged tiles + retreat timing.
- [[process-composition]] — Loop Hero is the exemplar of
  genre-fusion-with-a-binding-rule.

## Twist seams

- **Loop Hero but the loop is a real map you traverse** *(structure)* — swap
  the fixed track for an open path; placement becomes route-authoring. Moves
  toward [[genre-exploration]].
- **Loop Hero but two players share one loop — one places, one fights**
  *(perspective)* — split indirect and direct control across a coop pair; the
  placer's bets are the fighter's problem. Feeds
  [[system-coop-and-competition]].
- **Loop Hero but tonal — you're gardening, not adventuring** *(tonal)* — the
  double-edged tiles become plants that yield harvest *and* pests; auto-combat
  becomes an auto-tending sim. Pairs with [[genre-farming-sim]].
- **Loop Hero but the binding rule is scarcity, not danger** *(constraint)* —
  every tile you place *consumes* a shared budget that also powers the hero,
  so building up literally starves your walker; the double-edge becomes
  economic rather than combat. Sharpens the "everything helps and threatens"
  rule along a new axis. Pairs with [[system-resource-loops]].

## See also

- [[genre-auto-battler]] · [[genre-deckbuilder]] · [[process-composition]] ·
  [[pattern-risk-reward]]
- `design/FUN.md#11-·-roguelike-deckbuilder` — draft delta + win-rate window
  (the deck parent).
- `sandboxes/procgen-lab/` — `Rng`/`pickEntry` for weighted tile-hand draws.
- `sandboxes/pathfinding-demo/` — loop/route traversal reference.
