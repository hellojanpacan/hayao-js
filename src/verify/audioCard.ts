// Audio card: the polished, DEFAULT way to hand a rendered track to a human.
//
// The rest of the audio stack is built to be *measured* headlessly — WAV + a
// filmstrip SVG dropped into a folder. That's right for CI, wrong for delivery:
// a person can't press play on a folder. This closes that last mile. Given a
// StereoBuffer it emits ONE self-contained HTML file — the WAV inlined as a
// data URI, a real transport (play / scrub / loop / download), the filmstrip as
// the visual, and the measured features + quality score printed like a spec
// sheet — Regalia-styled, no external requests. It works three ways with no
// extra plumbing: a Claude Artifact (fragment mode), a file you double-click,
// or an itch.io / static upload. Pure and deterministic like everything else.

import { encodeWav, type StereoBuffer } from '../audio/pcm';
import { features } from '../audio/analysis';
import { renderAudioFilmstrip } from './audioFilmstrip';

export interface AudioCardMeta {
  /** Track title (large). */
  title: string;
  /** One-line description under the title. */
  subtitle?: string;
  /** Tempo, shown in the spec row when given. */
  bpm?: number;
  /** Extra key→value facts for the spec row (e.g. `{ key: 'C major' }`). */
  facts?: Record<string, string | number>;
  /** 0..100 mix-quality score — rendered as a labelled meter when present. */
  quality?: number;
  /** Embed the audio filmstrip as the visual (default true). */
  filmstrip?: boolean;
  /**
   * Emit a full standalone `<!doctype html>` document (default), or a body
   * FRAGMENT (`standalone: false`) for hosts that supply their own document
   * skeleton — e.g. a Claude Artifact.
   */
  standalone?: boolean;
  /** Loop playback by default (default true — this is a loop, after all). */
  loop?: boolean;
  /** Download filename stem (default derived from the title). */
  filename?: string;
}

/**
 * Render a self-contained HTML audio card for a stereo buffer. The returned
 * string is a complete web page (or a body fragment when `standalone: false`)
 * with the audio embedded — nothing is fetched at runtime.
 */
export function renderAudioCard(buf: StereoBuffer, meta: AudioCardMeta): string {
  const wav = encodeWav(buf);
  const dataUri = `data:audio/wav;base64,${base64(wav)}`;
  const f = features(mono(buf));
  const uid = 'ac' + hash(meta.title).toString(36);
  const stem = (meta.filename ?? slug(meta.title)) + '.wav';
  const loopDefault = meta.loop !== false;

  const facts: [string, string][] = [];
  if (meta.bpm != null) facts.push(['tempo', `${meta.bpm} bpm`]);
  facts.push(['length', `${f.durationSec.toFixed(1)} s`]);
  for (const [k, v] of Object.entries(meta.facts ?? {})) facts.push([k, String(v)]);
  facts.push(['peak', `${f.peakDb.toFixed(1)} dBFS`]);
  facts.push(['rms', f.rms.toFixed(3)]);
  facts.push(['centroid', `${Math.round(f.centroidHz)} Hz`]);

  const factRow = facts
    .map(
      ([k, v]) =>
        `<div class="fact"><span class="fk">${esc(k)}</span><span class="fv">${esc(v)}</span></div>`,
    )
    .join('');

  const q = meta.quality;
  const qBlock =
    q == null
      ? ''
      : `<div class="quality"><div class="qhead"><span>mix quality</span><span class="qnum">${Math.round(q)}<small>/100</small></span></div>` +
        `<div class="qbar"><div class="qfill" style="width:${Math.max(0, Math.min(100, q))}%"></div></div></div>`;

  const film =
    meta.filmstrip === false
      ? ''
      : `<div class="film">${renderAudioFilmstrip(buf, { title: '' })}</div>`;

  const body = `
<div class="hayao-audio-card" id="${uid}">
  <div class="card">
    <div class="head">
      <div class="mark">◗</div>
      <div class="titles">
        <div class="title">${esc(meta.title)}</div>
        ${meta.subtitle ? `<div class="sub">${esc(meta.subtitle)}</div>` : ''}
      </div>
    </div>

    <div class="transport">
      <button class="play" data-play aria-label="Play">
        <svg class="ic-play" viewBox="0 0 24 24" width="26" height="26"><path d="M8 5v14l11-7z"/></svg>
        <svg class="ic-pause" viewBox="0 0 24 24" width="26" height="26" hidden><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>
      </button>
      <div class="scrub">
        <input type="range" data-seek min="0" max="1000" value="0" step="1" aria-label="Seek">
        <div class="time"><span data-cur>0:00</span><span data-dur>0:00</span></div>
      </div>
      <button class="loop ${loopDefault ? 'on' : ''}" data-loop aria-label="Toggle loop" title="Loop">
        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M17 3l4 4-4 4V8H8a3 3 0 00-3 3H3a5 5 0 015-5h9V3zM7 21l-4-4 4-4v3h9a3 3 0 003-3h2a5 5 0 01-5 5H7v3z"/></svg>
      </button>
      <a class="dl" data-dl href="${dataUri}" download="${esc(stem)}" title="Download WAV" aria-label="Download WAV">
        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 3v10l4-4 1.4 1.4L12 16 5.6 10.4 7 9l4 4V3zM5 19h14v2H5z"/></svg>
      </a>
    </div>

    ${qBlock}
    ${film}
    <div class="facts">${factRow}</div>
    <div class="foot">rendered headlessly by the hayao sound engine · deterministic · press play</div>
  </div>
  <audio data-audio src="${dataUri}" preload="auto" ${loopDefault ? 'loop' : ''}></audio>
</div>`.trim();

  const script = `
<script>
(function(){
  var root = document.getElementById(${JSON.stringify(uid)});
  if(!root) return;
  var au = root.querySelector('[data-audio]');
  var play = root.querySelector('[data-play]');
  var icP = root.querySelector('.ic-play'), icU = root.querySelector('.ic-pause');
  var seek = root.querySelector('[data-seek]');
  var cur = root.querySelector('[data-cur]'), dur = root.querySelector('[data-dur]');
  var loopBtn = root.querySelector('[data-loop]');
  var seeking = false;
  function fmt(s){ s = Math.max(0, s||0); var m = Math.floor(s/60); var r = Math.floor(s%60); return m + ':' + (r<10?'0':'') + r; }
  function setPlaying(p){ icP.hidden = p; icU.hidden = !p; play.setAttribute('aria-label', p?'Pause':'Play'); }
  play.addEventListener('click', function(){ if(au.paused){ au.play(); } else { au.pause(); } });
  au.addEventListener('play', function(){ setPlaying(true); });
  au.addEventListener('pause', function(){ setPlaying(false); });
  au.addEventListener('ended', function(){ setPlaying(false); });
  au.addEventListener('loadedmetadata', function(){ dur.textContent = fmt(au.duration); });
  au.addEventListener('timeupdate', function(){
    if(seeking) return;
    cur.textContent = fmt(au.currentTime);
    if(au.duration) seek.value = String(Math.round(au.currentTime/au.duration*1000));
  });
  seek.addEventListener('input', function(){ seeking = true; if(au.duration) cur.textContent = fmt(seek.value/1000*au.duration); });
  seek.addEventListener('change', function(){ if(au.duration) au.currentTime = seek.value/1000*au.duration; seeking = false; });
  loopBtn.addEventListener('click', function(){ au.loop = !au.loop; loopBtn.classList.toggle('on', au.loop); });
})();
</script>`.trim();

  const html = STYLE + '\n' + body + '\n' + script;

  if (meta.standalone === false) return html;

  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<title>${esc(meta.title)} · hayao</title>` +
    `<style>html,body{margin:0;background:#0f1424;min-height:100%}</style>` +
    `</head><body>${html}</body></html>`
  );
}

// ── styling ── Regalia night, scoped so it never leaks into a host page ──
const STYLE = `<style>
.hayao-audio-card{--bg:#141a30;--card:#1d2542;--sunken:#273053;--line:#303a63;--ink:#eef1f9;--soft:#b3bbd4;--muted:#727b9c;--gold:#e59500;--green:#337357;--blue:#669bbc;
  font-family:'Overpass',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:var(--ink);
  display:flex;justify-content:center;padding:22px;box-sizing:border-box}
.hayao-audio-card *{box-sizing:border-box}
.hayao-audio-card .card{width:100%;max-width:660px;background:linear-gradient(180deg,var(--card),#19203c);
  border:1px solid var(--line);border-radius:18px;padding:22px 22px 16px;
  box-shadow:0 18px 50px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.04)}
.hayao-audio-card .head{display:flex;align-items:center;gap:14px;margin-bottom:18px}
.hayao-audio-card .mark{width:44px;height:44px;flex:0 0 44px;border-radius:12px;display:flex;align-items:center;justify-content:center;
  font-size:24px;color:#1a1205;background:radial-gradient(circle at 32% 28%,#ffbf47,var(--gold));box-shadow:0 4px 14px rgba(229,149,0,.4)}
.hayao-audio-card .title{font-size:22px;font-weight:700;letter-spacing:.2px;line-height:1.15}
.hayao-audio-card .sub{font-size:13px;color:var(--soft);margin-top:3px;line-height:1.4}
.hayao-audio-card .transport{display:flex;align-items:center;gap:14px;margin-bottom:16px}
.hayao-audio-card .play{flex:0 0 54px;width:54px;height:54px;border-radius:50%;border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;color:#1a1205;
  background:radial-gradient(circle at 34% 30%,#ffc65a,var(--gold));box-shadow:0 6px 18px rgba(229,149,0,.4);transition:transform .08s ease}
.hayao-audio-card .play:hover{transform:scale(1.05)}
.hayao-audio-card .play:active{transform:scale(.96)}
.hayao-audio-card .play svg{fill:currentColor}
.hayao-audio-card .scrub{flex:1;min-width:0}
.hayao-audio-card input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:6px;
  background:var(--sunken);outline:none;cursor:pointer}
.hayao-audio-card input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:15px;height:15px;border-radius:50%;
  background:var(--gold);border:2px solid #19203c;box-shadow:0 2px 6px rgba(0,0,0,.4)}
.hayao-audio-card input[type=range]::-moz-range-thumb{width:15px;height:15px;border-radius:50%;background:var(--gold);border:2px solid #19203c}
.hayao-audio-card .time{display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-top:6px;font-variant-numeric:tabular-nums}
.hayao-audio-card .loop,.hayao-audio-card .dl{flex:0 0 38px;width:38px;height:38px;border-radius:10px;border:1px solid var(--line);
  background:var(--sunken);color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center;text-decoration:none;transition:color .12s,border-color .12s}
.hayao-audio-card .loop:hover,.hayao-audio-card .dl:hover{color:var(--soft);border-color:#3d4877}
.hayao-audio-card .loop.on{color:var(--gold);border-color:var(--gold)}
.hayao-audio-card .loop svg,.hayao-audio-card .dl svg{fill:currentColor}
.hayao-audio-card .quality{margin-bottom:14px}
.hayao-audio-card .qhead{display:flex;justify-content:space-between;align-items:baseline;font-size:12px;color:var(--soft);margin-bottom:6px;text-transform:uppercase;letter-spacing:.6px}
.hayao-audio-card .qnum{font-size:20px;font-weight:700;color:var(--ink);letter-spacing:0;text-transform:none}
.hayao-audio-card .qnum small{font-size:12px;color:var(--muted);font-weight:400}
.hayao-audio-card .qbar{height:8px;border-radius:8px;background:var(--sunken);overflow:hidden}
.hayao-audio-card .qfill{height:100%;border-radius:8px;background:linear-gradient(90deg,var(--green),var(--gold))}
.hayao-audio-card .film{border-radius:12px;overflow:hidden;border:1px solid var(--line);margin-bottom:14px;line-height:0}
.hayao-audio-card .film svg{display:block;width:100%;height:auto}
.hayao-audio-card .facts{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.hayao-audio-card .fact{display:flex;flex-direction:column;gap:2px;background:var(--sunken);border:1px solid var(--line);border-radius:9px;padding:7px 11px;min-width:74px}
.hayao-audio-card .fk{font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:var(--muted)}
.hayao-audio-card .fv{font-size:14px;font-weight:600;color:var(--ink);font-variant-numeric:tabular-nums}
.hayao-audio-card .foot{font-size:11px;color:var(--muted);text-align:center;border-top:1px solid var(--line);padding-top:12px}
</style>`;

/** Downmix to mono for the feature readout. */
function mono(buf: StereoBuffer): Float32Array {
  const n = buf.left.length;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = (buf.left[i] + buf.right[i]) * 0.5;
  return out;
}

/** Platform-neutral base64 (no Buffer / btoa dependency). */
function base64(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += chars[(n >> 18) & 63] + chars[(n >> 12) & 63] + chars[(n >> 6) & 63] + chars[n & 63];
  }
  const rem = bytes.length - i;
  if (rem === 1) {
    const n = bytes[i] << 16;
    out += chars[(n >> 18) & 63] + chars[(n >> 12) & 63] + '==';
  } else if (rem === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out += chars[(n >> 18) & 63] + chars[(n >> 12) & 63] + chars[(n >> 6) & 63] + '=';
  }
  return out;
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'track';
}

/** Small deterministic string hash → non-negative int (for stable element ids). */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
