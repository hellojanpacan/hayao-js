---
id: genre-rts
title: Real-Time Strategy
kind: genre
tags: [rts, strategy, factions, asymmetry, macro, micro, pathfinding, spectacle]
summary: Mass under command — hundreds of wall-aware units, three asymmetric-but-fair factions, and battles that read as spectacle.
use-when: You want a game of commanding armies where economy, tech, faction identity, and positioning decide impressive battles.
composes-with: [system-faction-asymmetry, system-unit-rosters, system-economy, system-enemy-ai, system-tech-tree, system-counter-systems, system-difficulty-and-dda]
anchors: [anchor-starcraft, anchor-age-of-empires]
verify-with: design/FUN.md#9--rts-lite
---

# Real-Time Strategy

**What it is.** You command an army — not a unit. You **gather → build → tech →
army → engage**, all in real time, against an opponent doing the same. The game
is *macro* (economy and tech decisions) layered over *micro* (positioning a
fight), with faction identity coloring every layer.

**Player fantasy / why it's fun.** *"I out-thought them — my build read theirs,
my army answered it, and the battle was glorious."* RTS is the fantasy of
command: hundreds of units obey one intent, and a well-composed army crashing
into a bad one is the payoff shot.

## Pillars

1. **Mass under command.** Hundreds of units path around walls and answer
   orders as one. Flow fields (one BFS per goal tile, cached *outside* state)
   give wall-aware mass pathing cheaply — pathing is the genre's hardest tech
   and its most load-bearing.
2. **Asymmetry that balances.** Factions are *different, not reskinned* — and
   still fair. Distinct rosters, one balance. This is the deep well; get it
   right and every matchup is a new game.
3. **The intended line beats attack-move.** Strategy is the balance test. A
   thinking plan (turtle → tech → counterpush) must beat brute attack-move, or
   there is no strategy — just a bigger blob.

## The loop stack

| Scale | The beat |
|---|---|
| **Moment** | Issue an order — a group micro (focus fire, retreat, flank); units path and arrive. |
| **Encounter** | An engagement: your composition vs theirs, terrain and positioning decide it in seconds. |
| **Session** | A match: opening build → scout → adapt tech to the enemy → the decisive push. |
| **Meta** | Learn each faction's build orders, matchup counters, and timing windows. |

## Essential systems

| System | Why it's load-bearing |
|---|---|
| [[system-faction-asymmetry]] | The genre's soul. Different-but-fair identities; the design of asymmetric balance. |
| [[system-unit-rosters]] | A legible roster of roles and tiers per faction — the vocabulary of composition. |
| [[system-economy]] | Gather/faucet-sink macro; the eco-vs-army tension every decision trades against. |
| [[system-tech-tree]] | The ramp of options and power spikes; branch choices commit you to a plan. |
| [[system-enemy-ai]] | The AI opponent (and unit behaviour): readable, beatable, order-obeying minds. |
| [[system-counter-systems]] | The NvN duel matrix that makes composition a real decision. |

## Strategic depth — where the game lives

Depth is the *stack of layered decisions*, each with tension:

- **Economy vs army.** Every worker is delayed military. The eco/army/tech
  triangle (AoE ages, StarCraft supply timings) is the core macro tension.
- **Build order as a plan.** An opening commits you — greedy-eco vs early
  pressure vs tech rush. Scouting is the info that lets you punish or adapt.
- **Composition as a puzzle.** Counters ([[system-counter-systems]]) make army
  mix a rock-paper-scissors under fog. No unit is unconditionally best.
- **Timing windows.** A power spike (age-up, a tech completing) opens a window
  where you're temporarily ahead — attacking on-spike is the skill.
- **Positioning micro.** Terrain, high ground, concave/surround, focus-fire.
  Same armies, different outcomes by *how* they meet.

## Faction asymmetry — go deep here

The flagship difference. See [[system-faction-asymmetry]] for the full design;
the genre-level rules:

| Axis of difference | Example |
|---|---|
| **Economy shape** | One faction gathers faster but caps lower; another snowballs late. |
| **Roster identity** | Swarm-and-remax vs elite-and-expensive vs defensive-and-teched. |
| **Tech philosophy** | Wide/cheap upgrades vs deep/spiky ones. |
| **Signature mechanic** | One unique verb per faction (a build mechanic, a resource) that only they play. |

Balance them not by making them equal but by making each **strong at a different
timing** — asymmetry balances *across* the game clock, not within a single stat.
Ground every faction's fiction in [[world-faction-identity]] so the mechanics
*read* as a culture, not a stat block.

## Battle spectacle — the payoff shot

The reason to watch: two armies colliding must look *impressive* and stay
*readable*.

- **Legibility first.** Silhouette and color-code unit roles so a 100-unit fight
  parses at a glance — [[pattern-readability]]. Spectacle that can't be read is
  noise.
- **Choreography is cosmetic.** The sim resolves the fight; the view replays hit
  flashes, death animations, dust, screen-shake — all deletable without changing
  a sim bit (FUN.md law 6). Never let spectacle touch `world.hash()`.
- **Scale legibly.** Pooled sprites and flow-field movement keep hundreds of
  units cheap; the *mass* is the spectacle.

## Content & difficulty model

- **Balance is the content.** Matchups, not levels. The intended line beating
  attack-move (law 2 skill-delta) is the health check.
- **AI tiers = economy handicaps + better build orders**, not stat cheats the
  player can't see. See [[system-difficulty-and-dda]].
- **Skirmish maps** are the container; procedural or hand-made, they must be
  symmetric-fair (equal resources, mirrored expansions).

## Signature-mechanic seeds

- **RTS but you ARE one hero in the battle** *(perspective)* — Shadow-of-War
  scale flip; command from inside the fight, morale as your reach.
- **RTS but no base — the army is all you get** *(constraint)* — one-loop
  attrition; every unit lost is permanent, forcing preservation micro.
- **RTS but time advances in pulses you trigger** *(structure)* — semi-turn-based
  mass tactics; a bridge to [[genre-tactics]] at army scale.
- **RTS but the map is a living tide** *(theme + mechanic-swap)* — terrain
  floods/regrows on a clock; positioning fights the map, not just the enemy.
- **RTS but one faction plays the economy and one plays the army** *(perspective
  + coop)* — asymmetric two-player command. Pairs
  [[system-coop-and-competition]].

## Common pitfalls

- **Attack-move wins.** If a-move beats every plan, macro and composition are
  decorative — the whole game collapses. This is the first thing to disprove.
- **Reskin factions.** Same units, different colors = no asymmetry, no replay.
  Differentiate the *economy and roster*, not the palette.
- **Pathing that clumps or stalls.** Units that pile at walls or block each other
  break "mass under command." Flow fields, cached outside state, are the fix.
- **Unreadable battles.** A gorgeous fight you can't parse is a loss for the
  player. Legibility gates spectacle.
- **Snowball with no comeback.** A single lost fight ending the match kills
  tension — leave comeback vectors (defensive tech, eco recovery). See
  [[pattern-feedback-loops]].

## Anchors

- [[anchor-starcraft]] — three rosters, one balance; the reference for asymmetry
  done right. Steal the "strong at different timings" balance philosophy.
- [[anchor-age-of-empires]] — the eco/tech ramp and age-up power spikes; steal
  build orders and the economy-as-tension model.

## Verify

Prove it in **[FUN.md §9 · RTS-lite](../FUN.md#9--rts-lite)**: every
counter edge wins its NvN duel, the commander/intended-line bot beats
attack-move, a walled-off unit routes around, and ms/step holds at peak unit
count.

## Composes with

- [[system-faction-asymmetry]] — the different-but-fair identities that give the
  genre its replay value.
- [[system-economy]] — the macro tension every strategic decision trades against.
- [[system-enemy-ai]] — the order-obeying, beatable minds behind the mass.

## See also

- [`sandboxes/pathfinding-demo`](../../sandboxes/pathfinding-demo) — flow-field
  mass pathing; the load-bearing tech for hundreds of wall-aware units.
- [`sandboxes/particle-workshop`](../../sandboxes/particle-workshop) — pooled sprites
  and effects for cheap, legible battle spectacle (cosmetic, law 6).
- [design/JUICE.md](../JUICE.md) — impact feel for the payoff shot without
  touching the sim.
