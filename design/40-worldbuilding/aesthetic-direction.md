---
id: world-aesthetic-direction
title: Aesthetic Direction — briefing the Kentō woodblock look
kind: worldbuilding
tags: [art-direction, palette, kento, woodblock, readability, contrast, look, judge]
summary: Art direction — the Kentō woodblock palette and how to brief a look that passes the readability + JUDGE bars (findable avatar, depth, one-world colour).
use-when: You need to turn a theme into a concrete visual brief — palette, contrast, depth, silhouette — that survives the vision judge.
composes-with: [world-theme-vectors, world-faction-identity, world-naming-and-tone]
verify-with: design/JUDGE.md
---

# Aesthetic Direction — briefing the Kentō woodblock look

**What it is.** The **art brief**: the palette, contrast rules, depth plan, and
silhouette language that give a game one coherent look. The house default is
**Kentō woodblock / Miyazaki-16** — a small set of traditional-Japanese hues,
AA-gated, that reads as elegant ink-and-washi craft. This module is how you brief
a look that clears both the [[pattern-readability]] floor and the six-axis vision
judge (`design/JUDGE.md`), not just how to pick pretty colours.

**Player fantasy / why it's fun.** The look is the *first* thing the player
believes about the world — before a single mechanic fires. A frame that reads as
*shipped, not debug* earns trust; a flat grey grid loses it in a second.

## The Kentō palette

Import `KENTO`, `MEADOW` (light), `DUSK` (dark) from `@hayao`
([`docs/API.md`](../../docs/API.md)). It fuses the site's washi/sumi ink tokens
with landscape hues loosely from Miyazaki-16. **Eight named accents**, each with
a `Deep` tone for light grounds and a bright tone for dark:

| Hue | Name | Reads as |
|---|---|---|
| vermilion | **shu** | alarm, aggression, sacred |
| persimmon | **kaki** | warmth, harvest, rust |
| ochre-gold | **ko** | wealth, age, earth |
| pine green | **matsu** | life, growth, calm |
| teal-cyan | **asagi** | water, cool, clarity |
| indigo | **ai** | night, order, depth |
| wisteria violet | **fuji** | magic, dusk, mystery |
| dusty rose | **saku** | tenderness, transience |

Neutrals run from shell-white *gofun* → *washi* → *kinako* → *stone* → body-ink
*sumiSoft* → *sumi* → deepest *kuro*/*yohaku*. Pick **5–6 hues plus a ground** per
game; alpha/tone variants via `withAlpha`/`mix` are welcome. **Every pairing is
WCAG-AA verified — `npm run palette` is the gate.** The engine stays
palette-agnostic; Kentō is a consistent starting point, never a restriction
(`docs/CONVENTIONS.md`).

## Vectors / options — dialing the look to the theme

The palette is fixed-ish; the *composition* is where you express theme:

| Lever | Poles | Serves |
|---|---|---|
| **Ground** | light `MEADOW` (washi) ↔ dark `DUSK` (sumi/kuro) | daytime/cosy ↔ night/dread; sets the whole mood |
| **Accent count** | 2 (austere) ↔ 6 (rich) | tension of a lean frame vs a busy world |
| **Value range** | wide (ink→shell) ↔ narrow | drama & focal points ↔ flat/foggy atmosphere |
| **Line weight** | heavy ink outline ↔ soft edge | woodblock boldness ↔ painterly softness |
| **Light** | flat ambient ↔ `LightLayer`+`PointLight` pools | even scene ↔ carved-out focal depth |

Warm accents (*shu*, *kaki*, *ko*) push a scene toward harvest/dread/desperation;
cool accents (*asagi*, *ai*, *fuji*) toward night/order/calm. Let the theme's
register from [[world-theme-vectors]] pick the corner.

## Method

1. **Choose the ground** (`MEADOW` vs `DUSK`) from the theme's tone. This decision
   colours everything after it.
2. **Pick 5–6 accents** by *meaning*, not prettiness — one alarm hue, one focal
   hue for the avatar, the rest for world & factions
   ([[world-faction-identity]]). Reserve the highest-contrast pairing for the
   player so the avatar out-contrasts the scenery (JUDGE axis 1).
3. **Plan depth in three layers** — background / midground / foreground — *before*
   placing anything. Emptiness (objects floating in a void) is the JUDGE's most
   common failure (axis 2). Grade a sky, pin a horizon, layer ridges.
4. **Give interactables an ink edge.** Pickups/actors carry a dark outline
   (`stroke: KENTO.sumi` on light, `KENTO.gofun` rim on dark) plus a glow/pulse —
   contrast lives in the *edge*, not the fill (`docs/CONVENTIONS.md`).
5. **Set the silhouette language** — the shape rules that make avatar, enemies,
   and pickups readable as black shapes ([[pattern-readability]]).
6. **If lit, own the light.** A real `LightLayer` + `PointLight` carves a focal
   point out of ambient dark; but multiply-lighting lowers contrast, so the
   Kentō AA guarantee holds only *pre*-lighting — judge lit contrast from the
   rendered PNG, and let the `lightingIssues` feel-gate (`npm run feel`) own it.
7. **Render and judge.** Run `npm run judge <slug>`, *look* at the pixels, fix
   every high-severity finding cosmetically (the golden hash must stay
   unchanged), re-render until it reads shipped.

## The JUDGE bar — brief to pass all six axes

| Axis | The brief that passes it |
|---|---|
| **Readability** | Avatar on the reserved high-contrast pairing; threats warm-loud, pickups ink-edged |
| **Depth & composition** | Three real layers; a focal point; breathing room — never a void |
| **Palette harmony** | Every hue from the *one* Kentō set; a controlled value range, not all mid-tone |
| **Juice restraint** | Particles/shake that *punctuate*; nothing seizure-bright ([[pattern-juice-choreography]]) |
| **Motion clarity** | The eye tracks the important thing frame to frame |
| **Chrome & finish** | HUD framed as DOM overlay; consistent margins; nothing clipped; the title invites |

## Worked example — *lanternway*'s neighbourhood

**Theme:** a keeper walking into the dusk (elegiac, small-scale).

- **Ground:** `DUSK` — a graded night sky, pinned horizon, layered ridges (the
  depth the JUDGE demands; the updrift lesson in `design/JUDGE.md`).
- **Accents:** *ko* (warm lantern glow, the focal/avatar hue) against *ai*/*fuji*
  night; *shu* reserved for danger only. Five hues, one world.
- **Light:** each lantern is a `PointLight` pool carving warmth out of the dark —
  depth *and* the mechanic in one visual. Contrast judged from the PNG.
- **Edges:** lanterns and the keeper carry a *gofun* rim so they read against the
  dark ground.
- **Result:** a frame that reads as an atmospheric ascent, not a debug void —
  the exact gap the vision judge exists to close.

## Aesthetic hook

*This whole module is the aesthetic hook.* The one thing to internalise: **Kentō
gives you harmony and AA for free, but not depth or contrast-under-light** — those
you compose per scene and *prove from the rendered pixels*, never from the hexes
(`design/JUDGE.md` axis 2). Design in the palette; judge in the PNG.

## Traps

- **The debug void.** Objects on a flat grey field. Plan three layers first;
  emptiness is the #1 judge failure.
- **Palette clash.** Reaching outside the Kentō set for "one perfect blue."
  Break the one-world rule and every frame muddies. Swap the *whole* palette or
  stay in it.
- **Contrast from hexes.** Trusting `npm run palette` AA under a `LightLayer` —
  multiply kills it. Judge lit scenes from the PNG; let `lightingIssues` gate it.
- **Fill without edge.** An accent shape flat on a same-family floor vanishes.
  Ink outline + glow on anything interactive.
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

- [`design/JUDGE.md`](../JUDGE.md) — the six-axis rubric this module briefs
  to; the `/judge` loop (`.claude/skills/judge/`).
- `docs/CONVENTIONS.md` "Default palette is Kentō" — the palette, the ink-edge
  rule, DOM chrome, and the `npm run palette` AA gate.
- [`docs/API.md`](../../docs/API.md) — `KENTO`, `MEADOW`, `DUSK`, `withAlpha`,
  `mix`, `LightLayer`, `PointLight`.
