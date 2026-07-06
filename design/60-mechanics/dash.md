---
id: mechanic-dash
title: Dash
kind: mechanic
tags: [movement, burst, i-frames, platformer, combat]
summary: A short burst of directional speed — the escape/approach verb; feel lives in windup, distance, and cooldown.
use-when: Movement or combat needs an expressive escape/approach beat with a rechargeable cost.
composes-with: [mechanic-dodge-roll, system-grace, pattern-mastery-and-flow]
verify-with: docs/JUICE.md
---

**What it is.** A short, fixed-distance burst of directional speed on a button. It is the comma in a movement sentence — the beat that turns "run, jump" into "run, *dash*, jump."

**Player fantasy / why it's fun.** Instant agency. One press and the gap closes or the danger passes. The dash is the smallest expressive verb that still feels like a decision: you spent it *here*, not there.

## The verb
Press dash → the character snaps to a fixed speed in a chosen direction for a short window, then hands control back. The magic is that it is **discrete**: it isn't "hold to go fast," it's a committed unit you either have or don't.

## How it feels / why it's fun
- **Commitment.** A dash locks your vector for its duration. That short loss of steering is the price — and the reason a well-placed one feels earned. See [[pattern-risk-reward]].
- **Punctuation.** It reads as a *snap* against the smooth curve of walking. Contrast is the feel; a mushy dash is no dash. Choreograph the snap per [[pattern-juice-choreography]].
- **A resource, not a toggle.** The whole game emerges once the dash can *run out*. Distance is the budget; **lockout** (cooldown or a spend-and-refresh rule) is the rhythm. See [[system-resource-loops]].

## Tuning levers
| Lever | What it changes | Sane default |
|---|---|---|
| **Distance** | How far one dash carries | 2.5–4 body-widths (fixed, not speed-integrated) |
| **Duration** | How long steering is locked | 0.10–0.18 s |
| **Windup** | Startup before the burst | 0 for movement-feel; 2–4 frames if it must be readable/punishable |
| **Cooldown** | Time before you can dash again | 0.3–0.8 s ground; often longer in air |
| **Charges** | Dashes bankable at once | 1 (add a 2nd as an unlock, not a baseline) |
| **Refresh rule** | What refills the dash | Touch ground (Celeste); on kill (Hades); on timer (most) |
| **I-frames** | Invulnerable window inside the dash | none, OR ~60–80% of duration if it's a defensive tool |
| **Momentum carry** | Speed kept after the dash ends | 0 (clean stop) to full (chains into jumps) |
| **Buffer / coyote** | Input forgiveness at edges | buffer the press ~5 frames; grant per [[system-grace]] |

Two archetypes fall straight out of this table:
- **Pure-move dash** — no i-frames, refresh on ground, tuned for traversal and puzzle geometry. The dash *is* the platforming (Celeste).
- **I-frame dash** — invulnerable window, cooldown-gated, tuned against attacks. Now it's defense; the design conversation shifts to telegraph-reading. That's really [[mechanic-dodge-roll]] wearing a dash's clothes — decide which one you're building and don't blur them.

## Air vs ground
The interesting decisions live in the air.
- **Ground dash** is cheap and repeatable — a movement seasoning.
- **Air dash** is the scarce one. Gate it: usually **one per airtime**, refunded on landing. This is what makes [[mechanic-double-jump]] and air-dash *stack into* a traversal grammar instead of trivializing gravity.
- **Refresh-on-ground** turns floors into commas and gaps into sentences. It is the single rule that makes Celeste's dash a puzzle input rather than a mobility stat.
- Let dashes **cancel** the tail of a jump or a fall, and carry momentum, and you have a combo-able movement kit — the seam into [[pattern-mastery-and-flow]].

## Slots into
- Genres: [[genre-precision-platformer]] (the load-bearing verb), [[genre-metroidvania]] (a gated traversal unlock), [[genre-roguelike]] and [[genre-bullet-hell]] (the i-frame variant), [[genre-action-adventure]] and [[genre-soulslike]] (repositioning in [[system-combat-model]]).
- Anchors: [[anchor-celeste]] (refresh-on-ground, pure-move), [[anchor-hades]] (dash-on-cooldown with an i-frame window, dash-strike), [[anchor-dead-cells]] and [[anchor-nuclear-throne]] (dodge as tempo).
- Pairs with [[mechanic-wall-jump]], [[mechanic-glide]], [[mechanic-grapple]] to build a movement vocabulary; with [[mechanic-charge-attack]] and [[mechanic-combo-string]] as a dash-cancel in combat.

## Twist seams
- **Celeste but the dash is a paint-stroke that stains what it crosses** *(mechanic-swap)* — the traversal verb becomes a mark-making verb: stained tiles change state (solidify, ignite, become safe). Now every dash is also a level edit, and the puzzle is *route as brushwork*.
- **Dash but it swaps your position with the nearest enemy** *(perspective)* — reframes escape as *trade*. You don't leave the danger, you relocate it; approach and escape become the same input, and enemy placement becomes your movement network. Kin to [[mechanic-teleport]] and [[mechanic-possess]].
- **Dash but the distance is spent from a shared meter you also attack with** *(resource-swap)* — mobility and offense draw the same pool, forcing the [[pattern-risk-reward]] question every second. See [[system-status-effects]] for meter framing.

## How it wires to Hayao
- Model the dash as **explicit state**: a direction, a remaining-duration counter, a cooldown timer, a charge count — all part of sim state, ticked at fixed step so replays match. Keep it out of frame-rate.
- Drive the burst from your fixed-timestep movement integrator, not from real time; the burst is a velocity override for N ticks. Study a single-mechanic movement lab under `sandboxes/` for the isolated version before wiring it into a game.
- The **snap** (screen-shake, trail, freeze-frame, whoosh) is pure view — tag those nodes `cosmetic` so they never enter `world.hash()`. Design the feel here; prove the readability and the snap in `docs/JUICE.md`.
- I-frames are a *sim* flag (they change hit resolution), so they DO belong in hashed state — don't confuse them with the cosmetic flash that signals them.

## Fails when…
- **Cooldown is invisible.** Players spam dash into the wall. Show the recharge — a meter, a color, a chime — or it's an [[antipattern-input-lie]].
- **It's strictly better than walking.** Zero cost, infinite charges → nobody ever walks, and the verb collapses into "faster." Give it a budget or a lockout. Cf. [[antipattern-boring-optimal]].
- **The i-frame dash and the move dash are the same button with muddled tuning** — neither escape nor traversal feels crisp. Pick a lane.
- **Distance scales with framerate or speed.** Fixed distance is the contract; a variable dash breaks muscle memory and determinism both.
- **Air-dash isn't gated.** Infinite air dashes delete platforming; gravity stops mattering.
- **The burst has no snap.** No contrast against walking → it reads as a small speed buff, not a verb. That's [[antipattern-unreadable-juice]] territory.

## See also
- [[mechanic-dodge-roll]] — the defensive sibling; when i-frames dominate, build that instead.
- [[mechanic-teleport]], [[mechanic-double-jump]], [[mechanic-glide]], [[mechanic-wall-jump]] — the neighbors in a movement kit.
- [[system-grace]] — buffer/coyote so a mistimed dash still feels fair.
- [[pattern-mastery-and-flow]] — dash-cancel and momentum-carry are where mastery lives.
- [[system-combat-model]] — where the dash becomes reposition-and-strike.
