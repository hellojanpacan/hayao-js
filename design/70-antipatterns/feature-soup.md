---
id: antipattern-feature-soup
title: Feature Soup
kind: antipattern
tags: [scope, focus, pillars, bloat]
summary: Many systems, no spine — every feature is present, none is load-bearing, the game is about nothing.
use-when: Your design keeps adding systems and the pillars no longer predict what belongs.
composes-with: [process-pillars, process-core-loop, antipattern-second-system]
verify-with: design/FUN.md
---

**What it is.** A design where **every system is present and none is load-bearing**. Crafting, dialogue, base-building, combat, a skill tree, a day/night cycle — each real, each shallow, none feeding the others. The game does ten things and is *about* nothing.

**Why it hurts.** A player learns a game by finding its **spine** — the one loop everything else serves. Feature soup has no spine, so nothing teaches, nothing compounds, and mastery never starts. The player bounces because there is no floor to stand on. It also drains you: ten half-systems cost more than one whole one and verify worse.

## The smell
You can list the features but not the **pillars**. Ask "what are the 3 things this game is about?" and the honest answer is a shrug — or a list of nine.

## How it happens
| Path in | What it sounds like |
|---|---|
| Additive design | "While we're here, let's also add crafting." |
| Feature envy | "Genre X has a skill tree, so we need one." |
| No filter | Every idea justifies itself by *why not* instead of *why*. |
| Fear of thin | A thin loop feels risky, so systems get piled on as insurance. |
| Sunk cost | Half-built systems stay because ripping them out hurts. |

The engine of soup is **why-not**. A pillar-less design cannot reject anything, so it accepts everything. See [[antipattern-second-system]] for the sibling failure where *one* over-engineered system eats the project.

## The tell (check YOUR design)
- You **cannot name the 3 pillars** in one breath. → soup.
- A feature's whole defense is **"why not"** — it justifies its own presence, not the loop's. → soup.
- Two systems never touch: gains in one **never change** play in the other. → decorative system.
- The [[process-core-loop]] verb list runs past ~4 core verbs with no hierarchy. → no spine.
- You describe the game by **listing features**, not by naming what the player *does* thirty seconds in.
- New scope keeps landing and the pillars **don't predict** whether it belongs. That's the definition in [[process-pillars]] — pillars must be a *filter*, not a mission statement.

## The twist seams (soup masquerading as depth)
- **Many systems but one currency** — every system spends and refills the *same* resource, so they interlock instead of scattering (twist vector: converge outputs). [[anchor-slay-the-spire]] has relics, cards, potions, HP — all metered by one deck through one combat loop. [[anchor-balatro]] funnels jokers, hands, and vouchers into a single score threshold.
- **Many systems but one fantasy** — features are kept only if they deepen a *single* verb (twist vector: subordinate to a pillar). [[anchor-vampire-survivors]] is stat-drops, evolutions, and map events, but all of it serves *survive the horde by auto-attacking* — cut anything that doesn't. [[genre-horde-survival]].
- **Wide surface but shallow-by-design** — breadth that's honest about being a sandbox, not fake depth (twist vector: name it a toybox). [[anchor-minecraft]] and [[anchor-terraria]] are genuinely many systems — but the pillar is *the world is yours to reshape*, and every system is a verb for reshaping. Contrast a soup that has the same breadth with no reshape fantasy underneath. See [[antipattern-false-depth]].

## The fix
1. **Name the pillars.** Run [[process-pillars]]. Three or fewer. If you can't, you have soup, not a game.
2. **Find the loop that survives.** Run [[process-core-loop]]. Strip to the verbs a player repeats in the first minute — that's the spine.
3. **Filter every system against the pillars.** Each survivor must answer *which pillar do I serve, and how do I feed another system?* — not *why not*. Cut what only answers "why not."
4. **Make survivors interlock.** A kept system must **change** the loop, not sit beside it. Route outputs into the same resource or the same fantasy — see [[pattern-feedback-loops]] and [[system-resource-loops]].
5. **Re-derive from the mechanic.** If cutting leaves a hole, the hole is the real design. Rebuild outward from the spine, not inward from the pile. [[process-the-twist]] and [[process-intent-to-brief]].

The cut is the work. A game is defined by what it **refuses** as much as what it ships — [[pattern-restraint-and-negative-space]].

## Soup vs. spine
| Feature soup | Load-bearing design |
|---|---|
| Ten systems, none essential | Three pillars, each essential |
| Systems sit side by side | Systems feed each other |
| Justified by *why not* | Justified by *which pillar* |
| Described as a feature list | Described as a verb |
| Cutting anything feels fine | Cutting anything breaks the loop |

## Seen in…
- **Early-access sandboxes** that ship crafting + farming + combat + factions + questing at 20% depth each, then patch for years trying to find what the game is. The ones that survive (like [[anchor-stardew-valley]]) do it by making every system pour into *one* farm-life loop.
- **Kitchen-sink RPGs** where fishing, cooking, card games, and horse racing are all present and none matters — the pillars would have caught it.
- **Feature-parity clones** that copy a genre's checklist ([[genre-farming-sim]], [[genre-survival-horror]]) without a pillar, ending up as a list of the reference's features minus its spine.

Positive counter-references — many systems, one spine: [[anchor-hades]] (every meta-system feeds one run loop), [[anchor-rimworld]] (every system feeds the story-generator pillar), [[anchor-into-the-breach]] (a tiny surface, zero soup, total legibility).

## Verify / guard
- Pillars-as-filter and the loop hierarchy are enforced in [[process-pillars]] and [[process-core-loop]] — run both before handoff at [[process-refine-and-handoff]].
- Whether the surviving loop is actually *fun* on its own — no soup to hide behind — is the FUN question. Prove it there: `design/FUN.md`.
