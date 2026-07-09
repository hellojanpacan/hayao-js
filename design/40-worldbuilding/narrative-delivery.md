---
id: world-narrative-delivery
title: Narrative Delivery — story with little text
kind: worldbuilding
tags: [narrative, environmental, systemic, embedded, show-dont-tell, story, diegetic]
summary: Environmental / systemic / embedded storytelling with LITTLE text — show don't tell; let the systems author the story in a small deterministic game.
use-when: You want the world to tell its story through play and place, not cutscenes — a fit for a small, text-light deterministic game.
composes-with: [world-worldbuilding-scaffold, world-naming-and-tone, world-aesthetic-direction]
anchors: [anchor-shadow-of-mordor, anchor-outer-wilds, anchor-return-of-the-obra-dinn]
verify-with: none
---

# Narrative Delivery — story with little text

**What it is.** How the world reaches the player *without a wall of text*. A small
deterministic game can't (and shouldn't) lean on cutscenes and codex dumps. Its
story lives in **place** (what the level shows), in **systems** (what the rules
generate), and in **objects** (what a single item implies). The best delivery is
the one the player *finds*, not the one they're *told*.

**Player fantasy / why it's fun.** Discovered story is *yours*. A player who
pieces the world together from a broken lantern and a drowned path owns that
understanding in a way no narrator can give them. Show-don't-tell isn't a style
choice — it's how you make the player a participant instead of an audience.

## The three delivery channels

| Channel | The story is in… | Costs | Best for |
|---|---|---|---|
| **Environmental** | the *place* — layout, ruins, what's worn or broken | art & level design | premise, history, mood |
| **Systemic** | the *rules interacting* — what the systems generate | mechanical depth | emergent, personal, replayable story |
| **Embedded** | *objects & fragments* — one item, one line, one name | a little authored text | specific lore, character, the twist |

The house lean is **environmental + systemic first, embedded in tiny doses.** Text
is a DOM overlay ([[world-naming-and-tone]]); spend it sparingly. A game that
*shows* its drowning coast and lets its light-mechanic *enact* the loss needs
almost no words.

## Vectors / options — how much story, and where

Match delivery to the game's shape ([[system-session-structure]]):

| Game shape | Primary channel | What it looks like |
|---|---|---|
| Puzzle / arcade | environmental | the level *is* the premise; one title line |
| Roguelite | systemic | each run's events author a small story ([[system-emergent-systems]]) |
| Metroidvania / campaign | environmental + embedded | place tells history; fragments gate the twist |
| Systemic / emergent | systemic | the *nemesis* pattern — the game remembers and narrates back |
| Deduction | embedded | the player *reconstructs* the story (Obra Dinn) |

## Method

1. **Decide what the player must understand** vs what they may *infer*. Only the
   first needs delivery; the rest is theirs to imagine
   ([[world-worldbuilding-scaffold]] kept it minimal — hold that line).
2. **Assign each beat a channel.** Premise → environmental (show it in the first
   screen). Stakes → systemic (let a loss *happen*, don't narrate it). A specific
   reveal → embedded (one fragment).
3. **Make the environment tell the premise.** The [[world-aesthetic-direction]]
   brief is your first narrator: a drowned path, a snuffed lantern, a mended crack
   say more than a paragraph. Compose the frame to be *read*.
4. **Let systems generate the personal story.** Where you have memory or
   relationships ([[system-emergent-systems]]), the game authors specifics you
   didn't write — the guard who caught you twice, the lantern you always lose.
   That's the Shadow of War trick at small scale.
5. **Spend embedded text like a miser.** One line on a gravestone, one name on a
   crest. Diegetic, in-world, in the register ([[world-naming-and-tone]]). Never
   a scrolling codex.
6. **Show the change, not the state.** Story is *difference* — the path that was
   lit and now isn't; the crack that's now gold. Deliver transformations the
   player caused, so the narrative and the mechanic are the same event.

## Worked example

**World:** the drowned-coast keeper (from [[world-worldbuilding-scaffold]]).

- **Environmental:** the opening frame — a graded dusk, one lit lantern, a path
  of dark ones trailing into rising water. No text needed; the premise is *seen*.
- **Systemic:** when the tide claims a lantern, the hamlet behind it goes dark on
  the map and its light never returns this run. The *rule* tells the loss; the
  player feels it because they routed there or didn't.
- **Embedded:** one line at the far lamp — *"the last one lit."* Four words,
  diegetic, in register. That's the entire authored narrative.
- **Result:** a complete emotional arc — hope, attrition, a small held light —
  delivered by place, rule, and four words. No cutscene, no codex.

## Aesthetic hook

Environmental storytelling *is* [[world-aesthetic-direction]] doing double duty:
the **Kentō** frame that passes the JUDGE's depth axis (a real fore/mid/back,
a focal point) is also the frame that *narrates* — a snuffed lantern reads as
loss only if the scene has the depth and contrast to show it. Because text is a
DOM overlay and the palette carries the mood, you can tell a whole story in ink,
washi, and one *ko* glow going out. Keep embedded text set in the serif the JUDGE
renders true (`design/JUDGE.md`), and let restraint here reinforce the house voice
([[world-naming-and-tone]]): the systems and the light say it; the words just
confirm it.

## Traps

- **The lore dump.** A text wall at the start players skip. If it's not
  discoverable and short, cut it — deliver through play.
- **Narrating what the system already shows.** A popup "You lost a lantern!" over
  a lantern the player watched go dark. Trust the mechanic; drop the caption.
- **Story that ignores the mechanics.** Fiction that contradicts what the rules
  do ([[world-worldbuilding-scaffold]]'s "rule without echo"). The played story
  is the real one — align the told one to it.
- **Embedded everywhere.** Fragments on every rock dilute the ones that matter.
  Miser's budget.
- **Cutscene reflex.** Reaching for a scripted scene when a composed frame or a
  system event would land harder *and* stay deterministic and cosmetic-free.

## Composes with

- [[world-worldbuilding-scaffold]] — decides what little must be understood; this
  delivers it without text walls.
- [[system-emergent-systems]] — the systemic channel; the game authors personal,
  replayable story the designer didn't write.
- [[world-aesthetic-direction]] — the composed frame is the primary narrator.
- [[world-naming-and-tone]] — governs the spare, diegetic voice of any embedded
  text.

## See also

- [`design/JUDGE.md`](../JUDGE.md) — depth & composition: a frame with real
  layers is also a frame that can *tell* something.
- [[anchor-shadow-of-mordor]] (systemic memory as narrative),
  [[anchor-outer-wilds]] (knowledge as the only progression),
  [[anchor-return-of-the-obra-dinn]] (the player reconstructs the story).
