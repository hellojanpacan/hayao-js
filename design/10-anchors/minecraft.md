---
id: anchor-minecraft
title: Minecraft
kind: anchor
tags: [sandbox, survival, crafting, self-set-goals, emergent]
summary: A block world with no goals but yours — mine, craft, build; the player authors the objective and the world remembers it.
use-when: You want open-ended creation where players set their own goals in a systemic world.
composes-with: [genre-sandbox-survival, system-crafting, pattern-emergence]
anchors: [anchor-minecraft]
verify-with: docs/VERIFICATION.md
---

**What it is.** A uniform grid of destructible/placeable blocks with a legible material grammar (wood→planks→sticks→tools). You gather, craft, and build. The game hands you no quest; the day/night threat and your own ambition supply all the pressure.

**Player fantasy / why it's fun.** The world is clay and it *persists*. You point at a hill and it becomes a fortress because you decided so — and the thing you built is still there tomorrow, editable, yours. Every session the player writes the objective; the game only guarantees the medium.

## Design DNA

The compressed essence — four parts, none optional:

1. **Uniform block grammar.** One cell type, one interaction verb (break/place). Everything legible is built from that atom. Consistency is what makes the world feel *knowable* and buildable — see [[pattern-readability]].
2. **Gather → craft → build loop.** Raw material becomes intermediate becomes tool becomes the ability to gather *harder* material. A tight [[process-core-loop]] where each turn of the wheel widens the next. See [[system-crafting]], [[system-resource-loops]].
3. **Day/night threat clock.** A rhythmic, non-punitive pressure that structures the session without dictating a goal. Night is a soft deadline; the world imposes tempo, not tasks. See [[system-weather-and-time]], [[pattern-pacing-and-tension]].
4. **Zero mandated goal.** No fail-state you didn't opt into, no quest arrow. The **contract**: the game supplies a systemic medium and *durable memory*; the player supplies intent. This is the load-bearing move — steal this before anything else.

## Load-bearing structures

| structure | why it works |
|---|---|
| **Player-authored goal** | With no quest, ambition becomes the engine. The world is a canvas that answers back. Pairs with self-directed [[system-quests-and-objectives]] (optional, opt-in). |
| **Persistent, editable world** | Builds survive across sessions and can always be un-built. Permanence *plus* reversibility is what invites experiment — see [[system-save-and-checkpoint]]. |
| **Legible material tiers** | wood→stone→iron→diamond reads as a difficulty/reward ladder without a menu. The [[system-tech-tree]] is *physical*, discovered by mining down. |
| **Recipe crafting** | Fixed input→output rules the player memorizes and combines. Depth from combination, not from stat sliders. See [[system-crafting]]. |
| **Day/night clock** | Free tempo: build by day, defend by night. A [[pattern-feedback-loops]] pressure that never issues an order. |
| **Emergent systems (water, gravity, redstone)** | A handful of local rules interacting produce contraptions no designer authored. The source of the deepest play — see [[system-emergent-systems]], [[pattern-emergence]]. |
| **Procedural terrain** | Every world is new, so exploration stays fresh and the "what's over there" pull never dies. See [[system-procgen-design]], [[genre-exploration]]. |

## What to steal

- **The authorship contract.** Supply a medium + durable memory; let the player supply the goal. This is the whole game and it ports to any genre.
- **Atomic, uniform grammar.** One interaction verb applied to one cell type. Restraint *is* the buildability — see [[pattern-restraint-and-negative-space]].
- **Physical tech tree.** Encode progression as material you dig toward, not as an unlockable list.
- **Craft as combination.** Fixed recipes the player *learns*; combinatorial depth beats numeric depth. Avoids the trap of [[antipattern-false-depth]].
- **Ambient threat clock.** A rhythmic pressure (night, tide, season) that shapes sessions without scripting them.
- **Local rules that interact.** A few simple systems (fluid flow, gravity, signal) that compose into machines. This is where surprise lives — [[pattern-surprise-and-delight]].

## What's just theme (drop it)

- **The voxel look.** Blocks are the *grammar*, not the aesthetic. The contract survives in 2D, hex, isometric, hand-drawn. Terraria proves the DNA runs sideways in 2D.
- **Zombies/creepers specifically.** The night threat matters; its *skin* is free — pick from [[system-enemy-archetypes]] or make it environmental.
- **Survival meters (hunger).** Optional flavoring of the resource loop, not the core. Creative mode ships without them and the game still holds.
- **The Ender Dragon / "ending".** A vestigial goal bolted on late. The pure form has no ending — resist the urge to add one just to have one.
- **Nether/dimensions.** Content breadth, not DNA. Skippable in a small build.

## Composes into

- **Genres:** [[genre-sandbox-survival]] (native), [[genre-survival-horror]] (crank the night, starve the resources), [[genre-city-builder]] (freeze the player as architect), [[genre-exploration]] (foreground the procedural terrain).
- **Systems:** [[system-crafting]], [[system-resource-loops]], [[system-emergent-systems]], [[system-procgen-design]], [[system-tech-tree]], [[system-weather-and-time]], [[system-save-and-checkpoint]].
- **Patterns:** [[pattern-emergence]], [[pattern-feedback-loops]], [[pattern-readability]], [[pattern-restraint-and-negative-space]].
- **Co-op:** shared canvas + shared memory is a natural [[system-coop-and-competition]] seam — see [[genre-coop-chaos]] for the chaos variant.

## Twist seams

Each is "X but Y" with a twist vector in parens — mine these before you clone:

- **Minecraft but the world is 2D and gravity-driven (Terraria)** *(perspective)* — collapse the grid to a side-view plane and let dug ceilings fall. The authorship contract survives intact; the change is camera + physics, and combat sharpens because threats now come *along a line*, not a sphere. Proof that the DNA is not the voxel look.
- **Sandbox but every night the world edits your builds** *(structure)* — the day/night clock stops being ambient and becomes an antagonist that *rewrites your work*. Now building is a dialogue: you place, the world overwrites, you adapt. Turns a calm canvas into a tense [[pattern-risk-reward]] loop. Cousin of [[anchor-frostpunk]]'s hostile world; watch [[antipattern-fail-loop-tax]] if the edits feel like theft.
- **Crafting but the recipes are hidden and discovered by experiment** *(information)* — strip the recipe book. Combination becomes deduction, closer to [[anchor-return-of-the-obra-dinn]]'s "figure out the rule". Raises the ceiling but risks [[antipattern-guess-the-designer]] — telegraph the space of legal inputs.
- **Block world but you only ever subtract** *(constraint)* — no placing, only carving. The world starts solid; every level is a sculpture you excavate. Turns building into a grid puzzle — see [[genre-grid-puzzle]].

## See also

- [[anchor-terraria]] — the 2D-gravity execution of this exact DNA; read it as the sibling anchor.
- [[anchor-stardew-valley]] / [[anchor-rimworld]] — what happens when you *do* supply goals over a systemic sandbox (farm loop; colony story).
- [[anchor-factorio]] — the gather→craft→build loop pushed to industrial automation and [[system-emergent-systems]] as the whole point.
- [[anchor-animal-crossing]] — persistent, editable, no-goal world with the threat clock removed entirely (cozy, not survival).
- [[process-the-twist]] — how to pick which seam above is *your* game, not just a mod of this one.
- **Prove it** at `docs/VERIFICATION.md` — determinism of the procedural world and persistence of the edit-log are the things to assert on, not the look.
