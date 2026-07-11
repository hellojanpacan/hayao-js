---
id: recipe-one-button-boss-rush
title: One-Button Boss Rush
kind: recipe
tags: [boss-rush, one-button, constraint, recipe, accessible]
summary: Cuphead's pattern-mastery bosses reduced to a single input — all depth in timing, none in the controller.
use-when: You want maximal challenge/spectacle from minimal input (accessibility or js13k).
composes-with: [anchor-cuphead, system-boss-design, system-telegraphs, process-the-twist, process-the-spine]
anchors: [anchor-cuphead, anchor-peggle]
spine: "One button is your whole vocabulary against a boss that telegraphs, so every press commits you out of the answer the next attack demands — timing is the only resource."
verify-with: design/FUN.md#7-·-bullet-hell
---

**What it is.** A gauntlet of pattern-mastery bosses — Cuphead's memorize-and-execute fights — collapsed onto a **single button**. Depth lives in *when* you press, never in *what* you press.

**Player fantasy / why it's fun.** "I beat that with one button." Every death was legible, every win was earned by reading the boss, not by finger gymnastics. The controller vanishes; the fight is all attention.

## The brief

**Cuphead but one button** (constraint twist). Strip the input surface to the bone and force all the difficulty into telegraph-reading and timing. The spectacle stays; the dexterity tax disappears.

## The spine

*One button is your whole vocabulary against a boss that telegraphs, so every press
commits you out of the answer the next attack demands — timing is the only resource.*

| Part | This game |
|---|---|
| **Objective** | Survive and beat a 3-phase boss — read every attack, answer each one right |
| **Superpower** | The **one honest button**: tap = dodge the current window, hold-and-release = charge the riposte |
| **Scarcity** | The **single action-channel** — one button, one thing at a time — plus the **commitment window** each press locks you into (a launched dodge or a charging hold can't be recalled) |
| **Obstacle** | The boss's telegraphed attacks on a learnable clock — and its *counter*, provoked by the very riposte you just committed |
| **Renewal** | Each phase adds one attack or speeds the clock; each boss in the rush re-poses the read against a new pattern set |

## Resonance

Every element traces to the spine — the coherence proof (see [[process-the-spine]]).
Note the death-handling is [[recipe-emberfall]]'s retry-mastery answer, not
[[recipe-waterline]]'s stinging loss: the spine *derives* it.

| Element | Arrow back to the spine |
|---|---|
| Verb: one context-sensitive button (tap / hold) | The single agency; two meanings, but only ever *one press at a time* — the whole scarcity |
| **Power creates the problem** | Pressing to attack spends the same button you'd need to dodge the counter your riposte just provoked → answering one threat commits you out of the next *(passes the gate)* |
| Scarcity: single action-channel + commitment window | With one channel and no cancel, *when* to spend the press is the entire decision — the toy becomes a trade ([[pattern-meaningful-choice]]) |
| Telegraphs on a fixed, learnable clock | The tell is what makes one-button timing *fair* — read the wind-up or the single press is a coin-flip ([[system-telegraphs]], [[pattern-readability]]) |
| Renewal: 3-phase escalation, then a rush of bosses | Re-poses "read and commit in one channel" against a fresh pattern every beat ([[system-boss-design]], [[pattern-escalation-and-payoff]]) |
| Death-handling: instant retry to phase / fight start | Spine is *retry-mastery*; a slow or punishing retry would be **dissonant** ([[antipattern-dissonance]], [[antipattern-fail-loop-tax]]) |
| Theme / fantasy: "I beat that with one button" | The mechanic (all depth in timing, none in the controller) *is* the meaning — legible mastery, not finger gymnastics |
| Accessibility: one button as a first-class input mode | The constraint is the spine made a feature — the scarcity that creates the tension is also what opens the door ([[system-accessibility]]) |
| Feel: juice choreographed to *serve* the read | Mastery demands the death be *yours*; the telegraph must survive the fireworks, or the fairness the spine rests on breaks ([[antipattern-unreadable-juice]], [[pattern-juice-choreography]]) |

No row is decoration; no row fights the spine. The gate holds: **the press that
answers this attack is the press you no longer have for the counter it provokes.**

## Anchors

- [[anchor-cuphead]] — the memorize-the-pattern boss loop, the "you-died-but-you-saw-why" contract. This is the spine.
- [[anchor-peggle]] — proof that one committed input per beat can carry a whole game's tension. Aim (or in your case, *time*) and release.

## Genre + systems pulled

- Genre: [[genre-bullet-hell]] — dense, readable, telegraph-driven pressure. Do not restate its rules; inherit them.
- [[system-boss-design]] — the phase machine that gives each fight an arc.
- [[system-telegraphs]] — the wind-ups that make one-button reaction *fair*. Load-bearing; without clean tells the single input is a coin-flip.
- [[system-accessibility]] — the reason the constraint is a feature, not a gimmick. One button is a first-class input mode, not a nerf.
- Pull for feel, don't rebuild: [[system-difficulty-and-dda]], [[system-save-and-checkpoint]] (retry-fast between phases).

## The twist applied

Vector: **constraint** (subtract a dimension, force depth elsewhere). See [[process-the-twist]]. The removed dimension is *input breadth*; the depth it displaces flows into **timing** and **pattern-reading**.

Concrete "X but Y" seams to pick from:

| Seam | Twist vector |
| --- | --- |
| Cuphead but one button | constraint (subtract input) |
| A fighting game's parry loop but the *only* verb | reframe (one system becomes the whole game) |
| Guitar Hero's timing windows but the notes are boss attacks | mashup (rhythm × boss-rush) |
| Peggle's single commit but the target shoots back | inversion (aim → survive) |

Ship one seam. The default — **Cuphead but one button** — is the safest first playable.

## The one honest input

The button is **context-sensitive**, and the context is legible *before* you press. See [[antipattern-input-lie]] — the cardinal sin here is a button that means different things without telling you which.

- **Tap** = dodge / dash through the current attack window.
- **Hold** = charge; release to fire your one riposte.
- Context is set by the boss's telegraph, not a hidden mode. The player always knows what tap and hold will do *this instant* because the tell says so.

Two verbs on one button is the ceiling. A third (double-tap, long-hold) is a [[antipattern-second-system]] risk — add it only after the two-verb fight proves fun. Keep it honest: the input model in the tutorial is the input model in the final boss.

## The 3 pillars

1. **Readable patterns.** Every attack telegraphs on a fixed, learnable clock. Death teaches. Lean hard on [[system-telegraphs]] and [[pattern-readability]] — if a player can't name why they died, the pillar failed.
2. **One honest input.** Tap and hold, context set by the fight, never a lie. [[system-accessibility]] first, [[antipattern-input-lie]] never.
3. **Escalating phases.** Each boss is a 3-phase arc; each phase adds one pattern or speeds the clock. [[system-boss-design]] + [[pattern-escalation-and-payoff]].

These three are the whole design. If a feature doesn't serve one, cut it — see [[process-pillars]].

## Scope & first playable

**First playable: one 3-phase boss beatable with one button.** Not a rush yet — one fight, proven fun, proven fair.

- **Phase 1** — one attack, generous window. Teaches tap=dodge.
- **Phase 2** — add a second attack + the hold=charge window. Teaches the riposte.
- **Phase 3** — both attacks, faster clock, one new twist attack. The mastery check.

Constraints that keep it tight:

- **One boss, three phases, two verbs.** Nothing else.
- All randomness through a deterministic RNG so patterns are replayable and each death is honest — the boss should feel *authored*, not [[antipattern-rng-frustration]]. Prefer fixed pattern sequences over rolled ones for the first fight.
- Instant retry. Fail → back to phase start (or fight start) in under a second. See [[system-save-and-checkpoint]] and [[pattern-fairness-and-trust]]; a slow retry is a [[antipattern-fail-loop-tax]].
- **js13k-friendly**: one input, a handful of telegraph animations, and a phase table fit a tiny budget. This recipe is *cheap* — spend the bytes on tells and juice, not systems.

Only after that fight sings: chain 3–5 bosses into the rush, escalate across the set (not just within each fight), and let [[pattern-pacing-and-tension]] shape the rest/spike rhythm between them. See [[system-session-structure]] for the run shape.

## Traps to dodge

- **Unreadable spectacle.** Screen-shake and particles that hide the tell. Juice serves reading here — see [[antipattern-unreadable-juice]] and [[pattern-juice-choreography]]. The telegraph must survive the fireworks.
- **False depth from mode-stacking.** Piling hidden button contexts to fake complexity is [[antipattern-false-depth]]. Depth comes from pattern layering, not input layering.
- **Difficulty cliff at phase 3.** A jump the two-verb vocabulary can't answer is a [[antipattern-difficulty-cliff]]. Every phase-3 threat must be beatable with tap or hold — verify the answer exists.

## Handoff

- **Fun proof:** [[genre-bullet-hell]] pressure and legibility — verify against **design/FUN.md §7 · Bullet Hell**. Is every death readable? Is the one input always honest?
- **Feel proof:** telegraph timing and juice choreography — take it to design/JUICE.md.
- **Ship gate:** the accessibility promise and the vision-judge look — design/JUDGE.md.
- Refine the brief and hand it off via [[process-refine-and-handoff]].
