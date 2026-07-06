---
id: genre-walking-sim
title: Walking Sim / Vignette
kind: genre
tags: [narrative, exploration, atmosphere, environmental-story, pace]
summary: Story delivered by moving through space — atmosphere and environmental narrative over mechanics; pace is the design.
use-when: You want an emotional, story-first experience carried by place and mood.
composes-with: [genre-exploration, world-level-as-story, world-mood-and-atmosphere, world-narrative-delivery]
anchors: [anchor-outer-wilds]
verify-with: docs/JUDGE.md
---

**What it is.** A game where the primary verb is *move through place*, and the story lives in the environment — objects, light, sound, and layout — not in a combat model or a fail state. The **space** is the script.

**Player fantasy / why it's fun.** You are a reader who walks. Meaning accretes as you round each corner; the pull is *what is this place, and what happened here* — curiosity braided with mood, paid off by understanding rather than victory. *Gone Home*, *Dear Esther*, *Firewatch*, *What Remains of Edith Finch*.

## Pillars (exactly 3)

| Pillar | What it demands |
|---|---|
| **Place-as-story** | Every room encodes a fact, a feeling, or a question. Layout is exposition. No filler geometry. |
| **Curated pace** | You author the *rhythm* of the walk — where they slow, where they run, where the view opens. Pace is not incidental; it is the mechanic. |
| **Emotional arc** | The session bends toward a feeling. First beat sets the key; last beat resolves or ruptures it. Track the arc, not a score. |

## The loop stack

| Layer | Beat |
|---|---|
| **Moment** | See a detail → read it → form a small hypothesis. A note, a photo, a smell rendered as light. |
| **Encounter** | A *room* or vista: a self-contained vignette that lands one beat and hands you the next hook. |
| **Session** | The full walk — arc from hook to understanding. Most walking sims are one sitting (60–180 min). |
| **Meta** | Reflection and second reading; the world reframes on replay when you know the ending. Rare, prized. |

## Essential systems

- [[system-map-and-navigation]] — gentle wayfinding; the player must never be *lost* in a bad way, only *searching* in a good way. Sightlines and landmarks do the guiding, not a HUD arrow.
- [[world-narrative-delivery]] — audio logs, notes, overheard radio, in-world text. Choose one spine and commit; mixed delivery dilutes voice.
- [[world-mood-and-atmosphere]] — the atmosphere *is* the content budget. Weather, time-of-day, silence.
- [[world-level-as-story]] — geometry as authored sentence: a locked door is a paragraph, a dead-end is punctuation.
- [[world-soundscape]] — the single highest-leverage channel. Footstep material, room tone, a score that breathes with the walk.
- [[system-collectibles]] — optional, and dangerous: use it to *deepen* place, never to gate the ending. See pitfalls.
- [[system-weather-and-time]] — a cheap, potent lever for pace and mood shifts across the walk.
- [[system-save-and-checkpoint]] — invisible and forgiving; a walking sim should never punish leaving the room.

## Content & difficulty model

- **There is no difficulty curve — there is a *pull* curve.** Replace "can the player win" with "does the player want the next room." Author tension via [[pattern-pacing-and-tension]], not enemies.
- **Every room earns the walk.** The core gate: a room that adds no fact, feeling, or question is cut. Corridors between beats must at minimum shift mood. This is the whole discipline — see [[antipattern-content-desert]].
- **Density over size.** A short, dense walk beats a long, sparse one. Budget by *beats per minute of walk*, not by square meters.
- **Negative space is content.** Silence, an empty hallway, a held pause — deliberate emptiness is a beat, not absence. See [[pattern-restraint-and-negative-space]].
- **Sightline choreography.** You control what the player sees and when. Frame the payoff before the player reaches it; the reveal is a designed shot. See [[pattern-readability]] and [[pattern-opening-hook]].
- **Onboarding is diegetic.** Teach *look* and *move* inside the fiction in the first minute; no tutorial screen. See [[system-onboarding]].

## Signature-mechanic seeds

- **Walking sim but the space rearranges behind you** *(structure)* — corridors you've passed reconfigure when off-screen, so the map you're building in your head is unreliable and the *shape* of the place becomes the story. Deterministic, authored transforms — no random churn. (*Gone Home*'s house that never lies vs. this house that quietly does. Keep it fair — telegraph the rules; see [[pattern-fairness-and-trust]].)
- **Vignette but two players walk separate versions of the same place** *(perspective)* — split-screen or asynchronous; each sees a different era, mood, or truth of one location, and the story is the *diff* between the two walks. One player's graffiti is the other's fresh paint. Composes toward [[genre-narrative-decisions]] if the two must reconcile.
- **The walk is a single unbroken shot** *(constraint)* — no cuts, no loads, no fade; the whole arc is one continuous move, so pace becomes literally uncuttable. *Firewatch*'s tower-to-fire tension, stretched to the whole game.
- **You revisit one room across time** *(time)* — the same space at five moments; the walk is vertical (through years) not horizontal (through rooms). Pair with [[system-weather-and-time]].
- **The environment answers your gaze** *(feedback)* — where you *look* changes what the place reveals next; attention is the input verb. Restraint required — make the response subtle enough to feel like the world, not a puzzle lock.

## Common pitfalls

- [[antipattern-content-desert]] — the defining failure: empty space with no pull. If a stretch of walk has no beat, you have padding, not atmosphere. Cut or seed it.
- [[antipattern-endless-tutorial]] — over-explaining the fiction. Trust the player to read the room; a note that states what the room already shows is dead weight.
- [[antipattern-false-depth]] — a "profound" tone with nothing underneath. Mood must be *about* something; vibe alone curdles into pretension. *Dear Esther* survives on craft; imitators don't.
- [[antipattern-fake-choice]] — offering interaction that never matters. If the player can pick up an object, it should reward the reading — else don't make it grabbable.
- [[antipattern-guess-the-designer]] — a required insight the environment never fairly telegraphs. If progression stalls on a leap only the author would make, the sightlines failed. Guide with [[pattern-readability]].
- **Ludonarrative drift** — bolting a combat or puzzle mini-game onto a mood piece to "add gameplay." It fractures the pace. If a mechanic doesn't serve the walk, cut it; see [[antipattern-feature-soup]].

## Composes with

- [[genre-exploration]] — the mechanical parent; walking sim is exploration with the reward turned from *loot* to *meaning*.
- [[genre-narrative-decisions]] — add branching and you drift toward *Disco Elysium* / *The Stanley Parable*.
- [[genre-survival-horror]] — same navigation spine, dread instead of melancholy (*Amnesia*, *SOMA*, *P.T.*).
- [[genre-metroidvania]] — borrow its gated-space grammar without its combat, and the walk gains structure.
- Process: shape the feeling first via [[process-pillars]] and [[process-intent-to-brief]]; find the twist with [[process-the-twist]].

## Anchors

- [[anchor-outer-wilds]] — the ceiling: a solar system whose every place is a legible story beat, gated by *knowledge* not power, arced toward one devastating understanding. Study how it makes *walking toward the answer* the entire game.

## Verify

Judge this genre by eye, not by score. Render a headless still of each key vignette and ask: does the frame read its beat, does the mood land, does the space pull the eye onward? Score looks and legibility against `docs/JUDGE.md`.
