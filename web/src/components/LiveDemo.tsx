import * as React from "react";
import { Play, Check, Sparkles, Timer, Moon } from "lucide-react";
import type { DemoController, DemoMods } from "../demo/game";

/**
 * "Show, don't tell" — a live @hayao platformer beside a mock agent chat.
 * The three prompts toggle real multi-system edits in the running game.
 *
 * Loading: the island itself is `client:visible`; the engine + game chunk is
 * dynamically imported only when the visitor clicks Play (or a prompt).
 */

type ModKey = keyof DemoMods;

const PROMPTS: { id: ModKey; icon: React.ComponentType<{ className?: string }>; label: string; reply: string; revert: string }[] = [
  {
    id: "jumps",
    icon: Sparkles,
    label: "Allow only 3 jumps per screen, with refresh crystals",
    reply: "Done — jump budget wired into movement, crystals placed on each screen, avatar tint and jump pitch now track jumps left.",
    revert: "Reverted — unlimited jumps, crystals removed.",
  },
  {
    id: "timer",
    icon: Timer,
    label: "Add a per-screen time limit",
    reply: "Done — 12 seconds per screen: a draining bar across the top, seconds readout, timeout respawns the screen.",
    revert: "Reverted — no more clock.",
  },
  {
    id: "cave",
    icon: Moon,
    label: "Change the setting to a dark cave",
    reply: "Done — cave palette, ambient darkness, and glow lights on the avatar, crystals and the goal.",
    revert: "Reverted — back to daylight.",
  },
];

interface Msg {
  role: "user" | "agent";
  text: string;
}

export default function LiveDemo() {
  const mountRef = React.useRef<HTMLDivElement>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const demoRef = React.useRef<DemoController | null>(null);
  const [started, setStarted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const [mods, setMods] = React.useState<DemoMods>({ jumps: false, timer: false, cave: false });
  const [msgs, setMsgs] = React.useState<Msg[]>([
    { role: "agent", text: "This platformer runs on hayao right here. Click a prompt — I'll edit the live game." },
  ]);
  const [busy, setBusy] = React.useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [msgs, busy]);

  React.useEffect(() => () => demoRef.current?.stop(), []);

  async function ensureStarted(): Promise<DemoController | null> {
    if (demoRef.current) return demoRef.current;
    if (!mountRef.current || !wrapRef.current) return null;
    setLoading(true);
    const { createDemo } = await import("../demo/game");
    if (demoRef.current) return demoRef.current; // double-click guard
    const demo = createDemo(mountRef.current, wrapRef.current);
    demoRef.current = demo;
    setLoading(false);
    setStarted(true);
    return demo;
  }

  async function onPlay() {
    const demo = await ensureStarted();
    if (!demo) return;
    demo.setPaused(false);
    setPaused(false);
    wrapRef.current?.focus();
  }

  async function onPrompt(id: ModKey) {
    if (busy) return;
    const p = PROMPTS.find((x) => x.id === id)!;
    const turningOn = !mods[id];
    setBusy(true);
    setMsgs((m) => [...m, { role: "user", text: turningOn ? p.label : `Undo: ${p.label.toLowerCase()}` }]);
    const demo = await ensureStarted();
    await new Promise((r) => setTimeout(r, 450)); // a beat of "agent working"
    if (demo) {
      demo.setMods({ [id]: turningOn });
      setMods(demo.getMods());
    }
    setMsgs((m) => [...m, { role: "agent", text: turningOn ? p.reply : p.revert }]);
    setBusy(false);
  }

  function onFocus() {
    if (demoRef.current && started) {
      demoRef.current.setPaused(false);
      setPaused(false);
    }
  }

  function onBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (wrapRef.current?.contains(e.relatedTarget as globalThis.Node | null)) return;
    if (demoRef.current && started) {
      demoRef.current.setPaused(true);
      setPaused(true);
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-hair bg-panel text-left shadow-[0_18px_50px_-24px_rgba(41,51,92,0.3)]">
      <div className="grid md:grid-cols-[300px_1fr]">
        {/* ── chat pane ── */}
        <div className="order-2 flex flex-col border-t border-hair md:order-1 md:border-r md:border-t-0">
          <div className="flex items-center gap-2 border-b border-hair px-4 py-3">
            <span className="size-2 rounded-full bg-green" aria-hidden="true"></span>
            <span className="font-display text-[0.85rem] font-semibold text-ink">hayao · agent</span>
          </div>

          <div className="flex max-h-56 min-h-40 flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4 md:max-h-72">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-6 self-end rounded-2xl rounded-br-md bg-navy px-3.5 py-2 font-body text-[0.8rem] font-light leading-snug text-white"
                    : "mr-6 self-start rounded-2xl rounded-bl-md bg-mist px-3.5 py-2 font-body text-[0.8rem] font-light leading-snug text-ink"
                }
              >
                {m.text}
              </div>
            ))}
            {busy && (
              <div className="mr-6 self-start rounded-2xl rounded-bl-md bg-mist px-3.5 py-2 font-body text-[0.8rem] text-muted">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce">·</span>
                  <span className="animate-bounce [animation-delay:120ms]">·</span>
                  <span className="animate-bounce [animation-delay:240ms]">·</span>
                </span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="flex flex-col gap-2 border-t border-hair p-3">
            {PROMPTS.map((p) => {
              const active = mods[p.id];
              return (
                <button
                  key={p.id}
                  onClick={() => void onPrompt(p.id)}
                  disabled={busy}
                  className={
                    "flex items-start gap-2.5 rounded-2xl border px-3 py-2.5 text-left font-body text-[0.8rem] leading-snug transition-colors disabled:opacity-60 " +
                    (active
                      ? "border-orange/60 bg-orange/[0.07] text-ink"
                      : "border-hair text-soft hover:border-orange/40 hover:text-ink")
                  }
                >
                  <span className={"mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md " + (active ? "bg-orange text-white" : "bg-mist text-muted")}>
                    {active ? <Check className="size-3" /> : <p.icon className="size-3" />}
                  </span>
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── game pane ── */}
        <div className="order-1 md:order-2">
          <div
            ref={wrapRef}
            tabIndex={0}
            onFocus={onFocus}
            onBlur={onBlur}
            className="relative aspect-[5/3] w-full outline-none focus-visible:ring-2 focus-visible:ring-orange"
            aria-label="Hayao live demo game — arrow keys to move and jump"
          >
            <div ref={mountRef} className="absolute inset-0 [&>svg]:h-full [&>svg]:w-full" />
            {!started && (
              <button
                onClick={() => void onPlay()}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-mist transition-colors hover:bg-cloud"
              >
                <span className="flex size-16 items-center justify-center rounded-full bg-orange text-white shadow-lg">
                  {loading ? (
                    <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true"></span>
                  ) : (
                    <Play className="ml-1 size-7" fill="currentColor" />
                  )}
                </span>
                <span className="font-display text-[0.95rem] font-semibold text-ink">{loading ? "Loading engine…" : "Click to play"}</span>
                <span className="font-body text-[0.8rem] font-light text-muted">← → move · ↑ jump</span>
              </button>
            )}
            {started && paused && (
              <button
                onClick={() => void onPlay()}
                className="absolute inset-0 flex items-center justify-center bg-navy/40 backdrop-blur-[2px]"
              >
                <span className="rounded-full bg-panel px-5 py-2.5 font-display text-[0.9rem] font-semibold text-ink shadow-lg">Paused — click to resume</span>
              </button>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-hair px-4 py-2.5">
            <span className="font-mono text-[0.72rem] text-muted">import {"{ runBrowser }"} from 'hayao'</span>
            <span className="hidden font-body text-[0.72rem] text-muted sm:block">← → move · ↑ jump</span>
          </div>
        </div>
      </div>
    </div>
  );
}
