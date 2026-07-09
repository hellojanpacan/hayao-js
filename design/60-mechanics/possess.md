---
id: mechanic-possess
title: Possess / Body-Swap
kind: mechanic
tags: [control, puzzle, stealth, perspective]
summary: Leave your body to control another — the puzzle is which vessel solves which room.
use-when: You want perspective puzzles or "the right tool is a body" design.
composes-with: [mechanic-teleport, genre-stealth, pattern-emergence]
anchors: [anchor-dishonored]
verify-with: design/FUN.md#5-·-stealth
---

**What it is.** Detach your controlling **self** from your body and pilot another actor — an enemy, an animal, a machine. The room is a lock; the right body is the key.

**Player fantasy / why it's fun.** You are not a hero, you are a **ghost with options**. Every guard, rat, and turret becomes a possible you. The fun is the recon-then-inhabit rhythm: read the room, pick the vessel that trivializes it, wear its powers, discard it.

## The verb
Select a valid host in range → **transfer** control → inherit its body, abilities, and limits until you leave or it dies.

## How it feels / why it's fun
- **Identity as inventory.** Bodies are tools you don't carry — you find them placed in the level. Recon is loadout selection.
- **The dropped shell.** Your empty body is loot and liability. Leaving it exposed is the tension tax on freedom. See [[pattern-risk-reward]].
- **Aha through eyes.** A wall is a wall until you're the bird that flies over it. The solve is a **swap**, not a jump. Kin to [[pattern-emergence]] — the room's affordances change with the vessel.
- **Perspective churn.** Constant reframing keeps a small level dense. One corridor plays five ways.

## Tuning levers
| Lever | What it controls | Sane default |
|---|---|---|
| **Carry-over** | What survives the swap (nothing / health / keys / memory) | Position + objective only; body-specific gear stays behind |
| **Range** | How far you can reach a host | Line-of-sight, ~1 room; too far erases positioning play |
| **Duration** | Timed occupancy vs. indefinite | Indefinite; add a drain only if you want [[pattern-pacing-and-tension]] |
| **Host pool** | How many actors are valid vessels | 40-70% of actors; too few and it's a lock-and-key, not a toy |
| **Shell state** | Empty body persists / vanishes / auto-returns | Persists and vulnerable — the vulnerability *is* the design |
| **Return cost** | Ease of getting back to your true self | Free if adjacent; expensive across the map |
| **Ability grain** | Do you get the host's full kit or a subset | Full kit — surprise powers reward experimentation |

Defaults tuned for a puzzle-forward possess. For a combat toy (see [[anchor-dead-cells]] pace), shorten range, cheapen swaps, let it flow mid-fight.

## Slots into
- [[genre-stealth]] — the canonical home: possess a guard to walk past his friends. See [[anchor-dishonored]] (Possession rune), [[anchor-shadow-of-mordor]] (dominate the orc, not the body, but same fantasy).
- [[genre-immersive-sim]] — bodies as one more systemic key alongside doors, keys, and grease.
- [[genre-grid-puzzle]] / [[genre-puzzle-platformer]] — deterministic vessels on a grid make swaps machine-provable. Build the rules as a pure `Puzzle<State, Move>` like `examples/sokoban/`.
- [[genre-metroidvania]] — a host's ability is a **gate key**; possessing the flying enemy is your double-jump. Pairs with [[system-progression]].
- [[genre-tactics]] — mind-control a unit to turn the enemy's numbers into yours; a swing bigger than any attack.
- [[genre-horde-survival]] — jump bodies to survive; your health pool is the whole crowd.

## Twist seams
- **Possess but the host fights your control** (risk-reward) — occupancy runs a struggle meter; strong hosts buck, ejecting you at the worst moment or forcing quick, dirty use. The best vessel is also the least reliable. Tune with [[system-difficulty-and-dda]]; feel it as [[pattern-risk-reward]].
- **Possess but you can only leave a body when it dies** (constraint) — no free exit. To swap, you must spend the current host. Every body is a **one-way ride**; picking your next vessel becomes a life-or-death commit. Turns the mechanic into resource management — see [[system-resource-loops]].
- **Possess but the shell keeps acting** (emergence) — your dropped body wanders on a routine, or dies, or gets found. Now you juggle two timelines. Leans on [[pattern-emergence]].
- **Possess but only the dead** (constraint) — you inhabit corpses; the level's history is your toolkit. Reframes killing as key-crafting.

## How it wires to Hayao
- **Control indirection.** Model an explicit "controlled entity" pointer in world state; input routes to whoever it points at. Swapping is reassigning the pointer — cheap, deterministic, replayable.
- **Bodies as data.** Give each actor its ability set and limits as plain fields; a host isn't special-cased, it's just the actor the pointer names. Study [[system-enemy-archetypes]] for the vessel roster.
- **Deterministic reach.** Host-in-range checks read from the scene tree; keep iteration ordered so the "valid targets" set is identical every run. The struggle/eject roll goes through the deterministic RNG, never wall-clock time.
- **Puzzle proof.** For grid or turn-based possess, keep rules in a pure module and machine-prove each level winnable (the [[genre-grid-puzzle]] discipline). The vessel roster is part of the move set.
- **View, not logic.** The "who am I" outline, the ghost trail on swap, the shell's idle animation — all cosmetic; they must not touch the world hash. Prove it, then juice it via [[pattern-juice-choreography]].
- For the swap camera hand-off and follow behavior, prototype the parts in a `sandboxes/`-style single-mechanic lab before wiring the whole game.

## Fails when…
- **Every body is the same body.** If hosts don't differ in ability, possession is a reskin of [[mechanic-teleport]] with extra steps. Differentiate the vessels or cut the mechanic. Beware [[antipattern-false-depth]].
- **The best vessel is always obvious.** One dominant host collapses the choice; you stop reading the room. See [[antipattern-boring-optimal]].
- **The shell is never at risk.** If leaving your body costs nothing, the tension evaporates and it's just fast travel.
- **Return is a chore.** Fussy re-inhabiting between every idea taxes exploration — [[antipattern-backtracking-tax]].
- **Too many valid hosts, no reason to choose.** Infinite bodies with a fuzzy goal is [[antipattern-decision-paralysis]], not freedom.
- **Perspective without payoff.** Swapping that never changes what you can *solve* is novelty, not mechanic.

## See also
- [[mechanic-teleport]] — the closest cousin; possess is teleport that hands you a new body and its rules.
- [[mechanic-clone]] — one mind, many bodies at once, versus possess's one-at-a-time.
- [[mechanic-lock-on]] — target selection under pressure is the same UX problem as host selection.
- [[system-enemy-archetypes]] · [[system-enemy-ai]] — your vessels are your enemies; design them to be worth wearing.
- [[genre-stealth]] · [[anchor-dishonored]] — the reference implementation of possession-as-traversal.
- [[pattern-risk-reward]] · [[pattern-emergence]] — the two patterns possess lives or dies by.
