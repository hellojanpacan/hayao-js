import * as React from "react";
import { Play, Square, Volume2 } from "lucide-react";
import type { SoundSpec, SongHandle } from "@hayao";

/**
 * The sound engine, live on the page. Everything heard here is synthesised in
 * your browser from the parameters shown — the engine chunk (imported straight
 * from the monorepo via @hayao) loads on the first tap, and no audio file is
 * ever fetched. Same data as sound/ — the repo's Sound Workshop.
 */

// ── The SFX kit — each sound is this one line (see docs/AUDIO.md) ──
const SFX: { name: string; spec: SoundSpec }[] = [
  { name: "coin", spec: { freq: 988, wave: "square", attack: 0.005, sustain: 0.04, release: 0.12, pitchJump: 7, pitchJumpTime: 0.05, volume: 0.5 } },
  { name: "powerup", spec: { freq: 330, wave: "square", sustain: 0.05, release: 0.2, slide: 24, detune: 8, volume: 0.42 } },
  { name: "laser", spec: { freq: 900, wave: "saw", slide: -24, sustain: 0.02, release: 0.18, lowpass: 3000, volume: 0.4 } },
  { name: "jump", spec: { freq: 300, wave: "triangle", slide: 12, attack: 0.005, sustain: 0.03, release: 0.1, volume: 0.5 } },
  { name: "hurt", spec: { freq: 180, wave: "square", slide: -8, noise: 0.3, sustain: 0.03, release: 0.14, volume: 0.5 } },
  { name: "explosion", spec: { freq: 120, wave: "noise", sustain: 0.05, release: 0.4, lowpass: 1200, slide: -6, volume: 0.6 } },
  { name: "blip", spec: { freq: 640, wave: "sine", sustain: 0.01, release: 0.05, volume: 0.4 } },
  { name: "pickup", spec: { freq: 523, wave: "triangle", sustain: 0.03, release: 0.15, pitchJump: 5, pitchJumpTime: 0.04, volume: 0.45 } },
];

type Engine = typeof import("@hayao");
type TrackRow = { id: string; title: string; note: string; make: () => import("@hayao").Song };

export default function SoundLab() {
  const engineRef = React.useRef<Engine | null>(null);
  const handleRef = React.useRef<SongHandle | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [activeSfx, setActiveSfx] = React.useState<string | null>(null);
  const [playing, setPlaying] = React.useState<string | null>(null);
  const [groups, setGroups] = React.useState<{ name: string; blurb: string; tracks: TrackRow[] }[]>([]);

  React.useEffect(
    () => () => {
      handleRef.current?.stop();
    },
    [],
  );

  async function engine(): Promise<Engine> {
    if (engineRef.current) return engineRef.current;
    setLoading(true);
    const mod = await import("@hayao");
    mod.audio.setVolumes({ master: 0.7, music: 0.8, sfx: 0.9, muted: false });
    engineRef.current = mod;
    setGroups([
      {
        name: `${mod.ALBUM.title} — ${mod.ALBUM.subtitle}`,
        blurb: mod.ALBUM.concept,
        tracks: mod.ALBUM.tracks.map((t) => ({ id: `album-${t.id}`, title: t.title, note: t.intent, make: t.make })),
      },
      {
        name: `${mod.SOUNDTRACK.title} — ${mod.SOUNDTRACK.subtitle}`,
        blurb: mod.SOUNDTRACK.concept,
        tracks: mod.SOUNDTRACK.cues.map((c) => ({ id: `st-${c.id}`, title: `${c.title} · ${c.state}`, note: c.intent, make: c.make })),
      },
      {
        name: "The genre songbook",
        blurb: "Five rooms of the same instrument rack — proof the voice bends to the game, not the other way round.",
        tracks: mod.GENRES.map((g) => ({ id: `genre-${g.id}`, title: g.name, note: g.description, make: g.make })),
      },
    ]);
    setLoading(false);
    setReady(true);
    return mod;
  }

  async function playSfx(name: string, spec: SoundSpec) {
    const e = await engine();
    e.audio.start();
    e.audio.playSpec(spec);
    setActiveSfx(name);
  }

  async function toggleSong(row: TrackRow) {
    const e = await engine();
    e.audio.start();
    if (playing === row.id) {
      handleRef.current?.stop();
      handleRef.current = null;
      setPlaying(null);
      return;
    }
    handleRef.current?.stop();
    handleRef.current = e.audio.playSong(row.make(), { loop: true });
    setPlaying(row.id);
  }

  const active = SFX.find((s) => s.name === activeSfx);

  return (
    <div className="flex flex-col gap-10 text-left">
      {/* SFX kit */}
      <div>
        <p className="mb-4 text-center font-body text-[0.72rem] uppercase tracking-[0.18em] text-muted">
          The SFX kit — tap one, read its whole source below
        </p>
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
          {SFX.map((s) => (
            <button
              key={s.name}
              onClick={() => void playSfx(s.name, s.spec)}
              className={`rounded-2xl border px-2 py-4 font-display text-[0.9rem] font-semibold transition-all ${
                activeSfx === s.name
                  ? "border-orange bg-orange/10 text-orange"
                  : "border-hair bg-panel text-ink hover:border-orange/50 hover:text-orange"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[#303a63] bg-[#141a30] px-5 py-4">
          <code className="whitespace-pre font-mono text-[0.78rem] leading-relaxed text-[#eef1f9]">
            {active
              ? `audio.playSpec(${JSON.stringify(active.spec).replaceAll('"', "").replaceAll(",", ", ").replaceAll(":", ": ")})`
              : loading
                ? "// loading the engine…"
                : "// tap a pad — the line that plays is the sound's entire source"}
          </code>
        </div>
      </div>

      {/* Music */}
      <div>
        <p className="mb-4 text-center font-body text-[0.72rem] uppercase tracking-[0.18em] text-muted">
          Composed music — synthesised live, looping until you stop it
        </p>
        {!ready ? (
          <div className="flex justify-center">
            <button
              onClick={() => void engine()}
              className="inline-flex items-center gap-2 rounded-full bg-orange px-6 py-3 font-body text-[0.95rem] font-semibold text-white transition-colors hover:bg-green"
            >
              {loading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true"></span>
              ) : (
                <Volume2 className="size-4" />
              )}
              {loading ? "Loading engine…" : "Open the songbook"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {groups.map((g) => (
              <div key={g.name} className="overflow-hidden rounded-3xl border border-hair bg-panel">
                <div className="border-b border-hair px-6 py-4">
                  <h3 className="font-display text-[1rem] font-semibold text-ink">{g.name}</h3>
                  <p className="mt-1 font-body text-[0.82rem] font-light leading-snug text-muted">{g.blurb}</p>
                </div>
                {g.tracks.map((t, i, arr) => (
                  <button
                    key={t.id}
                    onClick={() => void toggleSong(t)}
                    className={`flex w-full items-center gap-4 px-6 py-3.5 text-left transition-colors hover:bg-mist ${
                      i !== arr.length - 1 ? "border-b border-hair" : ""
                    }`}
                  >
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                        playing === t.id ? "bg-orange text-white" : "bg-orange/10 text-orange"
                      }`}
                    >
                      {playing === t.id ? <Square className="size-3.5" fill="currentColor" /> : <Play className="ml-0.5 size-4" fill="currentColor" />}
                    </span>
                    <span className="min-w-0">
                      <span className={`block font-display text-[0.95rem] font-semibold ${playing === t.id ? "text-orange" : "text-ink"}`}>{t.title}</span>
                      <span className="block truncate font-body text-[0.8rem] font-light text-muted">{t.note}</span>
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
