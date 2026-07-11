---
name: judge
description: Run the vision judge on a game — render it headlessly to PNG, LOOK at it, score it against design/JUDGE.md, and apply cosmetic fixes until it looks shipped, not debug. Use after a game's mechanics are green, to raise its looks.
---

# /judge — close the vision-judge loop

The feel gates prove the mechanical floor; this closes the last mile the gates
can't see: **does it actually look good?** You will render the game, LOOK at the
pixels, and fix what a human would wince at — staying strictly cosmetic.

Read `design/JUDGE.md` first (the rubric + the rules). Then run this loop.

## 1. Render

```
npm run judge <slug>      # or: npm run judge   (all games)
```

Writes `shots/<slug>/judge/hero.png` (opening composition) + `motion.png` (a
liveliness contact sheet) + PNGs of any verify filmstrips. A game the rasterizer
can't render is reported, not skipped silently — review those live in a browser.

## 2. Look — actually view every PNG

Open each PNG with the Read tool and SCORE it 1–5 on the six rubric axes
(readability, depth & composition, palette, juice restraint, motion clarity,
chrome & finish). Write findings as a list of `{ file, axis, severity, fix }`.
Be specific and honest — "the background is an empty void; the avatar floats"
is a finding; "looks nice" is not.

## 3. Fix — cosmetic only

Apply every **high**-severity finding (a 1–2 on any axis). The hard rule:

- Change only **view** code — sprites, colors, layers, particles, camera framing,
  HUD. Never touch `world.state`, the pure logic, the input map, or the sim.
- All view nodes are `cosmetic`, so **the golden replay hash must be unchanged**
  after your pass. If it changed, you edited the sim — revert and redo.
- Prefer the house Regalia palette (`REGALIA`) and the juice kit (see
  `design/JUICE.md`): parallax/pinned backdrops for depth, `AmbientField` for
  atmosphere, `Particles`/`Shaker` for punctuation, `gradient()` for skies.

Common high-severity fixes: an empty background → a graded/pinned backdrop with a
focal element; an avatar lost in the scene → raise its contrast or add a glow; a
debug-square look → texture the ground, frame the HUD, add depth layers.

## 4. Re-render and converge

```
npm run judge <slug>
```

View again. Confirm each high finding cleared and nothing regressed. Repeat until
every axis is ≥ 4. Then re-run `npm run verify -- <slug>` to prove the golden hash
and all feel gates still pass (a cosmetic pass must keep them green).

## 5. Close

State the before/after per finding, and leave the game with: correct (winnable +
deterministic) · fair (feel gates) · **and looking the part** (this pass).
