---
id: antipattern-dissonance
title: Dissonance
kind: antipattern
tags: [coherence, spine, tension, tone, consistency]
summary: An element that fights the spine — it doesn't just fail to add tension, it relieves the tension the rest of the game is building. Worse than decoration.
use-when: You are auditing the resonance table and an element's arrow points *away* from the spine — it defuses the core pressure.
composes-with: [process-the-spine, antipattern-decoration, antipattern-fake-choice, pattern-pacing-and-tension]
verify-with: design/FUN.md
---

**What it is.** An element whose effect is to **reduce the core tension** the spine
exists to create. Where [[antipattern-decoration]] is inert — neutral weight beside
the spine — dissonance is *active*: it pulls against the spine, releasing the very
pressure every other system is working to build. In the resonance table its arrow
points backward. It is the worse of the two failures, because dead weight can be
ignored and a leak can't.

**Why it hurts.** The rest of the game spends its whole effort *building* a tension;
one dissonant element quietly *drains* it, and the player feels the game "doesn't
know what it is." A retry-mastery platformer that also punishes death is fighting
itself: the difficulty says "try again fearlessly," the death says "fear failure."
Neither message lands. Coherence is what makes a game feel authored; dissonance is
the tell that it was assembled from parts that disagree.

## The smell

An element you can only justify by how it **relieves** pressure the spine is trying
to apply. "It's a hardcore scarcity-survival game — with a cozy, comforting tone."
"Every second is a committal life-or-death read — and there's a free-look button so
you can plan safely." The word *but* or *so you can relax* in the pitch of a
tension game is the smell.

## How it happens

| Origin | What you did |
|---|---|
| Wrong-spine convention | You imported a feature from a game with a *different* spine — permadeath from a survival game into a mastery game, where it's poison. |
| Comfort reflex | You worried the game was too tense and added a valve — but the tension *was the game*, and the valve empties it. |
| Tonal borrowing | You loved another game's mood and grafted it on without checking it agrees with your mechanic ([[world-naming-and-tone]] gone loose). |
| Fake safety | You gave the player a way to *avoid* the core decision (a dominant safe option), which resolves the tension to nothing — a [[antipattern-fake-choice]] that erases the spine. |
| Difficulty by the wrong knob | You made it "harder" by adding punishment rather than pressure — attrition instead of tension ([[antipattern-fail-loop-tax]]). |

## The tell (check YOUR OWN design)

- **The arrow-direction test.** In the [[process-the-spine]] table, does the row's
  arrow point *toward* the tension or *away*? Toward = coupled. Away = dissonant.
- **The relief test.** Ask: *does this element let the player escape the core
  decision?* If its function is to make the spine's pressure optional, it's
  dissonant. (Emberfall's free-look, Waterline's infinite water — both defuse the
  bomb the game is built around.)
- **The opposite-designer test.** Would the designer of the *opposite* game add
  exactly this? A cozy game wants a soothing tone; if your terror game has one, you
  borrowed from the wrong shelf.
- **The two-messages test.** Does one system say "be brave" while another says "be
  afraid"? Contradictory instructions to the player are dissonance you can hear.

## The fix

**Remove it, or invert it so it serves the tension.** Derive the contested element
*from* the spine instead of from habit:

- **Death / failure handling is derived, not defaulted.** A mastery spine wants
  instant, cheap respawn ([[recipe-emberfall]]); a survival spine wants loss that
  *stings* ([[recipe-waterline]]). Same feature, opposite correct answer — pick the
  one your spine implies, not the genre default.
- **Turn a valve into a cost.** If you must give relief, price it on the spine: not
  a *free* safe option, but one that spends the scarcity. Now "playing safe" is
  itself a trade, and the tension survives — route through [[pattern-risk-reward]].
- **Fix tone at the source.** Make the mood *express* the tension, don't contradict
  it. Emberfall's near-silence in the dark isn't comfort — it's dread. See
  [[pattern-pacing-and-tension]].

## Twist seams

- **A survival game but death is instant and free** — dissonant *unless* you've
  re-spined it to mastery ([[recipe-emberfall]] did exactly this on purpose). The
  same feature is coupling or dissonance depending on the spine.
- **A high-tension action game but with an assist mode** — *not* dissonant when it's
  an opt-in accessibility layer that leaves the default spine intact (Celeste's
  assist mode). Dissonance is when the *default* experience defuses itself.

## Seen in…

| Game shape | The dissonant element | Why it drains |
|---|---|---|
| Retry-mastery platformer | Punishing permadeath / limited lives | Says "fear failure" while the loop says "fail freely and learn." |
| Scarcity-survival | A cozy, reassuring tone | The mood tells the player they're safe; the spine needs them afraid. |
| Greed-vs-safety economy | A dominant risk-free option | Removes the decision the whole game is about — [[antipattern-fake-choice]]. |
| Committal-read action | A free planning/pause-to-look mode | Erases the *commitment* that is the spine ([[recipe-emberfall]]). |

## Composition notes

- Dissonance and [[antipattern-decoration]] are the two coherence failures the
  resonance table catches: decoration has *no* arrow, dissonance has a *backward*
  one. Audit for both before handoff.
- A dissonant "safe option" is often a [[antipattern-fake-choice]] seen from the
  spine's altitude — it doesn't just fail as a choice, it dismantles the tension the
  choice was meant to serve.
- The prevention is discipline in [[process-the-spine]] step 5: derive tone,
  death, and structure *from* the tension, never from the genre's defaults.

## Verify / guard

Before handoff, walk every resonance row and check the arrow *direction*, not just
its presence. Any element that relieves the core tension is dissonant — cut it, or
re-price it onto the spine. Then take it to [[design/FUN.md]]: the spine's central
fun-claim is that the tension is *felt*; if a system exists whose job is to let the
player not feel it, that system is fighting your own proof. Confirm the final call
with a human in the workshop playtest — dissonance is often invisible on paper and
obvious in the hands.
