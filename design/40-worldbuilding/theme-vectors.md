---
id: world-theme-vectors
title: Theme Vectors — choosing a setting that recolours the mechanics
kind: worldbuilding
tags: [theme, setting, fiction, twist, recolour, fantasy, resonance]
summary: Choosing a setting/theme space; theme as a twist vector that recolours every system, not a skin — pick where the fiction and the mechanic rhyme.
use-when: You have a core loop and need the world it lives in — a setting that sharpens the mechanics instead of just decorating them.
composes-with: [world-worldbuilding-scaffold, world-aesthetic-direction, world-narrative-delivery]
verify-with: none
---

# Theme Vectors — choosing a setting that recolours the mechanics

**What it is.** The **theme** is the fiction the mechanics wear — the where, when,
and who. It is one of the six twist vectors in [[process-the-twist]], and the
cheapest to reach for, which is exactly why it's the easiest to waste. A theme
earns its place when it *recolours the systems* — makes the same rule mean
something new — not when it merely repaints the sprites.

**Player fantasy / why it's fun.** A setting is a promise about what the numbers
*mean*. "Fuel" and "faith" can be the identical resource loop; one is a survival
horror, one is a pilgrimage. The theme is where the player decides to care.

## The test: does the fiction rhyme with the mechanic?

A theme is load-bearing when you can trace a **rhyme** — a place where the rule
and the fiction say the same thing. Skip the theme and the loop still works but
means nothing; skip the loop and the theme is a wallpaper. Aim for both saying it.

| Mechanic | A theme that rhymes | A theme that's just a skin |
|---|---|---|
| Resource that decays if unused | *Grief* you must spend before a season ends | "Energy" that ticks down |
| Territory you can't hold everywhere | A **failing** lighthouse network on a drowning coast | Generic "zones" on a map |
| Permadeath with persistent memory | Orcs who *remember* every duel (Shadow of War) | Enemies with random names |
| One-screen constraint | A single tide-pool you tend as the sea rises | "A small arena" |

## Vectors / options

Theme is a *space* to choose within, not a single lever. Move along these axes:

| Axis | Poles | The mechanical consequence to hunt for |
|---|---|---|
| **Register** | mythic ↔ mundane | Mythic licenses spectacle & absolutes; mundane licenses stakes you feel |
| **Scale** | a room ↔ a cosmos | Sets what a "unit" is: a citizen, a hero, an empire, a season |
| **Agency** | steward ↔ conqueror | Do you *tend* the system or *bend* it? Recolours win conditions |
| **Time** | one night ↔ generations | Frames the session container; a run vs a campaign vs a lineage |
| **Tone** | dread ↔ cosy ↔ elegiac | The tonal twist rides here; recolours feedback (menace vs warmth) |
| **Material** | ink/wood/stone ↔ neon/chrome | Ties directly to [[world-aesthetic-direction]] and the Kentō set |

The Hayao example corpus lives near one corner of this space on purpose:
*lanternway*, *rootward*, *tarnholm*, *kintsugi* are **mundane-register,
small-scale, steward-agency, elegiac** worlds rendered in wood and ink. That's a
house lean, not a law — see the aesthetic hook below.

## Method

1. **Start from the signature mechanic**, not the setting. Name the one rule the
   game is *about* (from [[process-the-twist]]). The theme has to serve it.
2. **List 4–6 candidate fictions** the mechanic could wear. Force range: one
   mythic, one mundane, one cosy, one dreadful. Don't stop at the first.
3. **Find the rhyme for each.** For every candidate, write the single sentence
   where the fiction and the rule say the same thing. No rhyme → cut it.
4. **Trace the recolour** across three systems (economy, threat, progression):
   does the theme *change what a choice feels like*? A theme that touches only
   the art layer is a skin — send it to [[world-aesthetic-direction]] and pick a
   deeper one.
5. **Check it against the pillars** ([[process-pillars]]). The theme that most
   sharpens a pillar wins; a theme that fights one is a different game.
6. **Name the world in one line.** "A drowning coast where the last keeper
   rations light." If it's boring to say, it'll be boring to inhabit — hand the
   line to [[world-worldbuilding-scaffold]].

## Worked example

**Loop:** a push-your-luck resource run — bank early for safety, press on for
more, lose it all if you overreach ([[pattern-risk-reward]]).

- **Candidates:** deep-sea salvage; a tea ceremony under time pressure; a
  wildfire-line dig; *a lantern-lighter walking a mountain path at dusk*.
- **Rhyme found:** the lantern-lighter. Each lit lantern is banked progress; the
  dark ahead is the press. Oil is the run's only currency; the summit shrine is
  the bank. The fiction *is* the risk-reward curve.
- **Recolour:** threat becomes *the encroaching dark* (a timer with a face);
  the "bank" becomes *turning back*, which the fiction makes a real cost, not a
  menu button. Progression is the path itself.
- **World line:** *"A lantern-keeper climbing into the dusk, deciding how far
  the light will reach before the dark takes the path."* (This is *lanternway*'s
  neighbourhood — arrived at from the mechanic, not copied from it.)

## Aesthetic hook

The house look is **Kentō woodblock / Miyazaki-16** (`KENTO`, `MEADOW`, `DUSK`
in [`docs/API.md`](../../docs/API.md); see [[world-aesthetic-direction]]). Its
eight named hues — vermilion *shu*, persimmon *kaki*, ochre *ko*, pine *matsu*,
teal *asagi*, indigo *ai*, wisteria *fuji*, dusty-rose *saku* — read as *elegant
Japanese craft*, so themes in that register (folk myth, seasonal ritual, quiet
stewardship, weathered wood and ink) come pre-harmonised. A **neon-cyberpunk**
or **candy-arcade** theme fights the palette; if your mechanic truly wants it,
say so early and swap the palette deliberately — Kentō is a starting point, not a
cage (`docs/CONVENTIONS.md`). But a theme chosen *near* the house register gets
its art direction and its AA guarantee (`npm run palette`) close to free.

## Traps

- **Skin, not recolour.** If the theme could be swapped for another with zero
  mechanical change, it's set-dressing. Bend deeper or pick a vector other than
  theme.
- **Theme-first tourism.** Choosing "steampunk" because it's cool, then bolting a
  loop on. The mechanic picks the theme, not the reverse.
- **Register mismatch.** Cosy art on a punishing loop (or dread art on a gentle
  one) confuses the promise. Let tone, mechanic, and palette agree.
- **Over-lore.** A rich setting with no mechanical rhyme is a wiki, not a game.
  Minimum viable lore only — [[world-worldbuilding-scaffold]].
- **Fighting the palette by accident.** Reskinning to a clashing world without
  swapping `MEADOW`/`DUSK` yields muddy, off-brand frames the JUDGE flags.

## Composes with

- [[process-the-twist]] — theme *is* one of the six vectors; this module is its
  deep dive.
- [[world-worldbuilding-scaffold]] — the chosen setting becomes a coherent world
  with rules and stakes here.
- [[world-aesthetic-direction]] — theme sets the register; this turns it into a
  concrete, JUDGE-passing look.
- [[process-pillars]] — the pillars are the scoring function for candidate themes.

## See also

- [`docs/JUDGE.md`](../../docs/JUDGE.md) — palette harmony (axis 3): does the
  world's colour belong to *one* set?
- `docs/CONVENTIONS.md` "Default palette is Kentō" — the house register and the
  AA gate.
- Example worlds *lanternway*, *rootward*, *tarnholm*, *kintsugi* — as
  *convention references* for register, never a menu to copy (AGENTS.md).
