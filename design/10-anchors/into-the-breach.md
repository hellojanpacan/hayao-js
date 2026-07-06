---
id: anchor-into-the-breach
title: Into the Breach
kind: anchor
tags: [tactics, perfect-information, telegraph, turn-based, puzzle, positioning, grid]
summary: Perfect-information tactics — every enemy move is shown before it happens, and the game is the puzzle of rewriting that telegraphed future in one turn.
use-when: Designing a turn-based tactics game where fairness comes from total honesty and the fun is manipulating a known future, not guessing an unknown one.
composes-with: [genre-tactics, system-telegraphs, system-combat-model, system-counter-systems]
anchors: [anchor-into-the-breach]
verify-with: docs/FUN.md#12-·-turn-based-tactics-into-the-breach-like
---

# Into the Breach

**What it is.** A compact turn-based tactics game on an 8×8 grid. Enemies
telegraph exactly what they'll do next turn; you have three mechs and a
fistful of moves to shove, block, and reposition so the incoming attacks land
on *nothing* — or on each other.

**Player fantasy / why it's fun.** *I am a puzzle-solver defusing the future.*
The pull is **perfect information**: nothing is hidden, nothing is
random-to-your-face, so every loss is *your* miscalculation and every clean
turn feels like a proof you found. It's chess where the opponent shows their
move and dares you to invalidate it.

## Design DNA

Invert the fog. Where most tactics hide enemy intent behind hit-chances and
initiative, Into the Breach **shows everything** — targets, damage, order —
and makes the game about *editing* that plan. Your verbs aren't mostly damage;
they're **displacement**: push an enemy off its target, into another enemy,
into a hazard. The threat is real, the answer is spatial, and the board is
small enough to solve fully in your head.

Perfect information changes what "skill" means. In a hidden-info tactics game,
skill is partly *managing variance* — hedging against the roll. Here there is
no roll to hedge; skill is *pure spatial reasoning*, and a loss is
unambiguously a puzzle you solved wrong. That honesty is a design constraint
with teeth: every telegraph you show must resolve *exactly* as shown, or the
whole contract collapses. The reward is that hard turns feel *solvable* rather
than *unlucky* — the player always believes a perfect answer exists, and
usually it does.

Constraint is the engine: tiny grid, few units, few moves, one objective —
protect the buildings. Depth comes from interactions, not scale. Because you
win by *prevention* rather than *elimination*, the state space stays small
enough to reason about exhaustively, which is exactly why the puzzle lands.

## Load-bearing structures

| Structure | Why it works |
|---|---|
| **Telegraphs as directions, not target tiles** | Store "this bug attacks *this way*," so pushing it *rewrites the outcome*. This is the single most important implementation choice. FUN.md truth. [[system-telegraphs]]. |
| **Perfect information, perfect honesty** | What's shown is exactly what resolves — no hidden rolls. Fairness is structural, so hard turns feel solvable. |
| **Displacement as the primary verb** | Push/pull/block beats raw damage — you win by redirecting threats onto each other or into hazards. [[system-combat-model]] / [[system-counter-systems]]. |
| **Tiny bounded board** | 8×8 keeps the state space small enough to *fully reason about* — the puzzle is tractable by design. |
| **Protect-the-objective win condition** | You don't need to kill everything; you need the buildings to survive. Reframes "win" as damage-*prevention*. [[system-encounter-design]]. |
| **Both proofs per scenario** | A winning line AND a losing do-nothing must exist — a threat a null turn survives isn't a threat. FUN.md law 4. |
| **Run structure with persistent pilots** | Light meta (pilot XP, mech unlocks) wraps the tactical puzzles into a campaign. [[system-meta-progression]]. |

## What to steal

- **Show the enemy's move, then make the game about editing it.** The whole
  design flips from prediction to manipulation. This is the reusable core.
- **Store telegraphs as directions on units, not fixed target tiles** — so a
  push *changes* the outcome. (FUN.md §12; this is the load-bearing data
  choice.)
- **Make displacement a first-class verb.** Redirecting a threat is more
  interesting than out-damaging it, and it turns enemies into weapons.
- **Keep the board tiny and the objective defensive.** Solvability comes from
  bounded scale + "protect," not "eliminate."
- **Ship both proofs per encounter:** a winning line and a losing null (FUN.md
  law 4); prove each mechanic — push, bump, redirect — in isolation. A 1-ply
  greedy bot over `structuredClone`d state is a real baseline defender and a
  completability check in one.
- **Reframe the win condition as *prevention*.** "Protect the objective"
  instead of "kill everything" keeps the board small, makes displacement
  matter more than damage, and turns every enemy into a tool rather than just
  a target.

## What's just theme (drop it)

- **Kaiju / mech / time-travel fiction.** Cosmetic; the puzzle is theme-blind.
- **The specific squads.** *Squad = a coherent verb-set with an identity* is
  structural; "Rift Walkers vs Rusting Hulks" is flavour —
  [[system-faction-asymmetry]].
- **The grid being 8×8.** *Small enough to fully reason about* is the rule;
  the exact number is tuning.
- **Sci-fi VFX.** The threat only needs to *read* its direction and damage
  clearly — [[pattern-readability]].

## Composes into

- [[genre-tactics]] — its canonical anchor; the rewrite-the-future loop lives
  there.
- [[system-telegraphs]] — the exemplar of intent-as-direction.
- [[system-combat-model]] — displacement-first resolution.
- [[system-counter-systems]] — turning threats against each other.
- [[system-encounter-design]] — protect-the-objective scenario design.

## Twist seams

- **Into the Breach but you play the swarm** *(perspective)* — you set the
  telegraphs; a defender edits them; asymmetric two-side design. Feeds
  [[system-coop-and-competition]] / [[system-faction-asymmetry]].
- **Into the Breach but real-time with a freeze verb** *(mechanic-swap)* — the
  "shown future" becomes a pausable prediction line you scrub and rewrite.
  Bends the turn structure while keeping perfect information.
- **Into the Breach but the objective is to *cause* the chain reaction**
  *(constraint)* — Rube-Goldberg tactics: you can't attack directly, only
  nudge, so every kill is a redirect. Sharpens displacement into the *only*
  verb.
- **Into the Breach but tonal — you're a crossing guard, not a soldier**
  *(tonal)* — the telegraphed threats become traffic, weather, or a panicking
  crowd; you displace *hazards away from people* rather than bugs off
  buildings. Same perfect-information displacement puzzle, cozy register.
  Pairs with [[pattern-readability]].

## See also

- [[genre-tactics]] · [[system-telegraphs]] · [[system-counter-systems]]
- `docs/FUN.md#12-·-turn-based-tactics-into-the-breach-like` — greedy-clear +
  do-nothing-loses + per-mechanic proofs.
- `sandboxes/pathfinding-demo/` — grid movement / `astar` for reachable-tile
  UI.
