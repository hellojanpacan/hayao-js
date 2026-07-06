---
id: genre-bullet-hell
title: Bullet Hell
kind: genre
tags: [bullet-hell, shmup, danmaku, patterns, dodging, boss, density]
summary: Screen-filling patterns that read as motion, not noise — dodging is trivial, holding fire lanes under a boss is the skill.
use-when: You want a reflex game where the fantasy is threading a wall of bullets that looks impossible but is fair.
composes-with: [system-telegraphs, system-boss-design, system-difficulty-and-dda, system-grace, genre-horde-survival]
anchors: [anchor-nuclear-throne]
verify-with: docs/FUN.md#7--bullet-hell
---

# Bullet Hell

**What it is.** A shoot-'em-up where the screen fills with **coherent bullet
patterns** the player threads on foot. The bullets are the level; your hitbox is
a single pixel; the whole game is *reading density as motion*.

**Player fantasy / why it's fun.** *"I walked through a wall of death and it was
gorgeous."* Danmaku turns raw panic into a dance — a pattern that looks
unsurvivable resolves into one obvious gap you slide through at the last frame.

## Pillars

1. **Density that reads.** Every pattern is a legible shape (spiral, aimed
   spread, wall-with-gap). Difficulty comes from *tighter gaps and faster
   waves*, never from noise. Density ≠ difficulty.
2. **The gap is always there.** Fairness is provable: a greedy lookahead dodger
   clears deathless. If the bot can't survive, humans die *unfairly* — that's a
   bug, not challenge.
3. **Uptime is the game.** Dodging is trivial; the skill is holding your fire
   lane on the boss *while* dodging. Reward aggression under pressure.

## The loop stack

| Scale | The beat |
|---|---|
| **Moment** | Read the next wave's shape → slide into its gap → keep firing. |
| **Encounter** | A boss's pattern sequence: phases escalate; each phase teaches its gap before it speeds up. |
| **Session** | A stage: trash waves as breathers, midboss, boss. Graze/point economy rewards flying close. |
| **Meta** | Score chase, unlock ships/patterns, difficulty tiers (easy = wider gaps, same shapes). |

## Essential systems

| System | Why it's load-bearing |
|---|---|
| [[system-telegraphs]] | Every pattern's spawn point and direction must be readable *before* it's lethal — the tell is the fairness. |
| [[system-boss-design]] | The boss IS the content; phases are the difficulty ramp. Spectacle + honest tells. |
| [[system-grace]] | Mercy clears on death and at phase transitions are **structural** — without them deaths cascade (FUN.md law 5). |
| [[system-difficulty-and-dda]] | Difficulty tiers = wider gaps / slower bullets on the *same* patterns, not new ones. |
| [[pattern-readability]] | Player bullets, enemy bullets, and the tiny hitbox must never blur together. |

## Content & difficulty model

- **Pattern library, not level data.** Author reusable emitters (spiral, ring,
  aimed n-spread, wall-with-moving-gap) parameterised by rate/speed/count.
  Stages are *sequences* of patterns; difficulty is the parameters.
- **Ramp by geometry.** Widen or narrow the gap chord; speed up bullets; overlap
  two patterns. Cap peak on-screen bullet count and assert it — a spike past the
  budget is a frame-rate cliff, not difficulty.
- **Breathers are structural.** Trash waves and post-boss lulls let the player
  reset. A stage that never breathes reads as noise.
- **Verify the gap exists.** The greedy dodge bot must clear every stage
  deathless before you tune numbers — see [[system-difficulty-and-dda]] and the
  verify link below.

## Signature-mechanic seeds

- **Bullet hell but you place the bullets** *(mechanic-swap)* — a reverse shmup:
  you author the enemy's next pattern from a hand, then dodge your own design.
- **Bullet hell but time only moves when you do** *(constraint)* — SuperHot for
  danmaku; density becomes a spatial puzzle instead of a reflex test.
- **Bullet hell but the gap is drawn in ink** *(theme + tonal)* — Kentō
  woodblock; every wave is a brushstroke, grazing "wets" the paper for score.
- **Bullet hell but co-op share one hitbox** *(perspective)* — two players, one
  ship's life pool; threading requires reading each other. Pairs
  [[system-coop-and-competition]].
- **Bullet hell but bullets are the platform** *(mechanic-swap)* — stand *on*
  slow bullets to reach the boss; movement and dodging invert.

Pick one and let it ripple: a strong bullet-hell twist changes the *scoring
economy* (what grazing means), the *pattern authoring* (who places the bullets),
or the *hitbox itself* — not just the skin. See [[process-the-twist]].

## Common pitfalls

- **Noise mistaken for depth.** More bullets ≠ harder; unreadable ≠ challenging.
  If a death feels random, the pattern didn't telegraph.
- **No mercy on death.** Reviving into a live pattern chains deaths — always
  clear the screen and grant i-frames (law 5).
- **Hitbox lies.** If the visible sprite is the hitbox, players die to grazes
  that looked clear. Hitbox must be a tiny, honest sub-pixel.
- **Passive is optimal.** If parking in a corner survives, uptime isn't rewarded
  — pull the player forward with graze/point economy.
- **Difficulty tiers are new patterns.** An "easy" mode that swaps in different
  shapes doubles your authoring and splits your proofs. Same patterns, wider
  gaps — one library, many tunings ([[system-difficulty-and-dda]]).

## Anchors

- [[anchor-nuclear-throne]] — arcade twin-stick reflex mastery; the tight
  run-based loop and readable enemy fire translate straight to danmaku.
- [[genre-horde-survival]] — the sibling "rising tide" genre; borrow its
  density-that-reads discipline, swap auto-attack for manual dodge.

## Verify

Prove it in **[FUN.md §7 · Bullet hell](../../docs/FUN.md#7--bullet-hell)**: the
greedy lookahead dodge bot clears deathless, peak-bullet count is asserted, and
the per-step time budget holds.

## Composes with

- [[system-telegraphs]] — the tell that makes a wall of bullets fair.
- [[system-boss-design]] — the phased set-piece that is the whole encounter.
- [[system-grace]] — mercy clears and i-frames as structure, not polish.

## See also

- [`sandboxes/particle-studio`](../../sandboxes/particle-studio) — emitter and
  pooled-sprite wiring for cheap on-screen bullet mass.
- [docs/JUICE.md](../../docs/JUICE.md) — graze feedback, hit-stop, screen-clear
  flash as choreography (cosmetic, law 6).
