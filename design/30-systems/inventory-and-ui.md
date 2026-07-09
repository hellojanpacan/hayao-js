---
id: system-inventory-and-ui
title: Inventory & UI
kind: system
tags: [ui, information, clarity, items, management]
summary: How the game shows state and lets you act on it — the interface is a design surface; friction here is friction everywhere.
use-when: Managing items/state is becoming a chore, or the HUD is crowding the play.
composes-with: [pattern-readability, antipattern-currency-spaghetti, antipattern-decision-paralysis]
verify-with: design/JUICE.md
---

**What it is.** The **interface** is where the game reveals its state and takes your input — HUD, inventory, menus, tooltips. Not chrome bolted on after; a design surface you tune like any mechanic. Inventory is the special case everyone gets wrong: a container of items you sort, equip, and discard.

**Player fantasy / why it's fun.** Two pulls. The **loadout** — "these are my tools, chosen by me, and I own the consequence." And the **glance** — the screen tells me exactly what I need in the split-second I need it, and I trust it. When the UI disappears into the play, the player feels competent, not administrated.

## When to use / when NOT

- **Use** an inventory when items are *choices* — carry this or that, equip A over B. The container is only interesting if it constrains.
- **Use** rich HUD when the player acts on hidden state under time pressure (health, cooldowns, threat).
- **NOT** when the "inventory" is just a bag with infinite room and no decision — that's a database, and sorting it is a chore, not a game. Cut it or add a constraint.
- **NOT** more HUD to fix a readability failure. If the player can't parse the play, fix the play's silhouette first; see [[pattern-readability]]. Meters papering over an unreadable field is a smell.

## Variants

| Variant | Constraint | Feels like | Reference |
|---|---|---|---|
| Grid / Tetris | Space *and* item shape | Spatial packing puzzle | Resident Evil 4 attaché, Escape from Tarkov |
| Flat slot limit | Count only (N slots) | Clean loadout choice | [[anchor-slay-the-spire]] relics, [[anchor-hades]] boons |
| Weight / encumbrance | Total mass budget | Agonizing "what do I drop" | [[anchor-rimworld]], Skyrim |
| Sortable list | None — pure organization | Admin, spreadsheet | [[anchor-stardew-valley]] chests, [[anchor-minecraft]] |
| Diegetic / in-world | Physical space in fiction | Immersive, tense | Dead Space rig, [[anchor-dishonored]] |
| Card hand | Draw + hand cap | Tactical juggling | [[anchor-balatro]], [[genre-deckbuilder]] |

## Twist seams

- **Inventory but limited slots force loadout choices** (constraint) — the bag can't hold everything, so *what you leave behind* is the decision. [[anchor-into-the-breach]] gives three mech slots, not thirty; every pick is a build. Pairs with [[system-build-diversity]] and [[pattern-risk-reward]].
- **UI but diegetic — the interface is in the world** (theme) — no floating meters; health is the character's posture, ammo is a hologram on the gun, the map is a paper the avatar unfolds. [[anchor-outer-wilds]]' ship log, Dead Space's spine bar. Trades instant legibility for immersion — measure the cost in [[pattern-readability]].

## Tuning levers

- **Friction: intentional vs accidental.** Intentional friction is a *decision* you want the player to feel (drop the loot or the medkit?). Accidental friction is a click tax with no choice inside it (open menu → scroll → confirm → close, ten times a run). Kill the second; sharpen the first.
- **Information density.** Show what the player acts on *now*; defer the rest to a pull-open panel. A HUD that shows everything shows nothing. See [[pattern-pacing-and-tension]] — the HUD should breathe with the play.
- **Defaults.** Auto-sort, auto-equip-best, auto-stack, quick-transfer. Good defaults erase 90% of the busywork while leaving the meaningful override one click away. The default is a design statement about what's normal.
- **Slot / grid / weight budget.** The tightness of the constraint *is* the difficulty of the meta-game. Loosen it and choices evaporate; over-tighten and it becomes a sliding-block chore.
- **Sort & filter affordances.** One-tap sort, search, category tabs. Cheap to add, enormous friction relief on any list over ~12 items.
- **Comparison surface.** When equipping, show the delta (this vs. equipped) inline. The player should never do arithmetic in their head to make a choice.

## How it wires to Hayao

- **Menus and panels are DOM, not the sim.** Inventory screens, settings, loadout — build them as screen chrome via the show-screen path, kept out of the world hash. The play field is the sim; the menu is the shell around it. (Invariant 4 in AGENTS.md.)
- **In-world (diegetic) UI is view.** A meter drawn *inside* the scene — a bar over a unit, a glowing gauge on the avatar — is a pure-view node marked `cosmetic` so it never enters `world.hash()`. State it reflects lives in the sim; the drawing is cosmetic.
- **Item state is sim state.** What's in the bag, what's equipped, counts and stacks — that's authoritative game state and must be deterministic. Any shuffle or drop-order goes through the deterministic RNG, never `Math.random`.
- For the logic/view split that keeps interface out of the hash, `examples/sokoban/` is the reference. For a single view mechanic in isolation (camera, particles), read the matching `sandboxes/` lab rather than a whole game.

## Fails when…

- **Management outweighs play.** If the player spends more attention arranging the bag than using its contents, the container has become the game — and a boring one. This is the inventory form of [[antipattern-decision-paralysis]]: too many trivial options, no clear default, every choice equally weightless.
- **Currencies proliferate.** Five overlapping resources, each with its own bar and shop, none clearly better — see [[antipattern-currency-spaghetti]]. One legible economy beats a wallet of confetti; cross-check [[system-economy]].
- **Fake loadout.** Slots that look like a choice but where one option strictly dominates — that's [[antipattern-fake-choice]] wearing an inventory costume. If auto-equip-best is always correct, you have a database, not a decision.
- **Feature-soup HUD.** Every subsystem earns a corner meter until the field is a cockpit; see [[antipattern-feature-soup]]. Restraint is a feature — [[pattern-restraint-and-negative-space]].
- **Diegetic taken too far.** Immersion at the cost of the player *not knowing they're low on health*. When the fiction hides load-bearing state, the input feels like a lie ([[antipattern-input-lie]]). Legibility wins ties.

## Verify

Interface is a **feel** surface — prove it in [[design/JUICE.md]]. The bar: can a first-time player find and act on the state they need without a tutorial, and does opening/sorting the inventory cost near-zero friction? Judge the look from a headless render (Invariant 5), assert item/equip state via the sim's probe/hash — never eyeball counts. If the HUD reads as debug scaffolding rather than shipped chrome, run the `judge` skill against design/JUDGE.md.
