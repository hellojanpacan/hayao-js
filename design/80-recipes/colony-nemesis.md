---
id: recipe-colony-nemesis
title: Colony Nemesis
kind: recipe
tags: [colony-sim, nemesis, emergent, recipe, rimworld]
summary: RimWorld's story-generator colony with Shadow of Mordor's memory — rivals who remember what you did and come back for it.
use-when: You want emergent personal drama in a management sim.
composes-with: [anchor-rimworld, anchor-shadow-of-mordor, system-emergent-systems, genre-management-tycoon]
anchors: [anchor-rimworld, anchor-shadow-of-mordor]
verify-with: docs/VERIFICATION.md
---

# Colony Nemesis

**What it is.** A colony sim where the raiders are **named, persistent rivals**
who remember every raid you won, lost, or bungled — and escalate the feud on
their next visit. The AI storyteller doesn't spawn threats; it spawns *history*.

**Player fantasy / why it's fun.** Not "a raid arrived" but "*Kael's back — the
one who took my sniper's arm last winter, and he's brought friends this time*."
The colony gives you characters to lose; the **nemesis** gives the enemy a face
you'll hate on sight. Drama becomes personal on both sides of the wall.

## The brief

**RimWorld but the raiders remember** — the raid isn't a wave, it's a **grudge**.

## Anchors

- [[anchor-rimworld]] — the loop, the sim depth, and the storyteller-as-author
  stance. Story is the product, not a score.
- [[anchor-shadow-of-mordor]] — the **nemesis system**: a systemic hierarchy of
  named antagonists who remember, rise from your failures, and personalize.

The bet: RimWorld's raids are *forgettable* because the attackers are anonymous.
Mordor already solved anonymity. Bolt one onto the other.

## Genre + systems pulled

- [[genre-management-tycoon]] — the base loop: build, staff, defend, sustain a
  colony against escalating pressure. Don't restate it; borrow its resource and
  labor spine.
- [[system-emergent-systems]] — the engine of the whole thing. Drama is the
  *output* of a legible sim colliding with a memory ledger, not authored scenes.
- [[system-spawn-directors]] — repurposed as the storyteller. It no longer picks
  "3 tribals with clubs"; it picks *which rival* returns, at what strength, with
  what grudge. The director reads state and authors the next chapter.
- [[system-enemy-ai]] — raiders act *in character* per their memory (the one you
  humiliated fights cautious; the one who beat you swaggers).
- [[system-faction-asymmetry]] — rivals belong to factions whose disposition
  shifts with your history, so a grudge can metastasize into a war.
- [[pattern-emergence]] — the pattern you're farming: small remembered facts
  compounding into stories no one wrote.

## The twist applied — *mechanic-swap*

Replace one load-bearing verb: **spawn** becomes **remember**. Everything else
in the colony sim reorganizes around a persistent nemesis ledger. See
[[process-the-twist]] for the vector; this is a textbook mechanic-swap.

Concrete twist seams to design against:

- **RimWorld but the raid remembers** *(mechanic-swap — persistent memory
  ledger)*. Every attacker who survives is written down: what they did, what you
  did to them, what they carry now.
- **Shadow of Mordor but you're defending, not hunting** *(structure — invert
  the vantage)*. You don't stalk the hierarchy; it comes to your gate. The
  fortress is fixed; the nemesis is mobile.
- **A tower defense but the creeps hold a grudge** *(mechanic-swap — reactive
  wave composition)*. The next wave is *authored by* how the last one went, not
  drawn from a table. Contrast the drafted waves in [[recipe-tower-defense-roguelite]].

## The 3 pillars

Design and cut against these. If a feature serves none, it's out — see
[[process-pillars]].

1. **Systemic story.** Drama emerges from sim × memory, never from a script.
   The storyteller times and casts; it does not write dialogue trees. Guard
   against [[antipattern-fake-choice]] — the grudge must actually alter play.
2. **Personal rivals.** The enemy has a *name, a face, and a because*. If the
   player can't say "that one, because ___," the nemesis has failed. Lean on
   [[world-naming-and-tone]] and [[world-character-design]].
3. **Consequential memory.** Every remembered fact must *show* on the table —
   a scar, a stolen gun turned against you, a taunt that references the real
   event. Memory the player can't perceive is [[antipattern-false-depth]].

## Scope & first playable

Ruthlessly minimal. One colony, **one** recurring named rival, memory that is
*visible*. Prove the loop before you widen the roster.

| Layer | First playable | Deliberately deferred |
|---|---|---|
| Colony | 3 colonists, one defensible room, food + one weapon type | Full needs/mood sim, trading, research |
| Rival | **one** named raider, seeded name + one trait | Faction hierarchy, promotions, betrayal |
| Memory | 3 remembered facts: *wounded you / you wounded them / fled* | Relationship graphs, cross-rival memory |
| Escalation | rival returns stronger, references one past fact on arrival | Multi-rival wars, faction disposition shifts |
| Show | scar sprite + a one-line arrival taunt citing the fact | Cutscenes, portraits, VO |

The one thing the first playable must earn: on the rival's **second** arrival,
the player feels *recognition and dread* — "oh no, it's them." If that beat
doesn't land with one rival and three facts, more content won't save it. Avoid
[[antipattern-content-desert]] by proving the beat, then multiplying rivals.

Determinism is the hard constraint. The memory ledger is state; every roll —
who returns, what they carry, whether they flee — goes through the world's
deterministic RNG so a seed replays a feud identically. A remembered fact is
just [[system-emergent-systems]] data hanging off a colonist/raider id; keep it
in the hashed sim state, keep its render [[pattern-readability]]-clean and
cosmetic. See [[system-save-and-checkpoint]] — the ledger must survive a save,
or the memory is a lie.

## Handoff

A design isn't done until it names its proofs.

- **`docs/VERIFICATION.md`** — the ledger is deterministic: same seed, same
  feud, same taunt on the same tick. Assert on the sim's probe/hash, not on
  pixels. The nemesis is *simulation*, so it must be provable, not vibes.
- **[[system-emergent-systems]]** — verify the emergence: remembered facts
  actually change wave composition and enemy behavior (guard the pillars 1 & 3
  above). If disabling memory produces an identical raid, you built a reskin,
  not a nemesis.

Then generate your own from the mechanic, don't reskin this one — see
[[process-refine-and-handoff]].
