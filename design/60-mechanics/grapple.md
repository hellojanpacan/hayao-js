---
id: mechanic-grapple
title: Grapple / Hookshot
kind: mechanic
tags: [movement, traversal, swing, reach, tool]
summary: A tethered pull to a point — reach as a verb; anchors turn the map into a network of handholds.
use-when: You want expressive long-range traversal or object-pulling that rewards target reads.
composes-with: [mechanic-swing, mechanic-throw, system-map-and-navigation]
verify-with: design/JUICE.md
---

**What it is.** A **tether** fired at a point; on contact it reels — pulling the player to the anchor, or the anchor to the player. Reach becomes a button, and every valid anchor is a handhold on the map's mesh.

**Player fantasy / why it's fun.** The map stops being floor and becomes a **lattice of grab points**. You read a distant hook, fire, and the world snaps closer — the payoff of *spotting* the line lands before the payoff of *taking* it.

### The verb
Aim at an anchor → fire tether → reel. Land, cancel, or transition into a swing.

### How it feels / why it's fun
- The joy is **target acquisition**, not the arc. A grapple is a scan-and-commit read: see it, trust it, go. Reward the read (see [[pattern-readability]]).
- Two feels, one verb. **Instant-pull** (Zelda hookshot) is a decisive teleport-on-a-rope — crisp, arcade, no momentum. **Momentum-swing** (Spider-Man's web-swing) keeps velocity and hands you an arc to steer; that's [[mechanic-swing]]'s domain — grapple *enters* it.
- Reeling is a **curve you own**. Variable reel speed, air-steer during the pull, and a release window turn a straight line into a controllable trajectory. The skill ceiling lives in the release, not the fire.

### Tuning levers
| Lever | Does | Sane default |
|---|---|---|
| Pull mode | Instant-pull vs momentum-swing | Instant-pull to start; unlock swing later |
| Max range | How far a valid anchor can be | 6–10 player-heights |
| Reel speed | Time to close the gap | 0.25–0.5s to travel full range |
| Air control during reel | Steer the pull | Light; full steer only for swing mode |
| Release velocity | Kept speed on detach (swing) | ~1.0–1.4× swing speed |
| Anchor cooldown | Regrab delay per anchor | 0 for instant; short for swing chains |
| Aim assist | Snap to nearest valid anchor in a cone | On for pad, generous cone |
| Miss penalty | Cost of firing at nothing | Cheap; brief recovery, no death |

### Anchor telegraphing (do not skip)
A grapple is only as good as your ability to **read the anchor**. Un-telegraphed anchors turn traversal into guessing — the [[antipattern-guess-the-designer]] trap.
- Give valid anchors a **consistent, diegetic silhouette** — rings, beams, glowing nodes. One visual grammar, honored everywhere.
- **Highlight in range.** When a reticle crosses a reachable anchor, snap the reticle or bloom the node. The player should never fire to *test* range.
- Distinguish **grapple-to** (pull self) from **grapple-pull** (pull object) by color or icon — mixing them silently is an [[antipattern-input-lie]].
- This is [[system-telegraphs]] applied to level geometry; keep it in the readability budget of [[pattern-juice-choreography]].

### Slots into
- **Genres:** [[genre-metroidvania]] (the canonical gating tool — a hookshot *is* a key), [[genre-precision-platformer]], [[genre-action-adventure]], [[genre-immersive-sim]], [[genre-physics-arcade]].
- **Anchors:** [[anchor-celeste]] (dash-adjacent commitment reads), [[anchor-dishonored]] (Blink as a cousin verb; grapple is its lateral twin), [[anchor-dead-cells]] (traversal woven into combat).
- **Systems:** [[system-map-and-navigation]] (anchors *are* the nav graph), [[system-progression]] (grapple as an unlock that re-opens old rooms).

### Twist seams
- **Zelda but the hookshot pulls the world to you, not you to it** *(perspective)* — flip who moves. Fire at a crate, a bridge, an enemy: it slides to *you*. Now the same verb solves puzzles by rearranging geometry, and traversal happens by pulling platforms into reach. See [[mechanic-magnet]] for the object-attraction cousin.
- **Grapple but the rope is finite and you spend it** *(constraint)* — the tether is a **consumable length**. Each pull eats meters; you scavenge or recoil-reclaim rope. Reach becomes a resource-management read — where to spend, where to walk. Pairs with [[system-resource-loops]] and the tension pacing of [[pattern-risk-reward]].
- **Grapple but only onto things you first threw there** *(inversion)* — no native anchors; you plant your own by tossing a spike ([[mechanic-throw]]), then hook it. Traversal becomes a two-verb sentence you author yourself.

### How it wires to Hayao
- Grapple is deterministic vector work: anchor set, a validity/range query, and a reel that interpolates position over fixed ticks. Route any aim-assist tie-break through a **deterministic RNG** or ordered iteration so a replay hashes identically — never argless timing.
- Study the swing/tether feel in the **`sandboxes/physics-lab`** (rope constraint, release velocity) and read the logic/view split in **`examples/sokoban`** if you build the pull-the-world variant as a grid puzzle — the pull is a pure `Move`, the arc is cosmetic.
- Keep the reticle, rope, and reach-bloom **cosmetic** — they must stay out of the world hash. The *pull result* is state; the *rope you draw* is not.
- Prove the *feel* against design/JUICE.md; prove *anchor reachability* the way a puzzle proves winnability — every gated room must have a reachable anchor path.

### Fails when…
- **Anchors aren't legible.** Invisible or ambiguous grab points make every fire a coin-flip — [[antipattern-guess-the-designer]].
- **The read is trivial.** One glowing hook per screen with infinite range is a cutscene with a button. Ask for a *choice* of anchor or a timed release.
- **Momentum lies.** If the release keeps less speed than the swing implied, the arc feels dead — [[antipattern-input-lie]] on the exit.
- **It replaces walking.** When grapple is strictly faster everywhere, the floor goes dead and every room is a hook-spam — the [[antipattern-boring-optimal]] collapse. Reserve anchors; make ground travel a real alternative.
- **Range creep.** Ever-longer rope with no new read is [[antipattern-power-creep]]; grow the *puzzle*, not the meter.
- **Backtracking with no fast lane.** A grapple-gated Metroidvania that makes you re-cross cleared rooms on foot is a [[antipattern-backtracking-tax]].

### See also
[[mechanic-swing]] · [[mechanic-dash]] · [[mechanic-teleport]] · [[mechanic-throw]] · [[mechanic-magnet]] · [[mechanic-wall-jump]] · [[system-telegraphs]] · [[system-map-and-navigation]] · [[pattern-readability]] · [[pattern-risk-reward]] · [[genre-metroidvania]]
