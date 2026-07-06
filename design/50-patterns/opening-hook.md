---
id: pattern-opening-hook
title: The Opening Hook
kind: pattern
tags: [onboarding, first-minutes, retention, teaching, pull]
summary: The first two minutes decide the rest — hook with the fantasy fast, teach by doing, earn the next decision quickly.
use-when: You are designing the first thing a player sees and does.
composes-with: [system-onboarding, antipattern-endless-tutorial, pattern-mastery-and-flow]
verify-with: docs/VERIFICATION.md
---

**What it is.** The first two minutes of play, engineered. You deliver a taste of the **core fantasy** before you explain anything, teach the first verb by having the player *do* it, and hand them a real decision fast enough that they lean in instead of drifting off.

**Player fantasy / why it's fun.** The pull is *"I already get this, and I already like it."* A good hook lets a stranger feel competent and curious inside a minute — the promise of the whole game, compressed and playable, before the game has earned any patience.

## The three beats

The hook is not one moment. It's a sequence, and the order is load-bearing.

| Beat | Question it answers | Timing |
|---|---|---|
| **Taste** | "What am I?" — the fantasy, shown not told | Seconds 0–15 |
| **Verb** | "What do I do?" — the first real action, by doing | First ~30s |
| **Win** | "Am I good at this?" — a small, legible payoff | Under ~2 min |

Miss **Taste** and the player never forms a reason to care. Miss **Verb** and they wait to be told (and leave). Miss **Win** and they never close the first competence loop, so nothing pulls them into the second.

## Levers

- **Time-to-fun** — how long until the player does the thing the box promised. Measure it in seconds, not screens. *Tetris* is fun on piece one. *Vampire Survivors* is fun the moment a weapon auto-fires and a wave dies. Cut everything between boot and that.
- **First-verb clarity** — the opening should make *one* verb obvious and safe to try. Not a moveset — a verb. *Celeste* teaches "jump" on a flat screen with nothing to hit, then "dash" on a screen where dash is the only way forward. The level *is* the lesson.
- **Early win** — a payoff the player caused and can read. It must feel earned, not gifted. *Peggle*'s first board can't really be lost; the fireworks still land because the player aimed the shot.
- **Reversibility** — early mistakes should be cheap. A safe sandbox lets the player poke the verb without fear, which is faster teaching than any prompt. See [[pattern-fairness-and-trust]] and [[system-grace]].

## How to build it

1. **Name the fantasy in one line**, then ask what single action *is* that fantasy. Build the first screen around that action and nothing else. Work from [[process-core-loop]] and [[process-pillars]] — the hook is the loop's smallest honest slice.
2. **Teach the first verb spatially, not textually.** Design a room where the verb is the only path forward. The environment prompts; you don't. This is the [[system-onboarding]] craft.
3. **Front-load the taste, back-load the depth.** Show the fantasy in beat one; reveal systems on a curve after the hook has bought attention. See [[pattern-mastery-and-flow]] and [[system-mastery-curve]].
4. **Guarantee the first win, then let the second be earnable.** Rig beat three so effort pays; make beat four require a little more. That gap is the pull into [[system-progression]].
5. **Withhold the menu.** Locked slots, greyed abilities, and choice screens before the first win are noise. See [[pattern-restraint-and-negative-space]].

## Hook shapes by genre

Different genres promise different fantasies, so their hooks front-load different beats.

| Genre | Taste it must deliver first | Fast reference |
|---|---|---|
| [[genre-roguelike]] | "A run is mine to steer" — first meaningful build choice fast | [[anchor-slay-the-spire]], [[anchor-hades]] |
| [[genre-horde-survival]] | "I get stronger and the screen fills" — an early kill wave | [[anchor-vampire-survivors]] |
| [[genre-precision-platformer]] | "My inputs are read exactly" — one clean jump, one clean death | [[anchor-celeste]] |
| [[genre-grid-puzzle]] | "The rules are simple and I can bend them" — a solvable-at-a-glance board | [[anchor-baba-is-you]] |
| [[genre-narrative-decisions]] | "My choices bite" — a consequence inside the first swipe | [[anchor-reigns]], [[anchor-papers-please]] |
| [[genre-deckbuilder]] | "Cards combo" — a two-card synergy that reads on turn one | [[anchor-balatro]] |
| [[genre-city-builder]] | "I made that grow" — one building that visibly pays off | [[anchor-factorio]] |

## Twist seams

Bend the standard hook when the game's identity lives in the bend.

- **A hook, but the taste is a lie you'll later invert** *(subverted-promise vector)*. Open with a confident, competent fantasy — then reframe it once trust is banked. *Braid* teaches "rescue the princess," then rewinds the meaning. Powerful; costs a second act to pay off. See [[world-narrative-delivery]].
- **A hook, but the first minute withholds the verb to make you find it** *(discovery vector)*. No prompt, no obvious action — the fun *is* deducing what you can do. *Outer Wilds* and *Return of the Obra Dinn* hook on curiosity, not competence. Works only when noticing is itself the core loop; see [[pattern-emergence]].
- **A hook, but it teaches by killing you** *(controlled-failure vector)*. The first death is the lesson and it must read instantly as fair. *Spelunky* and *Dark Souls* front-load a legible loss. Demands airtight readability — see [[pattern-readability]] and [[system-telegraphs]] — or it curdles into [[antipattern-rng-frustration]].

## Where it goes wrong

- **The hook oversells.** You show a fantasy the game never delivers — a scripted, juiced first level that the real game can't sustain. The player feels the drop when systems arrive. Promise only what beat 30 also keeps.
- **The tutorial ate the hook.** Explanation displaces play; the player is *told* the fantasy instead of *tasting* it. This is [[antipattern-endless-tutorial]] — the single most common way a hook dies.
- **The first decision is fake.** An early "choice" with one real answer teaches that choices don't matter. See [[antipattern-fake-choice]].
- **The menu came first.** A loadout/settings/lore wall before the first verb. See [[antipattern-decision-paralysis]].
- **The first win was gifted, not earned.** Unearned confetti reads as noise; the player learns their input didn't cause the payoff. Keep [[pattern-fairness-and-trust]] intact even in the sandbox.

## Overdone when

- Every session re-runs the hook — the tutorial you can't skip on run two. Gate it once; see [[system-save-and-checkpoint]].
- The scripted opening is more polished than any later hour, so the game peaks at minute one.
- You add a *second* hook (a splashy meta-progression tease) before the first fantasy has landed. One taste at a time — see [[antipattern-second-system]].

## Composes with

- [[system-onboarding]] — the mechanics of teaching; the hook is its opening move.
- [[antipattern-endless-tutorial]] — the failure mode this pattern exists to prevent.
- [[pattern-mastery-and-flow]] — where the player goes *after* the hook lands.
- [[pattern-pacing-and-tension]] — the hook is beat zero of the game's whole rhythm.
- [[system-reward-schedules]] — beat three's early win is the first entry on the schedule.
- [[process-the-twist]] — if your game is "X but Y," the hook must taste the Y, not just the X.

Prove the first-two-minutes feel with `sandboxes/` in isolation before wiring the full game; verification lives in [docs/VERIFICATION.md](docs/VERIFICATION.md), not here.
