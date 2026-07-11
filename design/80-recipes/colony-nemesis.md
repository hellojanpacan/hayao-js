---
id: recipe-colony-nemesis
title: Colony Nemesis
kind: recipe
tags: [colony-sim, nemesis, emergent, recipe, rimworld]
summary: RimWorld's story-generator colony with Shadow of Mordor's memory — rivals who remember what you did and come back for it.
use-when: You want emergent personal drama in a management sim.
composes-with: [anchor-rimworld, anchor-shadow-of-mordor, system-emergent-systems, genre-management-tycoon, process-the-spine]
anchors: [anchor-rimworld, anchor-shadow-of-mordor]
spine: "A raid is a grudge, not a wave — the enemy remembers, so every raid you survive without ending the rival is written into a ledger that authors a deadlier, more personal return."
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

## The spine

*A raid is a grudge, not a wave — the enemy **remembers**, so every raid you survive
without ending the rival is written into a ledger that authors a deadlier, more
personal return.*

| Part | This game |
|---|---|
| **Objective** | Sustain the colony through escalating raids — keep your named colonists alive |
| **Superpower** | **Repel the raid** — defend, and wound / rout / humiliate the rival who leads it |
| **Scarcity** | Your **losable colonists** (each a named character with a history) **+ the memory ledger itself** — every raider who survives writes down what you did, so a raid *ended short of killing the rival* is spent into a debt that compounds |
| **Obstacle** | The **named nemesis** — returning *in character* per their memory, stronger, citing the last fight; grudges metastasizing into faction wars |
| **Renewal** | The **storyteller-director** reads the ledger and casts the next chapter — *which* rival returns, at what strength, carrying which grudge — so the pressure is a live author, never a table |

## Resonance

Every element traces to the spine — the coherence proof (see [[process-the-spine]]).
Note that death-handling here sits with [[recipe-waterline]]'s survival stance, not
[[recipe-emberfall]]'s retry-mastery: the spine *derives* it, because a loss the
enemy remembers only means something if it is a loss you keep.

| Element | Arrow back to the spine |
|---|---|
| Verb: repel the raid | The single agency — the only way to keep the colony standing is to win the fight in front of you |
| Scarcity: losable named colonists | The stake that makes a grudge *hurt* — the enemy authors its return around who you can't afford to lose |
| Scarcity: the memory ledger accumulates | The load-bearing spend — surviving a raid *short of ending the rival* is written down, so mercy and half-victories are paid for in the next attack |
| **Power creates the problem** | Winning the raid without killing the rival is exactly what breeds a stronger, angrier, better-armed nemesis next season → every defense you survive authors a deadlier one *(passes the gate)* |
| Renewal: the storyteller casts from the ledger ([[system-spawn-directors]]) | Re-poses the same tension each visit — the director doesn't pick "3 tribals," it reads your history and returns the chapter you earned |
| Death-handling: lost colonists stay lost; the rival who beat you swaggers back | Loss must *stick*, or the ledger is a lie — a cheap undo would relieve the grudge and be **dissonant** ([[antipattern-dissonance]]) |
| Setting: a fixed fortress the nemesis comes *to* (Mordor inverted) | Makes the tension physical — you can't stalk the hierarchy away; it walks to your gate carrying its memory |
| Theme: systemic story — drama as sim × memory | The mechanic (the enemy remembers) *is* the meaning (feuds become personal history no one wrote) |
| Feel: recognition-and-dread on the rival's second arrival | The felt payload of the spine — "oh no, it's *them*" is what a remembered raid buys over an anonymous wave |
| Show: scar sprite + arrival taunt citing the real event | Makes the ledger *legible* — memory the player can't perceive is [[antipattern-false-depth]], and an inert grudge would be [[antipattern-decoration]] |
| [[system-emergent-systems]] | The engine of the whole spine — the story is the *output* of a legible sim colliding with the memory ledger, not authored scenes |
| [[system-enemy-ai]]: raiders act in character per memory | The nemesis's memory *changes play* — the one you humiliated fights cautious, the one who beat you swaggers — so the grudge is felt, not displayed |
| [[system-faction-asymmetry]]: disposition shifts with history | Lets a single grudge *metastasize* — the ledger scales the obstacle from one rival into a war, renewing the tension at a larger grain |
| [[pattern-emergence]] | Names what the spine farms — small remembered facts compounding into stories, the tension's renewal source generalized |

No row is decoration and none is dissonant; the gate holds: **the only way to end
this raid is to win it, and winning it without ending the rival is what writes the
next, worse one.**

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
