---
id: antipattern-unreadable-juice
title: Unreadable Juice
kind: antipattern
tags: [juice, readability, feedback, clarity]
summary: Feedback so loud it hides state — particles and shake bury the information the player needs to act.
use-when: You are adding effects and the screen is getting busy.
composes-with: [pattern-readability, pattern-juice-choreography, world-mood-and-atmosphere]
verify-with: design/JUICE.md
---

**What it is.** Polish that costs clarity. The screen is so loud with **effects** — shake, bloom, particle storms, flash — that the player can't read the one thing they need to act on: the hit, the telegraph, the resource, the enemy about to strike.

**Why it hurts.** Juice exists to *confirm the read*, not replace it. When spectacle drowns state, the player stops trusting the screen. Deaths feel unfair, wins feel accidental, and mastery stalls — you can't get better at a game you can't see. See [[pattern-readability]].

## The smell
The most important pixel on screen is not the loudest pixel on screen. **Signal** is buried under **decoration**.

## How it happens
- Effects get added one at a time, each fine alone — the sum is never audited. Death by a thousand particles. See [[antipattern-feature-soup]] for the same additive trap in mechanics.
- **Screen shake** on every event, so no event reads as bigger than another. Emphasis with no contrast is noise.
- The telegraph and the hit-flash share a color, or the wind-up frame is hidden behind the effect it triggers. See [[system-telegraphs]].
- Juice authored for the trailer, not the tenth hour. It photographs great and plays blind.
- Everything animates at once with no **hierarchy** — the eye has nowhere to rest and nothing to prioritize.

## The tell (audit YOUR OWN design)
- At the busiest moment — full horde, boss combo, screen-clear — can you still point to the player, the next threat, and the win/lose condition? If not, you have unreadable juice. Stress-test at peak, not on an empty room.
- Kill all sound and watch a clip at half speed: does the frame still say who got hit and what's coming? If the effect is the only carrier of information, the read is fragile.
- New players die to the same thing twice and can't say why. The lesson was on screen — hidden.
- You reach for *more* juice to make a moment land instead of *clearing* competing juice. See [[pattern-restraint-and-negative-space]].
- Your color for "you took damage" and your color for "you dealt damage" are close enough to confuse under motion.

## Twist seams (X but Y)
- **Bullet-hell spectacle but a legible bullet layer** *(twist: layer separation — desaturate/dim everything that can't kill you so the lethal reads instantly)*. See [[genre-bullet-hell]], [[anchor-nuclear-throne]].
- **Horde-survival screen-clear fireworks but the next threat never disappears** *(twist: priority budget — the incoming elite always wins the top visual layer over any explosion)*. See [[genre-horde-survival]], [[anchor-vampire-survivors]].
- **Impactful screen shake but it only fires on the one hit that matters** *(twist: spend the budget — reserve your loudest effect for your rarest, highest-stakes event)*. See [[pattern-juice-choreography]].

## The fix
State first, spectacle second. Juice **serves** the read; it never competes with it.

| Principle | Do |
| --- | --- |
| **Hierarchy** | Rank events by stakes. The rarest, most important event gets the loudest effect; routine events get quiet ones. Emphasis is a budget — see [[pattern-juice-choreography]]. |
| **Layer separation** | Keep the actionable layer (player, threats, telegraphs) visually above and distinct from the decorative layer (dust, bloom, ambient particles). Dim or desaturate what can't hurt or help. |
| **Contrast, not volume** | A hit reads because it's *different* from its surroundings, not because it's *bright*. If everything flashes, nothing flashes. See [[pattern-readability]]. |
| **Reserve the shake** | Screen shake is a spice. Reserve it for the top of your event hierarchy; a constant rumble reads as zero information. |
| **Telegraph owns its channel** | Give wind-ups a dedicated color/shape/sound that no cosmetic effect uses. The player must never confuse "about to happen" with "just happened." See [[system-telegraphs]]. |
| **Peak-load test** | Design and tune the effect stack at the busiest moment, not the calmest. If it's readable at full horde, it's readable everywhere. |

For the accessibility floor — colorblind-safe channels, reduced-motion and screen-shake toggles — see [[system-accessibility]]. These aren't extras; they're proof your read survives without your prettiest channel.

## Seen in…
- **Nuclear Throne** and **Vampire Survivors** win by holding the enemy layer readable through chaos — bullets and elites stay legible while everything else churns. When a clone of either loses that discipline, it becomes a screensaver you die in.
- **Hades** stacks enormous juice yet keeps Zagreus, the dash-target, and every telegraph reading clean — the effects celebrate the read instead of hiding it. See [[anchor-hades]], [[system-boss-design]].
- **Peggle**'s finale is maximal spectacle *by design* — but it fires only after the shot resolves, when there's no state left to read. Loud juice is free once the decision is over. See [[anchor-peggle]].
- **Cuphead** telegraphs every boss attack in a channel that survives its dense, hand-drawn effects; the read is protected on purpose. See [[anchor-cuphead]], [[system-telegraphs]].
- Countless bullet-hell and horde clones fail here: the ancestor's restraint was invisible, so imitators copy the fireworks and drop the legibility.

## Related failure modes
- [[antipattern-input-lie]] — when feedback contradicts what the sim actually did; unreadable juice hides the truth, input-lie fakes it.
- [[antipattern-feature-soup]] — the same "each addition is fine, the sum is chaos" trap, in mechanics rather than pixels.
- [[system-telegraphs]] and [[pattern-readability]] — the systems this antipattern is the negative image of.

## Verify / guard
This is a **design-time checklist** you run before handoff, not a metric. Screenshot the busiest moment and ask: player, threat, objective — all three readable? Then hand to the verification half. For the JUICE budget, hierarchy discipline, and the readability gates that catch this after build, see `design/JUICE.md` (and `design/JUDGE.md` for the headless look-test). The design job is to make sure there's a legible read *for* those gates to protect.
