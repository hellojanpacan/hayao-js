---
id: mechanic-swing
title: Pendulum Swing
kind: mechanic
tags: [physics, momentum, traversal, rope]
summary: Convert a tether into an arc — momentum-in, momentum-out; the release timing is the skill.
use-when: Traversal or combat wants physical, trust-the-physics motion.
composes-with: [mechanic-grapple, pattern-mastery-and-flow, genre-physics-arcade]
verify-with: design/FUN.md#19-·-physics-arcade
---

**What it is.** A tether pins the player to an anchor; gravity turns the leash into a **pendulum**. Fire the rope, ride the arc, and release at the apex to launch. The swing is passive — the skill is *when you let go*.

**Player fantasy / why it's fun.** You are not moving the character; you are *steering physics you don't fully control*. The satisfaction is a **conversation with momentum** — you commit to an arc, read it, and cash it out at exactly the right frame. Spider-Man, Umihara Kawase, Worms' ninja rope: all deliver the same thrill of borrowed velocity spent well.

## The verb
**Attach → fall into arc → release.** The player picks an anchor and a moment; the sim owns everything between.

## How it feels / why it's fun
- **Delayed agency.** Input is sparse (attach, reel, drop) but consequence is huge. That gap is the flow. See [[pattern-mastery-and-flow]].
- **Legible momentum.** A good swing telegraphs its own exit velocity — the player *sees* where the arc will fling them before committing. This is [[pattern-readability]] applied to motion.
- **Risk you author yourself.** Longer rope = faster apex = more distance but less control. The player sets their own stakes every swing. See [[pattern-risk-reward]].
- **The apex is the reward.** Nailing a release that carries into a second swing with no ground-touch is the mastery beat. Chain them and you get [[pattern-escalation-and-payoff]].

## Tuning levers
| Lever | What it does | Sane default | Push it |
| --- | --- | --- | --- |
| **Rope length** | Arc radius; longer = wider, faster apex | 4–6 player-heights | Variable (reel in/out) = the whole depth of the mechanic |
| **Release-velocity carry** | Fraction of tangent speed kept on drop | 1.0 (full carry) | <1.0 punishes; >1.0 (boost) is arcadey and forgiving |
| **Gravity** | How hard the arc pulls down | Match world g | Lower g = floatier, more forgiving reads |
| **Attach window** | Range/aim assist to grab an anchor | Generous cone | Tight = precision; loose = flow-first |
| **Reel speed** | How fast rope shortens (raises apex) | Zero (fixed rope) is fine to start | Non-zero unlocks pumping and vertical gain |
| **Air control post-release** | Drift while airborne | Small nudge | Large = platformer; none = pure ballistics |
| **Anchor cooldown** | Reuse delay per anchor | None | Cooldown forces route variety |

Start with a **fixed-length rope and full velocity carry** — that alone is a complete, teachable toy. Add reeling only once the base arc reads clean.

## Why determinism is non-negotiable
The swing is a *contract*: the player commits to an arc on faith that the same input yields the same arc every time. If the physics wobble frame-to-frame, the release timing skill evaporates and the mechanic feels like a slot machine — see [[antipattern-input-lie]] and [[pattern-fairness-and-trust]]. Run the integrator on a **fixed timestep** off a deterministic clock (never wall-time), and let the player build muscle memory against a stable arc. Speedruns, ghost replays, and level proofs all depend on this. The verification bar lives in this module's `verify-with` target (design/FUN.md#19-·-physics-arcade); design *to* it, don't restate it.

## Slots into
- **Genres:** [[genre-physics-arcade]] (native home), [[genre-metroidvania]] (grapple-swing as a gated traversal verb), [[genre-precision-platformer]] (swing as a high-skill movement option), [[genre-action-adventure]] (Spider-Man-style city traversal), [[genre-racing]] (rope as a cornering tool).
- **Anchors:** [[anchor-celeste]] (release-timing as expressive movement), [[anchor-katamari]] (trust-the-physics motion feel), [[anchor-cuphead]] (tight arcs against precise hazards).

## Twist seams
- **Swing but the anchor is a live enemy that reacts** (*perspective*): the pivot is a flying foe that jerks away, dives, or tries to shake you loose — your arc is now a negotiation with an [[system-enemy-ai]] agent, not a fixed nail. Combat and traversal fuse; see [[system-encounter-design]].
- **Swing but each rope snaps after one arc** (*constraint*): one attach = one arc, then the rope is spent. Every anchor becomes a consumable, and a room becomes a route-planning puzzle of which pivots to spend and in what order — flow bends toward [[system-map-and-navigation]] and [[pattern-pacing-and-tension]].
- **Swing but you carry weight that alters the arc** (*resource*): a payload changes mass, so the pendulum period and exit velocity shift — heavier cargo = slower, deeper arcs. Ties the traversal verb to an [[system-economy]] of what you're hauling.

## How it wires to Hayao
- Model the tether as a **distance constraint** to an anchor point and integrate under gravity on a fixed timestep. On release, hand the body its current tangent velocity — that carry *is* the mechanic.
- Study a single-mechanic physics lab in `sandboxes/` (the physics lab) to see the integrator and constraint in isolation before wiring it into a game — that isolation is exactly what the doctrine asks for.
- The rope render is pure view: draw it as a `cosmetic` node so it never enters the world hash — the anchor position and body state are the only things logic reads. See [[process-composition]] for the state/view split.
- Anchors are level data; author them as fixed points and let a solver prove a traversable path exists before shipping the level.

## Fails when…
- **The arc is unreadable.** If the player can't predict exit velocity, release becomes a guess — [[antipattern-guess-the-designer]] on a physics budget. Telegraph the tangent.
- **Physics drift.** Non-deterministic integration breaks the timing contract; the skill ceiling collapses. See [[antipattern-input-lie]].
- **Air control overrides the arc.** Give too much post-release drift and momentum stops mattering — the swing degrades into a jump with extra steps ([[antipattern-false-depth]]).
- **Anchors everywhere.** Blanket the level in pivots and there's no route to read; density should be authored, not sprayed.
- **Free reeling with no cost.** Infinite reel-in lets players cheese vertical gain and trivializes arcs — meter it or gate it.
- **It's the only verb.** A whole game of nothing but swinging fatigues; interleave with ground movement and let the swing be the *highlight*, per [[pattern-pacing-and-tension]].

## See also
- [[mechanic-grapple]] — the attach half; swing is what grapple does once gravity takes over.
- [[mechanic-glide]] · [[mechanic-double-jump]] · [[mechanic-wall-run]] — momentum-carrying traversal verbs that chain into and out of a swing.
- [[mechanic-dash]] — a common release-into-dash combo for arc extension.
- [[pattern-mastery-and-flow]] · [[pattern-risk-reward]] · [[pattern-readability]] — the feel spine of a good swing.
- [[genre-physics-arcade]] · [[genre-metroidvania]] — where it lives.
- [[process-the-twist]] — for spinning the seams above into a pitch.
