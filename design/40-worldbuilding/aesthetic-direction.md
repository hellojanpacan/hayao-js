---
id: world-aesthetic-direction
title: Aesthetic Direction — briefing the Regalia look
kind: worldbuilding
tags: [art-direction, palette, regalia, duotone, readability, contrast, look, judge]
summary: Art direction — the Regalia palette and how to brief a look that passes the readability + JUDGE bars (findable avatar, depth, one-world colour).
use-when: You need to turn a theme into a concrete visual brief — palette, contrast, depth, silhouette — that survives the vision judge.
composes-with: [world-theme-vectors, world-faction-identity, world-naming-and-tone]
verify-with: design/JUDGE.md
---

# Aesthetic Direction — briefing the Regalia look

**What it is.** The **art brief**: the palette, contrast rules, depth plan, and
silhouette language that give a game one coherent look. The house default is
**Regalia** — a small, AA-gated set (`docs/STYLE.md`) built on *one hue at two
opacities*: bold, rounded, friendly, no outlines. This module is how you brief a
look that clears both the [[pattern-readability]] floor and the six-axis vision
judge (`design/JUDGE.md`), not just how to pick pretty colours.

**Player fantasy / why it's fun.** The look is the *first* thing the player
believes about the world — before a single mechanic fires. A frame that reads as
*shipped, not debug* earns trust; a flat grey grid loses it in a second.

## The Regalia palette

Import `REGALIA`, `REGALIA_DAY` (light), `REGALIA_NIGHT` (dark) from `@hayao`
([`docs/API.md`](../../docs/API.md)). It's **a core of four, grown by the job** —
never a big box of crayons:

| Hue | Token | Reads as |
|---|---|---|
| Regalia Gold | **gold** | primary — marks, joy, coins, magic |
| Ink Navy | **ink** | structure — line, type, night |
| Meadow | **green** | growth — nature, success |
| Dusk Blue | **blue** | calm — sky, water, tech |
| Rose *(ext)* | **rose** | vitality — hearts, health, damage |
| Bark *(ext)* | **bark** | material — wood, earth, crates |

Surfaces run light `paper → mist → cloud` and dark `ground → night → shade`;
text is `ink`/`soft` on light, `paperInk`/`softInk` on dark. Grow the palette
**by the job, not the mood** — a new hue earns its place only by owning one
specific thing the core four can't (that is exactly how `rose` and `bark` got in),
and it stays out of the core UI chrome. **Every pairing is WCAG-AA verified —
`npm run palette` is the gate.** The engine stays palette-agnostic; Regalia is a
consistent starting point, never a restriction (`docs/CONVENTIONS.md`).

## Vectors / options — dialing the look to the theme

The palette is fixed-ish; the *composition* is where you express theme:

| Lever | Poles | Serves |
|---|---|---|
| **Ground** | light `REGALIA_DAY` (paper) ↔ dark `REGALIA_NIGHT` (ground) | daytime/cosy ↔ night/dread; sets the whole mood |
| **Accent count** | 2 (austere) ↔ 5 (rich) | tension of a lean frame vs a busy world |
| **Value range** | wide (ink→paper) ↔ narrow | drama & focal points ↔ flat/foggy atmosphere |
| **Mass vs focal** | broad 32% mass ↔ 100% focal detail | the duotone depth cue — light backdrop, bright detail on top |
| **Light** | flat ambient ↔ `LightLayer`+`PointLight` pools | even scene ↔ carved-out focal depth |

Warm accents (`gold`, `rose`, `bark`) push a scene toward harvest/vitality/craft;
cool accents (`green`, `blue`, `ink`) toward night/order/calm. Let the theme's
register from [[world-theme-vectors]] pick the corner.

## Method

1. **Choose the ground** (`REGALIA_DAY` vs `REGALIA_NIGHT`) from the theme's tone.
   This decision colours everything after it.
2. **Pick 3–5 accents** by *meaning*, not prettiness — one alarm/focal hue for
   the avatar, the rest for world & factions ([[world-faction-identity]]).
   Reserve the highest-contrast pairing for the player so the avatar
   out-contrasts the scenery (JUDGE axis 1).
3. **Plan depth in three layers** — background / midground / foreground — *before*
   placing anything. Emptiness (objects floating in a void) is the JUDGE's most
   common failure (axis 2). Grade a sky, pin a horizon, layer ridges as stacked
   duotone masses.
4. **Give interactables an ink edge or a bright focal.** Pickups/actors read via
   the duotone split — a 32% mass carrying a 100% focal detail — plus a
   glow/pulse; contrast lives in the *edge and the focal*, not a flat fill
   (`docs/CONVENTIONS.md`).
5. **Set the silhouette language** — the shape rules that make avatar, enemies,
   and pickups readable as black shapes ([[pattern-readability]]).
6. **If lit, own the light.** A real `LightLayer` + `PointLight` carves a focal
   point out of ambient dark; but multiply-lighting lowers contrast, so the
   Regalia AA guarantee holds only *pre*-lighting — judge lit contrast from the
   rendered PNG, and let the `lightingIssues` feel-gate (`npm run feel`) own it.
7. **Render and judge.** Run `npm run judge <slug>`, *look* at the pixels, fix
   every high-severity finding cosmetically (the golden hash must stay
   unchanged), re-render until it reads shipped.

## The JUDGE bar — brief to pass all six axes

| Axis | The brief that passes it |
|---|---|
| **Readability** | Avatar on the reserved high-contrast pairing; threats warm-loud, pickups focal-bright |
| **Depth & composition** | Three real layers; a focal point; breathing room — never a void |
| **Palette harmony** | Every hue from the *one* Regalia set; a controlled value range, not all mid-tone |
| **Juice restraint** | Particles/shake that *punctuate*; nothing seizure-bright ([[pattern-juice-choreography]]) |
| **Motion clarity** | The eye tracks the important thing frame to frame |
| **Chrome & finish** | HUD framed as DOM overlay; consistent margins; nothing clipped; the title invites |

## Worked example — a keeper walking into the dusk

**Theme:** a small-scale, elegiac ascent (elegiac, intimate).

- **Ground:** `REGALIA_NIGHT` — a graded night sky, pinned horizon, layered
  ridges (the depth the JUDGE demands).
- **Accents:** `gold` as the warm lantern glow and focal/avatar hue against a
  `blue`/`ink` night; `rose` reserved for danger only. Three hues, one world.
- **Light:** each lantern is a `PointLight` pool carving warmth out of the dark —
  depth *and* the mechanic in one visual. Contrast judged from the PNG.
- **Edges:** lanterns and the keeper carry a bright focal detail over their mass
  so they read against the dark ground.
- **Result:** a frame that reads as an atmospheric ascent, not a debug void —
  the exact gap the vision judge exists to close.

## Aesthetic hook

*This whole module is the aesthetic hook.* The one thing to internalise: **Regalia
gives you harmony and AA for free, but not depth or contrast-under-light** — those
you compose per scene and *prove from the rendered pixels*, never from the hexes
(`design/JUDGE.md` axis 2). Design in the palette; judge in the PNG.

## Traps

- **The debug void.** Objects on a flat grey field. Plan three layers first;
  emptiness is the #1 judge failure.
- **Palette clash.** Reaching outside the Regalia set for "one perfect blue."
  Break the one-world rule and every frame muddies. Swap the *whole* palette or
  stay in it.
- **Contrast from hexes.** Trusting `npm run palette` AA under a `LightLayer` —
  multiply kills it. Judge lit scenes from the PNG; let `lightingIssues` gate it.
- **Fill without edge.** A flat accent shape on a same-family floor vanishes.
  Duotone split (mass + focal) + glow on anything interactive.
- **Mid-tone mush.** All hues at one value = no focal point. Reserve the widest
  value range for what matters most.
- **Skipping the judge.** "Passes the gates" ≠ "looks shipped." Run
  `npm run judge` and actually look.

## Composes with

- [[world-theme-vectors]] — supplies the register that picks the palette's corner.
- [[world-faction-identity]] — each faction's owning hue is assigned from this
  set; silhouette rules are briefed here.
- [[pattern-readability]] — the salience floor this brief must clear.
- [[pattern-juice-choreography]] — feedback that punctuates without smothering
  (JUDGE axis 4).

## See also

- [`docs/STYLE.md`](../../docs/STYLE.md) — the Regalia visual house style: the
  palette, the duotone "draw anything in five rules" recipe.
- [`design/JUDGE.md`](../JUDGE.md) — the six-axis rubric this module briefs
  to; the `/judge` loop (`.claude/skills/judge/`).
- `docs/CONVENTIONS.md` "Default palette is Regalia" — the palette, the duotone
  rule, DOM chrome, and the `npm run palette` AA gate.
- [`docs/API.md`](../../docs/API.md) — `REGALIA`, `REGALIA_DAY`, `REGALIA_NIGHT`,
  `withAlpha`, `mix`, `LightLayer`, `PointLight`.
