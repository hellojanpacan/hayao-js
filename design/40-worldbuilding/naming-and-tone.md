---
id: world-naming-and-tone
title: Naming & Tone — the Kentō house restraint
kind: worldbuilding
tags: [naming, tone, voice, register, restraint, copy, evocative, ux-text]
summary: Names, voice, and register — the Kentō house restraint of one-word evocative titles (lanternway, rootward, tarnholm, kintsugi) and text that trusts the player.
use-when: You need to name the game, its places, factions, and mechanics — and set the voice for the little text a small game shows.
composes-with: [world-worldbuilding-scaffold, world-faction-identity, world-narrative-delivery]
verify-with: none
---

# Naming & Tone — the Kentō house restraint

**What it is.** The **name** is the smallest, most-seen piece of worldbuilding —
the title on the first screen, the word on every place and mechanic. **Tone** is
the register of every string the game shows. The house style is *restraint*: one
evocative word over a compound sentence, an implied world over an explained one,
text that trusts the player to feel it. The examples name themselves in a breath
— *lanternway*, *rootward*, *tarnholm*, *kintsugi* — and say almost nothing else.

**Player fantasy / why it's fun.** A good name is a whole world compressed. Say
*rootward* and the player already feels down, inward, growing. The name does the
worldbuilding the text doesn't have to.

## The house rule: one evocative word

The Hayao lean is a **single coined or weathered word** that implies a direction
or a place. It reads on a title screen, survives in a URL, and carries a mood
without a subtitle.

| Name | How it's built | What it implies at a glance |
|---|---|---|
| **lanternway** | lantern + way (a path) | a lit route through dark; keeping, walking |
| **rootward** | root + -ward (toward) | descent, growth, inward, earth |
| **tarnholm** | tarn (mountain lake) + holm (island) | a cold, small, isolated place |
| **kintsugi** | the craft of gold-mending broken pottery | repair as beauty; breakage that heals |

The technique: **fuse two small, concrete morphemes** (a thing + a direction, or
a place + a place), or **borrow a real craft/place word** with the right weather
on it. Avoid the fantasy-generator failure modes below.

## Vectors / options — dialing the register

Pick a register and hold it across *every* string, from the title to the
game-over line:

| Register | Feels like | Naming source | Fits themes |
|---|---|---|---|
| **Weathered / folk** | old, worn, quiet | real archaic words; place-suffixes (-holm, -mere, -fen) | stewardship, seasonal, elegiac |
| **Coined-compound** | crafted, precise | two morphemes fused (root+ward) | most house games; clean & ownable |
| **Craft-loan** | elegant, specific | a real craft term (kintsugi, kentō) | Japanese-craft register; on-brand |
| **Mythic** | grand, absolute | invented proper nouns, capitalised | large-scale, conqueror-agency worlds |
| **Plain / wry** | modern, light | ordinary words, a little dry | cosy, comedic, or tonal-twist games |

The house default sits in the first three. Mythic and wry are available but pull
*away* from the Kentō register — use them deliberately, matched to the theme.

## Method

1. **Name the game last, from the fantasy.** Once [[world-worldbuilding-scaffold]]
   has the premise and role, the name is the compression of that feeling — not a
   thing you pick first and rationalise.
2. **Try the fuse.** Combine two concrete morphemes from the world (its material,
   its direction, its place). Or borrow one weathered real word. Say it aloud.
3. **Set one register** and write a *tone sheet* — 3–4 example strings (a title,
   a prompt, a win line, a loss line) that fix the voice. Everything else matches.
4. **Name places and factions in the same grammar.** If the game is *lanternway*,
   its places are *the Duskmere*, *the Last Lamp* — not *Region 3*. Factions
   inherit their value's register ([[world-faction-identity]]).
5. **Name mechanics in-world where you can.** "Kindle," "mend," "ward" over
   "activate," "repair," "buff." An in-fiction verb teaches and immerses at once.
6. **Cut adjectives.** The house voice is nouns and verbs. If a string needs three
   adjectives to land, the name or the scene isn't doing its job.

## Worked example

**World:** the drowned-coast keeper from [[world-worldbuilding-scaffold]].

- **Title tries:** *saltway* (too plain), *The Last Keeper of Ys* (too much
  subtitle), **lanternway** (fuse: lantern + way — a lit path; keeps the house
  grammar). Ship the one-word fuse.
- **Places:** *the Duskmere* (the drowning marsh), *the Far Lamp* (the last
  lantern). Not "Level 5."
- **Mechanics:** *kindle* (light), *ward* (hold the dark). In-world verbs.
- **Tone sheet:** title *"lanternway."* · prompt *"the path ahead is dark."* ·
  win *"the far lamp holds."* · loss *"the dark has the road."* Four strings,
  one weathered voice, no adjectives to spare.

## Aesthetic hook

Tone is set by the **Kentō** register itself: the palette is *elegant Japanese
craft* (the name *kentō* — 見当 — is the woodblock registration mark that aligns
each colour pass), so the copy should share that restraint — spare, concrete,
unhurried. Text is a **DOM overlay** in the house style, not `Text` nodes drawn
into the scene (`docs/CONVENTIONS.md`), which frees the voice from HUD clutter:
say less, and set it in the serif the JUDGE renders true (`docs/JUDGE.md` fonts).
A title screen with one word in ink on washi *invites* (JUDGE chrome axis) far
better than a paragraph of lore. Match the naming register to the palette
register: weathered names for the woodblock look; save the neon-mythic voice for
a deliberately swapped palette.

## Traps

- **Fantasy-generator soup.** *Zephyrvale of the Thornwilds*. Apostrophes,
  double-vowels, and stacked proper nouns read as generated. One clean word beats
  a compound epic.
- **Subtitle crutch.** If the name needs *": A Tale of…"* to make sense, the name
  isn't carrying its weight.
- **Register drift.** A weathered title over jokey button text (or vice versa)
  breaks the spell. One register, everywhere.
- **UI-verb naming.** "Activate ability," "consume resource." Name it in-world or
  the fiction leaks out through the buttons.
- **Adjective pile-up.** The house voice trusts the noun. Three adjectives means
  the scene isn't showing what the words are telling.

## Composes with

- [[world-worldbuilding-scaffold]] — the premise and role the name compresses.
- [[world-faction-identity]] — faction names inherit the register and the value.
- [[world-narrative-delivery]] — tone governs every string the world shows, and
  restraint here is what lets the *systems* speak.

## See also

- [`docs/JUDGE.md`](../../docs/JUDGE.md) — chrome & finish: a spare, well-set
  title *invites*; a wall of lore doesn't.
- `docs/CONVENTIONS.md` — menus/titles/HUD are DOM overlays; Kentō is the house
  palette and *kentō* the registration-mark namesake.
- Example titles *lanternway*, *rootward*, *tarnholm*, *kintsugi* — the restraint
  in one word (reference the *technique*, not the words themselves).
