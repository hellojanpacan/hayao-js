---
id: mechanic-parry
title: Parry / Riposte
kind: mechanic
tags: [combat, timing, defense, reads]
summary: A tight defensive window that flips offense to you — the read that turns the best attack into an opening.
use-when: Deliberate combat wants a high-skill, high-reward defensive answer.
composes-with: [mechanic-block, mechanic-deflect, system-telegraphs]
anchors: [anchor-into-the-breach]
verify-with: design/FUN.md#4-·-action-adventure
---

**What it is.** A brief defensive window you open on a button, timed to the instant an attack lands. Hit it and the exchange flips: the attacker is staggered and you get a free, oversized **riposte**. Miss it and you eat the hit — often worse than if you'd never tried.

**Player fantasy / why it's fun.** Reading the killing blow and answering it. The parry is the moment defense becomes offense in a single frame — you didn't survive the attack, you *invited* it. Mastery reads as calm: the better player looks like they're doing less.

## The verb
Watch the tell → press parry so your window overlaps the moment of impact → on success, the attacker recoils into a punishable state and you land a **riposte**. It is not "hold to be safe" (that's [[mechanic-block]]); it is a **committed spike** of safety you place on a read.

## How it feels / why it's fun
- **The read, not the reflex.** A fair parry is answered by anticipation more than twitch — you commit *before* certainty. That is the whole [[pattern-risk-reward]] engine of the mechanic. See [[system-counter-systems]].
- **Legibility is the contract.** A parry is only fair if the tell is. The window is a promise the enemy's wind-up must honor. Design the wind-up before the window; that's [[system-telegraphs]] and [[pattern-readability]].
- **Asymmetric payout.** Success should feel enormous and failure should sting — the gap is where the tension lives. A parry that's merely "block, but slightly better" has no pull. Cf. [[antipattern-false-depth]].
- **The frozen beat.** On success, the whole world catches for a few frames — the clang, the hitstop, the flash. That contrast is the reward's flavor; choreograph it per [[pattern-juice-choreography]].

## Tuning levers
| Lever | What it changes | Sane default |
|---|---|---|
| **Window size** | Frames counted as a parry | 3–8 frames (Sekiro ~ tight; Souls' parry ~ generous but delayed) |
| **Startup** | Frames before the window opens | 1–3; small enough that the read, not lag, decides |
| **Whiff cost** | Penalty for a mistimed parry | full damage + a **recovery** you can be punished in (0.2–0.5 s) |
| **Riposte reward** | Payoff on success | 2–5× a normal hit, or a guaranteed critical / execution |
| **Stagger duration** | How long the attacker is open | long enough for one telegraphed riposte, not a free combo |
| **Chip on success** | Damage you still take | 0 (clean) → small (keeps blocking relevant) |
| **Coverage** | What is parryable | melee only, or "everything with a tell"; unparryable = a *different-colored* tell |
| **Buffer** | Input forgiveness at the edges | ~3 frames of leniency, granted via [[system-grace]] |
| **Meter / posture** | Whether parries build toward a break | optional: successful parries fill an enemy **posture** bar that breaks into an execution |

Two archetypes fall out of this table:
- **Deflect-parry** — tight window, low whiff cost, tuned so the *rhythm* of an exchange is the fight; you can be aggressive because failure is survivable. That's [[mechanic-deflect]] (Sekiro).
- **Commit-parry** — generous but scary; a big riposte gated behind a real punish-on-whiff. The parry is a rare, decisive read, not a beat you hold (Dark Souls, Street Fighter's parry lineage).

Decide which one you're building and tune the **whiff cost** and **window** as a matched pair — a tight window with a brutal whiff is masochism; a wide window with no penalty is a free button.

## Slots into
- Genres: [[genre-soulslike]] and [[genre-action-adventure]] (the signature read in [[system-combat-model]]), [[genre-fighting-game]] (the mind-game layer), [[genre-rhythm]] and [[genre-precision-platformer]] (parry-as-beat), even [[genre-tactics]] where a parry is a *predicted* interrupt.
- Anchors: [[anchor-dark-souls]] (commit-parry into a critical), [[anchor-street-fighter]] (the parry as spacing mind-game), [[anchor-cuphead]] (the pink-parry as a rhythmic reset), [[anchor-into-the-breach]] (reads-as-parry: you counter the *telegraphed* attack a turn ahead — the same fantasy in a turn-based skin).
- Pairs with [[mechanic-block]] (the safe floor a parry is the spike above), [[mechanic-dodge-roll]] (the escape alternative — offer both, let the player choose their answer), [[mechanic-lock-on]] (parries want a committed target), [[mechanic-charge-attack]] as the riposte payload.
- Systems: [[system-boss-design]] leans on it for [[pattern-pacing-and-tension]]; [[system-enemy-archetypes]] must earn parryability with a clean wind-up.

## Twist seams
- **Parry but a perfect one rewinds the exchange one beat** *(mechanic-swap)* — a frame-perfect parry doesn't just block, it *un-happens* the attack: both fighters snap back to the position they held one beat prior, and the enemy's move is spent. The fantasy shifts from "counter" to "veto." Now the read is layered — do you parry to punish, or parry to erase and reset spacing? Kin to [[mechanic-rewind]]; verify the state snapshot is deterministic.
- **Parry but you can only parry the color you currently are** *(constraint)* — you carry a color; attacks carry a color; a parry only lands when they match, and you swap your color on a separate input (Ikaruga's polarity, made defensive). The window is no longer the only variable — *are you the right state* is. This forces color-management under pressure and turns an incoming barrage into a legible pattern-read. See [[system-status-effects]].
- **Parry but success is a shared resource you spend to interrupt** *(resource-swap)* — parries don't punish directly; they fill a **counter** meter you bank and later spend to cancel an enemy's unblockable. Defense becomes a savings account, and the tension is *when to cash it*. Frames the read as economy — [[system-resource-loops]].

## How it wires to Hayao
- Model the window as **explicit sim state**: a small integer counter of remaining active frames, opened on the input tick and decremented each fixed step. Hit resolution checks "is a parry window active at the moment of impact?" — pure, ordered, deterministic. It belongs in hashed state.
- Tie the window to the enemy's attack timeline, which is *also* sim state — the tell, the active frame, the recovery. The parry is fair because both clocks advance on the same fixed timestep and a replay reproduces the exact overlap. Study an isolated timing/telegraph lab under `sandboxes/` before wiring a full encounter.
- The **clang, the flash, the hitstop, the slow-mo** on success are pure view — tag those nodes `cosmetic` so they stay out of `world.hash()`. Design the feel here; prove the readability of the tell and the punch of the riposte in `design/JUICE.md`, and prove the encounter is winnable-by-read in `design/FUN.md`.
- If parries build **posture** toward an execution, that meter is sim state too; the *bar you draw* is cosmetic, the number it reflects is not.

## Fails when…
- **The tell is unreadable.** No legible wind-up → the parry is a coin flip, and a coin flip you get punished for is [[antipattern-guess-the-designer]]. The window is only as fair as the telegraph.
- **Whiff has no cost.** Parry becomes the always-on optimal answer; blocking and dodging die. Give it a real recovery you can be punished in, or you've built [[antipattern-boring-optimal]].
- **The reward is stingy.** A riposte that barely out-damages a normal hit means nobody takes the risk — the mechanic is decoration. That's [[antipattern-false-depth]].
- **Coverage is a lie.** If some attacks are unparryable but look identical to parryable ones, you've turned a read into a memory-test. Unparryable attacks need a *different* tell (color, sound, animation) — a fair "don't parry this" signal.
- **The window scales with framerate.** Count active frames on the fixed step, not real time — a framerate-dependent window breaks muscle memory and determinism both. Cf. [[antipattern-input-lie]].
- **Every enemy is parry-bait.** If parrying trivializes all combat, you've deleted the reason to ever [[mechanic-dodge-roll]] or [[mechanic-block]]. Mix in un-parryable pressure (grabs, delayed swings, multi-hits) so the read stays a *choice*.

## See also
- [[mechanic-deflect]] — the tight, rhythmic sibling; when the *exchange tempo* is the fight, build that.
- [[mechanic-block]] — the safe floor the parry is the risky spike above; ship them together.
- [[mechanic-dodge-roll]] — the escape answer; offering both parry and dodge is what makes a defensive read a decision.
- [[system-telegraphs]] & [[pattern-readability]] — the tell is the mechanic; design it first.
- [[system-counter-systems]] & [[pattern-risk-reward]] — the payout math that makes the read worth committing.
- [[system-boss-design]] — where a well-tuned parry becomes the shape of a whole fight.
