// Hayao Studio — the director's surface. The game runs in a same-origin iframe
// (dev page, module variant, or worktree build — a pane is just a URL); the
// page reads the iframe's window.__studio (StudioHandle) directly. Knobs are
// leva controls built from the game's declared TuningSpec; "accept" persists
// values to .studio/knobs.json for the agent's knob write-back loop.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Leva, useControls } from 'leva';
import type { StudioHandle } from '@hayao';

interface GameEntry {
  slug: string;
  kind: string;
  url: string;
}

interface ServerState {
  buildRef: string;
  sessions: Array<{ id: string }>;
}

/** Poll a same-origin iframe until the game inside publishes window.__studio. */
function useFrameHandle(nonce: number): { frameRef: (el: HTMLIFrameElement | null) => void; handle: StudioHandle | null } {
  const [handle, setHandle] = useState<StudioHandle | null>(null);
  const el = useRef<HTMLIFrameElement | null>(null);
  const frameRef = useCallback((node: HTMLIFrameElement | null) => {
    el.current = node;
    setHandle(null);
  }, []);
  useEffect(() => {
    setHandle(null);
    const t = window.setInterval(() => {
      const w = el.current?.contentWindow as (Window & { __studio?: StudioHandle }) | null | undefined;
      if (w?.__studio) {
        setHandle(w.__studio);
        window.clearInterval(t);
      }
    }, 150);
    return () => window.clearInterval(t);
  }, [nonce]);
  return { frameRef, handle };
}

function paneUrl(game: GameEntry, seed: number, variant: string): string {
  const q = new URLSearchParams({ seed: String(seed) });
  if (variant) q.set('variant', variant);
  return `${game.url}?${q}`;
}

/** Knob panel: leva controls generated from the game's declared tuning spec. */
function Knobs({ handle, onDirty }: { handle: StudioHandle; onDirty: () => void }) {
  const spec = handle.tuningSpec();
  const values = handle.knobValues();
  useControls(
    'tuning',
    () =>
      Object.fromEntries(
        (spec?.knobs ?? []).map((k) => [
          k.key,
          k.type === 'number'
            ? {
                value: Number(values[k.key]),
                min: k.min,
                max: k.max,
                step: k.step,
                label: k.label ?? k.key,
                onChange: (v: number, _path: string, ctx: { initial: boolean }) => {
                  if (!ctx.initial) {
                    handle.setKnob(k.key, v);
                    onDirty();
                  }
                },
              }
            : k.type === 'enum'
              ? {
                  value: String(values[k.key]),
                  options: k.options ?? [],
                  label: k.label ?? k.key,
                  onChange: (v: string, _path: string, ctx: { initial: boolean }) => {
                    if (!ctx.initial) {
                      handle.setKnob(k.key, v);
                      onDirty();
                    }
                  },
                }
              : {
                  value: String(values[k.key]),
                  label: k.label ?? k.key,
                  onChange: (v: string, _path: string, ctx: { initial: boolean }) => {
                    if (!ctx.initial) {
                      handle.setKnob(k.key, v);
                      onDirty();
                    }
                  },
                },
        ]),
      ),
    [handle],
  );
  return null;
}

export function App() {
  const [games, setGames] = useState<GameEntry[]>([]);
  const [state, setState] = useState<ServerState | null>(null);
  const [slug, setSlug] = useState<string>('');
  const [seed, setSeed] = useState(1);
  const [variantA, setVariantA] = useState('');
  const [variantB, setVariantB] = useState<string | null>(null); // null = single pane
  const [nonce, setNonce] = useState(0); // bumps to re-hook after iframe reloads
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState('');
  const a = useFrameHandle(nonce);
  const b = useFrameHandle(nonce);

  useEffect(() => {
    void fetch('/__studio/games').then(async (r) => {
      const list = (await r.json()) as GameEntry[];
      setGames(list);
      const params = new URLSearchParams(location.search);
      setSlug(params.get('game') ?? list.find((g) => g.slug === 'physics-lab')?.slug ?? list[0]?.slug ?? '');
    });
    void fetch('/__studio/state').then(async (r) => setState((await r.json()) as ServerState));
  }, [nonce]);

  const game = games.find((g) => g.slug === slug);
  const variantNames = a.handle ? a.handle.variants() : {};
  const say = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 1800);
  };

  const annotate = (h: StudioHandle | null) => {
    if (!h) return;
    const note = window.prompt('What felt bad? (optional note)') ?? undefined;
    h.annotate('felt-bad', note || undefined);
    h.flush('idle');
    say('annotated — the agent will see this moment');
  };

  const accept = async () => {
    if (!a.handle || !game) return;
    await fetch('/__studio/knobs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ game: game.slug, values: a.handle.knobValues(), acceptedAt: new Date().toISOString() }),
    });
    setDirty(false);
    say('accepted — ask the agent to write these into the source defaults');
  };

  return (
    <>
      <header className="bar">
        <a className="brand" href="/">
          hayao<span className="js"> studio</span>
        </a>
        <select value={slug} onChange={(e) => (setSlug(e.target.value), setVariantB(null), setVariantA(''), setNonce((n) => n + 1))} aria-label="game">
          {games.map((g) => (
            <option key={g.slug} value={g.slug}>
              {g.kind === 'gym' ? '🏋 ' : ''}
              {g.slug}
            </option>
          ))}
        </select>
        <input type="number" value={seed} onChange={(e) => (setSeed(Number(e.target.value) || 1), setNonce((n) => n + 1))} aria-label="seed" style={{ width: 74 }} />
        <select value={variantA} onChange={(e) => (setVariantA(e.target.value), setNonce((n) => n + 1))} aria-label="variant A">
          <option value="">baseline</option>
          {Object.entries(variantNames).map(([name, label]) => (
            <option key={name} value={name}>
              {label}
            </option>
          ))}
        </select>
        <div className="spacer" />
        <span className="build">
          {state ? `build ${state.buildRef} · ${state.sessions.length} sessions` : '…'}
        </span>
      </header>

      <main className="panes">
        {game && (
          <section className="pane">
            <div className="pane-head">
              A · {a.handle?.title() ?? slug} · {variantA || 'baseline'} · seed {seed}
            </div>
            <iframe key={`a-${slug}-${seed}-${variantA}-${nonce}`} ref={a.frameRef} src={paneUrl(game, seed, variantA)} title="pane A" />
          </section>
        )}
        {game && variantB !== null && (
          <section className="pane">
            <div className="pane-head">
              B · {variantB || 'baseline'} · seed {seed}
              <select value={variantB} onChange={(e) => setVariantB(e.target.value)} aria-label="variant B">
                <option value="">baseline</option>
                {Object.entries(variantNames).map(([name, label]) => (
                  <option key={name} value={name}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <iframe key={`b-${slug}-${seed}-${variantB}-${nonce}`} ref={b.frameRef} src={paneUrl(game, seed, variantB)} title="pane B" />
          </section>
        )}
      </main>

      <div className="actions">
        <button className="hy feel" onClick={() => annotate(a.handle)}>
          ✗ felt bad
        </button>
        <button className="hy accept" onClick={() => void accept()} disabled={!dirty}>
          ✓ accept knobs
        </button>
        <button className="hy" onClick={() => setVariantB(variantB === null ? '' : null)}>
          {variantB === null ? '⊞ compare A/B' : '⊟ single pane'}
        </button>
        <span className="note">knobs drive pane A · same seed both panes · sessions record automatically</span>
      </div>

      {a.handle && <Knobs key={`${slug}-${variantA}-${nonce}`} handle={a.handle} onDirty={() => setDirty(true)} />}
      <Leva
        titleBar={{ title: 'tuning', position: window.innerWidth < 720 ? { x: 0, y: 56 } : undefined }}
        collapsed={window.innerWidth < 720}
      />
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
