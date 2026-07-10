import * as React from "react";
import { Play } from "lucide-react";
import type { GameHandle } from "@hayao";

/**
 * The live "2D Platformer" — Small Flame — running on this page. The engine +
 * game chunk is dynamically imported only when the visitor taps Play. The result
 * overlay mounts into `mount`, so the night CSS vars on the wrapper theme it to
 * match the game's navy ground.
 */

// Night overlay theme for the in-game result card (mounts inside the frame).
const NIGHT_VARS: React.CSSProperties = {
  ["--hy-paper" as string]: "#1d2542",
  ["--hy-ink" as string]: "#eef1f9",
  ["--hy-ink-soft" as string]: "#b3bbd4",
  ["--hy-line" as string]: "#303a63",
  ["--hy-accent" as string]: "#e59500",
  ["--hy-accent-ink" as string]: "#141a30",
};

export default function PlatformerPlay() {
  const mountRef = React.useRef<HTMLDivElement>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const handleRef = React.useRef<GameHandle | null>(null);
  const [started, setStarted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => () => handleRef.current?.stop(), []);

  const setGamePaused = React.useCallback((p: boolean) => {
    const h = handleRef.current;
    if (!h) return;
    h.world.paused = p;
    if (p) h.input.clear();
    setPaused(p);
  }, []);

  async function onPlay() {
    if (handleRef.current) {
      setGamePaused(false);
      wrapRef.current?.focus();
      return;
    }
    if (!mountRef.current) return;
    setLoading(true);
    const { createSmallFlame } = await import("../play/smallflame");
    if (handleRef.current) return; // double-tap guard
    handleRef.current = createSmallFlame(mountRef.current);
    setLoading(false);
    setStarted(true);
    wrapRef.current?.focus();
  }

  return (
    <div className="flex flex-col items-center">
      <div
        ref={wrapRef}
        tabIndex={0}
        onBlur={(e) => {
          if (wrapRef.current?.contains(e.relatedTarget as globalThis.Node | null)) return;
          if (started) setGamePaused(true);
        }}
        onFocus={() => started && setGamePaused(false)}
        style={NIGHT_VARS}
        className="relative aspect-[16/9] w-full overflow-hidden rounded-[1.5rem] border border-hair bg-[#141a30] shadow-[0_24px_60px_-24px_rgba(41,51,92,0.5)] outline-none focus-visible:ring-2 focus-visible:ring-orange"
        aria-label="Small Flame — hold to rise on your fuel, drift left and right, reach the lantern"
      >
        <div ref={mountRef} className="absolute inset-0 [&>svg]:h-full [&>svg]:w-full" />
        {!started && (
          <button
            onClick={() => void onPlay()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#141a30] transition-colors hover:bg-[#1d2542]"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-orange text-white shadow-lg">
              {loading ? (
                <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true"></span>
              ) : (
                <Play className="ml-1 size-7" fill="currentColor" />
              )}
            </span>
            <span className="font-display text-[0.95rem] font-semibold text-white">{loading ? "Loading engine…" : "Click to play"}</span>
            <span className="font-body text-[0.8rem] font-light text-white/60">Hold ↑ to rise · ← → drift · feather your fuel</span>
          </button>
        )}
        {started && paused && (
          <button
            onClick={() => void onPlay()}
            className="absolute inset-0 flex items-center justify-center bg-navy/50 backdrop-blur-[2px]"
          >
            <span className="rounded-full bg-panel px-5 py-2.5 font-display text-[0.9rem] font-semibold text-ink shadow-lg">Paused — click to resume</span>
          </button>
        )}
      </div>
      <p className="mt-4 font-mono text-[0.72rem] text-muted">import {"{ runBrowser }"} from 'hayao'</p>
    </div>
  );
}
