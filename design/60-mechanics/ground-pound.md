---
id: mechanic-ground-pound
title: Ground Pound / Slam
kind: mechanic
tags: [combat, platformer, impact, area]
summary: A committed downward strike — the emphatic verb; height buys power, landing buys a shockwave.
use-when: You want a high-commitment area attack or a break-through-floor traversal beat.
composes-with: [mechanic-charge-attack, mechanic-bounce, system-telegraphs]
verify-with: design/JUICE.md
---

**What it is.** The player halts, snaps downward, and hits the ground hard enough to
matter — damage, a shockwave, a broken floor. The airtime before impact IS the wind-up;
the impact IS the payoff.

**Player fantasy / why it's fun.** You are heavy. You spend altitude and you buy
consequence. It's the one attack that reads as a *decision* — you left the ground, you
can't take it back, and the whole crowd below knows what's coming.

## The verb
Rise, commit, fall. The player trades mobility and horizontal control for a single
concentrated hit at a point they aimed for on the way up.

## How it feels / why it's fun
- **Weight.** The snap-to-fall and the freeze-frame on contact sell mass. Cheap slams float; good slams *drop*.
- **Commitment.** Once you're pounding you've spent your air options. That risk is the whole flavor — see [[pattern-risk-reward]].
- **The clearing.** A radial shockwave that resolves a crowd in one beat is deeply satisfying. It's the melee answer to a screen-clear bomb.

## Tuning levers
| Lever | What it controls | Sane default |
|---|---|---|
| **Charge model** | Flat power, or scale with fall height / hold time | Scale with height, capped at ~2× |
| **Hover freeze** | Beat of hang-time before the drop (readability + intent) | 0.10–0.20 s |
| **Fall speed** | How fast the drop reads as *heavy* | 1.5–2× normal gravity |
| **Recovery lag** | Vulnerable frames after landing — the cost | 0.25–0.45 s |
| **Shockwave radius** | Area of the landing effect | 1.5–3× character width |
| **Cancel window** | Can the fall be aborted? (usually no) | None — commitment is the point |
| **Floor-break** | Does it destroy tiles / open traversal? | Only on tagged tiles |

Two levers carry the design: **charge-by-height** (the reward you earned in the air) and
**recovery lag** (the price you pay for missing). Tune those against each other first; the
rest is polish.

## Slots into
- **Genres:** [[genre-precision-platformer]] (traversal + break-floor beats), [[genre-metroidvania]] (a gated pound that opens new floors), [[genre-action-adventure]] and [[genre-soulslike]] (a heavy, punishable finisher), [[genre-horde-survival]] and [[genre-bullet-hell]] (a crowd-clear with a cooldown baked into the recovery).
- **Anchors:** [[anchor-dead-cells]] (ground-slam as a committed hitbox), [[anchor-hades]] (Poseidon/heavy casts read like area slams), [[anchor-vampire-survivors]] (radial area pressure), [[anchor-celeste]] and [[anchor-braid]] as the reference for *how much air-control you're allowed to trade away*.

## Twist seams
- **Slam but it launches you back up for a combo** (structure) — impact converts downward momentum into a bounce, so a clean pound feeds a [[mechanic-double-jump]] or [[mechanic-combo-string]] instead of ending the beat. See [[mechanic-bounce]] for the momentum return.
- **Ground pound but it plants a seed that grows into a platform** (theme) — the slam is *constructive*, not destructive: each landing spawns terrain, turning an attack into level authorship. Pairs with [[genre-puzzle-platformer]].
- **Pound but the shockwave is the real attack** (structure) — the fall does nothing; only the expanding ring damages, so aim becomes *timing the radius*, not landing on a head. Leans on [[system-telegraphs]] for both sides to read the ring.

## How it wires to Hayao
- The airtime-to-impact arc is a downward velocity you clamp on the way down; the landing test is a contact against the floor collider. Read the physics parts in the platformer sandbox lab (`sandboxes/` — the single-mechanic labs, not a whole game) before wiring anything.
- The shockwave is **pure view** — a radial cosmetic node, not part of the sim state. The *hitbox* that clears the crowd is simulation and must be deterministic (drive any spread/knock through the deterministic RNG, never a wall clock). Keep the ring flagged cosmetic so it stays out of the world hash.
- Freeze-frame, screen-shake, and dust are all cosmetic-side; choreograph them per [[pattern-juice-choreography]]. Do the impact-feel work against `design/JUICE.md` — that's where the freeze/shake/particle timing gets proven, not here.
- For the crowd-clear hitbox, model contacts in a fixed iteration order so the same slam resolves the same enemies every run (an invariant, not a nicety).

## Fails when…
- **The commitment is fake.** If you can steer freely mid-fall or cancel on a whim, it's just a fast attack wearing a costume — see [[antipattern-false-depth]]. Commitment is the mechanic; don't refund it.
- **Recovery is invisible.** No punish window means it's strictly the best button and every other attack rots. That's [[antipattern-boring-optimal]]. The lag is a *feature*.
- **The shockwave doesn't read.** A crowd-clear the player can't parse is [[antipattern-unreadable-juice]] — big flash, no information. Telegraph the radius and the threatened zone; readability first ([[pattern-readability]]).
- **It's the answer to everything.** A pound that trivializes traversal *and* crowds *and* bosses flattens the kit into [[antipattern-feature-soup]]. Give it one job and a cost.
- **The input lies.** If contact damage lands before the visible impact frame, players feel robbed — [[antipattern-input-lie]]. Hitbox and impact frame fire together.

## See also
- Composes with: [[mechanic-charge-attack]] (charge-by-hold vs. charge-by-height are siblings), [[mechanic-bounce]] (the launch-back seam), [[system-telegraphs]] (make the ring legible).
- Neighbors in the kit: [[mechanic-dash]], [[mechanic-double-jump]], [[mechanic-parry]], [[mechanic-throw]].
- Design context: [[pattern-risk-reward]], [[pattern-juice-choreography]], [[system-combat-model]], [[system-encounter-design]].
- Process: [[process-the-twist]] for pushing the two seams above further.
