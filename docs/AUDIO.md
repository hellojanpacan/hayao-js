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
| **Reverb** | `src/audio/reverb.ts` | Deterministic Freeverb (parallel combs → series allpass). Dry synths bloom into a room. |
| **Genre songbook** | `src/audio/genres.ts` | Five hand-composed reference tracks (electronic, lo-fi, piano, orchestral, jazz-funk) — a demo *and* a test fixture. |
| **Quality scorer** | `src/audio/quality.ts` | Objective 0–100 mix scoring vs genre-target windows: loudness, headroom, dynamics (crest), stereo width, spectral balance (mud/harshness/low-end), genre-fit. The hard gate for "is this good?" — proven to score good tracks high and bad mixes low. `npm run audio` prints it. |
| **Playback** | `src/audio/audio.ts` | `AudioBus.playSpec` / `playSong` render the data at the live context rate and push it through the SFX/music buses. Still a no-op headless. |
| **Showcase** | `sound/` | The **Sound Workshop** web page (`/sound/`) plays every genre live and shows its filmstrip; drives the real published API. `npm run audio` regenerates WAV+SVG artifacts. |

### Expressive / arrangement features (what lifts it above a MIDI demo)

The synth grew a **detuned 2nd oscillator** (`detune`, cents) and **sub-oscillator**
(`sub`) for warmth/weight. `renderSong` grew, all deterministic:
- **`swing`** — delays off-beat 8ths toward the triplet grid (lo-fi, jazz).
- **`humanize`** — seeded micro timing/velocity jitter so it breathes.
- **`velBrightness`** — velocity scales each voice's lowpass, so a velocity map
  reads as *phrasing* (soft = darker), not just loudness.
- **`sidechain`** — a beat-synced ducking pump (the breath of electronic music).
- **`reverb`** — per-song room.
And theory grew **`voiceLead`** / **`openVoicing`** so progressions move by small
steps instead of leaping in parallel root position — the biggest single cure for
the "procedural" sound. These were driven by adversarial music-producer critics
in the Build-Measure-Learn loop.

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

## SoundSpec units (the porting trap)

`SoundSpec` uses **musical units**, not ZzFX's per-sample deltas — the full
field-by-field reference lives in the `src/audio/synth.ts` docstrings (grep
`SoundSpec`); the summary that prevents mis-ports:

- Envelope times (`attack`/`decay`/`sustain`/`release`) — **seconds**.
- `slide` — total **semitones over the whole sound body** (ZzFX slides in
  semitones/second); `slideAccel` is the quadratic term, also semitones.
- `pitchJump` — **semitones** (ZzFX's is an absolute Hz addend);
  `pitchJumpTime` in seconds.
- `lowpass` / `highpass` — cutoff **Hz** (ZzFX packs both into one signed knob).
- `repeat` — pitch-envelope repeat period in seconds (ZzFX `repeatTime`): the
  slide/jump progression resets each period while the amplitude envelope runs
  on.

## Porting ZzFX sounds: `specFromZzfx()`

Don't convert by hand — `specFromZzfx(params)` takes the positional array you
copy out of the ZzFX designer (holes and all:
`specFromZzfx([,,1675,,.06,.24,1,1.82,,,837,.06])`) and returns a `SoundSpec`,
encoding every unit conversion above. Documented approximations, each warned
once per parameter name: `randomness` is **dropped** (specs are deterministic
— same spec, same samples, same hash), `modulation` becomes a vibrato LFO at
the same rate, shape 3 ("tan") approximates to a hard square. Sound close
first, exact later.

## External synths: the `audio.ctx` / bus contract

The shared `audio` bus exposes its Web Audio graph so ported synths join
hayao's context instead of fighting it: `audio.ctx` (the live `AudioContext`),
`audio.sfxBus` and `audio.musicBus` (the mix `AudioNode`s) — all null until
`start()` unlocks audio on the first user gesture. The contract: **create
sources ON `audio.ctx` and connect them to a bus — never `ctx.destination`,
and never a second `AudioContext`** (a second context needs its own autoplay
unlock and escapes master volume/mute).

ZzFXM (tracker music) recipe: transcribing a ZzFXM song to a hayao `Song` is a
porting task, not an engine seam — so bundle zzfxm.js verbatim, render its
buffer, then play it through hayao's graph:

```ts
const buf = audio.ctx!.createBuffer(2, samples[0].length, audio.ctx!.sampleRate);
// …copy zzfxM's rendered channels in…
const src = audio.ctx!.createBufferSource();
src.buffer = buf; src.loop = true;
src.connect(audio.musicBus!);   // volume/mute apply; sfxBus for one-shots
src.start();
```

Native loops need no recipe: `audio.playSong(song, { loop: true })` loops the
musical body (excluding the ring-out tail) and returns a stop handle;
`audio.startAmbient()` starts the evolving pad on the music bus.

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
