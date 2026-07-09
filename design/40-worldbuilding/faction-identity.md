---
id: world-faction-identity
title: Faction Identity — making sides feel distinct in fiction
kind: worldbuilding
tags: [faction, identity, silhouette, motif, colour, values, fiction, asymmetry]
summary: Making factions feel distinct in FICTION — silhouette, values, colour, motif; the fiction companion to system-faction-asymmetry's mechanical difference.
use-when: Your design has two or more sides/factions and you need them to read as different worlds at a glance, not palette-swaps.
composes-with: [world-aesthetic-direction, world-naming-and-tone, world-theme-vectors]
anchors: [anchor-starcraft, anchor-shadow-of-mordor]
verify-with: design/JUDGE.md
---

# Faction Identity — making sides feel distinct in fiction

**What it is.** [[system-faction-asymmetry]] makes factions play differently.
This module makes them *feel* like different peoples. A faction reads when its
**silhouette, values, colour, and motif** all say the same thing — so a player
knows which side they're looking at from one frame, and knows what that side
*believes* from one unit. Mechanical asymmetry without fictional identity is a
stat-sheet; fictional identity without asymmetry is a costume.

**Player fantasy / why it's fun.** Players don't main a faction for its numbers;
they main it because it's *theirs*. Identity is what they're loyal to. A distinct
faction is a distinct fantasy: the swarm, the disciplined line, the desperate
salvagers.

## The four identity channels

Every faction needs a coherent answer on all four. When they agree, the faction
is legible; when they clash, it's noise.

| Channel | The question | Read at a glance? |
|---|---|---|
| **Silhouette** | Could you name the faction from a black shape? | Yes — shape is the fastest read |
| **Values** | What does this people believe / fear / want? | Slower — read through behaviour & lore |
| **Colour** | Which Kentō hue *owns* this faction? | Yes — one accent per side |
| **Motif** | The repeated visual/verbal signature (a shape, a word, a ritual) | Yes — the thing that recurs |

The strongest factions **map a value onto a mechanic onto a look** in one line:
*the disciplined line* believes in order → fights in formation (mechanic) →
straight silhouettes, indigo *ai* (look). Change any one and the other two feel
wrong.

## Vectors / options — where to source contrast

Pick a *primary axis of difference* and let all four channels express it:

| Contrast axis | Faction A pole | Faction B pole | Expresses through |
|---|---|---|---|
| **Order ↔ chaos** | rigid, geometric, few | teeming, organic, many | silhouette density; formation vs swarm |
| **Growth ↔ decay** | living, verdant, *matsu* | rusted, salvaged, *kaki*/*ko* | material & motif |
| **Sky ↔ earth** | tall, pale, airy | low, heavy, grounded | silhouette height; ground vs flight |
| **Old ↔ new** | weathered, ritual, ink | sharp, forged, bright | tone & naming register |
| **Predator ↔ prey** | angular, forward, few | rounded, defensive, many | shape language; posture |

Two factions should sit at *opposite poles of the same axis* — that's what makes
them read as a pair rather than two unrelated design docs. StarCraft's three sit
on order↔chaos↔hybrid; each is a clean silhouette and a clean fantasy.

## Method

1. **Pick the contrast axis** that matches your mechanical asymmetry
   ([[system-faction-asymmetry]]). If Faction A masses cheap units and B fields
   few elites, your axis is *chaos ↔ order* — build fiction on that.
2. **Write each faction's value in one sentence** — what they believe and fear.
   This drives naming ([[world-naming-and-tone]]) and behaviour.
3. **Assign one owning hue per faction** from the Kentō set. One accent each,
   never shared — colour is the fastest faction read (see hook).
4. **Design the silhouette rule.** A shape language each faction obeys:
   straight-and-tall vs low-and-organic. Test it as black shapes — if you can't
   tell them apart in silhouette, neither can the player mid-fight.
5. **Choose the motif** — one recurring signature (a broken-lantern crest, a word
   that only they use, a ritual gesture). It appears on units, HUD, and lore.
6. **Cross-check the triangle.** Value ↔ mechanic ↔ look must agree for each
   faction. A "peaceful" faction with the aggressive kit is a contradiction the
   player feels but can't name.

## Worked example

**Axis:** growth ↔ decay, on a drowned-coast world.

| | The Tidewardens | The Wracksalvage |
|---|---|---|
| **Value** | *keep the light; hold the line* | *take what the sea gives; owe nothing* |
| **Silhouette** | tall, straight lanterns & robes | low, hunched, jury-rigged hulls |
| **Colour** | indigo *ai* + shell *gofun* | persimmon *kaki* + rust *ko* |
| **Motif** | the unbroken flame | the scavenged hook |
| **Mechanic** | few, durable, defensive (holds ground) | many, cheap, opportunistic (swarms wrecks) |

You can tell them apart as black shapes; you can tell them apart by a single
hue; and each look *is* the mechanic. That's a legible pair.

## Aesthetic hook

Colour is the fastest faction read the JUDGE has an axis for (palette harmony).
Give each faction **one owning accent** from Kentō's eight — indigo *ai* reads as
disciplined and cool, persimmon *kaki* and rust *ko* as desperate and warm, pine
*matsu* as living, vermilion *shu* as aggressive. Because all eight belong to one
harmonised set (`npm run palette`, AA-gated), factions can be *distinct* without
*clashing* — the whole frame stays one world, which is exactly the JUDGE's
palette-harmony bar (`design/JUDGE.md` axis 3). Keep silhouette contrast doing the
heavy lifting so the sides read even where their pooled sprites share a lit
scene — contrast lives in the *edge and shape*, not only the fill
(`docs/CONVENTIONS.md`). Pair with [[world-aesthetic-direction]] to brief the
look and [[pattern-readability]] to keep both sides salient in a crowd.

## Traps

- **Palette-swap factions.** Same silhouette, different hue. Players read them as
  the same side in two colours. Silhouette first, colour second.
- **Look that fights the mechanic.** A "gentle" faction with a hyper-aggressive
  kit. The triangle (value ↔ mechanic ↔ look) must close.
- **Shared accent.** Two factions on the same hue are indistinguishable at
  distance. One owning accent each.
- **Motif overload.** Five crests and three slogans dilute the one that matters.
  One motif per faction, repeated.
- **Fiction with no mechanical asymmetry.** If the sides play identically, the
  identity is a costume — pair with [[system-faction-asymmetry]] or drop to one
  faction.

## Composes with

- [[system-faction-asymmetry]] — the mechanical difference this module dresses;
  they must be authored together.
- [[world-aesthetic-direction]] — turns each faction's colour/silhouette rule
  into a briefed, JUDGE-passing look.
- [[world-naming-and-tone]] — faction names and the words only they use.
- [[pattern-readability]] — keeps competing factions salient in a busy frame.

## See also

- [`design/JUDGE.md`](../JUDGE.md) — readability & palette-harmony axes:
  can you find and name each side instantly, in one world's colours?
- [[anchor-starcraft]] — three rosters, one balance, three unmistakable
  silhouettes. [[anchor-shadow-of-mordor]] — factions of *individuals* whose
  identity is emergent memory.
