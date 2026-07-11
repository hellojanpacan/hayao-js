---
id: world-soundscape
title: Soundscape & Audio Identity
kind: worldbuilding
tags: [audio, sound, music, feedback, mood]
summary: The sonic signature of a game — music, ambience, and SFX as identity and feedback; sound is half of feel.
use-when: You want audio to carry mood and reinforce feedback, not just decorate.
composes-with: [world-mood-and-atmosphere, pattern-juice-choreography, system-camera-and-controls]
verify-with: design/JUICE.md
---

**What it is.** The **sonic signature** of a game — music, ambience, and SFX treated as identity and as the second sense in every feedback event. Sound is half of feel; mute a great game and it dies.

**Player fantasy / why it's fun.** You *hear* your competence: the crisp thock of a landed hit, the swell as the arena opens, the pad that tells you home is safe before your eyes do. Audio closes the loop faster than a pixel can move.

## The kit

| Layer | Job | Failure if absent |
|---|---|---|
| **Music** | Mood, pacing, place-identity, tension curve | Scenes feel flat, no arc |
| **Ambience** | Continuous world presence (wind, machinery, crowd) | Space feels dead, "on a stage" |
| **SFX** | Per-event confirmation — the second sense | Actions feel unregistered, mushy |
| **Stinger** | One-shot punctuation on state change (win, unlock, death) | Beats pass unmarked |
| **UI sound** | Menu/HUD confirmation, distinct from world SFX | Cold, unresponsive chrome |

The **two-senses contract**: every consequential action lands on at least two senses. Screen-shake or flash is sense one (see [[pattern-juice-choreography]]); the SFX is sense two. A hit with no sound is a rumor. Build the pair, not the picture.

## Vectors / options

- **Palette per place/faction.** Give each biome or side a **motif** — an instrument, a key, a rhythm. Hades scores each Underworld region distinctly; the player knows where they are with eyes shut. See [[world-faction-identity]], [[world-mood-and-atmosphere]].
- **Diegetic vs. score.** Is the music *in* the world (a radio, a bard) or *over* it? Diegetic ties sound to fiction; score floats free. Papers Please's border-booth drone is near-diegetic dread.
- **Synth vs. sampled.** Prefer a small procedural synth kit (zzfx-style, generated at load, no external audio asset pipeline) for prototypes — every SFX becomes a parameter set you can tune deterministically. See [[world-aesthetic-direction]].
- **Adaptive layers.** Stack music stems and duck/raise them by state: combat adds a percussion layer, low-health adds a heartbeat, safety strips back to a pad. Ties to [[pattern-pacing-and-tension]].
- **Density curve.** Silence is a color. Cuphead's brass never stops; Return of the Obra Dinn withholds until a death is solved, then strikes a chord. Both are choices. See [[pattern-restraint-and-negative-space]].
- **Pitch as data.** Rising pitch = rising combo/stack (Peggle's ode-to-joy pegs, Vampire Survivors' escalating pickup blips). The ear reads a scale it can't read on a bar.

## Twist seams

- **Soundscape but the music IS the level timer** *(mechanic-swap)* — the track isn't backing, it's the clock. The bar you're on tells you how long you have; the final loop is the deadline. Rhythm games live here ([[genre-rhythm]]), but any timed level can borrow it: the drop lands when the door closes. Now audio can't be muted without losing information — treat it as a readability channel, not decoration ([[system-accessibility]] must mirror it visually).
- **Audio identity built from one instrument** *(constraint)* — the entire game speaks through a single voice: one synth, one drum, one plucked string. Constraint forces character. Mini Metro's whole soundscape is tuned tones derived from the map's own activity; Katamari commits to a maximalist band but a coherent one. Pick the instrument first, then design what it can say. See [[process-pillars]], [[world-theme-vectors]].

## Method

1. **Name the audio pillar** in one line — "warm analog dusk," "brittle glass menace," "8-bit triumphant." This is a [[process-pillars]] entry; every sound answers to it.
2. **Map the two-senses contract.** List every consequential action and state change; assign each a SFX or stinger slot. This is the spine — do it before any music.
3. **Assign motifs** to places/factions. One distinguishing element each (instrument, key, tempo). Cross-check against [[world-mood-and-atmosphere]] so sound and light agree.
4. **Build the synth kit** as parameter sets (frequency, decay, shape, noise), generated deterministically at load — no `Date.now`, all variation through the world RNG so a replay sounds identical.
5. **Layer the music adaptively.** Author stems for calm/tension/climax; drive the mix from game state, not a fixed playlist.
6. **Set the density curve.** Decide where silence sits. Mark the withheld beats — the moment the music *stops* is the loudest one.
7. **Mirror to the eye.** Anything audio conveys as information (timer, threat, combo) must also be visible. Prove the mute-test in [[system-accessibility]].
8. **Tune against JUICE.** Feel is the metric — see `verify-with`. Sit the SFX on the frame the effect lands (see [[pattern-juice-choreography]]); a hit sound a beat late reads as [[antipattern-input-lie]].

## Aesthetic hook

The Regalia palette prizes **restraint and register** — few colors, exact placement. Score to match: a *small* kit, precisely voiced. A duotone frame doesn't shout in every hue; your soundscape shouldn't fill every millisecond. Choose two or three timbres that "print" cleanly — a warm pad, a dry percussive tap, one bright accent — and let negative space carry weight. The dry *tok* of a placed stone is more on-register than an orchestral hit. Consistency of voice over volume of assets; the same discipline JUDGE applies to the frame.

## Traps

- **Audio as afterthought.** Bolted on after the mechanic ships, it never gets a pillar and stays generic. Design it in the brief ([[process-intent-to-brief]]) or it decorates instead of communicates.
- **Wallpaper music.** A loop that never reacts to state trains the player to ignore it. Adaptive layers or intentional silence — never a flat backing track under everything.
- **SFX soup.** Too many sounds firing at once and none reads. Prioritize: the player's own action is loudest, ambience is a floor. Mirrors [[antipattern-unreadable-juice]] in the ear.
- **Info hidden in sound only.** If the only tell for an incoming attack is audio, deaf and muted players are locked out. Every audio cue that gates play needs a visual twin — [[system-accessibility]], [[system-telegraphs]].
- **The unskippable sting.** A triumphant stinger on *every* pickup becomes torture at scale (see Vampire Survivors' late-game chaos). Rate-limit repeated sounds or vary pitch so the tenth one isn't the first.
- **Volume as intensity.** Louder is not more intense; contrast is. A whisper before the roar beats a constant roar. See [[pattern-escalation-and-payoff]].

## See also

[[world-mood-and-atmosphere]] · [[pattern-juice-choreography]] · [[system-camera-and-controls]] · [[genre-rhythm]] · [[world-aesthetic-direction]] · [[system-accessibility]] · [[system-telegraphs]] · [[pattern-pacing-and-tension]] · [[pattern-restraint-and-negative-space]] · [[world-faction-identity]] · [[process-pillars]] · [[world-theme-vectors]]
