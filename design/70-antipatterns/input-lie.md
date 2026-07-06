---
id: antipattern-input-lie
title: The Input Lie
kind: antipattern
tags: [controls, feel, latency, trust]
summary: The game drops or delays inputs — the player did the thing, the game disagreed, and trust dies.
use-when: Testers say controls feel "off" or "unfair" without a clear reason.
composes-with: [system-camera-and-controls, system-grace, pattern-fairness-and-trust]
verify-with: docs/JUICE.md
---

**What it is.** The player pressed the button, the game did not honor it — swallowed, delayed, or resolved against the player's own eyes. The action was correct; the machine disagreed.

**Why it hurts.** Every input is a promise. Break it once and the player stops trusting the controls; from then on they blame the game for their own deaths, and they're right. Trust is the substrate mastery grows in — see [[pattern-fairness-and-trust]]. Poison it and no amount of content matters.

## The smell

"I **pressed** jump!" said out loud, mid-run, in a flat betrayed tone. The tester isn't confused about the rules — they're certain they did the right thing and the game robbed them. That certainty is the diagnostic. Confusion is an onboarding problem; betrayal is an input lie.

## How it happens

The lie is almost never one bug. It's an accumulation of small honesties skipped:

| Cause | What the player experiences |
|---|---|
| Input polled once per frame, dropped between frames | Fast taps vanish |
| Action only fires while a condition is *exactly* true | Jump one pixel off the ledge = nothing |
| Buffer window too tight or absent | Pre-pressed inputs eaten during animation |
| Hitbox larger than the sprite (enemy) / smaller (player) | "That didn't touch me!" |
| Visual lags physics by frames | You see contact after damage already landed |
| Coyote time absent | Ran off the edge, pressed jump, fell anyway |
| Priority resolves attack over jump on same frame | You get the move you didn't ask for |

Note the pattern: each is *technically defensible* and *collectively unplayable*. The engine is honest to its own timestep and lying to the human holding the controller.

## The tell (check YOUR design)

- You can name the exact frame a window opens but you've never watched a human miss it by one.
- Your input handler reads state at fire-time, not "was this pressed recently."
- No **coyote time**: leaving a platform and jumping is a hard boolean, not a forgiving window.
- No **buffer**: an input during a locked animation is discarded, not queued.
- Hitboxes match art pixel-for-pixel because "that's accurate" — accuracy the player can't see is just difficulty they can't attribute.
- Death review can't answer "was that fair?" from the replay alone.
- You tuned feel on *your* reflexes at 120fps and never on a tired tester at 45.

If two testers independently say "unfair" and can't point at a rule, assume the lie before you assume they're bad. The corpus proof fixtures render from a headless SVG precisely so the judge sees what the player saw, not what the sim believed.

## The fix

Honesty is engineered, not wished for. Grace mechanics turn a hostile timestep into a fair one:

- **Buffer the input.** Queue jump/attack/dash for a short window so a press *just before* it's legal still fires. Cure via [[system-grace]].
- **Coyote time.** Keep "grounded" true for a few frames after leaving a ledge. Celeste's jump feels honest because it lies *for* you — see [[anchor-celeste]] and [[mechanic-double-jump]].
- **Honest hitboxes.** Shrink the player's hurtbox inside the sprite; grow forgiveness on pickups. The bullet-hell convention (tiny hitbox, big ship) is the same trust move — [[genre-bullet-hell]], [[anchor-nuclear-throne]].
- **Read presses, not states.** Sample the whole frame's input; never drop a tap between polls.
- **Sync view to truth.** The frame the player reacts to must match the frame the sim resolves. Mismatched view/physics is a readability lie — [[pattern-readability]], [[antipattern-unreadable-juice]].
- **Own the controls contract.** Deadzones, priority, repeat — decide them on purpose. See [[system-camera-and-controls]].

The whole family is anti-frustration design: remove the *undeserved* loss without removing the challenge — [[pattern-anti-frustration]], [[system-accessibility]].

## Twist seams

- **Precision platformer but the grace is diegetic** (twist vector: fiction) — coyote time you can *see* as a shimmer of held footing, so forgiveness reads as a mechanic the player earns, not a hidden mercy. Pairs with [[genre-precision-platformer]], [[mechanic-wall-jump]].
- **Fighting game but every dropped input is logged and shown** (twist vector: transparency) — a post-round "you buffered too early" readout converts betrayal into a lesson. See [[genre-fighting-game]], [[anchor-street-fighter]], [[system-mastery-curve]].
- **Rhythm game but the timing window widens as trust builds** (twist vector: adaptive grace) — early misses forgive generously, then the window tightens as the player proves competence, so the lie never gets a foothold. Pairs with [[genre-rhythm]], [[system-difficulty-and-dda]].

## Seen in

- **Celeste** — a masterclass *against* the lie: buffer, coyote time, and a hurtbox smaller than Madeline's sprite make brutal precision feel fair. The difficulty is honest.
- **Cuphead** — hard, and mostly honest; where players cry foul it's usually a telegraph/hitbox read, not a dropped input. See [[system-telegraphs]], [[anchor-cuphead]].
- **Dark Souls** — deliberate input *commitment* (you can't cancel a swing) is design, not a lie — *because* it's consistent and telegraphed. The lie is inconsistency, not weight. See [[anchor-dark-souls]], [[mechanic-dodge-roll]].
- **Early/knockoff platformers** — the canonical offenders: no coyote time, pixel-tight hitboxes, inputs eaten mid-animation. The "I pressed jump!" genre.

## Distinguish from

- **Not [[antipattern-rng-frustration]]** — that's honest inputs, unfair *outcomes*. The lie is the input never counting at all.
- **Not [[antipattern-difficulty-cliff]]** — a cliff is deserved, legible difficulty. The lie is *undeserved* difficulty the player can't attribute.
- **Not [[antipattern-guess-the-designer]]** — that's opaque intent; this is honored intent. The player knew exactly what they wanted; the game refused it.

## Verify / guard

Feel is proven, not asserted — see [[docs/JUICE.md]] for the input-honesty and grace-window gates, and reference the `updrift` golden platformer as the honest-controls floor. Guard rule: any death or miss must be reconstructable as *fair* from the replay alone. If a human says "unfair" and the replay agrees with them, the lie is in your input layer — fix it before handoff, per [[process-refine-and-handoff]].
