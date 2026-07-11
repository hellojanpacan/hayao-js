---
id: process-the-seed
title: The Seed — atom-first design
kind: process
tags: [seed, atom, entry, pivot, timeline, radiates, prototyping, inspiration]
summary: Enter the pipeline from an authored atom — a character, a motif, a look, a verb — instead of an intent; interrogate what it radiates, then run the spine backwards until the atom is load-bearing.
use-when: The project starts from something you can already see, hear, or feel — a sprite you can't stop flipping, a chord that sets a mood, a mechanic that's fun in a grey box — and no concept exists yet. Run this instead of intent-to-brief.
composes-with: [process-intent-to-brief, process-the-spine, process-the-twist, process-refine-and-handoff]
verify-with: design/FUN.md
---

# The Seed — atom-first design

The pipeline has **two lawful entries**. [[process-intent-to-brief]] parses a
*request* into a brief — concept-first, the classic door. This module is the
other door: the project begins with an **atom** — a small authored thing,
iterated until it's good *in isolation* — and the concept is grown out of it.
A protagonist silhouette becomes a platformer; a wistful motif becomes a
farewell game; a card that reads at a glance becomes a deckbuilder. Gamedev
does not always start with a design document. Sometimes it starts with
something you made on a Tuesday and couldn't put down.

Both doors lead to the same gate: **no loop assembly until a spine holds**
([[process-the-spine]]). What changes is the direction of travel — intent-first
*derives* elements from a tension; seed-first *discovers* the tension inside an
element that already exists.

## Why an atom outranks a pitch

The spine's old ordering law said *never twist-first, or you get a pitch in
search of a loop*. The refined law is **never pitch-first** — and an atom is
not a pitch. A pitch is an unfelt sentence; an atom is **felt evidence**. It
has survived iterations. Someone kept touching it. It carries real information
about what is interesting — information no brief can contain, because briefs
describe intentions and atoms demonstrate results. That evidence is exactly
what earns the atom its entry: you are not designing from a guess, you are
designing from the one part of the game that already works.

## The method

**1 · Author the atom until it's good alone.** In the project, from day zero —
an atom is a module in `atoms/`, visible in the Workshop the moment it exists
(see the project anatomy in `docs/CONVENTIONS.md`). Iterate with the knobs, the
vision judge, the audio gates — whichever proof fits its kind. Do not start
concepting from a mediocre atom; the whole method rests on the atom being
genuinely good.

**2 · Interrogate what it radiates.** An atom that's good in isolation is
radiating something — name it. Ask, in order:

- **Fantasy** — who do I become when I look at / listen to / play this?
- **Verb** — what action does it imply? (A silhouette with a lantern implies
  *carrying*; a rising motif implies *ascending*; a card implies *committing*.)
- **Tension** — what could make this thing *load-bearing*? What would it cost,
  what would it renew, what would oppose it?

Write the answer as one line in the atom's declaration (`radiates:`) — the
machine-readable hook the tooling surfaces. If, after honest iteration, the
atom radiates *nothing* — it's pretty but implies no fantasy, no verb, no
tension — archive it with a note. A dead seed costs a day; a game grown from
a dead seed costs a month.

**3 · Run the spine backwards.** [[process-the-spine]] normally derives
elements from a tension. Here you invert it: audition **tensions in which this
atom is structural, not decorative**. For each candidate spine, ask the seed
gate:

> If I removed this atom from this spine, would the spine survive unchanged?

If yes, the atom is decoration in that spine — the exact failure
[[antipattern-decoration]] names — and you keep auditioning. You want the
spine where the atom sits *inside* the tension: the lantern-carrier's flame IS
the scarcity; the motif's swell IS the renewal beat; the card's cost IS the
spend. From there the spine runs forward as normal — objective · superpower ·
scarcity · obstacle · renewal, the gate, the resonance table.

**4 · Write the concept into the Timeline.** When a spine holds, open the
project's `TIMELINE.md` and write the **Original Concept** as its first entry —
dated, honest, and *allowed to stale*. The Timeline is a log, not a contract:
later pivots are appended as new entries, never edited into the original. The
concept you write today is the record of what you meant, not a rail the
project must run on.

**5 · Proceed as usual.** Compose, shape, handoff — the rest of the pipeline
([[process-refine-and-handoff]]) neither knows nor cares which door you came
through.

## The pivot rule

Before loop assembly, **atoms outrank concepts**: when iterating an atom
teaches you something the concept can't absorb — the character you can't nail
gives way to a cooler one that implies a different game — the concept yields.
Re-run this module from the new atom and append the pivot to the Timeline.
This is *why* atom iteration happens before assembly: it is when pivots cost a
paragraph instead of a rewrite.

After loop assembly, the ranking flips: **the spine outranks atoms**. A new
atom that fights the shipped tension is scope creep wearing inspiration's
clothes — park it in the Timeline's Future section for the next game.

## Traps

- **Pitch smuggling.** "My atom is the idea of a game where…" — no. An atom is
  authored and iterated, not described. If you can't put it in the Workshop,
  it's a pitch, and pitches enter through [[process-intent-to-brief]].
- **Polish as procrastination.** Six atoms, no spine, no game. The Workshop's
  missing Play tab is the tell. The discipline: every atom names what it
  radiates or gets archived; the seed exists to *grow*, not to be tended.
- **Decoration marriage.** Forcing the atom into a spine it doesn't bear.
  Run the seed gate honestly — a good atom in the wrong spine makes a worse
  game than no atom at all.
- **Concept archaeology.** Treating the Timeline's first entry as binding.
  It's a dated record of a past belief; the log grows, the project moves.
