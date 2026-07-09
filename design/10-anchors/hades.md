---
id: anchor-hades
title: Hades
kind: anchor
tags: [roguelite, meta-progression, narrative, death, build-diversity, boons, run-based]
summary: Action roguelite where dying is the delivery mechanism for story and power — meta-progression is narrative, so losing is content, not punishment.
use-when: Designing a run-based game where you want death to advance the fiction and the meta-loop to carry players through failure.
composes-with: [genre-roguelike, system-meta-progression, system-build-diversity, system-emergent-systems]
anchors: [anchor-hades]
verify-with: design/FUN.md#10-·-traditional-roguelike
---

# Hades

**What it is.** A fast isometric action roguelite where every death returns
you *home* — and home is where the story, the relationships, and the permanent
upgrades all live. You lose, you learn something, you get a little stronger
and a lot more attached.

**Player fantasy / why it's fun.** *Failure is progress.* Most roguelites ask
you to endure the grind between runs; Hades makes the grind the *best part*.
The pull is a double hook: the tight combat run, and the soap-opera of NPCs
who react to your last death by name.

## Design DNA

Take the roguelike's **fair-discovery run** and solve its oldest problem — the
demoralising reset — by routing **death straight into content**. Every failed
run spends its currency on: a permanent power sliver, a new line of dialogue,
a nudged relationship. The meta-layer isn't a stat screen; it's a *story that
only advances when you die*. Combat gives you the moment-to-moment; the
between-runs layer gives you the reason to start the next one.

The structural inversion is worth naming: in most roguelites the run is the
reward and the reset is the tax. Hades makes **the reset the reward** — you
*want* to come home, because home is where the writing, the gifts, and the
mirror upgrades live. A player who bounces off the combat still gets a full
game out of the hub. That doubles the audience the design can hold, and it's
why "just one more run" survives even a losing streak.

The second pillar is **build-from-a-draft**: boons offered on the way down
compose into a run identity, so no two descents play alike. The draft and the
meta-layer reinforce each other — the mirror talents you unlocked by *dying*
widen the space of viable builds, so failure literally expands the strategy
tree.

## Load-bearing structures

| Structure | Why it works |
|---|---|
| **Death → home → story** | The reset isn't a punishment screen; it's the narrative delivery vehicle. Losing *is* the content. [[system-meta-progression]] + [[world-narrative-delivery]]. |
| **Two currencies, two horizons** | Ephemeral in-run resources (build the run) vs persistent meta-currency (build the *account*). Splits "this run" from "forever." [[system-economy]]. |
| **Boon draft = run identity** | Choose-1-of-N god blessings compound into a build; synergies (duo boons) reward committing. [[system-build-diversity]] / [[pattern-risk-reward]]. |
| **NPCs with memory** | Characters react to your deaths, gifts, progress — a light [[system-emergent-systems]] that makes the hub feel alive and rewards *returning*. |
| **Escalating-but-optional heat** | A self-imposed difficulty stack (Pact of Punishment) lets mastered players re-earn tension. [[system-difficulty-and-dda]]. |
| **Generous permanent floor** | Meta-upgrades (death defiance, mirror talents) make each run start stronger — the curve pulls weak players forward without trivialising skill. |
| **Short, legible runs** | ~30-min descents keep the death-story loop tight; you're never far from the next beat. [[system-session-structure]]. |

## What to steal

- **Route failure into content.** The single most portable idea: every loss
  should hand the player *something* — a line, an unlock, a relationship tick.
  Kills the "wasted run" feeling and turns a losing streak into a story arc.
- **Split ephemeral vs persistent currency.** One builds the run, one builds
  the save. Keep the horizons distinct so both decisions matter — in-run
  resources are spent recklessly, meta-currency is hoarded and planned.
- **Draft-of-N boons that compound into an identity**, with rare high-synergy
  payoffs (duo boons) that reward committing early to an archetype rather than
  grabbing the best single card.
- **A hub of NPCs that remember.** Even shallow memory — a flag per death, a
  gift counter, a "last boss killed" string — makes the meta-loop feel like a
  place you return to, not a menu you tab through. See
  [[system-emergent-systems]].
- **A permanent floor generous enough to carry a struggling player**, paired
  with an *opt-in* difficulty stack for the mastered one (Heat / Pact). One
  curve, two audiences: the floor pulls weak players up, the opt-in ceiling
  re-earns tension for strong ones.
- **Make the meta-tree widen builds, not just raise stats.** Unlocks that add
  *options* (new weapons, mirror branches) keep death interesting far longer
  than unlocks that only add power.

## What's just theme (drop it)

- **Greek mythology.** Fully cosmetic — the boon-givers could be corporate
  sponsors or rival chefs. The *draft-from-named-benefactors* structure is
  what matters.
- **The specific family drama.** The *structure* (NPCs react to deaths) is
  stealable; the exact cast is flavour — see [[world-narrative-delivery]].
- **Isometric hack-and-slash combat.** The meta/death loop is genre-agnostic;
  bolt it onto a deckbuilder, a shmup, a racer.
- **Voice-acted dialogue at scale.** The reactive-NPC *hook* works with one
  line of text per event.

## Composes into

- [[genre-roguelike]] — supplies the fair-discovery run this wraps.
- [[system-meta-progression]] — Hades is the reference for meta-as-narrative.
- [[system-build-diversity]] — the boon draft is the exemplar.
- [[system-emergent-systems]] — the remembering hub.
- [[world-narrative-delivery]] — story told through system events, not
  cutscenes.

## Twist seams

- **Hades but you play the ones left behind** *(perspective)* — you're a hub
  NPC managing the runners; death sends *them* home to you, and you spend
  their currency. Inverts who owns the meta-loop.
- **Hades but the story only advances on a *win*** *(structure)* — flips the
  emotional register: now every run is a fragile hope, and the meta-tree is a
  reward for survival, not consolation. Bends [[system-meta-progression]].
- **Hades but cozy — death is a dinner party** *(tonal)* — no combat; each
  "run" is a social escapade, and returning home unlocks recipes and
  relationships. Keeps the death→home→story spine, drops the violence. Pairs
  with [[genre-narrative-decisions]].
- **Hades but the hub is the game and the runs are backstory** *(perspective)*
  — invert the weighting: you *manage* the house between other characters'
  descents, and their deaths deliver content to *you*. The action loop becomes
  ambient; the relationship sim becomes central. Feeds
  [[system-emergent-systems]].

## See also

- [[genre-roguelike]] · [[system-meta-progression]] ·
  [[system-build-diversity]] · [[world-narrative-delivery]]
- `design/FUN.md#10-·-traditional-roguelike` — connectivity + winnability
  verify.
- `sandboxes/procgen-lab/` — seeded run generation with `Rng` / `pickEntry`.
