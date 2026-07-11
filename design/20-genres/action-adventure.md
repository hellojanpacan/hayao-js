---
id: genre-action-adventure
title: Top-down Action-Adventure (Zelda-like)
kind: genre
tags: [action-adventure, zelda, top-down, combat, telegraph, dungeon, readable]
summary: Readable combat and gated dungeons — enemies that tell you what they'll do, a hit that feels like it landed, and keys that turn the map into a lock.
use-when: Designing a top-down game of reactive melee combat woven with light puzzle-gating and exploration.
composes-with: [system-telegraphs, system-combat-model, system-enemy-archetypes, system-encounter-design, system-boss-design, system-grace]
anchors: [anchor-shadow-of-mordor, anchor-dead-cells]
verify-with: design/FUN.md#4--top-down-action-adventure-zelda-like
---

# Top-down Action-Adventure (Zelda-like)

**What it is.** A top-down world of rooms and dungeons. You fight readable
enemies with a small verb set (attack, dodge, a tool or two), collect keys and
items that open the map, and best set-piece bosses. Combat is *reactive*: the
enemy shows its intent, you answer.

**Player fantasy / why it's fun.** *"I read that and beat it."* The satisfaction
of watching a wind-up, recognising it, and punishing it — plus the steady drip of
a new tool that reframes every room you've seen.

## Pillars

1. **Readable threat.** Every attack telegraphs — a flash, a wind-up, a
   ~0.45s tell — long enough to react. Reactive play is only possible if the
   threat is *legible* (FUN.md §4). [[system-telegraphs]].
2. **The hit has weight.** Hit-stop, i-frames, knockback — a landed blow *feels*
   landed. But hit-stop must buffer inputs through its freeze or attacks
   "randomly" vanish ([[system-combat-model]], FUN.md law 5/§4).
3. **The map is a lock.** Keys, switches, and items gate progress; a dungeon is a
   spatial puzzle whose solution is the tool you find inside it.

## The loop stack

| Scale | The loop |
|---|---|
| **Moment** | Read a wind-up → dodge or block → punish in the recovery window. Sub-second. |
| **Encounter** | A room of mixed [[system-enemy-archetypes]] — clear it by exploiting each one's tell. |
| **Session** | A dungeon: rooms + a keyed lock puzzle + the tool that solves it + the boss that tests the tool. |
| **Meta** | New tools reopen the overworld; hearts/upgrades and secrets reward exploration. |

## Essential systems

| System | Why it's needed |
|---|---|
| [[system-telegraphs]] | Pillar 1. The wind-up window is the entire fairness contract of reactive combat. |
| [[system-combat-model]] | Defines the hit — damage, hit-stop, i-frames, knockback — and the input-buffer-through-freeze rule. |
| [[system-enemy-archetypes]] | A legible alphabet (skirmisher/artillery/tank/swarm) so rooms compose meaning, not noise. |
| [[system-encounter-design]] | Rooms as compositions of archetypes; pressure and pockets, clear exit lanes. |
| [[system-boss-design]] | The dungeon's set-piece; phases and telegraphs that test the dungeon's tool. |
| [[system-grace]] | I-frames on dodge, hit-stop buffering, wound-before-death — the reactive-combat grace canon. |

## Content & difficulty model

- **Telegraph budget first.** Fix the tell duration (~0.45s baseline) and derive
  enemy density from it — enough space to read every threat that's live at once.
  Overlapping unreadable tells are the genre's core unfairness.
- **Keep exit lanes clear.** Cover or pillars in a door row/column is a softlock —
  the containment/exit-lane rule (FUN.md §4). Author door lanes obstacle-free.
- **Escalate by combining archetypes, not by inflating stats.** A skirmisher +
  artillery pair is harder — and more interesting — than a bigger-HP skirmisher.
  See [[system-encounter-design]].
- **Gate honestly.** Dungeon locks should be solvable with the tools available
  inside; the item you find is the intended key. Prove door gates open only when
  their key is held (both ways).

Reference wiring: a top-down steering + hunt-and-slash build proves the loop with a
combat bot (walk, fight, telemetry: win time, hp floor, 0 deaths). Grep
[`docs/API.md`](../../docs/API.md) for the hit-stop / i-frame / particle primitives
before citing them.

## Signature-mechanic seeds

"X but Y" ([[process-the-twist]]) — bend the *tool*, the *enemy memory*, or *time*.

- **Zelda but every enemy remembers your last fight** — the nemesis bend: a foe
  you fled comes back scarred and cocky. (mechanic-swap — see [[anchor-shadow-of-mordor]])
- **Zelda but your weapon is also your key** — the sword that opens the door is the
  one you fight with; upgrading it re-gates the map. (mechanic-swap)
- **Zelda but time only moves when you do** — a Superhot dungeon; telegraphs freeze
  between your steps. (constraint)
- **Zelda but you can only hold one tool at a time** — the loadout swap *is* the
  dungeon puzzle. (constraint)
- **Zelda but the dungeon is a single boss's body** — rooms are organs; the tool
  you find disables one. (theme + structure)

## Common pitfalls

- **Unreadable combat.** Too many simultaneous tells, tells too short, or no tell
  at all → the player can't play reactively, only spam. Budget telegraphs first.
- **Weightless hits.** No hit-stop/knockback/i-frames → combat feels like poking
  fog. And hit-stop *without* input buffering eats attacks — buffer through the
  freeze (FUN.md §4).
- **Softlocking door lanes.** Cover in an exit row can trap the player with a live
  enemy. Keep lanes clear.
- **Dungeons that are combat corridors.** Without the lock-and-key layer it's a
  beat-'em-up wearing a map. The *puzzle* of the dungeon is half the genre.
- **Stat-inflation difficulty.** Bigger numbers aren't harder, they're slower.
  Combine archetypes instead.

## Anchors

- [[anchor-shadow-of-mordor]] — the nemesis system; systemic enemy memory that
  personalises the overworld's threats.
- [[anchor-dead-cells]] — tight, weighty top-down/side melee feel and the
  tool-as-key unlock loop.

## Verify

Prove it with **[FUN.md §4 · Action-adventure](../FUN.md#4--top-down-action-adventure-zelda-like)** —
kiting-bot telemetry (win time, hp floor comfortable, 0 deaths); door gate proven
both ways; containment every frame; hit-stop buffers inputs through the freeze.
Design the readable fight here; prove it fair there.

## Composes with

- [[system-telegraphs]] — the readability pillar made mechanical.
- [[system-combat-model]] — the shape and weight of a hit.
- [[system-emergent-systems]] — nemesis-style memory turns fights into rivalries.

## See also

- [`design/FUN.md §4`](../FUN.md#4--top-down-action-adventure-zelda-like) — the proof playbook.
