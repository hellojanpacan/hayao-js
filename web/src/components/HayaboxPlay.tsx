import * as React from "react";
import { Crown, Landmark, Sprout, Moon, Drum, Trees, Volume2, VolumeX } from "lucide-react";
import type { LoopDeckHandle, PreparedStem } from "@hayao";

/**
 * Hayabox — the consort in a box, live. Six courtiers, each a pre-rendered
 * loop of the same eight bars, phase-locked from one shared start. Waking a
 * courtier schedules its gain rise ON THE NEXT BAR BOUNDARY (see
 * AudioBus.startLoopDeck), so every join lands in the pocket. All twelve
 * stems (two moods per courtier) are synthesised in the browser from
 * src/audio/hayabox.ts — no audio file is ever fetched.
 */

type Engine = typeof import("@hayao");

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  herald: Crown,
  chancellor: Landmark,
  gardener: Sprout,
  consoler: Moon,
  fool: Drum,
  forester: Trees,
};

/** Regalia job → the site's brand tokens (light/dark aware via CSS vars). */
const JOB_STYLE: Record<string, { text: string; ring: string; chip: string }> = {
  gold: { text: "text-orange", ring: "border-orange", chip: "bg-orange/10" },
  ink: { text: "text-ink", ring: "border-ink", chip: "bg-ink/10" },
  green: { text: "text-green", ring: "border-green", chip: "bg-green/10" },
  blue: { text: "text-blue", ring: "border-blue", chip: "bg-blue/10" },
  rose: { text: "text-rose", ring: "border-rose", chip: "bg-rose/10" },
  bark: { text: "text-bark", ring: "border-bark", chip: "bg-bark/10" },
};

type CourtState = { awake: boolean; mood: number; pendingUntil: number | null };

export default function HayaboxPlay() {
  const engineRef = React.useRef<Engine | null>(null);
  const deckRef = React.useRef<LoopDeckHandle | null>(null);
  const [phase, setPhase] = React.useState(0);
  const [loading, setLoading] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [court, setCourt] = React.useState<Record<string, CourtState>>({});
  const [courtiers, setCourtiers] = React.useState<Engine["HAYABOX"]["courtiers"]>([]);
  const [lastLine, setLastLine] = React.useState<string | null>(null);

  // Bar-phase + pending-join resolution, throttled to ~10Hz — the UI only
  // needs beat granularity, and a 60fps setState loop is real renderer load.
  React.useEffect(() => {
    const timer = setInterval(() => {
      const deck = deckRef.current;
      if (!deck?.playing) return;
      const p = deck.phase();
      setPhase((prev) => (Math.abs(prev - p) > 0.02 ? p : prev));
      const now = deck.elapsed();
      setCourt((c) => {
        let changed = false;
        const next: typeof c = {};
        for (const [id, s] of Object.entries(c)) {
          if (s.pendingUntil !== null && now >= s.pendingUntil) {
            next[id] = { ...s, pendingUntil: null };
            changed = true;
          } else next[id] = s;
        }
        return changed ? next : c;
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => () => deckRef.current?.stop(0.4), []);

  async function openCourt() {
    if (ready || loading) return;
    setLoading("waking the engine…");
    const e = (engineRef.current ??= await import("@hayao"));
    e.audio.setVolumes({ master: 0.7, music: 0.9, sfx: 0.8, muted: false });
    e.audio.start(); // inside the tap — the autoplay unlock
    setCourtiers(e.HAYABOX.courtiers);

    // Synthesise every stem (each courtier's moods), phase-locked ids
    // "<courtier>/<mood>". Cooperative renders, so the page stays alive.
    const stems: PreparedStem[] = [];
    let done = 0;
    const total = e.HAYABOX.courtiers.reduce((sum, c) => sum + c.moods.length, 0);
    for (const c of e.HAYABOX.courtiers) {
      for (const m of c.moods) {
        setLoading(`synthesising the court… ${done}/${total}`);
        // 22.05 kHz halves synthesis time and buffer memory across all the
        // stems; these soft voices carry nothing near that Nyquist anyway.
        const prepared = await e.audio.prepareSong(m.make(), { sampleRate: 22050 });
        stems.push({ id: `${c.id}/${m.id}`, prepared, gain: m.mix });
        done++;
      }
    }
    deckRef.current = e.audio.startLoopDeck(stems, {
      secPerBar: e.secondsPerBar(e.HAYABOX.bpm, e.HAYABOX.beatsPerBar),
    });
    setCourt(Object.fromEntries(e.HAYABOX.courtiers.map((c) => [c.id, { awake: false, mood: 0, pendingUntil: null }])));
    setLoading(null);
    setReady(true);
    // Wake the rhythm section so the room isn't silent.
    wake(e, "fool", 0, true);
    wake(e, "chancellor", 0, true);
  }

  function wake(e: Engine, id: string, mood: number, on: boolean) {
    const deck = deckRef.current;
    if (!deck) return;
    const c = e.HAYABOX.courtiers.find((x) => x.id === id);
    if (!c) return;
    const at = deck.setStem(`${id}/${c.moods[mood].id}`, on);
    setLastLine(`deck.setStem('${id}/${c.moods[mood].id}', ${on})  // lands on the next downbeat`);
    setCourt((s) => ({ ...s, [id]: { awake: on, mood, pendingUntil: at } }));
  }

  function toggle(id: string) {
    const e = engineRef.current;
    const s = court[id];
    if (!e || !s) return;
    wake(e, id, s.mood, !s.awake);
  }

  function setMood(id: string, mood: number) {
    const e = engineRef.current;
    const deck = deckRef.current;
    const s = court[id];
    if (!e || !deck || !s || s.mood === mood) return;
    const c = e.HAYABOX.courtiers.find((x) => x.id === id);
    if (!c) return;
    if (s.awake) {
      // Swap on the same boundary: the old mood sleeps as the new one wakes.
      deck.setStem(`${id}/${c.moods[s.mood].id}`, false);
      const at = deck.setStem(`${id}/${c.moods[mood].id}`, true);
      setLastLine(`deck.setStem('${id}/${c.moods[mood].id}', true)  // mood swap, same downbeat`);
      setCourt((st) => ({ ...st, [id]: { awake: true, mood, pendingUntil: at } }));
    } else {
      setCourt((st) => ({ ...st, [id]: { ...s, mood } }));
    }
  }

  function setAll(on: boolean) {
    const e = engineRef.current;
    if (!e) return;
    for (const c of e.HAYABOX.courtiers) wake(e, c.id, court[c.id]?.mood ?? 0, on);
  }

  function toggleMute() {
    const e = engineRef.current;
    if (!e) return;
    const next = !muted;
    e.audio.setVolumes({ muted: next });
    setMuted(next);
  }

  if (!ready) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-hair bg-panel px-6 py-14">
        <p className="max-w-[40ch] font-body text-[0.9rem] font-light leading-relaxed text-soft">
          Twelve loops, synthesised right here from plain data — then the court is yours to conduct.
        </p>
        <button
          onClick={() => void openCourt()}
          className="inline-flex items-center gap-2 rounded-full bg-orange px-7 py-3.5 font-body text-[0.95rem] font-semibold text-white transition-colors hover:bg-green"
        >
          {loading ? (
            <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true"></span>
          ) : (
            <Volume2 className="size-4" />
          )}
          {loading ?? "Wake the court"}
        </button>
      </div>
    );
  }

  const beats = 4;
  const beatNow = Math.floor(phase * beats);

  return (
    <div className="flex flex-col gap-5">
      {/* the bar clock — the toggle grid, visible */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-hair bg-panel px-5 py-3">
        <div className="flex items-center gap-2" aria-label="bar position">
          {Array.from({ length: beats }, (_, i) => (
            <span
              key={i}
              className={`rounded-full transition-all duration-150 ${
                i === beatNow ? "size-3 bg-orange" : "size-2 bg-hair"
              }`}
            />
          ))}
          <span className="ml-2 font-body text-[0.72rem] uppercase tracking-[0.16em] text-muted">
            96 bpm · 8 bars · A min pentatonic
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAll(true)}
            className="rounded-full border border-hair px-3.5 py-1.5 font-body text-[0.78rem] font-semibold text-soft transition-colors hover:border-orange/60 hover:text-orange"
          >
            All awake
          </button>
          <button
            onClick={() => setAll(false)}
            className="rounded-full border border-hair px-3.5 py-1.5 font-body text-[0.78rem] font-semibold text-soft transition-colors hover:border-orange/60 hover:text-orange"
          >
            Hush
          </button>
          <button
            onClick={toggleMute}
            aria-label={muted ? "unmute" : "mute"}
            className="rounded-full border border-hair p-1.5 text-soft transition-colors hover:border-orange/60 hover:text-orange"
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
        </div>
      </div>

      {/* the court */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {courtiers.map((c) => {
          const s = court[c.id];
          const style = JOB_STYLE[c.job];
          const Icon = ICONS[c.id];
          const pending = s?.pendingUntil !== null && s?.pendingUntil !== undefined;
          return (
            <div
              key={c.id}
              className={`flex flex-col items-center gap-2 rounded-3xl border bg-panel px-3 py-5 text-center transition-all ${
                s?.awake ? `${style.ring} shadow-[0_10px_30px_-18px_rgba(41,51,92,0.55)]` : "border-hair"
              } ${pending ? "animate-pulse" : ""}`}
            >
              <button
                onClick={() => toggle(c.id)}
                aria-pressed={s?.awake ?? false}
                className={`flex size-16 items-center justify-center rounded-full transition-transform duration-200 ${
                  s?.awake ? `${style.chip} ${style.text}` : "bg-mist text-muted hover:scale-105"
                }`}
                style={s?.awake ? { transform: `scale(${beatNow % 2 === 0 ? 1.08 : 1.0})` } : undefined}
              >
                <Icon className="size-7" />
              </button>
              <div>
                <p className={`font-display text-[0.92rem] font-semibold ${s?.awake ? style.text : "text-ink"}`}>{c.name}</p>
                <p className="font-body text-[0.7rem] uppercase tracking-[0.14em] text-muted">{c.seat}</p>
              </div>
              <div className="flex gap-1.5">
                {c.moods.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => setMood(c.id, i)}
                    title={m.note}
                    className={`rounded-full px-2.5 py-1 font-body text-[0.68rem] font-semibold transition-colors ${
                      s?.mood === i ? `${style.chip} ${style.text}` : "bg-mist text-muted hover:text-soft"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* the line that just ran */}
      <div className="overflow-x-auto rounded-2xl border border-[#303a63] bg-[#141a30] px-5 py-4 text-left">
        <code className="whitespace-pre font-mono text-[0.78rem] leading-relaxed text-[#eef1f9]">
          {lastLine ?? "// tap a courtier — the join waits for the downbeat, so it always grooves"}
        </code>
      </div>
    </div>
  );
}
