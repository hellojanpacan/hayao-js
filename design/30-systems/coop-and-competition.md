---
id: system-coop-and-competition
title: Co-op & Competition
kind: system
tags: [coop, pvp, competition, asymmetric, interdependence, rivalry, multiplayer, communication]
summary: Co-op and PvP hooks — asymmetric co-op, interdependence, and rivalry that make other players the most interesting system in the game.
use-when: The design has more than one player and you need to shape how they cooperate, compete, or depend on each other.
composes-with: [system-faction-asymmetry, system-encounter-design, genre-coop-chaos, pattern-emergence]
anchors: [anchor-overcooked, anchor-it-takes-two]
verify-with: design/FUN.md#part-1--universal-laws
---

# Co-op & Competition

**What it is.** The design of **other players** as a system. Two engines: **co-op**
(players pursue a shared goal) and **competition** (players pursue opposed goals) —
and the richest designs make players **interdependent** (co-op) or **rivalrous**
(PvP) rather than merely co-located. Overcooked forces *communication* by making one
person's job depend on another's; It Takes Two gives each player a *different verb*
so neither can proceed alone.

**Player fantasy / why it's fun.** *You needed me / I beat you.* Co-op's pull is
shared triumph and the panic-laughter of a plan under pressure; competition's is the
sharp joy of a read that beat a real mind. Both put the most reactive, least
predictable system in the room — a *person* — at the center.

## When to use / when NOT

| Use it when | Skip it when |
|---|---|
| Two+ players share a screen/session | A solo experience — don't bolt on multiplayer |
| Interdependence or rivalry is the *point* | "Multiplayer" that's just two solo games side by side |
| Communication-under-pressure is the fun | Turn-based async where presence adds nothing |

> **Interdependence is the design, not the player count.** Two players who could
> each finish alone are playing *near* each other, not *with* each other. Force the
> dependency — split the verbs, split the resources, split the information — and
> co-op becomes a conversation ([[anchor-overcooked]], [[anchor-it-takes-two]]).

## Variants

| Variant | Structure | Feels like | Anchor |
|---|---|---|---|
| **Symmetric co-op** | same abilities, shared goal | "divide the work" | most horde co-op |
| **Asymmetric co-op** | different verbs, shared goal | "I can't do your job" | [[anchor-it-takes-two]] |
| **Forced-comms co-op** | one's task gates another's | "TALK to me" | [[anchor-overcooked]] |
| **Symmetric PvP** | mirror match | "pure skill read" | fighting/RTS |
| **Asymmetric PvP** | different roles/goals | "hunter vs. hunted" | 1-vs-many |
| **Shared-world rivalry** | indirect competition | "I beat your score/ghost" | leaderboards, ghosts |

## Tuning levers

| Lever | Effect | Watch for |
|---|---|---|
| **Interdependence depth** | how much players *need* each other | too much = one weak link stalls all; too little = parallel play |
| **Communication pressure** | how hard they must coordinate | time pressure forces talk (Overcooked); own it in [[genre-coop-chaos]] |
| **Asymmetry balance** | different roles, comparable impact | one role feeling like a passenger kills it |
| **Rivalry stakes** | what winning takes from the loser | too harsh = griefing; too soft = no bite |
| **Solo-fallback** | can one carry a struggling partner? | none = brittle; total = interdependence lost |

## How it wires to Hayao

- **Multiple players = multiple input streams into one deterministic sim.** Each
  player's intent flows as input *actions* on the shared `world.state`; because the
  sim is pure and rolls through `world.rng`, a co-op or PvP session is one
  deterministic, replayable artifact — the same seam Studio records
  ([`docs/STUDIO.md`](../../docs/STUDIO.md), FUN.md law 7). *(Grep `docs/API.md`
  before assuming any specific netcode primitive — Hayao's guarantee is the
  deterministic sim, not a bundled transport.)*
- **Rollback-with-carryover is already here.** The knob-change / hot-swap
  "snapshot → restore → `attach`" contract is the *same* contract rollback netplay
  uses (STUDIO knob-change semantics) — the determinism you need for co-op is the
  determinism the engine already enforces.
- **Asymmetric roles reuse faction design.** "Different but fair" is exactly
  [[system-faction-asymmetry]] applied to players — assert each role's viability the
  way you'd assert a faction's.
- **Shared encounters** are still [[system-encounter-design]] — pockets and exit
  lanes now serve two bodies, not one.

## Fails when…

- **Parallel play.** Players who never need each other are two solo games sharing a
  screen — no co-op fun (interdependence missing).
- **A passenger role.** In asymmetric designs, a role with no real impact benches a
  player — balance the roles like factions.
- **Griefing headroom.** PvP stakes so harsh (or tools so one-sided) that winning
  means ruining someone's session.
- **Coordination with no pressure.** Co-op that *permits* silence rarely *creates*
  talk — pressure (time, scarcity, split info) is what forces the conversation.
- **Non-determinism across clients.** Any wall-clock, `Math.random`, or
  iteration-order drift and the shared sim desyncs (CLAUDE.md invariant 2).

## Verify

- **Determinism across streams:** golden-hash a scripted two-player session; the
  shared sim replays bit-exactly regardless of which player acted when
  ([FUN.md law 7](../FUN.md#part-1--universal-laws)).
- **Every role viable (asymmetric):** assert each role's contribution clears a
  floor — the faction-viability check applied per player
  ([[system-faction-asymmetry]]; FUN.md law 2 skill-delta shape).
- **Interdependence proof:** a scripted "one player idles" run *fails* the shared
  objective — if solo-carry always works, the dependency isn't real (FUN.md law 4
  null-strategy shape).
- **Shared encounter fairness:** pockets/exit-lanes hold for the group
  ([[system-encounter-design]], FUN.md §4/§5).

## Composes with

- [[genre-coop-chaos]] — the genre where forced-comms co-op is the whole game.
- [[system-faction-asymmetry]] — asymmetric roles are player-side factions.
- [[system-encounter-design]] — fights now serve multiple bodies.
- [[pattern-emergence]] — the most emergent system in any game is another person.

## See also

- [`docs/STUDIO.md`](../../docs/STUDIO.md) — deterministic sessions + the rollback-with-carryover contract.
- [`design/FUN.md` law 7](../FUN.md#part-1--universal-laws) — pure state makes multiplayer replayable.
- [[anchor-overcooked]] · [[anchor-it-takes-two]] — forced communication and asymmetric interdependence.
