---
id: genre-stealth
title: Stealth
kind: genre
tags: [stealth, vision-cone, patrol, noise, plan, heist, guard, route]
summary: Plannable danger — vision cones and noise you can read, so the tension is the gap between a route you can see and a route you can execute.
use-when: Designing a game where the fun is reading enemy perception and routing through it, not out-shooting it.
composes-with: [system-enemy-ai, system-telegraphs, system-encounter-design, system-save-and-checkpoint, system-onboarding, system-difficulty-and-dda]
anchors: [anchor-shadow-of-mordor]
verify-with: design/FUN.md#5--stealth
---

# Stealth

**What it is.** Guards with legible **vision cones** and **noise** radii patrol a
space. You are weak in the open and safe in the seams. The game is a live routing
puzzle: read perception, find the gap, move through it, don't be seen.

**Player fantasy / why it's fun.** *"I threaded the needle."* The held breath of
slipping behind a guard whose cone you *watched*, timing your dash to the exact
beat his back turns. Power fantasy inverted: you win by being unseen, and the
world is more dangerous than you.

## Pillars

1. **Perception is legible.** Cones, hearing radii, and alert states are drawn or
   inferable. The player plans against *visible* danger — a threat you can't read
   is a cheap death, not tension (FUN.md §5 demands both-ways affordance proofs).
2. **Concealment actually conceals.** Shadows hide, cover blocks sight, a distraction
   pulls a gaze — reliably, through a full patrol loop. If hiding is a coin flip,
   planning is pointless (pillar 1's dual).
3. **Exposure is punished fast.** Being seen escalates quickly — an alert, a hunt,
   a fail-or-flee. The knife-edge between hidden and caught is where the genre
   lives.

## The loop stack

| Scale | The loop |
|---|---|
| **Moment** | Watch a cone sweep; time a move through the gap it leaves. |
| **Encounter** | Cross one guarded room: read the patrol, find the safe pocket, chain single-guard windows. |
| **Session** | A level/heist: string encounters into a route to an objective and back out. |
| **Meta** | Optional ghost (0-alert) runs, alternate routes, tools that reshape perception — mastery of the space. |

## Essential systems

| System | Why it's needed |
|---|---|
| [[system-enemy-ai]] | Patrols, gaze, alert-state escalation, aggro/threat — readable, beatable minds; the danger *is* the AI. |
| [[system-telegraphs]] | The alert ramp (suspicion → search → chase) must be telegraphed so the player can react before it's terminal. |
| [[system-encounter-design]] | Composing cones and pockets; the safe-pocket-at-midpoint and chained-single-guard rules live here. |
| [[system-save-and-checkpoint]] | Getting caught should rewind to a fair, recent checkpoint — long re-stealth is punishment tax, not tension. |
| [[system-onboarding]] | Teach cone-reading and noise in a no-fail room before the first real guard. |
| [[system-difficulty-and-dda]] | Difficulty = cone density and window tightness; assist options widen windows or slow patrols. |

## Content & difficulty model

- **Balance on cone-shadow duration, not guard distance.** The real constraint is
  *how long* the safe gap in a guard's sweep stays open along your path — the chord
  of shadow, not raw spacing (FUN.md §5). Compute it against the actual route.
- **A safe pocket at every long traversal's midpoint.** No open crossing longer
  than a player can hold under one window; give a place to breathe (FUN.md §5).
- **Chain single-guard windows; never require joint phases.** Waiting for two
  patrols to align by chance explodes combinatorially into unfair wait times —
  design so each step depends on *one* guard's timing (FUN.md §5).
- **Prove affordances both ways.** Exposure punished fast AND hiding conceals
  through a full loop. "The bot got through" proves neither on its own — you need
  the punished-exposure and concealment-holds assertions.

Reference wiring: [`examples/veilstep`](../../examples/veilstep) — the canonical
stealth sim: cones drawn from `world.state`, the heist-bot 0-alarm run plus the
punished-exposure and concealment-holds proofs. Grep [`docs/API.md`](../../docs/API.md)
for the raycast/FOV and audio primitives.

## Signature-mechanic seeds

"X but Y" ([[process-the-twist]]) — bend *what perceives you* or *what you control*.

- **Stealth but you control the guards' distractions, not the thief** — you route
  an AI thief by pulling gazes. (perspective)
- **Stealth but light is your resource** — you carry the only lamp; every step lit
  is a step seen, so you ration your own visibility. (constraint — pairs with survival-horror light)
- **Stealth but the guards remember and adapt** — patrol a room twice the same way
  and they pre-empt it. (mechanic-swap — see [[anchor-shadow-of-mordor]])
- **Stealth but sound is the only sense** — no cones; guards are blind and you hide
  in silence, routing by noise alone. (constraint)
- **Stealth but you're the guard hunting an invisible intruder** — read *their*
  noise, cut off *their* route. (perspective)

## Common pitfalls

- **Illegible perception.** Cones you can't see or infer make stealth a save-scum
  lottery. Draw the danger.
- **Concealment that doesn't.** If shadow only *sometimes* hides, the player stops
  trusting the map and starts fleeing — the loop collapses. Prove it holds a full
  loop.
- **Joint-phase gates.** Requiring two patrols to align is an unfair wait. Chain
  single-guard windows.
- **Pocketless marathons.** A long open crossing with no midpoint refuge is a
  memorisation gauntlet, not a plan.
- **Combat as the out.** If fighting your way through is easier than sneaking, it's
  a shooter with cones. Make exposure genuinely costly.

## Anchors

- [[anchor-shadow-of-mordor]] — systemic guard memory; enemies that adapt to your
  routes turn stealth into an evolving rivalry.

## Verify

Prove it with **[FUN.md §5 · Stealth](../FUN.md#5--stealth)** —
heist bot 0-alarm run + a punished-exposure assertion + a concealment-holds
assertion, balanced on cone-shadow duration with a midpoint pocket per long
traversal. Design the plannable danger here; prove both affordances there.

## Composes with

- [[system-enemy-ai]] — readable, beatable patrol minds are the danger.
- [[pattern-pacing-and-tension]] — the hidden/caught knife-edge is a tension curve.
- [[system-encounter-design]] — cones and pockets composed into a route.

## See also

- [`examples/veilstep`](../../examples/veilstep) — the reference stealth sim + proofs.
- [`design/FUN.md §5`](../FUN.md#5--stealth) — the proof playbook.
