---
id: mechanic-lock-on
title: Lock-On / Target
kind: mechanic
tags: [combat, camera, targeting, readability]
summary: Bind camera and attacks to one foe — clarity in a crowd at the cost of tunnel vision.
use-when: Melee combat with multiple threats needs legible focus.
composes-with: [system-camera-and-controls, mechanic-combo-string, system-enemy-ai]
anchors: [anchor-dark-souls]
verify-with: docs/VERIFICATION.md
---

**What it is.** Press a button to bind the **camera** and your attack orientation to one chosen enemy. Movement becomes relative to that target; the camera orbits it; strikes home in on it. Press again to release, or flick to switch.

**Player fantasy / why it's fun.** You are the duelist who never loses sight of the one that matters. Lock-on turns a chaotic melee into a readable **duel** — but every foe you ignore is now behind your back.

## The verb
Bind attention to one foe. Everything — strafe, roll, swing, camera — reorients around that single **relationship** until you break it.

## How it feels / why it's fun
- Collapses a noisy fight into a legible 1v1; see [[pattern-readability]].
- Makes strafing and spacing meaningful — you circle a *thing*, not a compass direction.
- Creates the core soulslike tension: focus is safety and blindness at once. See [[pattern-risk-reward]].
- Switching targets under pressure is a skill expression of its own; see [[system-mastery-curve]].

## Tuning levers
| Lever | What it controls | Sane default |
|---|---|---|
| **Lock type** | Soft (camera nudge, aim assist, auto-releases) vs hard (rigid orbit, held) | Hard, with soft fallback when unlocked |
| **Acquire range** | Max distance a foe can be locked | ~15 m / one screen |
| **Break range** | Distance at which lock auto-drops | 1.5× acquire range |
| **Switch input** | Right-stick flick, bumper, or face-toward | Right-stick flick + directional bias |
| **Switch deadzone** | Flick magnitude before target changes | 0.6 stick throw — high, to prevent thrash |
| **Reticle occlusion** | Does lock persist through walls/LOS loss? | Drop after 1.0 s no line-of-sight |
| **Camera lerp** | How fast the camera snaps to the axis | 0.15 s ease — fast enough to feel bound, slow enough to not nauseate |
| **Priority weighting** | What switch picks: nearest, most-hurt, most-dangerous | Angular-nearest to stick direction |

Defaults are a starting duel-feel; retune per encounter density — see [[system-encounter-design]].

## Slots into
- **Genres:** [[genre-soulslike]], [[genre-action-adventure]], [[genre-metroidvania]], [[genre-fighting-game]] (as facing/side-swap).
- **Anchors:** [[anchor-dark-souls]] (the reference implementation, hard lock + break range), [[anchor-shadow-of-mordor]] (lock-on inside a nemesis crowd), [[anchor-hades]] (deliberately *omits* it — twin-stick aim replaces it, worth studying as the negative case).

## Twist seams
- **Lock-on but locking marks YOU as the priority target** *(risk-reward)* — the instant you bind a foe, its allies aggro onto you and it enrages. Focus becomes a loud commitment, not a free safety blanket. Pairs with [[system-enemy-ai]] and [[pattern-risk-reward]].
- **Lock-on but you can only lock what is behind you** *(constraint)* — a rear-view duel. You fight by memory and camera-flip, and facing your target means turning your back on it. Inverts the readability the mechanic normally grants; see [[pattern-readability]].
- **Lock-on but the target chains** *(escalation)* — kill the locked foe and the lock leaps to the next-nearest, building a hit-chain that rewards never releasing. Feeds a [[system-combat-model]] combo economy; see [[pattern-escalation-and-payoff]].

## How it wires to Hayao
- Camera binding is an ordered relationship between the player node and a target node in the scene tree; the orbit axis is derived each frame from their positions — keep it in the deterministic sim, not a wall-clock lerp. See [[system-camera-and-controls]] for the camera-follow patterns.
- Target selection is a **pure query**: given the roster, the player facing, and the stick vector, return one target id by a total ordering (angular distance, then entity id as tiebreak) so switching is deterministic and replayable.
- Study the camera and input labs under `sandboxes/` in isolation before wiring lock into a full fight — one mechanic at a time.
- The reticle, camera, and any lock glow are **cosmetic** view state; the *bound target id* is the only thing gameplay logic reads.

## Fails when…
- **Switch input thrashes.** Too low a deadzone and the target flickers mid-combo. Raise the switch threshold and add angular hysteresis.
- **Tunnel vision has no counter.** If off-screen foes can freely gank you while locked, players stop using it. Give audio/edge telegraphs for the ignored threats — see [[system-telegraphs]].
- **Camera fights the player.** A snap that's too aggressive on target death or LOS loss induces nausea and disorientation; ease it, and hold last-known-axis briefly.
- **It's mandatory but unreadable.** Forcing lock in wide-open crowds without a clear reticle just hides information; see [[antipattern-unreadable-juice]].
- **It removes the fight.** Perfect aim-assist plus auto-strafe can make encounters play themselves — [[antipattern-false-depth]]. Lock should aid orientation, not aim *and* dodge for you.
- **No manual release.** Players must be able to drop lock instantly to reposition; a sticky lock with no clean exit reads as [[antipattern-input-lie]].

## See also
- [[system-combat-model]], [[mechanic-combo-string]], [[mechanic-parry]], [[mechanic-dodge-roll]], [[mechanic-block]] — the moves lock-on frames.
- [[system-boss-design]] — where a single legible target matters most.
- [[system-camera-and-controls]] — the substrate lock-on rides on.
- [[pattern-readability]], [[pattern-risk-reward]] — the two forces it balances.
