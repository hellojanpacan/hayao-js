# JUDGE.md — the vision judge (the taste in the loop)

The feel gates (Channel 4) prove the **floor** mechanically: grace windows exist,
events answer on two senses, the avatar out-contrasts the scenery, the camera
doesn't snap. But a game can pass every gate and still look *empty, flat, or like a
debug layout* — the gap the game-director critique named "green tests, dead game."

The vision judge closes that last mile. The engine renders headlessly to SVG;
`npm run judge` rasterizes to PNG (via `@resvg/resvg-js`, zero browser); then a
**multimodal model looks at the actual pixels** and scores them against the rubric
below. It is the one judge that can't be a pure function — so it's the one an
AI-first engine is uniquely built to run in a loop (deterministic sim + headless
render make "render → look → fix → re-render" cheap and reproducible).

> Real example: updrift passed the salience *and* camera gates, yet the judge saw
> its parallax mountains were invisible (colored a shade off the sky, and anchored
> off-screen). The fix — a pinned, graded night sky with a moon and layered ridges
> — turned an empty void into an atmospheric ascent. No mechanical gate caught it.

## The loop

```
npm run judge [slug…]        # render hero + motion PNGs → shots/<slug>/judge/
  → VIEW each PNG            # the model actually looks
  → score against the rubric # findings as { file, severity, fix }
  → apply high-severity fixes (cosmetic only — never touch world.state/logic)
  → npm run judge <slug>     # re-render, confirm the finding cleared
  → repeat until it looks shipped, not debug
```

Run it with the `/judge` skill (`.claude/skills/judge/`), which drives exactly this
loop. Fixes must stay **cosmetic** — the judge changes how a game *looks*, never how
it *plays*; the golden replay hash must be unchanged after a judge pass (view nodes
are `cosmetic`, so it will be).

## The rubric

Score each 1–5. A game is "shipped" when every axis is ≥ 4 and nothing is a 1–2.

1. **Readability** — is the avatar instantly findable? Do threats read as
   dangerous, pickups as desirable? Is text legible over its background? (The
   salience + layout gates set the floor here; the judge checks it *feels* clear.)
2. **Depth & composition** — is there a foreground / midground / background, or do
   objects float in a void? Does the frame have a focal point and breathing room, or
   is it empty / cramped / evenly-gray? Emptiness is the most common failure.
3. **Palette harmony** — do the colors belong to one world (the Kentō woodblock
   set), or clash? Is there a controlled range of value (not all mid-tone)?
4. **Juice restraint** — is feedback present but not noise? Particles/shake that
   *punctuate*, not smother. (In motion strips: do impacts read? is anything
   seizure-bright or frantic?)
5. **Motion clarity** — across the motion strip, is the action legible frame to
   frame? Does the eye track the important thing, or is it visual soup?
6. **Chrome & finish** — HUD framed and unobtrusive; margins consistent; no
   debug-square look; nothing clipped at the edges; the title/first screen invites.

## Severity → action

- **high** (a 1–2 on any axis): fix before shipping. Empty background, avatar
  lost, clashing palette, unreadable HUD, seizure-bright juice.
- **medium** (a 3): fix if cheap; log otherwise.
- **low** (polish): note for later.

## What the judge does NOT do

It doesn't judge *fun* (that's playtest + the skill-delta proofs) and it doesn't
touch gameplay. It judges the **image**. Pair it with the feel gates (mechanics
floor) and the winnability/determinism proofs (correctness) for the full picture:
correct · fair · **and it looks the part**.
