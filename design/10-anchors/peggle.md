---
id: anchor-peggle
title: Peggle
kind: anchor
tags: [physics-arcade, variable-ratio, juice, reward-schedule, aim, one-input, spectacle]
summary: Aim, drop a ball, watch physics scatter it through pegs — trivial input wrapped in variable-ratio payoffs and maximal celebration juice.
use-when: Designing a low-skill-floor game that feels ecstatic through reward scheduling and disproportionate feedback on a single simple action.
composes-with: [genre-physics-arcade, system-reward-schedules, pattern-juice-choreography, pattern-risk-reward]
anchors: [anchor-peggle]
verify-with: design/FUN.md#19-·-physics-arcade-breakoutpeggle
---

# Peggle

**What it is.** A pachinko-like arcade game: aim a launcher at the top of the
screen, drop one ball, and watch it ricochet through a field of pegs, lighting
them up. Clear the orange pegs to win the level. The input is a single angle;
the payoff is a cascade.

**Player fantasy / why it's fun.** *I barely did anything and something
wonderful happened.* The pull is **maximal juice on minimal input**: you set
one angle, and the game rewards you with an escalating fireworks show — lucky
bounces, a "free ball" bucket, and a final slow-mo, orchestral,
rainbow-explosion victory that's wildly out of proportion to the click that
caused it.

## Design DNA

Take a **trustworthy physics sandbox** and lay a **variable-ratio reward
schedule** over it, then celebrate every outcome — especially the lucky ones —
with disproportionate feedback. The skill floor is near zero (aim and drop),
but the *feel* is ecstatic because the physics manufactures surprise and the
juice amplifies it. The genius is the **gap between input effort and output
spectacle**: a single trivial action detonates a chain of delightful
consequences you didn't fully control but feel credit for.

The design does two clever things at once. First, it **outsources complexity
to physics** — the player supplies one number (the angle), and the peg field
plus deterministic bounces generate all the richness, so the game is deep
without the input being hard. Second, it **launders luck into feeling like
skill**: because you *chose* the shot, a lucky twelve-peg cascade reads as
*your* triumph, not the RNG's gift. The variable-ratio schedule supplies the
surprise; the aim supplies the ownership; together they make a near-zero-skill
action feel earned.

The hidden design work is honest physics — swept collision so the ball never
tunnels, energy conservation so bounces feel real — because the whole payoff
depends on *trusting* the scatter. A ball that clips through a peg or gains
speed from a bounce breaks the illusion instantly; the ecstasy is only
possible on a foundation the player never doubts.

## Load-bearing structures

| Structure | Why it works |
|---|---|
| **One trivial input, cascading output** | Aim + drop is all the player does; physics + pegs generate the complexity. The effort/reward gap IS the fun. |
| **Trustworthy swept-collision physics** | Closed-form time-of-impact = no tunneling ever; energy honesty (a bounce never speeds the ball up) makes the scatter feel real, not glitchy. FUN.md truth. [[genre-physics-arcade]]. |
| **Variable-ratio surprise** | Lucky multi-peg bounces and the free-ball bucket are unpredictable payoffs — the schedule that keeps you dropping "one more ball." [[system-reward-schedules]]. |
| **Disproportionate celebration** | Slow-mo, zoom, orchestral sting, screen-filling explosion on the last orange peg — feedback far exceeds the input. [[pattern-juice-choreography]]. |
| **Read the board, place the bet** | Skill lives in *choosing the shot* — angling for clusters, banking off walls — turning luck into a decision. [[pattern-risk-reward]]. |
| **Aim-search proves winnability** | Pure state → clone-and-fire candidate aims → count clears: winnability AND a difficulty meter for free. FUN.md law 7. |
| **Escalating per-ball scoring** | Points ramp within a single drop (peg after peg), so even one ball has an arc. [[pattern-feedback-loops]]. |

## What to steal

- **Widen the gap between input effort and output spectacle.** One trivial
  action → a cascade of consequence. This is the whole feel; steal it into any
  arcade toy.
- **Overlay a variable-ratio schedule on physics.** Let lucky bounces and
  bonus buckets manufacture surprise; the unpredictability is the compulsion.
  See [[system-reward-schedules]].
- **Celebrate disproportionately.** Slow-mo + zoom + audio sting on the win
  moment. Feedback should *exceed* the action — that's the Peggle signature.
  [[pattern-juice-choreography]] / `design/JUICE.md`.
- **Make honest physics the foundation.** Swept collision (no tunneling),
  energy conservation — the surprise only delights if the ball is *trusted*.
  Wire via [[genre-physics-arcade]].
- **Use aim-search bots** to prove every level is clearable within the ball
  budget and to *rate* its difficulty (FUN.md law 7). Pure state means you
  clone the board, fire candidate aims, and count clears — winnability proof
  and a difficulty meter from the same loop.
- **Give the trivial input a *decision*.** Skill lives in *choosing the shot*
  — banking off a wall, aiming for a cluster, going for the free-ball bucket.
  Layer a real read over the simple action so mastery has somewhere to grow.
  [[pattern-risk-reward]].

## What's just theme (drop it)

- **The unicorns / Peggle Masters fiction.** Cosmetic; the loop is theme-free.
- **The rainbow "Ode to Joy" victory.** The *disproportionate celebration* is
  structural; the specific song/rainbow is a [[pattern-juice-choreography]]
  instance you'd re-skin.
- **The specific power-ups.** Bomb/multiball/etc. are *reward-schedule
  variants*; the categories matter, the names don't —
  [[system-reward-schedules]].
- **Peg colours (orange = must-clear).** *A subset of targets defines the win*
  is structural; the colour is readability flavour — [[pattern-readability]].

## Composes into

- [[genre-physics-arcade]] — its canonical anchor; trustworthy-flight physics
  lives there.
- [[system-reward-schedules]] — variable-ratio payoff exemplar.
- [[pattern-juice-choreography]] — disproportionate-celebration reference.
- [[pattern-risk-reward]] — reading the board to place a shot.
- [[pattern-feedback-loops]] — escalating per-ball scoring.

## Twist seams

- **Peggle but the pegs are a deck you place before the drop**
  *(mechanic-swap)* — you build the board, then fire; aim becomes
  construction. Pulls in [[genre-deckbuilder]] / [[anchor-loop-hero]]
  planning.
- **Peggle but two players share one board and alternate drops**
  *(perspective)* — every bounce sets up or spoils the rival's next shot.
  Feeds [[system-coop-and-competition]].
- **Peggle but one ball for the whole level** *(constraint)* — no retries per
  level; the trivial input becomes a high-stakes single bet, converting
  variable-ratio joy into push-your-luck tension. Sharpens
  [[pattern-risk-reward]].
- **Peggle but the pegs fight back** *(mechanic-swap)* — pegs move, shield, or
  shoot on a telegraph between your drops; the calm arcade toy gains a
  reactive-threat layer. Pulls in [[system-telegraphs]] and shifts the read
  from static to dynamic.

## See also

- [[genre-physics-arcade]] · [[system-reward-schedules]] ·
  [[pattern-juice-choreography]]
- `design/FUN.md#19-·-physics-arcade-breakoutpeggle` — swept collision, energy
  invariant, aim-search verify.
- `sandboxes/physics-lab/` — swept-collision / no-tunnel reference.
- `sandboxes/juice-lab/` · `design/JUICE.md` — the celebration choreography.
