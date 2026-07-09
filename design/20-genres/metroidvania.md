---
id: genre-metroidvania
title: Metroidvania
kind: genre
tags: [metroidvania, exploration, gating, ability, map, backtrack, locked-door]
summary: The locked-door promise kept — a single connected world where every ability you earn retroactively unlocks a place you already saw and couldn't reach.
use-when: Designing an interconnected exploration game whose progression is spatial — abilities as keys, the map as the meta-puzzle.
composes-with: [system-progression, system-skill-trees, system-save-and-checkpoint, system-onboarding, system-boss-design, system-collectibles]
anchors: [anchor-dead-cells, anchor-celeste]
verify-with: design/FUN.md#3--metroidvania
---

# Metroidvania

**What it is.** One continuous world, not a level list. You explore, hit a
**locked door** (a wall too high, a gap too wide, a gate keyed to an ability you
don't have), and file it away. Later you earn the key — and the world you already
walked opens up beneath you. The map is the real progression bar.

**Player fantasy / why it's fun.** *"I remember this place."* The double-jump you
just earned is a memory of a dozen ledges you eyed and left. Power is measured in
*where you can now go*, and the world rewarding your growth feels like the world
was waiting for you.

## Pillars

1. **The locked-door promise.** Every gate you can't pass is a promise the game
   *will* let you pass it later — and keeps. Gates really gate; abilities really
   open. A gate you can cheese breaks the contract (FUN.md §3 demands *negative*
   proofs).
2. **One connected world.** Not levels — a place. Shortcuts fold back, biomes
   interlock, and the joy is holding the whole map in your head.
3. **Ability as key and as verb.** Each unlock changes both *where* you go and
   *how* you move/fight — a double-jump is a key to high ledges and a new combat
   option at once. (Celeste's abilities do exactly this to its movement envelope.)

## The loop stack

| Scale | The loop |
|---|---|
| **Moment** | Traverse a room; test a gap; note "can't yet." |
| **Encounter** | Reach an ability (often behind a boss/miniboss) → the room that teaches it → the first gate it opens. |
| **Session** | Sweep a biome: open its gates, find its shortcuts, beat its guardian, leave with one new key. |
| **Meta** | The whole map fills in; optional collectibles and sequence-breaks reward mastery of the geography. |

## Essential systems

| System | Why it's needed |
|---|---|
| [[system-progression]] | Abilities are the power curve; each is a discrete, world-changing unlock, not a stat bump. |
| [[system-boss-design]] | Guardians gate abilities; the fight *is* the ceremony of earning the key. |
| [[system-save-and-checkpoint]] | The world is persistent; save/load must round-trip the full map + unlock state (FUN.md §3 asserts the hash round-trip). |
| [[system-onboarding]] | The room right after each ability must *force* its use — teach the verb before the world demands it. |
| [[system-skill-trees]] | Optional: layer optional upgrades over the mandatory ability spine for build texture. |
| [[system-collectibles]] | Off-the-critical-path secrets give the fully-powered player reasons to re-sweep the map. |

## Content & difficulty model

- **Gates need negative proofs.** The movement envelope is only a *lower* bound.
  For every "you can't pass yet," simulate the best ungated maneuver against the
  real geometry and show it falls short — otherwise a skilled player sequence-
  breaks by accident and the promise means nothing (FUN.md §3).
- **Design the map as a lock-and-key graph.** Author the ability order first, then
  place gates so each new key opens exactly the doors that route the player
  forward *and* backward into old regions. A progression-as-graph spine keeps it
  provable.
- **Room transitions must be clean.** Trigger inside the border, land past the far
  threshold — no ping-pong at the seam (FUN.md §3).
- **Backtracking must pay.** A revisited region should offer new reachability, a
  shortcut, or a secret — never an empty walk. Fast-travel or folded shortcuts
  respect the player's time once the geography is learned.

Reference wiring: [`examples/sproutveil`](../../examples/sproutveil) — the
room-connected exploration structure and the waypoint-bot pattern extended across
rooms; [`examples/kintsugi`](../../examples/kintsugi) — the flagship whose five
abilities each extend the movement envelope (the metroidvania spine).

## Signature-mechanic seeds

"X but Y" ([[process-the-twist]]) — bend the *key*, the *map*, or *who holds it*.

- **Metroidvania but the map rearranges when you gain an ability** — new powers
  re-lay the world, so backtracking is always into somewhere new. (structure)
- **Metroidvania but abilities are spent, not kept** — a key opens one door then
  is consumed; routing the map is a resource puzzle. (constraint)
- **Metroidvania but the locked doors are in time, not space** — a "key" lets you
  visit an earlier state of the same room. (perspective)
- **Metroidvania but you play the world, not the hero** — you *place* the gates and
  route an AI explorer. (perspective)
- **Metroidvania but every gate is a promise you make to an NPC** — social access,
  not physical, opens the map. (theme)

## Common pitfalls

- **Cheesable gates.** A gate the movement envelope can clear ungated is a broken
  promise. Prove every gate *both ways* (ungated fails, gated passes) — FUN.md §3.
- **Levels wearing a map costume.** Disconnected rooms with a fast-travel menu
  aren't a metroidvania; the *interconnection* is the fun. Fold the world back on
  itself.
- **Empty backtracking.** Sending the player through cleared rooms with nothing new
  is padding. Every revisit pays.
- **Ability that's only a key.** If a new power opens doors but doesn't change how
  you move or fight, it's a keycard, not a verb. Make it both (pillar 3).
- **Save that loses the map.** Unlock/exploration state must survive save/load
  exactly — assert the hash round-trip.

## Anchors

- [[anchor-dead-cells]] — metroidvania × roguelite; permanent unlocks over
  impermanent runs (steal the unlock-as-key spine, drop the run structure if you
  want the classic form).
- [[anchor-celeste]] — abilities as movement-envelope changers; the traversal feel
  a metroidvania needs under its map.

## Verify

Prove it with **[FUN.md §3 · Metroidvania](../FUN.md#3--metroidvania)** —
bot full-run with abilities; both-ways gate proofs (best ungated maneuver fails,
gated passes); save/load hash round-trip; clean room-transition triggers. Design
the lock-and-key world here; prove the doors there.

## Composes with

- [[system-progression]] — abilities *are* the curve; pace their power.
- [[system-boss-design]] — guardians as the gate ceremony.
- [[genre-precision-platformer]] — the traversal feel under the exploration.

## See also

- [`examples/kintsugi`](../../examples/kintsugi) — the flagship metroidvania spine.
- [`examples/sproutveil`](../../examples/sproutveil) — room-connected structure.
- [`design/FUN.md §3`](../FUN.md#3--metroidvania) — the proof playbook.
