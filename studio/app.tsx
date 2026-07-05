// Hayao Studio — the director's surface. The game runs in a same-origin iframe
// (dev page, module variant, or worktree build — a pane is just a URL); the
// page reads the iframe's window.__studio (StudioHandle) directly. Knobs are
// leva controls built from the game's declared TuningSpec; "accept" persists
// values to .studio/knobs.json for the agent's knob write-back loop.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Leva, useControls } from 'leva';
import QRCode from 'qrcode';
import type { StudioHandle } from '@hayao';

interface GameEntry {
  slug: string;
  kind: string;
  url: string;
}

interface SessionEntry {
  id: string;
  game: string;
  startedAt: string;
  endReason: string;
  frames: number;
  annotations: number;
  variant: string;
}

interface ServerState {
  buildRef: string;
  sessions: SessionEntry[];
  /** Worktree builds registered by scripts/studio-variant.mjs. */
  variants: Record<string, { kind: string; ref: string; commit: string }>;
  /** LAN addresses of this dev server (phone play). */
  urls: string[];
}

interface Report {
  frames: number;
  simSeconds: number;
  reachedGoal: boolean;
  deaths: number;
  hesitations: Array<{ startFrame: number; frames: number }>;
  deathClusters: Array<{ x: number; y: number; count: number }>;
  futileVerbs: Array<{ action: string; futilePresses: number; totalPresses: number }>;
  unusedActions: string[];
  quit?: { frame: number; recentDeaths: number; recentHesitations: number; endReason: string };
  annotations: Array<{ frame: number; tag: string; note?: string }>;
  knobEvents: Array<{ frame: number; key: string; value: number | string }>;
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

function paneUrl(game: GameEntry, seed: number, variant: string, replay?: { id: string; at?: number }): string {
  const q = new URLSearchParams({ seed: String(seed) });
  if (replay) {
    // Watch a past session: the pane loads the artifact and scrubs to `at`.
    q.set('session', replay.id);
    if (replay.at !== undefined) q.set('at', String(replay.at));
    return `${game.url}?${q}`;
  }
  // 'wt:<name>' plays the same game page inside an immutable worktree build.
  if (variant.startsWith('wt:')) return `/__studio/variants/${variant.slice(3)}${game.url}?${q}`;
  if (variant) q.set('variant', variant);
  return `${game.url}?${q}`;
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function VariantOptions({ moduleVariants, worktrees }: { moduleVariants: Record<string, string>; worktrees: ServerState['variants'] }) {
  return (
    <>
      <option value="">baseline</option>
      {Object.entries(moduleVariants).map(([name, label]) => (
        <option key={name} value={name}>
          {label}
        </option>
      ))}
      {Object.entries(worktrees).length > 0 && (
        <optgroup label="worktree builds">
          {Object.entries(worktrees).map(([name, v]) => (
            <option key={name} value={`wt:${name}`}>
              {name} @ {v.commit}
            </option>
          ))}
        </optgroup>
      )}
    </>
  );
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

/**
 * Time travel for pane A: freeze, drag to any recorded frame (exact — the
 * engine restores a snapshot and re-steps the recorded inputs), resume to
 * fork from there. The probe inspector shows the sim's own state snapshot.
 */
function Timeline({ handle }: { handle: StudioHandle }) {
  const [tl, setTl] = useState(() => handle.timeline());
  const [frozen, setFrozen] = useState(() => handle.frozen());
  const [probe, setProbe] = useState<Record<string, unknown> | null>(null);
  const [showProbe, setShowProbe] = useState(false);

  useEffect(() => {
    const t = window.setInterval(() => {
      setTl(handle.timeline());
      setFrozen(handle.frozen());
      if (showProbe) setProbe(handle.world.probe());
    }, 250);
    return () => window.clearInterval(t);
  }, [handle, showProbe]);

  const onScrub = (frame: number) => {
    handle.scrub(frame);
    setTl(handle.timeline());
    setFrozen(true);
    if (showProbe) setProbe(handle.world.probe());
  };

  return (
    <div className="timeline">
      <button
        className="hy"
        aria-label={frozen ? 'resume' : 'freeze'}
        onClick={() => {
          handle.setFrozen(!frozen);
          setFrozen(!frozen);
        }}
      >
        {frozen ? '▶' : '❚❚'}
      </button>
      <input
        type="range"
        min={tl.min}
        max={Math.max(tl.max, tl.min + 1)}
        value={tl.frame}
        aria-label="timeline"
        onChange={(e) => onScrub(Number(e.target.value))}
      />
      <span className="note frames">
        {tl.frame}/{tl.max}
      </span>
      <button className="hy" onClick={() => setShowProbe(!showProbe)} aria-label="probe">
        ⌖
      </button>
      {showProbe && probe && <pre className="probe">{JSON.stringify(probe, null, 1)}</pre>}
    </div>
  );
}

/**
 * Phone play: scan and the couch playtest starts. Sessions record to the same
 * .studio/ bus regardless of which device played — develop mobile games on
 * the device they're for.
 */
function PhoneModal({ urls, onClose }: { urls: string[]; onClose: () => void }) {
  const lan = urls[0] ? `${urls[0].replace(/\/$/, '')}/studio/` : null;
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    if (lan) void QRCode.toDataURL(lan, { margin: 1, width: 260, color: { dark: '#242019', light: '#f8f3e9' } }).then(setQr);
  }, [lan]);
  return (
    <div className="drawer" role="dialog" aria-label="phone play" onClick={onClose}>
      <div className="phone-card" onClick={(e) => e.stopPropagation()}>
        <b>Play on your phone</b>
        {lan ? (
          <>
            {qr && <img src={qr} alt="QR to the Studio on your LAN" width={260} height={260} />}
            <code>{lan}</code>
            <span className="note">Same Wi-Fi. Touch works out of the box; every session records here.</span>
          </>
        ) : (
          <span className="note">No LAN address — the dev server isn't exposed on the network.</span>
        )}
        <button className="hy" onClick={onClose}>
          close
        </button>
      </div>
    </div>
  );
}

/**
 * The player's own field notes: recorded sessions and the ethnographer's
 * report — the same analysis the agent reads via MCP, rendered for humans.
 * Numbers describe; deciding what they mean stays with the director.
 */
function SessionsDrawer({
  sessions,
  onClose,
  onWatch,
  onImported,
}: {
  sessions: SessionEntry[];
  onClose: () => void;
  onWatch: (entry: SessionEntry, at?: number) => void;
  onImported: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);

  const open = async (id: string) => {
    setOpenId(id);
    setReport(null);
    setLoading(true);
    try {
      const r = await fetch(`/__studio/report/${encodeURIComponent(id)}`);
      if (r.ok) setReport((await r.json()) as Report);
    } finally {
      setLoading(false);
    }
  };

  // The manual playtester circle: a tester sends you their session file (⬇ on
  // their machine), you drop it in here — same artifact, same reports, tapes.
  const importSessions = async (files: FileList | null) => {
    if (!files) return;
    for (const file of files) {
      try {
        const body = await file.text();
        JSON.parse(body); // refuse garbage before it reaches the bus
        await fetch('/__studio/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
      } catch {
        /* skip unreadable files */
      }
    }
    onImported();
  };

  const secs = (frames: number) => `${Math.round(frames / 60)}s`;
  return (
    <div
      className="drawer"
      role="dialog"
      aria-label="sessions"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void importSessions(e.dataTransfer.files);
      }}
    >
      <div className="drawer-head">
        <b>Playtests</b>
        <span className="note">{sessions.length} recorded · tap for report · drop session files to import</span>
        <label className="hy" role="button">
          ⬆ import
          <input type="file" accept=".json" multiple hidden onChange={(e) => void importSessions(e.target.files)} />
        </label>
        <button className="hy" onClick={onClose} aria-label="close">
          ✕
        </button>
      </div>
      <div className="drawer-body">
        {[...sessions].reverse().map((s) => (
          <div key={s.id}>
            <button className={`session-row${openId === s.id ? ' open' : ''}`} onClick={() => void open(s.id)}>
              <span className="game">{s.game}</span>
              <span className="note">
                {s.variant !== 'dev' ? `${s.variant} · ` : ''}
                {secs(s.frames)} · {s.endReason}
                {s.annotations > 0 ? ` · ✗${s.annotations}` : ''}
              </span>
              <span className="note when">
                {new Date(s.startedAt).toLocaleTimeString()}{' '}
                <a
                  className="moment-link"
                  href={`/__studio/session/${encodeURIComponent(s.id)}`}
                  download={`${s.id}.json`}
                  onClick={(e) => e.stopPropagation()}
                  title="download this session (send it to the developer)"
                >
                  ⬇
                </a>
              </span>
            </button>
            {openId === s.id && (
              <div className="report">
                {loading && <span className="note">analyzing (exact replay)…</span>}
                {report && (
                  <>
                    <div className="stat-row">
                      <span className={report.reachedGoal ? 'good' : 'warn'}>{report.reachedGoal ? '✓ reached the goal' : '— did not finish'}</span>
                      <span>{Math.round(report.simSeconds)}s played</span>
                      <span>{report.deaths} deaths</span>
                      <span>{report.hesitations.length} hesitations</span>
                      <button className="hy moment" onClick={() => onWatch(s)}>
                        ⏵ watch the tape
                      </button>
                    </div>
                    {report.quit && (
                      <p>
                        Stopped at{' '}
                        <button className="moment-link" onClick={() => onWatch(s, Math.max(0, report.quit!.frame - 300))}>
                          frame {report.quit.frame} ⏵
                        </button>{' '}
                        ({report.quit.endReason}) — {report.quit.recentDeaths} deaths and {report.quit.recentHesitations} hesitations in the
                        final stretch.
                      </p>
                    )}
                    {report.deathClusters.length > 0 && (
                      <p>
                        Deaths cluster at{' '}
                        {report.deathClusters
                          .slice(0, 3)
                          .map((c) => `(${Math.round(c.x)}, ${Math.round(c.y)}) ×${c.count}`)
                          .join(' · ')}
                      </p>
                    )}
                    {report.hesitations.length > 0 && (
                      <p>
                        Longest pauses:{' '}
                        {[...report.hesitations]
                          .sort((a, b) => b.frames - a.frames)
                          .slice(0, 3)
                          .map((h, idx) => (
                            <button key={idx} className="moment-link" onClick={() => onWatch(s, h.startFrame)}>
                              {(h.frames / 60).toFixed(1)}s @ {h.startFrame} ⏵
                            </button>
                          ))}
                      </p>
                    )}
                    {report.futileVerbs.length > 0 && (
                      <p>
                        Presses that did nothing:{' '}
                        {report.futileVerbs.map((f) => `${f.action} (${f.futilePresses}/${f.totalPresses})`).join(' · ')}
                      </p>
                    )}
                    {report.unusedActions.length > 0 && <p>Never used: {report.unusedActions.join(', ')}</p>}
                    {report.annotations.length > 0 && (
                      <p>
                        Your notes:{' '}
                        {report.annotations.map((a, idx) => (
                          <button key={idx} className="moment-link" onClick={() => onWatch(s, Math.max(0, a.frame - 120))}>
                            "{a.note ?? a.tag}" @ {a.frame} ⏵
                          </button>
                        ))}
                      </p>
                    )}
                    <p className="note">The agent sees this same report — ask it to act on any of these moments.</p>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
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
  const [showSessions, setShowSessions] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [tape, setTape] = useState<{ id: string; at?: number } | null>(null); // pane A watches a past session

  const refreshState = () => void fetch('/__studio/state').then(async (r) => setState((await r.json()) as ServerState));
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
          <VariantOptions moduleVariants={variantNames} worktrees={state?.variants ?? {}} />
        </select>
        <div className="spacer" />
        <button className="hy" onClick={() => setShowPhone(true)} aria-label="play on phone">
          📱
        </button>
        <button className="hy" onClick={() => setShowSessions(true)}>
          ▤ {state ? state.sessions.length : '…'} playtests
        </button>
        <span className="build">{state ? `build ${state.buildRef}` : ''}</span>
      </header>

      {showPhone && state && <PhoneModal urls={state.urls} onClose={() => setShowPhone(false)} />}

      {showSessions && state && (
        <SessionsDrawer
          sessions={state.sessions}
          onClose={() => setShowSessions(false)}
          onImported={refreshState}
          onWatch={(entry, at) => {
            // Route the tape to the right game page (title → slug convention).
            const target = games.find((g) => g.slug === slugify(entry.game)) ?? games.find((g) => g.slug === slug);
            if (target) setSlug(target.slug);
            setTape({ id: entry.id, ...(at !== undefined ? { at } : {}) });
            setVariantB(null);
            setShowSessions(false);
            setNonce((n) => n + 1);
          }}
        />
      )}

      <main className="panes">
        {game && (
          <section className="pane">
            <div className="pane-head">
              A · {a.handle?.title() ?? slug} ·{' '}
              {tape ? (
                <>
                  <span className="tape">⏵ tape</span>
                  <button className="hy" onClick={() => (setTape(null), setNonce((n) => n + 1))}>
                    back to live
                  </button>
                </>
              ) : (
                `${variantA || 'baseline'} · seed ${seed}`
              )}
            </div>
            <iframe
              key={`a-${slug}-${seed}-${variantA}-${nonce}-${tape?.id ?? ''}`}
              ref={a.frameRef}
              src={paneUrl(game, seed, variantA, tape ?? undefined)}
              title="pane A"
            />
          </section>
        )}
        {game && variantB !== null && (
          <section className="pane">
            <div className="pane-head">
              B · {variantB || 'baseline'} · seed {seed}
              <select value={variantB} onChange={(e) => setVariantB(e.target.value)} aria-label="variant B">
                <VariantOptions moduleVariants={variantNames} worktrees={state?.variants ?? {}} />
              </select>
            </div>
            <iframe key={`b-${slug}-${seed}-${variantB}-${nonce}`} ref={b.frameRef} src={paneUrl(game, seed, variantB)} title="pane B" />
          </section>
        )}
      </main>

      {a.handle && <Timeline key={`tl-${slug}-${variantA}-${nonce}`} handle={a.handle} />}

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

      {a.handle && !tape && <Knobs key={`${slug}-${variantA}-${nonce}`} handle={a.handle} onDirty={() => setDirty(true)} />}
      <Leva
        titleBar={{ title: 'tuning', position: window.innerWidth < 720 ? { x: 0, y: 56 } : undefined }}
        collapsed={window.innerWidth < 720}
      />
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
