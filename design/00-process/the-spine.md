---
id: process-the-spine
title: The Spine — tension-first design
kind: process
tags: [tension, spine, coupling, resonance, core-loop, coherence, decisions, scarcity]
summary: Find the one tension a game is about, then derive every element as an expression of it — and audit that each one traces back with a resonance table.
use-when: You want a game whose loop, theme, feel, and setting all pull the same direction — a coupled design, not an assembled one. Run this before (or instead of) the twist.
composes-with: [process-pillars, process-core-loop, process-the-twist, process-the-seed, process-refine-and-handoff]
verify-with: design/FUN.md
---

# The Spine — tension-first design

**What it is.** A good game is *one tension, expressed everywhere*. Before you pick
an anchor or a twist, you name the **spine** — the single pressure the player feels
every second — and then you *derive* the rest of the design (theme, setting, feel,
structure, even how death works) as expressions of that one tension. The spine is
not a mechanic and not a theme; it is the **relationship** between what the player
wants, what they can do, and what it costs. Everything else hangs off it.

**Why it's fun.** Fun is a *live decision under pressure*, repeated, that keeps
mattering. [[process-the-twist]] gives you a **pitch** ("X but Y") — a thing you
*say*. The spine gives you a **loop** — a thing you *do*. A pitch can be novel and
still play like a corridor; a spine can't, because it is defined by the tension
that makes each moment a choice. And when every element is derived from the same
spine, the game reads as one thing — the coherence *is* the quality. Celeste's
mountain, its brutal difficulty, its instant respawn, and its story about anxiety
are not four decisions; they are one spine seen from four sides.

> **The tension test.** Say your game as: *"I want **[objective]**, and I can
> **[superpower]** — but every use spends **[scarcity]**, against **[obstacle]**,
> and the situation renews by **[renewal]**."* If you can't fill all five, the loop
> isn't a loop yet — it's a premise.

## The tension skeleton — five parts

The spine is five coupled parts. They are not a menu you pick from; they are one
object described five ways. Change one and the others must move.

| Part | The question | Celeste | RTS |
|---|---|---|---|
| **Objective** | What pulls you forward? | Reach the top of the screen | Out-produce and out-fight the enemy |
| **Superpower** | What is your one agency? | The air-dash | Build economy → army |
| **Scarcity** | What does the power *spend*? | One dash per grounding; position; commitment | **Time** — every worker is an investment or a liability |
| **Obstacle** | What resists? | Spikes, geometry, timing windows | The enemy attacking mid-growth |
| **Renewal** | What re-poses the tension each beat? | Each screen = new geometry + one new interacting mechanic | A *live, adaptive* opponent |

Two of these are the ones designers under-name, and they are the ones that decide
whether you have a game:

- **Scarcity is the engine.** A superpower with no cost is a spam button, and a
  spam button is not a decision. Remove stamina and Celeste's dash is just
  *movement*; remove time and an RTS is just a build order. The scarcity is what
  turns "I have a power" into "**I must choose when to spend it**." If you can't
  name what the superpower costs, you have no tension yet — you have a toy.
- **Renewal is why it's a game and not a puzzle.** A static tension gets solved
  once and goes rote. What keeps Celeste alive is that every *screen* re-poses
  "stamina vs distance" in fresh geometry; what keeps an RTS alive is that the
  pressure is a *live agent* who adapts. Name your renewal source — level geometry,
  an adaptive opponent, an escalating economy, a random draw, or verbs that
  recombine — or you've designed one good moment, not a loop.

## The gate — the superpower must create its own problem

The single strongest property a spine can have: **using your superpower well is
what generates your next obstacle.** When the power and the problem are the *same
lever*, every use is a real decision, and the tension renews for free.

> **The gate:** *Does using my superpower well create my next problem?*
> **Yes** → you have a loop. **No** (the power just cleanly defeats the obstacle)
> → you have a chore. Redesign until the answer is yes.

- Celeste's dash is your recovery *and* it commits you to a trajectory you can't
  cancel — your escape is what strands you.
- Sekiro's deflect is your defense *and* your offense (it builds the enemy's
  posture) — playing safe is playing aggressive.
- An RTS expansion feeds your army *and* thins your defense the moment you take it.

When superpower and obstacle are *separate systems bolted together*, the game
feels like two things sharing a screen. When the superpower is the obstacle-engine,
the loop is self-winding. Aim for the coupled version.

## Coupling — derive everything from the spine

Once the five-part spine holds, you do **not** go shopping for a theme and a feel
and a death rule independently. You *derive* each one as an expression of the same
tension, and you keep only elements that trace back:

- **Setting** makes the tension *physical and legible*. Celeste's mountain isn't a
  backdrop — climbing *is* the objective, and the mountain's height *is* the
  difficulty. The best setting teaches the mechanic with no tutorial.
- **Theme** makes the tension *mean something*. "You will fail many times and must
  keep trying" is Celeste's loop *and* its story about anxiety. The mechanic is the
  metaphor.
- **Feel** (this is a [[../JUICE.md|JUICE]] concern) makes the tension *fair and
  weighty*. Mastery-through-repetition demands that failure is always the player's
  fault, never the controls' — so the inputs must be tight and forgiving.
- **Structure** (run / level-set / campaign / endless) is chosen to *keep the
  tension renewing* at the session scale — see [[process-core-loop]].
- **Death / failure handling** is derived, not defaulted. A retry-mastery spine
  wants instant, non-punishing respawn; a survival spine wants loss that *stings*.
  Pick the one your spine implies.

This is the part [[process-the-twist]]'s "X but Y" can't reach: coupling is
*relational*, so it can't be assembled from independent modules. You reach into the
[parts bin](../README.md) to **name and sharpen** what the spine demands — not to
pick the design off a shelf.

## The resonance table — coupling made auditable

The spine is only as good as its coherence, and coherence is checkable. For every
element of the design, write one row: *how does this express the core tension?* If
you can't fill a cell, that element is [[antipattern-decoration]] (cut it) or
[[antipattern-dissonance]] (it fights the spine — redesign it). A complete table
with no dissonant row **is** the proof the design is coupled.

**Worked example — Celeste.**
**Spine: *ascend under scarce, committal movement — mastery through repetition.***

| Element | Arrow back to the spine |
|---|---|
| Verb: air-dash | The one tool that traverses; agency + expression |
| Scarcity: one dash per grounding | Turns the verb into a *choice*, not a spam |
| **Power creates the problem** | Dash is your recovery **and** commits your trajectory → your escape strands you *(passes the gate)* |
| Renewal: per-screen geometry + 1 new interacting mechanic | Re-poses the same tension fresh every beat |
| Death-handling: instant, non-punishing respawn | Spine is *mastery through repetition*; punishing death would be **dissonant** |
| Setting: a mountain | Objective made physical; difficulty made narrative |
| Theme: anxiety / self-doubt | "Fail, and keep going" *is* the loop — the mountain is the panic attack |
| Feel: tight, forgiving inputs | Mastery requires failure always be *yours*, never the controls' |

Every arrow lands on the same spine. That is what "deeply coupled" means, made
falsifiable. Two flagship recipes carry a full table: [[recipe-emberfall]]
(a committal-movement spine) and [[recipe-waterline]] (a single-master-resource
spine).

## The coherence gate — the third proof

The Codex hands off to three proofs: the solver proves a level is **winnable**,
[design/JUDGE.md](../JUDGE.md) proves it **looks shipped**, and the **coherence
gate** proves the design is **coupled**. The gate is a judgment, not an automated
truth — but it is structured:

1. **Completeness.** Every element has a row, and every row names a real arrow to
   the spine. A missing arrow is [[antipattern-decoration]].
2. **No dissonance.** No element fights the spine. A punishing death in a
   retry-mastery game, a cozy tone on a scarcity-terror spine — that is
   [[antipattern-dissonance]], and it's worse than decoration because it actively
   drains the tension.
3. **The gate holds.** *Using the superpower well creates the next problem.* If not,
   the loop is a chore no coupling will save. This one is **mechanically provable**
   once the game runs: build it twice — coupling intact and coupling neutralized —
   run skilled and lazy play over both, and the skill-gap must **collapse** when the
   coupling is removed. If the gap survives, the tension lives elsewhere and this
   coupling is [[antipattern-decoration]]. That is `assertLoadBearing` from
   `@hayao` — the *ablation proof*, [FUN.md](../FUN.md) law 8.

The completeness and no-dissonance checks (1 & 2) are judgment: an agent runs them
as self-critique before handoff, a human confirms in the workshop playtest. The
gate-holds check (3) is machine-checkable — the ablation proof turns it into a
test. And `scripts/build-design-index.mjs` enforces the *structural* floor — a
recipe that declares a `spine` must carry a Resonance table, and vice versa — so a
half-migrated design can't ship pretending to be coupled.

## How to run it

1. **Name the objective and the one superpower.** What does the player want, and
   what is their single primary verb? Prototype the verb alone in a
   [`sandboxes/*-lab`](../../sandboxes/) — if it isn't interesting in a grey box,
   stop.
2. **Find the scarcity.** What does the superpower spend? If nothing, invent the
   cost — this is the design move that creates the game. (Stamina. Time. Position.
   Ammo. Heat. Light.)
3. **Run the gate.** Make the superpower *create its own obstacle*. Iterate the
   verb+cost until using it well is what generates the next problem.
4. **Name the renewal source.** What re-poses the tension every beat? Without one,
   go back to step 1 — you have a puzzle, not a loop.
5. **Derive the coupling.** Setting, theme, feel, structure, death-handling — each
   as an expression of the spine. Reach into anchors/genres/systems/mechanics only
   to sharpen what the spine demands.
6. **Fill the resonance table.** One row per element. Empty cell → decoration
   (cut) or dissonance (redesign). Run the coherence gate.
7. **Hand off.** Pillars ([[process-pillars]]) fall out of the spine; the loop
   stack ([[process-core-loop]]) is the spine at four timescales; then
   [[process-refine-and-handoff]] to FUN / JUICE / JUDGE.

## Spine vs. twist — when to use which

They are not rivals; the twist is now a **sub-tool of the spine**. Use the spine
as the primary generator — it produces the loop. Use [[process-the-twist]] as *one
way to discover or sharpen a spine*: bending a proven game along a vector often
*reveals* a new tension (Loop Hero's "no map, one loop" constraint surfaced a
fresh attrition spine). The order is: **spine first (what is the tension?), twist
optionally (what bend gives it a fresh face?)** — never *pitch*-first, or you get
a pitch in search of a loop. An authored, iterated **atom** is not a pitch — it is
felt evidence, and [[process-the-seed]] is its lawful entry: run the spine
*backwards* from the atom until it is load-bearing. Same gate, either direction of
travel.

## Traps

- **No scarcity.** A superpower that costs nothing is a toy verb. If you can't name
  the spend, you have no tension — this is the most common empty-loop failure.
- **Bolted-on obstacle.** Superpower and obstacle as separate systems → the game
  feels like two things. Fail the gate loudly and fix it before anything else.
- **No renewal.** One tension, never re-posed, is a single puzzle. Name geometry /
  opponent / economy / draw / recombination, or the game dies after one beat.
- **Decoration.** An element with no arrow to the spine is weight, not depth — see
  [[antipattern-decoration]]. Cut it; it's not free.
- **Dissonance.** An element that *fights* the spine (punishing death in a retry
  game) drains the tension — see [[antipattern-dissonance]]. Worse than cutting.
- **Pitch-first.** Starting from an unfelt sentence ("X but Y", "a game where…")
  and hoping a loop appears. The pitch is the last step, not the first. (An
  *atom* — authored, iterated, felt — is not a pitch; see [[process-the-seed]].)

## Composes with

- [[process-pillars]] — the three pillars are the spine's facets made into a
  scoring function; derive them *from* the spine.
- [[process-core-loop]] — the loop stack is the spine expressed at moment /
  encounter / session / meta. The scarcity lives at the moment layer; the renewal
  lives at encounter/session.
- [[process-the-twist]] — the sub-tool for finding or refreshing a spine's face.
- [[pattern-meaningful-choice]] / [[pattern-risk-reward]] — a spine's scarcity is
  what makes choices real trades; these are the patterns it expresses.
- [[pattern-mastery-and-flow]] / [[pattern-pacing-and-tension]] — renewal and feel
  are graded here.

## See also

- [design/FUN.md](../FUN.md) law 8 — where the spine's tension becomes a *proof*:
  the superpower-creates-problem gate is the **ablation proof** (`assertLoadBearing`),
  which disables the coupling and asserts the skilled-vs-lazy gap measurably
  collapses. This is the mechanical half of the coherence gate above.
- [`sandboxes/`](../../sandboxes/) — prototype the superpower+scarcity in isolation
  before deriving anything above it.
- [AGENTS.md](../../AGENTS.md) "Design from the mechanic, not from the corpus" — the
  spine *is* the mechanic-first method; the parts bin stays a dictionary.
