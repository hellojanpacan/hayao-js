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

**Sound is the sixth Regalia pillar.** Regalia is the house design system —
colour, type, UI, motion, and *sound* — not just a palette (`docs/STYLE.md` is its
visual half). The audio house voice is **soft synthesis**: sine / triangle / noise,
a small kit of warm voices mapped to Regalia's jobs (a bright lead for `gold`, a
calm pad for `blue`, growth-green textures, an ink-navy bass), pentatonic-leaning
and deterministic. Like the palette, it is a *default, not a wall* — bring your own
SoundFont of specs and lose nothing structural (`docs/ASSETS.md`).

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
| **LoopDeck** | `src/audio/loopdeck.ts` | Vertical-layer loop playback (the Creaksbox/Incredibox model): a deck of equal-tempo, bar-multiple stem Songs that play as phase-locked loops, toggled on bar boundaries. The pure half is the bar clock + `lintDeck` (proves the phase-lock can never drift); playback is `AudioBus.startLoopDeck`. |
| **Hayabox** | `src/audio/hayabox.ts` | The house LoopDeck: six courtiers (one per Regalia job), two moods each, every note in A minor pentatonic so ANY subset of awake stems harmonizes — a property of the data, proven in `hayabox.test.ts` (lintDeck + zero out-of-key + rendered-tutti gates). Live on the site at `/play/hayabox`. |
| **Genre songbook** | `src/audio/genres.ts` | Six hand-composed reference tracks (electronic, lo-fi, piano, orchestral, jazz-funk, ambient-prologue) — a demo *and* a test fixture. |
| **Concept album** | `src/audio/album.ts` | "Neon Precinct" — a six-cue authored jazz-funk record, mixed front-and-centre. A *listening* deliverable. |
| **Game soundtrack** | `src/audio/soundtrack.ts` | "Palace Hours" — a four-cue funky/jazzy score (`SOUNDTRACK`), one loop per game state, engineered **background-first**: it carves a spectral + dynamic pocket so SFX cut through. Its own `BACKGROUND_PROFILE` scoring window; the "leaves room for SFX" promise is *proven* (dark centroid + healthy crest gates in `soundtrack.test.ts`). `npm run soundtrack` renders + scores it. |
| **Quality scorer** | `src/audio/quality.ts` | Objective 0–100 mix scoring vs genre-target windows: loudness, headroom, dynamics (crest), stereo width, spectral balance (mud/harshness/low-end), genre-fit. The hard gate for "is this good?" — proven to score good tracks high and bad mixes low. `npm run audio` prints it. |
| **Playback** | `src/audio/audio.ts` | `AudioBus.playSpec` / `playSong` render the data at the live context rate and push it through the SFX/music buses. Still a no-op headless. |
| **Showcase** | `sound/` | The **Sound Workshop** web page (`/sound/`) plays every genre live and shows its filmstrip; drives the real published API. `npm run audio` regenerates WAV+SVG artifacts. |

### Expressive / arrangement features (what lifts it above a MIDI demo)

The synth grew a **detuned 2nd oscillator** (`detune`, cents) and **sub-oscillator**
(`sub`) for warmth/weight, then two shape controls that kill the "synthetic" tell:
- **`envCurve`** — bends the amp decay/release from linear toward **exponential**
  (fast onset drop, long tail), the way struck/plucked/bell voices actually decay.
  0 = linear (bit-identical default); ~2–4 reads as natural piano/mallet.
- **`filterEnv`** — a **lowpass envelope** (octaves of cutoff offset at onset,
  settling to the base over `filterEnvTime`): positive = a bright-attack pluck
  that closes down, negative = a pad that blooms open from dark. 0 = static.

`renderSong` grew, all deterministic:
- **`swing`** — delays off-beat 8ths toward the triplet grid (lo-fi, jazz).
- **`humanize`** — seeded micro timing/velocity jitter so it breathes.
- **`velBrightness`** — velocity scales each voice's lowpass, so a velocity map
  reads as *phrasing* (soft = darker), not just loudness.
- **`sidechain`** — a beat-synced ducking pump (the breath of electronic music).
- **`reverb`** — a per-song room, or (when any track sets **`reverbSend`**) a
  shared **send bus** on the mixing-desk model: the dry mix stays dry and only
  the sends bloom, so a bone-dry bass and a washed lead coexist (front-to-back
  depth a single whole-mix reverb can't give).
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

### Playing a Song without freezing the game

`renderSong` is a synchronous, CPU-bound synthesis loop — a full cue is a
multi-second block on a phone. **Never call `renderSong` (or the old blocking
`playSong`) during a step/frame.** Rendering a `title` cue inline froze games at
the worst moment: the menu→play swap (issue #104). The rule of thumb:

- **`audio.prepareSong(song)` → `Promise<PreparedSong>`** renders OFF the hot
  path (cooperative, event-loop-yielding) and works headlessly — no
  `AudioContext` needed. Pre-render every cue at load, hold the results.
- **`audio.playPrepared(prepared, { loop })`** is cheap and re-loopable — state
  swaps and restarts just re-wire a buffer, never re-render. Returns a
  `SongHandle` (`stop(fadeSec?)`, `playing`, `ready`).
- **`audio.playSong(song, { loop })`** is the convenience path: it returns a
  `SongHandle` immediately and renders in the background, starting playback when
  ready (`await handle.ready` if you need that timing). Non-blocking, but it
  re-renders each call — prefer `prepareSong` + `playPrepared` for cues you
  restart.

```ts
// at load — pay the cost once, off any frame
const cues = new Map<string, PreparedSong>();
for (const cue of SOUNDTRACK.cues) cues.set(cue.state, await audio.prepareSong(cue.make()));

// on a state swap — cheap, no hitch, no re-render
let music: SongHandle | null = null;
function scoreState(state: 'title' | 'explore' | 'tension' | 'reward') {
  music?.stop(0.4);
  music = audio.playPrepared(cues.get(state)!, { loop: true });
}
```

`audio.startAmbient()` starts the evolving pad on the music bus (a live
oscillator bed — no render, always hitch-free).

The `songRenderCost(song)` lint (`src/audio/lint.ts`) is the deterministic gate:
it flags a cue whose synchronous render would blow a frame budget
(`blockingRisk`), so "render this inline" is caught before a player feels it.

Under the hood, `renderSongAsync` shares one generator with `renderSong` (so the
output is byte-identical) and `yield`s per note and per windowed master pass
(reverb/EQ/compressor/pump are chunked). The only work it can't subdivide is a
single note's synthesis — one `renderSound` call is atomic — so a cue with an
unusually long sustained note (e.g. a 20 s room-tone pad) has that one note as
its worst block. Keep individual notes reasonable, and always `prepareSong` at
load rather than mid-play.

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
