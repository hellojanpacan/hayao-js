---
id: system-telegraphs
title: Telegraphs — readable threat
kind: system
tags: [telegraph, tells, windup, readability, reaction, threat, combat]
summary: The wind-up that makes a threat readable — every hitbox announces itself long enough to react, and the tell is stored as a direction, not a guess.
use-when: Any threat can hurt the player in real time or resolve on a turn; you need the danger to be reactable, not a surprise.
composes-with: [system-combat-model, system-boss-design, system-enemy-ai, system-grace, pattern-readability]
anchors: [anchor-into-the-breach, anchor-shadow-of-mordor]
verify-with: docs/FUN.md#4-top-down-action-adventure-zelda-like
---

# Telegraphs — readable threat

**What it is.** The **tell**: the flash, wind-up, or warning tile that fires *before*
a threat can hurt you, giving a window to react. A telegraph is the contract that
makes reactive play possible — without it, damage is a dice roll disguised as a
fight. It is the readable half of every [[system-combat-model]].

**Player fantasy / why it's fun.** "I saw it coming and I moved." Every dodged blow
is the player's skill, not the game's mercy. A death after a telegraph is *fair* —
you read it or you didn't; a death with no telegraph is the designer's fault.

## When to use / when NOT

| Telegraph when… | Skip when… |
|---|---|
| A threat can kill/hurt in real time | Damage is player-initiated only (you hit them) |
| Perfect information is the promise (tactics) | The threat is a slow, always-visible hazard (lava) |
| A boss/elite has committal, punishable moves | The genre's fun is *not* reacting (idle, puzzle) |

Turn-based games still telegraph — they just do it as **shown intent on the board**
(the arrow, the highlighted tiles), not a timed flash.

## Variants

| Telegraph | Channel | Window | Anchor | Note |
|---|---|---|---|---|
| **Flash / color wind-up** | visual | ~0.45s (§4) | Zelda-likes | the default reactive tell |
| **Wind-up animation** | visual | scales to move weight | brawlers, [[anchor-shadow-of-mordor]] | big moves telegraph longer |
| **Audio cue** | audio | leads the visual | rhythm, horror | a growl before the lunge |
| **Ground marker / AoE** | visual | fills over the window | ARPGs, bosses | the red circle grows, then fires |
| **Shown intent (turn)** | visual, static | until next turn | [[anchor-into-the-breach]] | the arrow you rewrite |
| **Charge / meter** | visual | fills to threshold | bosses | commit-punish window |

## Tuning levers

| Lever | Does | Healthy range |
|---|---|---|
| **Reaction window** | telegraph frames before the hitbox | **~0.45s** flash floor (FUN.md §4); scale up for heavier moves |
| **Salience** | how loud the tell reads | brightest thing after the avatar (JUICE salience gate) |
| **Recovery** | punish window after the move whiffs | long enough to answer; short enough to stay dangerous |
| **Overlap budget** | simultaneous telegraphs | few enough that each still reads (bullet-hell coherence, §7) |
| **Channels** | senses the tell fires on | ≥ 2 for the big ones (sfx + flash) |

The window is a **derived inequality** (FUN.md law 3): reaction window ≥ human
reaction floor + the frames the dodge costs. Don't vibe it — compute it.

## How it wires to Hayao

- **The gate is real.** `telegraphIssues(timeline, minFrames)` (in `@hayao`) walks a
  per-frame `TelegraphFrame[]` (`{ telegraphing, active }`) and flags any hitbox that
  goes live after fewer than `minFrames` of contiguous wind-up. This is the direct
  proof that reactive play is possible.
- **Store tells as DIRECTIONS, not target tiles.** FUN.md §12: a tactics telegraph is
  a *direction on the unit*, so a shove/redirect rewrites the outcome for free — the
  future is editable, which is the whole fun of the genre. Encode the intent, resolve
  it late.
- **The tell is cosmetic; the timing is sim time.** The flash/marker are view; the
  *window* is `world.time` and fixed `dt` (FUN.md law 6). Wire the flash to the sim
  event, never to wall-clock — a replay reproduces the exact tell.
- Reference: the top-down §4 pattern (kiting bot reads flashes); [[anchor-into-the-breach]]
  DNA for shown-intent telegraphs.

## Fails when…

- **No wind-up.** A hitbox that goes live cold is an unfair death — `telegraphIssues`
  fails and it *should*.
- **The tell is illegible.** Too dim, too brief, or buried under five other flashes.
  If the salience gate can't find it, neither can the player ([[pattern-readability]]).
- **The telegraph lies.** The flash points left, the hit lands right. Perfect
  information demands perfect honesty (FUN.md §12) — shown must equal resolved.
- **Uniform windows.** Every move telegraphs 0.45s regardless of weight, so nothing
  reads as *scary*. Scale the tell to the threat.

## Verify

- **[FUN.md §4](../../docs/FUN.md)** — ~0.45s flash makes reactive play possible;
  kiting-bot telemetry with an hp floor.
- **[FUN.md §12](../../docs/FUN.md)** — telegraphs as directions; intent honesty
  (resolve each telegraph, compare to the shown number/arrow).
- `telegraphIssues(timeline, minFrames)` → **[VERIFICATION Channel 4](../../docs/VERIFICATION.md)**.
- Salience: `salienceIssues` proves the tell out-contrasts scenery (JUICE Part 2/3).

## Composes with

- [[system-combat-model]] — the telegraph is the reactive half of the resolution rule.
- [[system-boss-design]] — bosses live or die on legible, escalating tells across phases.
- [[system-enemy-ai]] — the AI must *commit* to a telegraphed move, not cancel it.
- [[pattern-readability]] — signposting and salience are how a tell gets read.

## See also

- [`docs/FUN.md`](../../docs/FUN.md) §4 (flash window), §7 (pattern coherence), §12 (directions).
- [`docs/JUICE.md`](../../docs/JUICE.md) — salience gate; the avatar/threat contrast floor.
- [`src/verify/gates.ts`](../../src/verify/gates.ts) — `telegraphIssues`, `TelegraphFrame`.
