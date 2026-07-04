# AUDIO.md — first-class, AI-first game audio

Hayao's thesis is "an LLM can author, test, and *prove* a whole game without opening
a browser." Audio used to be the one subsystem that broke it: the old `AudioBus`
was a no-op in Node, so sound could only be *heard*, never *verified*. This
subsystem fixes that. **The reframe: audio is the most verifiable subsystem, not
the least.** A score is deterministic data that renders to PCM in plain Node, so
it is hashable, measurable, and gated exactly like puzzle logic.

Everything here is **zero-runtime-dependency, pure TypeScript, deterministic**
(all transcendental math via `dmath`; the only entropy is a seeded `Rng`). The
designs are borrowed from proven OSS (ZzFX, Sonant/SoundBox, ZzFXM, tonal.js,
Meyda, FMOD/Wwise) but reimplemented fresh to fit the determinism invariant.

## The layers

| Layer | File | What it is |
|---|---|---|
| **PCM core** | `src/audio/pcm.ts` | Stereo buffers, equal-power pan, additive mix, soft-clip/normalize, WAV encode, `signalHash`. The headless substrate everything renders into. |
| **SFX synth** | `src/audio/synth.ts` | `SoundSpec` (ZzFX's 20-knob vocabulary + jsfxr filters, named fields, musical units) → `renderSound(spec) → Float32Array`. Sample-by-sample, deterministic. |
| **Theory** | `src/audio/theory.ts` | Pure note↔MIDI↔freq, scales/modes, diatonic chords, roman-numeral progressions. The "harmony oracle" a composer leans on (LLMs can't invent harmony). |
| **Composition** | `src/audio/music.ts` | `Song` = tracks × patterns × `{pitch,beats,vel}` notes (tracker model). `renderSong → StereoBuffer` through the *same* synth core. `INSTRUMENTS` preset voices. |
| **Linter** | `src/audio/lint.ts` | `lintSong` — a deterministic rule-checker (in-key, structure, valid data). To music what `assertSolvable` is to a puzzle. |
| **Analysis** | `src/audio/analysis.ts` | FFT, RMS, peak dBFS, spectral centroid, ZCR, spectral-flux onsets, autocorrelation tempo. The numeric "ear." |
| **Verifier** | `src/verify/audioFilmstrip.ts` | `renderAudioFilmstrip` (waveform + spectrogram + feature readout SVG) and `assertAudio` (feature-vector assertions). The audio analog of the visual filmstrip. |
| **Match** | `src/audio/match.ts` | `featureDistance` / `matchReport` — compare a rendered track to a reference's feature vector. The engine of the AI-led improvement loop. |
| **Adaptive/spatial** | `src/audio/adaptive.ts` | Pure RTPC curves, Web-Audio-exact distance-attenuation models, vertical-layer gains. FMOD/Wwise-in-miniature, deterministic. |
| **Playback** | `src/audio/audio.ts` | `AudioBus.playSpec` / `playSong` render the data at the live context rate and push it through the SFX/music buses. Still a no-op headless. |

## The AI-first loop (Build → Measure → Learn)

1. **Author** — an LLM writes a `Song` / `SoundSpec` as plain data, using `theory`
   helpers so it never guesses harmony (research: constrain to a scale/chord grid,
   author in layers, anchor melody to the progression).
2. **Prove** — `lintSong` gates structure and key *before* rendering (a rule-based
   check, never an LLM judge — LLM judges reward-hack).
3. **Render** — `renderSong` → PCM, fully headless and hashable.
4. **Measure** — `features()` extracts a numeric fingerprint; `assertAudio` gates
   it (not clipping, not silent, right tempo/brightness). `renderAudioFilmstrip`
   gives a human/judge a visual.
5. **Learn / recreate** — `matchReport` compares a candidate to a *reference
   track's* features and says what's off and which way ("too dark", "too slow").
   Recreate good game music in the engine, diff the feature vectors, and let the
   gaps drive what synth/DSP features to build next.

## Determinism contract (same as the rest of the engine)

- No `Math.random` / wall-clock. Noise draws from a seeded `Rng`; the same
  `SoundSpec`/`Song` always renders byte-identical samples (`signalHash` proves
  it in tests).
- DSP uses `dsin`/`dcos`/`dexp2`/`dlog2`/`dlog10`, never `Math.sin/pow/exp/...`
  (enforced by `npm run invariants`).
- Audio is a **renderer/observer**, never sim state: it's driven off sim time
  (the beat counter) and never enters `world.hash()`. Playback nodes are cosmetic.

## Roadmap (honest gaps)

Done and verified: PCM core, SFX synth, theory, composition, linter, analysis,
audio-filmstrip, feature-match, adaptive primitives, browser playback.

Next, toward "Ori-scale out of the box":
- **Adaptive driver** — wire the pure adaptive intent (layer gains, ducking,
  snapshots) into live `GainNode`s; horizontal re-sequencing on the beat grid.
- **Reference corpus loop** — a script that ingests a library of reference game
  tracks, recreates them, and reports per-feature gaps as a backlog.
- **Richer DSP** — steeper (biquad) filters, convolution reverb send bus.
- **Adoption** — migrate example games from ad-hoc `blip/thud` to `SoundSpec`
  kits, and ship at least one example with a full `playSong` soundtrack.
- **Authoring sugar** — optional MML/pattern-string front-ends over the `Song` schema.
