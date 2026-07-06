---
id: mechanic-throw
title: Throw / Carry
kind: mechanic
tags: [physics, object, coop, puzzle]
summary: Pick up and hurl a thing — makes the world into ammo, keys, and shared burdens.
use-when: You want object interaction, coop hand-offs, or physics puzzles.
composes-with: [mechanic-grapple, genre-coop-chaos, pattern-emergence]
anchors: [anchor-overcooked]
verify-with: docs/FUN.md#19-·-physics-arcade
---

**What it is.** A two-beat verb: **pick up** a loose object, then **release** it — drop, place, or hurl along an arc. The carried thing rides *on* the player, so holding it changes what the player can do until they let go.

**Player fantasy / why it's fun.** The world stops being scenery and becomes **inventory you can weaponize**. Any barrel, plate, or teammate is a projectile, a key, or a stepping-stone the moment your hands close on it. The pull is agency over *objects*, not just over yourself.

### The verb
Grab (enter carry) → move under a **carry constraint** → aim → throw (exit carry) OR place (soft exit). Two decisions: *what to hold* and *where to let go*.

### How it feels / why it's fun
- **Carry is a cost, not a free pocket.** The best throw mechanics make holding *expensive* — you move slower, can't [[mechanic-dash]] or [[mechanic-double-jump]], your hands are full. Every carried second is a lockout of your other verbs. That tension is the game.
- **The arc is a read.** A thrown object obeys gravity; landing it is a lob-and-lead skill, not a hitscan. Aim ceiling lives in the arc, like [[anchor-peggle]] and [[mechanic-bounce]].
- **Emergence for free.** Once objects have mass, position, and effects, throwing *composes* — a lit torch thrown into oil is a sentence the designer never wrote. This is [[pattern-emergence]]'s cheapest engine.

### Tuning levers
| Lever | Does | Sane default |
|---|---|---|
| Carry slowdown | Move-speed penalty while holding | 0.6–0.8× base |
| Verb lockout | Which abilities carry disables | Dash + jump-tech off; walk only |
| Carry capacity | How many things at once | 1 (scarcity forces routing) |
| Throw arc | Flat toss vs high lob | Mid-arc; aimable via hold-charge |
| Charge time | Hold-to-throw-farther window | 0.2–0.5s to full power |
| Auto-pickup radius | Grab-nearest vs precise grab | Small; precise beats fumbly |
| Object persistence | Does it despawn on landing | Persist — landed objects are level state |
| Drop vs throw | Soft place under a **place button** | Split them; silent conflation lies |
| Friendly-fire | Can a throw hit an ally | On for chaos; off for pure puzzle |

### Slots into
- **Genres:** [[genre-physics-arcade]] (its native soil), [[genre-coop-chaos]] (hand-offs *are* the game), [[genre-grid-puzzle]] and [[genre-puzzle-platformer]] (throw as a discrete, provable move), [[genre-survival-horror]] (scarce improvised weapons), [[genre-sandbox-survival]].
- **Anchors:** [[anchor-overcooked]] (throw an onion across the kitchen to beat the clock), [[anchor-katamari]] (carry-mass reframed as growth), [[anchor-it-takes-two]] and [[anchor-portal]] (carried objects as puzzle keys), [[anchor-nuclear-throne]] (thrown weapons as spent ammo).
- **Systems:** [[system-inventory-and-ui]] (what "held" means on-screen), [[system-hazards-and-environment]] (throwing *into* hazards), [[system-crafting]] (carry ingredients to a station), [[system-coop-and-competition]].

### Twist seams
- **Throw but you can throw your co-op partner** *(perspective)* — the projectile is a *player*. One hurls, the other becomes a directed body: cleared gaps, out-of-reach switches, a launched tackle. Now every throw is a two-brain negotiation and the carried "object" has opinions. See [[anchor-it-takes-two]] and [[genre-coop-chaos]]; the launched partner can chain into [[mechanic-glide]] or [[mechanic-grapple]] mid-flight.
- **Throw but thrown items keep their momentum as platforms** *(emergence)* — a hurled crate doesn't stop on impact; it *stays* a moving surface you can ride or stack. Throw your own footing ahead, then land on it. Traversal becomes level authoring in real time — pairs with [[mechanic-stack]] and [[pattern-emergence]].
- **Throw but only onto things you must first place** *(inversion)* — no native handholds; you plant an object, then hook or leap to it, as in the grapple seam of [[mechanic-grapple]]. The throw *is* the setup move.

### How it wires to Hayao
- Model carry as **held-object state on the carrier** plus a **release event** that spawns free physics. A thrown object is a body with position + velocity integrated over fixed ticks — deterministic, replayable, hashable. Any spread or bounce-scatter tie-break goes through a **deterministic RNG** or ordered iteration, never argless timing.
- For the physics feel (arc, mass, bounce, impact), study the **`sandboxes/physics-lab`** in isolation before wiring it into a game.
- If throw is a *puzzle* move (grid, provable), keep it a pure `Move` and model it the way **`examples/sokoban`** splits pushable-object logic from view — the thrown block's landing cell is state; the arc you draw between cells is **cosmetic** and stays out of the world hash.
- The held-object sprite, the aim reticle, and the arc preview are all **cosmetic** overlays. What's held and where it lands is state.
- Prove the *throw feel* against docs/FUN.md#19-·-physics-arcade; prove puzzle levels the way a puzzle proves winnability — every solution must have a reachable throw.

### Fails when…
- **Carry has no cost.** If holding an object doesn't slow, block, or spend anything, it's an invisible backpack — the tension evaporates and it becomes [[antipattern-false-depth]]. Make hands *full*.
- **Aim is a lie.** A reticle that promises an arc the throw doesn't honor is [[antipattern-input-lie]]. The preview must be the physics.
- **Throw dominates every verb.** If hurling is strictly better than walking, meleeing, or shooting everywhere, the rest of the kit goes dead — [[antipattern-boring-optimal]]. Reserve it; gate ammo by what's actually loose in the room.
- **Fumbly pickup.** Grab-nearest that snaps the wrong object turns intent into a wrestling match. Precise grab beats a greedy radius.
- **Coop throws with no telegraph.** Hurling a partner they didn't consent to is grief, not coop — surface the aim, honor the [[pattern-fairness-and-trust]] budget of [[system-coop-and-competition]].
- **Landed objects vanish.** If thrown things despawn, you erase the emergent-tool loop — persistence is what lets a barrel become a platform later.

### See also
[[mechanic-grapple]] · [[mechanic-stack]] · [[mechanic-bounce]] · [[mechanic-magnet]] · [[mechanic-ground-pound]] · [[genre-physics-arcade]] · [[genre-coop-chaos]] · [[genre-grid-puzzle]] · [[anchor-overcooked]] · [[anchor-it-takes-two]] · [[anchor-katamari]] · [[system-coop-and-competition]] · [[pattern-emergence]] · [[pattern-fairness-and-trust]]
