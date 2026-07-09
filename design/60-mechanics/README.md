# 60-mechanics/ — The Verb Library

The **atoms**. Where [`30-systems/`](../30-systems/) gives you the organs, this
section gives you the *verbs* — the single things a player actually **does**:
dash, parry, grapple, rewind, merge. A system is a loop; a mechanic is a press.
Reach here at the [TWIST](../README.md) and [SHAPE](../00-process/core-loop.md)
steps, when you're deciding *what the hands do* — because a game's feel lives in
its verbs, not its menus. This is the shelf that serves the house rule: **design
from the mechanic, not from the corpus.**

Each module says **the verb · how it feels · tuning levers (with defaults) · what
it slots into · twist seams · how it wires to Hayao · fails when…** — so you pick
a verb, tune it, bend it, and prove the *feel* over in [`design/JUICE.md`](../JUICE.md).
Every mechanic names 2–3 "X but Y" seams: the verb is where a twist bites hardest.

Cross-link with `[[mechanic-id]]`; follow `composes-with`.

## Movement & traversal

| id | title | summary |
|---|---|---|
| [[mechanic-dash]] | Dash | A burst of directional speed; the escape/approach verb |
| [[mechanic-double-jump]] | Double Jump | A second air impulse; forgiveness as a verb |
| [[mechanic-wall-jump]] | Wall Jump | Kick off walls; geometry becomes a ladder |
| [[mechanic-wall-run]] | Wall Run | Momentum along a surface; keep feeding it or fall |
| [[mechanic-ledge-grab]] | Ledge Grab | Catch an edge; a near-miss becomes a foothold |
| [[mechanic-climb]] | Climb | Ascend against a stamina bar; freedom rented against a clock |
| [[mechanic-glide]] | Glide | Trade fall speed for control; the soft landing |
| [[mechanic-swing]] | Pendulum Swing | Momentum in, momentum out; release is the skill |
| [[mechanic-grapple]] | Grapple | Reach as a verb; the map becomes handholds |
| [[mechanic-teleport]] | Teleport | Collapse distance into a targeting decision |
| [[mechanic-gravity-flip]] | Gravity Flip | The level stays; your relationship to it inverts |
| [[mechanic-ground-pound]] | Ground Pound | A committed downward strike; height buys power |
| [[mechanic-bounce]] | Bounce / Pogo | Rebound off surfaces and foes; keep the chain alive |

## Combat

| id | title | summary |
|---|---|---|
| [[mechanic-parry]] | Parry | The read that turns the best attack into an opening |
| [[mechanic-deflect]] | Deflect | Turn incoming danger into your ammo |
| [[mechanic-block]] | Block | The patient answer; guard breaks are the tension |
| [[mechanic-dodge-roll]] | Dodge Roll | Evade with i-frames; recovery is the honest cost |
| [[mechanic-charge-attack]] | Charge & Release | Power costs a visible, readable commitment |
| [[mechanic-combo-string]] | Combo String | The depth verb; mastery is knowing what links |
| [[mechanic-lock-on]] | Lock-On | Clarity in a crowd at the cost of tunnel vision |
| [[mechanic-throw]] | Throw / Carry | The world becomes ammo, keys, and shared burdens |

## Manipulation & puzzle

| id | title | summary |
|---|---|---|
| [[mechanic-rewind]] | Rewind | Failure becomes a draft; the puzzle is what NOT to undo |
| [[mechanic-time-stop]] | Time Stop | Bullet-time as a spendable resource |
| [[mechanic-stack]] | Stack | Height is score and jeopardy at once |
| [[mechanic-merge]] | Merge | Fuse like-with-like into the next tier |
| [[mechanic-clone]] | Clone / Echo | Solve alongside your past selves |
| [[mechanic-portal]] | Portal | Carry momentum and sightlines through folded space |
| [[mechanic-magnet]] | Magnet | Action-at-a-distance over metal, foes, and floors |
| [[mechanic-grow-shrink]] | Grow / Shrink | Scale as a key: what fits, what reaches, what crushes |
| [[mechanic-possess]] | Possess | The puzzle is which vessel solves which room |

## Prove the feel, don't restate it

A mechanic is only as good as its feel, and feel is *proven*, not asserted.
Design the verb here; tune and gate it in [`design/JUICE.md`](../JUICE.md)
(the 2-senses contract) and [`src/verify/gates.ts`](../../src/verify/gates.ts)
(the Channel-4 feel-proof gates). For a single verb in isolation — physics,
tweens, particles, camera — read the matching [`sandboxes/`](../../sandboxes/)
lab, not a whole game. Pair every mechanic with [[system-grace]] so the verb
forgives the way a good one should.
