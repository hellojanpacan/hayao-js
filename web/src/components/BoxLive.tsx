import * as React from "react";
import type { HeroCellCtrl, JuiceCellCtrl, SchemeName } from "../showcase/box";

/**
 * The live "What's in the box" grid on /create/quickstart. The hero and juice
 * cells are real @hayao worlds; the SFX buttons play the real synth bus; the
 * palette and controller cards render the shipped constants.
 *
 * The island is `client:visible`; the engine chunk (../showcase/box) loads
 * only when the grid scrolls into view. Worlds pause when scrolled back out.
 */

type BoxModule = typeof import("../showcase/box");

const SFX_BUTTONS: { key: string; label: string; play: (m: BoxModule) => void }[] = [
  { key: "blip", label: "blip", play: (m) => m.sfx.blip() },
  { key: "thud", label: "thud", play: (m) => m.sfx.thud() },
  { key: "chime", label: "chime", play: (m) => m.sfx.chime() },
  { key: "success", label: "success", play: (m) => m.sfx.success() },
];

function Card({ title, desc, children }: { title: string; desc: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-3xl border border-hair bg-panel p-5 text-left">
      <h3 className="font-display text-[0.98rem] font-semibold text-ink">{title}</h3>
      {children}
      <p className="mt-3 font-body text-[0.83rem] font-light leading-relaxed text-soft">{desc}</p>
    </div>
  );
}

export default function BoxLive() {
  const gridRef = React.useRef<HTMLDivElement>(null);
  const heroMountRef = React.useRef<HTMLDivElement>(null);
  const juiceMountRef = React.useRef<HTMLDivElement>(null);
  const heroCtrlRef = React.useRef<HeroCellCtrl | null>(null);
  const juiceCtrlRef = React.useRef<JuiceCellCtrl | null>(null);
  const [mod, setMod] = React.useState<BoxModule | null>(null);
  const [scheme, setScheme] = React.useState<SchemeName>("gold");

  React.useEffect(() => {
    let dead = false;
    let io: IntersectionObserver | null = null;
    void (async () => {
      const m = await import("../showcase/box");
      if (dead || !heroMountRef.current || !juiceMountRef.current) return;
      heroCtrlRef.current = m.createHeroCell(heroMountRef.current);
      juiceCtrlRef.current = m.createJuiceCell(juiceMountRef.current);
      setMod(m);
      io = new IntersectionObserver(
        ([entry]) => {
          const paused = !entry.isIntersecting;
          heroCtrlRef.current?.setPaused(paused);
          juiceCtrlRef.current?.setPaused(paused);
        },
        { threshold: 0.05 },
      );
      if (gridRef.current) io.observe(gridRef.current);
    })();
    return () => {
      dead = true;
      io?.disconnect();
      heroCtrlRef.current?.stop();
      juiceCtrlRef.current?.stop();
      heroCtrlRef.current = null;
      juiceCtrlRef.current = null;
    };
  }, []);

  function pickScheme(name: SchemeName) {
    setScheme(name);
    heroCtrlRef.current?.setScheme(name);
    if (mod) {
      mod.sfx.ensure();
      mod.sfx.blip(660);
    }
  }

  function pokeJuice() {
    if (!mod) return;
    mod.sfx.ensure();
    mod.sfx.thud();
    juiceCtrlRef.current?.poke();
  }

  function playSfx(b: (typeof SFX_BUTTONS)[number]) {
    if (!mod) return;
    mod.sfx.ensure();
    b.play(mod);
  }

  const loadingPulse = !mod ? "animate-pulse" : "";

  return (
    <div ref={gridRef} className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {/* ── the hero, playing its authored clips ── */}
      <Card title="A rigged hero" desc="Seven authored clips on a loop — idle, run, jump, fall, wall-slide, death, spawn. Pick a scheme; the rig recolours.">
        <div
          ref={heroMountRef}
          className={`mt-3 aspect-[16/15] w-full overflow-hidden rounded-xl bg-mist ${loadingPulse} [&>svg]:h-full [&>svg]:w-full`}
          aria-label="Live hero rig cycling through its animation clips"
        />
        <div className="mt-3 flex items-center gap-2" role="group" aria-label="Duotone scheme">
          {(mod?.schemes ?? []).map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => pickScheme(s.name)}
              aria-label={`Scheme ${s.name}`}
              title={s.name}
              className={
                "size-6 rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange " +
                (scheme === s.name ? "ring-2 ring-ink ring-offset-2 ring-offset-panel" : "")
              }
              style={{ backgroundColor: s.base }}
            />
          ))}
        </div>
      </Card>

      {/* ── the juice kit, on demand ── */}
      <Card title="The juice kit" desc="Particle presets, trauma-based camera shake, floating text, squash — the recipes your agent wires to game events.">
        <button
          type="button"
          onClick={pokeJuice}
          aria-label="Trigger a juice burst"
          className={`mt-3 aspect-[16/11] w-full cursor-pointer overflow-hidden rounded-xl bg-mist ${loadingPulse} focus:outline-none focus-visible:ring-2 focus-visible:ring-orange [&>svg]:h-full [&>svg]:w-full`}
        >
          <div ref={juiceMountRef} className="pointer-events-none h-full w-full [&>svg]:h-full [&>svg]:w-full" />
        </button>
        <p className="mt-2 font-body text-[0.75rem] text-muted">click the crate — burst, shake, popup, thud</p>
      </Card>

      {/* ── the synth bus ── */}
      <Card title="Synth audio" desc="No samples to source — every sound is parameters through the mixer, with separate music and SFX buses.">
        <div className="mt-3 grid grid-cols-2 gap-2">
          {SFX_BUTTONS.map((b) => (
            <button
              key={b.key}
              type="button"
              onClick={() => playSfx(b)}
              disabled={!mod}
              className="rounded-xl border border-hair bg-mist px-3 py-2.5 font-mono text-[0.8rem] text-ink transition-colors hover:border-orange/50 hover:bg-orange/5 disabled:opacity-50"
            >
              ♪ {b.label}
            </button>
          ))}
        </div>
        <p className="mt-2 font-body text-[0.75rem] text-muted">audio.blip() · rendered live, deterministic to render offline</p>
      </Card>

      {/* ── the palette, from the shipped constants ── */}
      <Card title="The Regalia palette" desc="Five duotone schemes derived from one contrast-checked colour system. These swatches are read from the shipped constants.">
        <div className="mt-3 flex flex-col gap-1.5">
          {(mod?.schemes ?? []).map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => pickScheme(s.name)}
              className={
                "group flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-mist focus:outline-none focus-visible:ring-2 focus-visible:ring-orange " +
                (scheme === s.name ? "bg-mist" : "")
              }
            >
              <span className="flex h-5 flex-1 overflow-hidden rounded-md">
                <span className="flex-1" style={{ backgroundColor: s.light }} />
                <span className="flex-1" style={{ backgroundColor: s.base }} />
                <span className="flex-1" style={{ backgroundColor: s.shade }} />
              </span>
              <span className="w-16 text-left font-mono text-[0.72rem] text-soft">{s.name}</span>
            </button>
          ))}
          {!mod && <div className={`h-32 rounded-lg bg-mist ${loadingPulse}`} />}
        </div>
      </Card>

      {/* ── the controller, real numbers ── */}
      <Card title="A tuned platformer controller" desc="Coyote time, jump buffering, dash, wall-jump, moving platforms — pure, deterministic, pre-tuned. These are the shipped defaults.">
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(mod?.controllerFacts ?? []).map((f) => (
            <span key={f.label} className="rounded-full border border-hair bg-mist px-2.5 py-1 font-mono text-[0.72rem] text-soft">
              {f.label} <span className="font-semibold text-ink">{f.value}</span>
            </span>
          ))}
          {!mod && <div className={`h-16 w-full rounded-lg bg-mist ${loadingPulse}`} />}
        </div>
      </Card>

      {/* ── proof tooling — the one card that lives in the terminal ── */}
      <Card title="Proof tooling" desc="A solver proves levels winnable; replay hashes prove refactors safe. The same checks your agent runs before showing you anything.">
        <code className="mt-3 self-start rounded-lg bg-[#141a30] px-3 py-1.5 font-mono text-[0.75rem] text-[#eef1f9]">npm run verify</code>
      </Card>
    </div>
  );
}
