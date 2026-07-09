---
id: anchor-trackmania
title: Trackmania
kind: anchor
tags: [racing, time-attack, mastery, ghost, restart, medal-ladder, racing-line, track-editor]
summary: Time-attack racing distilled — the clock is the only opponent, restart is instant, and a medal ladder fits one track to every skill.
use-when: Designing a racer whose fun is beating the clock on a fixed line, where retry is free and difficulty is a self-paced ladder, not a menu.
composes-with: [genre-racing, system-mastery-curve, system-difficulty-and-dda, pattern-mastery-and-flow, system-progression]
anchors: [anchor-trackmania]
verify-with: design/FUN.md#20-·-top-down-racing
---

# Trackmania

**What it is.** A racer stripped to one loop — drive a fixed track, chase a
target time, press one key to restart the instant you miss it. No fuel, no
damage, no car tuning, no combat. The car is a constant; the **track and your
line** are the entire game.

**Player fantasy / why it's fun.** *I found the perfect line, and the clock
proves it.* The pull is a **micro-mastery loop** measured in tenths — you know
exactly where you lost the time, restart costs nothing, and the medal one tier
up is always just visible. Improvement is legible, and it is yours.

## Design DNA

Trackmania's bet is that **the clock is a better opponent than any AI.** Strip
out rivals, items, and damage and you are left with the purest racing question —
what is the fastest line through this geometry, and can your hands execute it?
Everything the design keeps exists to sharpen that question and shorten the gap
between attempts.

The restart is a load-bearing structure, not a convenience. Because a run costs
**two seconds and one keypress** to abandon, the player lives inside a tight
practice loop — try a braking point, miss, restart, adjust, repeat. Failure
never compounds into frustration because it never costs anything: the retry *is*
the practice, and the practice *is* the fun.

Difficulty is a **ladder the player climbs on their own terms.** One track ships
several target times — bronze, silver, gold, and the author's own — so a beginner
and an expert play the identical track toward different, always-visible goals. No
difficulty menu, no rubber-band: the ramp is the medal you reach for, and one
track meets every skill level at once. The ghost of your best run teaches the
line by contrast, with no tutorial text.

## Load-bearing structures

| Structure | Why it works |
|---|---|
| **Instant, free restart** | One key respawns you at the start with no load, no menu, no lost run. Retry cost is near zero, so the practice loop stays tight and failure never compounds. [[system-mastery-curve]]. |
| **The clock is the only opponent** | No rival AI, no items, no damage — the single honest score is elapsed time, and every tenth traces to a decision you made corners ago. |
| **Medal ladder as self-paced difficulty** | Bronze/silver/gold/author times ship with every track. One track serves all skill levels at once; the next medal *is* the difficulty ramp. [[system-difficulty-and-dda]]. |
| **Ghost as silent teacher** | Your PB (or the medal's) replays as a non-colliding car — it shows the ideal line by contrast, onboarding with zero tutorial text. [[system-telegraphs]]. |
| **The car is a constant** | One fixed car, no tuning economy. All skill and all design budget flow into the track and the line, not the garage. |
| **The track is the level** | Corner radius, width, and sequence author every ounce of difficulty — geometry is content, and an editor makes it infinite. [[system-procgen-design]]. |
| **Checkpoints, not fences** | Ordered checkpoints validate a run and set the respawn; cutting the course simply does not count. FUN.md §20 anti-cheat. |

## What to steal

- **Make restart free and instant.** Bind retry to one key, respawn at the start
  (or last checkpoint) with no load. Cheap failure is the license for a hard line
  — the retry loop teaches while it punishes.
- **Ship several target times per track, not a difficulty menu.** Bronze, silver,
  gold, and an author time turn one track into a ladder each player climbs on
  their own terms — expose the next medal and keep it just visible.
- **Let the clock be the opponent.** You do not need rival AI to have a racing
  game — a PB ghost plus a target time is a complete, honest loop, and it is far
  cheaper to build and prove than a driver bot.
- **Use a ghost to teach the line.** A non-colliding replay of the ideal run
  onboards by contrast, no pop-up required. Record it via the same deterministic
  replay you already need for goldens (FUN.md law 6).
- **Fix the car; make the track the variable.** Put all skill expression and all
  content budget into geometry, not tuning menus — one well-tuned car plus endless
  tracks beats endless cars on three tracks.
- **Design the track against the car's turn radius**, never by eye. The law-3
  inequality (turn radius < corner radius < track width) is what makes a corner
  honest — state it as a comment and assert it (FUN.md §20).

## What's just theme (drop it)

- **The 3D stadium, loops, and stunt spectacle.** Pure coat of paint — the loop is
  dimension-agnostic, working top-down, side-on, or first-person.
- **The specific medal names and colors.** *A tiered ladder of target times* is
  structural; "bronze/gold" is flavor — stars, letters, or percentiles obey the
  same DNA.
- **The online track-of-the-day and global leaderboards.** A social layer over the
  loop, not the loop — the single-player time attack is fun with zero connectivity.
- **The car's exact handling model.** *A car with real understeer* is structural
  (law 3); the particular grip curve is tuning.

## Composes into

- [[genre-racing]] — this is its canonical anchor: the speed/line tradeoff and the
  honest clock live there.
- [[system-mastery-curve]] — the die-till-your-hands-learn-it loop, aimed at a
  corner instead of a screen.
- [[system-difficulty-and-dda]] — the medal ladder is difficulty as a self-paced
  goal, the opposite of rubber-band.
- [[pattern-mastery-and-flow]] — a clean track holds the flow channel from beginner
  to record-holder on one rule.
- [[system-progression]] — medals and unlocked tracks are the shallow meta over a
  deep moment.

## Twist seams

- **Trackmania but the track draws behind you and erases ahead** *(constraint)* —
  commit to a line you cannot preview; the ghost becomes memory, not sight. Pulls
  in [[system-procgen-design]].
- **Trackmania but braking charges a boost you spend on straights**
  *(mechanic-swap)* — the speed/line tradeoff becomes an economy, not just a
  physics fact. Feeds [[system-economy]].
- **Trackmania but two ghosts race a shared split** *(perspective)* — your PB and a
  rival's line run side by side without collision; the solo clock becomes a duel.
  Feeds [[system-coop-and-competition]].
- **Trackmania but tonal: a delivery run through a cozy town** *(tonal)* — same
  line-and-clock loop, but the target time is a client's patience and the "track"
  is city streets. Bends the register without touching the verb. Pairs with
  [[genre-farming-sim]]'s calm register.

## See also

- [[genre-racing]] · [[system-mastery-curve]] · [[system-difficulty-and-dda]] ·
  [[pattern-mastery-and-flow]]
- `sandboxes/physics-lab` — the car and its understeer, in isolation.
- `sandboxes/pathfinding-demo` — the racing-line follower for a ghost or rival.
- `design/FUN.md#20-·-top-down-racing` — the racing verify pattern (line finishes
  laps, cutting advances nothing, golden grand prix).
