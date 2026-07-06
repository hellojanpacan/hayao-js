---
id: process-core-loop
title: The Core Loop Stack
kind: process
tags: [core-loop, gameplay-loop, verb, feedback, reward, progression, pacing, engagement]
summary: Design the nested loop stack — moment / encounter / session / meta — and the verb→challenge→feedback→reward→growth cycle inside each layer.
use-when: You have pillars and need to design the actual moment-to-moment play and how it nests up into a session and a reason to return.
composes-with: [process-pillars, process-composition, process-refine-and-handoff]
verify-with: docs/FUN.md#part-2--per-genre-cheat-sheet
---

# The Core Loop Stack

**What it is.** A game is **loops inside loops**. The smallest is one input and its
answer; the largest is the reason you open it again tomorrow. Design each layer,
then **nest** them so every turn of a small loop advances a bigger one.

**Why it's fun.** Fun is a satisfying loop, repeated, that keeps meaning more. A
loop that doesn't feed the loop above it is a treadmill; a stack where each turn
compounds is *"one more run."* The nesting is the engagement.

## The step

Pillars → the loop stack. You design four layers and the single cycle that runs
inside each of them, then check every layer expresses a pillar.

## The four layers

| Layer | Timescale | The question it answers | Reference |
|---|---|---|---|
| **Moment** | 1 frame – 2 s | "Does the second-to-second feel good?" | the dash, the shot, the swap, the placement |
| **Encounter** | 10 s – 2 min | "Is a single unit of challenge satisfying?" | a room, a wave, a hand, a corner, a fight |
| **Session** | 5 – 40 min | "Is one sitting a complete arc?" | a run, a level set, a match, a day |
| **Meta** | across sessions | "Why open it again?" | unlocks, mastery, collection, story |

Not every game needs all four fully loaded. A pure-mastery arcade game
([[anchor-tetris]]) is almost all *moment*, thin meta. A roguelite
([[anchor-hades]]) leans hard on *meta*. Match the weight to the brief's
**session length** and fantasy — but design each layer *consciously*, even the
thin ones.

## The cycle inside every layer

Each layer runs the same five-beat cycle. The layers differ in timescale, not in
shape.

```
VERB ──▶ CHALLENGE ──▶ FEEDBACK ──▶ REWARD ──▶ GROWTH ──┐
  ▲                                                      │
  └──────────────────────────────────────────────────────┘
```

- **Verb** — the thing the player *does*. One primary verb per layer; the moment
  layer's verb is the game's soul (jump, place, draft, fire).
- **Challenge** — what resists the verb. A gap, a guard, a wave, a bad hand.
- **Feedback** — the game answers *legibly and on ≥ 2 senses*. This is a
  JUICE.md concern — design the *event*, prove the feel there (see
  [docs/JUICE.md](../../docs/JUICE.md) Part 3).
- **Reward** — what the success buys: territory, a pickup, a clear, a card.
- **Growth** — how the reward changes future turns: more power, more options, a
  new verb. Growth is the hook into the *next layer up*.

## How to run it

1. **Name the moment verb first.** The one input the whole game orbits. If it
   isn't fun alone, in a grey box, nothing above it saves the game. Prototype it
   as a `sandboxes/*-lab` before anything else.
2. **Build the encounter around the verb.** One clean unit of challenge that
   demands the verb. This is your smallest shippable, verifiable thing.
3. **Shape the session** as a *sequence* of encounters with a curve — rise,
   breather, peak (pacing is [[pattern-pacing-and-tension]]). A session must
   *end*, and end at its peak.
4. **Design the meta hook.** What does finishing a session *change*? Unlock,
   record, story beat, collection tick. Weight it to session length: short
   sessions need strong meta; long ones can carry themselves.
5. **Nest — the load-bearing step.** Wire each layer's **growth** to the layer
   above: encounter reward feeds the session build; session reward feeds meta
   progression. If a layer's growth feeds nothing above, it's a dead end.
6. **Score against pillars.** Each layer should *dramatise* a pillar. A loop that
   expresses no pillar is a mechanic with no reason to exist.

## Worked example

**Intent:** *"a chill deckbuilder I can play in short bursts."* Pillars: (1) *every
run rewrites the deck*, (2) *decisions with teeth*, (3) *a clean 20-minute arc*.
X = [[anchor-slay-the-spire]].

| Layer | Verb | Challenge | Feedback | Reward | Growth (→ up) |
|---|---|---|---|---|---|
| Moment | play a card | mana + timing | number pops, sfx, flash | damage / block | tempo this turn |
| Encounter | win a fight | enemy intent | telegraph resolves as shown | HP kept, gold | **card reward → session build** |
| Session | finish a run | boss + curve | run summary | victory / death | **unlock → meta** |
| Meta | unlock cards | rarer picks | new draft-of-3 options | expanded pool | **future runs diverge (pillar 1)** |

The nesting is explicit: the card reward (encounter) *is* the session's deck; the
run's unlock *is* the meta's new option. Every arrow points up. Pillar 1 lives in
the meta→moment feedback: yesterday's unlock changes today's draft.

**Verify the loop, don't just draw it.** The deckbuilder's *"decisions with teeth"*
pillar becomes a FUN.md §11 draft-delta proof (drafting on beats drafting off by a
margin) — declared here, proven there.

## Diagnosing a weak loop

| Symptom | Likely broken layer | Fix |
|---|---|---|
| "Feels like a treadmill" | growth feeds nothing above | wire the nesting; make a reward change the next layer |
| "Great for 5 min then boring" | encounter has no variety | vary the challenge, not the verb ([[system-enemy-archetypes]]) |
| "No reason to come back" | thin/absent meta | add a meta hook sized to the session |
| "Every run feels the same" | growth doesn't diverge | make rewards branch ([[system-build-diversity]]) |
| "The core just isn't fun" | the **moment verb** | stop; the verb is wrong — re-prototype it in isolation |
| "Rewards feel hollow" | feedback, not reward | it's a feel gap → [docs/JUICE.md](../../docs/JUICE.md), not more loot |

The single most common failure is a **weak moment verb** propped up by heavy meta
— unlocks papering over a core that isn't fun. No amount of meta fixes a bad
moment. Fix the bottom of the stack first.

## Traps

- **Skipping the moment prototype.** Designing session/meta before the verb is fun
  is building a tower on sand. Grey-box the verb first.
- **Loops that don't nest.** Four independent loops are four treadmills. The stack
  is only alive if growth climbs it.
- **Meta as a bribe.** Progression that exists to mask a dull core is a
  psychological trick, not a design ([[system-reward-schedules]] has the ethics).
- **A session with no end.** "Endless" still needs a peak and a resolution per
  sitting, or it's just noise until you quit.
- **Confusing feedback with reward.** Juicy feedback on a worthless reward still
  feels empty; a great reward with no feedback feels flat. You need both.

## Composes with

- [[process-pillars]] — every layer must dramatise a pillar; the loop is where
  pillars become play.
- [[process-composition]] — the systems you compose are *what fills the layers*
  (progression → meta, economy → session, combat → encounter).
- [[pattern-mastery-and-flow]] / [[pattern-pacing-and-tension]] — the moment and
  session layers live or die on flow and pacing.
- [[system-progression]] / [[system-meta-progression]] — the meta layer's engine.

## See also

- [docs/FUN.md](../../docs/FUN.md) Part 2 — each genre's *mechanical truth* is the
  proof that its core loop actually holds; find your genre and its verify pattern.
- [`sandboxes/`](../../sandboxes/) — the place to prototype a moment verb in
  isolation before you build the stack on top of it.
