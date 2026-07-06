---
id: process-intent-to-brief
title: Intent → Brief
kind: process
tags: [intent, brief, scope, fantasy, hook, constraints, requirements, parse]
summary: Parse a vague request into a one-page brief — player fantasy, one-line hook, scope, hard constraints, target session length.
use-when: You have a high-level ask ("make a polished platformer") and need a concrete brief before you anchor, compose, or twist.
composes-with: [process-pillars, process-the-twist, process-composition]
verify-with: none
---

# Intent → Brief

**What it is.** The first step of the pipeline. Turn a one-line request into a
**brief**: five fields an agent can build against. The intent is the seed; the
brief is the contract you'll pressure-test everything else against.

**Why it's fun.** A brief protects fun. Left implicit, a request like *"a polished
platformer with responsive controls"* silently expands into scope you can't
verify. Pin the **fantasy** and you know what feeling to protect; pin the
**constraints** and you know what to refuse.

## The step

Parse intent → brief. You are not designing yet — you are *reading the request
correctly* so the design lands on what was actually asked.

## Inputs → outputs

| In | Out |
|---|---|
| A high-level request, one sentence to a paragraph | A five-field brief (below) |
| Named genres, feels, adjectives ("responsive", "impressive", "chill") | Each adjective resolved to a **fantasy** or a **constraint** |
| Implicit scope ("an RTS", "a roguelite") | An explicit scope + target session length |

The five brief fields:

1. **Player fantasy** — what the player *feels they are*. Not "a platformer" but
   *"a body you trust completely, threading gaps by a hair."* One sentence.
2. **One-line hook** — the store sentence, provisionally in [[process-the-twist]]'s
   "X but Y" shape. It may still be pure X here; the twist sharpens it later.
3. **Scope** — how big: one screen vs. a campaign, one system vs. six. The honest
   size, phrased as content units (levels, rooms, waves, cards).
4. **Hard constraints** — the non-negotiables. Some come from the ask ("couch
   coop", "one button"); some are *always on* for Hayao (deterministic sim, pure
   logic, DOM chrome — see [CLAUDE.md](../../CLAUDE.md)).
5. **Target session length** — 90-second run? 20-minute sitting? A weekend? This
   sets the loop stack ([[process-core-loop]]) and the meta.

## How to run it

1. **Read the request twice.** First for genre, then for *adjectives*. Every
   adjective is a smuggled requirement — "responsive" = grace system, "impressive
   battles" = mass + spectacle, "chill" = a tonal constraint against fail-states.
2. **Extract the fantasy.** Ask "what does the player get to *feel they are*?"
   Write it as a person doing a thing, not a genre label.
3. **Draft the hook.** One sentence. If a touchstone game is obvious, name it —
   that's your provisional **X** for [[process-the-twist]].
4. **Size the scope honestly.** Convert "an RTS" into countable content and the
   systems it implies (this is where [[process-composition]]'s checklist starts).
   Under-scope on purpose; a small proven thing beats a large unverifiable one.
5. **List hard constraints.** Split into *asked* (from the request) and *inherited*
   (Hayao invariants). Constraints are gifts — each one collapses the design space.
6. **Set session length.** Pick the sitting the fantasy wants, then let it drive
   the loop layers you'll design in [[process-core-loop]].
7. **Write it as one page.** If it doesn't fit a page, the intent isn't parsed yet.

## Worked example A

**Intent:** *"make a polished platformer with really responsive controls."*

| Field | Parsed |
|---|---|
| Fantasy | *"A body you trust completely — every death is your fault, never the game's."* |
| Hook | *"A precision platformer where the controls are the whole promise."* (X = [[anchor-celeste]]; twist TBD.) |
| Scope | ~12 handcrafted levels, one movement kit, one hazard family. No combat. |
| Hard constraints | *Asked:* "responsive" = a full grace system ([[system-grace]]). *Inherited:* deterministic sim, movement envelope derived not vibed, DOM menus. |
| Session length | 2–5 min per level; 30–45 min for the set. Instant retry. |

"Responsive" was the load-bearing word: it resolved straight to [[system-grace]]
and to FUN.md's coyote/buffer/apex canon — proven, not designed here (see FUN.md
§2). The brief now *knows what to protect*.

## Worked example B

**Intent:** *"design an RTS with faction asymmetry and impressive battles."*

| Field | Parsed |
|---|---|
| Fantasy | *"A commander whose faction plays like nobody else's, watching a hundred units answer one order."* |
| Hook | *"An RTS where three factions share no units and still balance."* (X = [[anchor-starcraft]].) |
| Scope | 3 factions × ~6 units, ~5 skirmish maps, 1 economy, 1 tech ramp. No campaign v1. |
| Hard constraints | *Asked:* asymmetry that *balances* ([[system-faction-asymmetry]]); "impressive" = mass pathing + spectacle. *Inherited:* flow-field pathing, deterministic sim, exported arrival tolerances. |
| Session length | 10–20 min per skirmish; sit-down, not snackable. |

Two adjectives, two systems: *asymmetry* → [[system-faction-asymmetry]] +
[[system-unit-rosters]]; *impressive* → mass under command (FUN.md §9) +
[[system-boss-design]]-grade spectacle. "Impressive" is a **feel** claim — it will
hand off to JUICE.md's gates, not get argued here.

## Traps

- **Adjective blindness.** "Polished", "responsive", "impressive", "chill" are
  requirements in disguise. Leave one unparsed and it becomes untestable scope.
- **Genre as fantasy.** "A roguelite" is not a fantasy; *"every death teaches you
  the dungeon"* is. Push past the label to the feeling.
- **Scope inflation.** The request rarely asks for the biggest version. Build the
  smallest thing that delivers the fantasy; grow only what verifies.
- **Skipping inherited constraints.** Determinism, pure logic, and the cosmetic
  rule are constraints on *every* brief even when unasked — bake them in now, not
  in a painful refactor later.
- **Hook without an anchor.** If no touchstone comes to mind, the intent may be
  under-specified — name the closest X anyway; [[process-the-twist]] needs one.

## Composes with

- [[process-pillars]] — the brief's fantasy + hook are the raw material the three
  pillars distill from.
- [[process-the-twist]] — the provisional hook here becomes the **X** to bend.
- [[process-composition]] — scope + constraints feed the systems-checklist.

## See also

- [`design/README.md`](../README.md) — where this sits in the pipeline (step 1).
- [CLAUDE.md](../../CLAUDE.md) / [AGENTS.md](../../AGENTS.md) — the inherited
  invariants every brief must list as hard constraints.
- [docs/FUN.md](../../docs/FUN.md) — the mechanical truths the parsed adjectives
  will eventually be proven against. Design here; prove there.
