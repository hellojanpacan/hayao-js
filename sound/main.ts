// Sound Studio — the audio showcase, driving the real @hayao API in the browser.
// Music: GENRES → audio.playSong (looping). SFX: SoundSpec → audio.playSpec.
// The waveform/spectrogram is the same renderAudioFilmstrip used in verification.

import {
  GENRES,
  audio,
  renderSong,
  renderAudioFilmstrip,
  type Song,
  type SoundSpec,
} from '@hayao';

audio.setVolumes({ master: 0.7, music: 0.8, sfx: 0.9, muted: false });

const genresEl = document.getElementById('genres')!;
const vizEl = document.getElementById('viz')!;
const sfxEl = document.getElementById('sfx')!;
const nowEl = document.getElementById('nowplaying')!;
const volEl = document.getElementById('vol') as HTMLInputElement;

let stopCurrent: (() => void) | null = null;
let activeId: string | null = null;
const filmstripCache = new Map<string, string>();

function clearActive() {
  document.querySelectorAll('.card').forEach((c) => c.classList.remove('active'));
  document.querySelectorAll('button.play').forEach((b) => {
    b.classList.remove('on');
    b.textContent = '▶ play';
  });
}

function showFilmstrip(id: string, song: Song) {
  const cached = filmstripCache.get(id);
  if (cached) {
    vizEl.innerHTML = cached;
    return;
  }
  vizEl.innerHTML = '<div class="placeholder">rendering waveform &amp; spectrogram…</div>';
  // defer so playback starts instantly; the render is ~1s
  setTimeout(() => {
    const buf = renderSong(song, { sampleRate: 44100 });
    const svg = renderAudioFilmstrip(buf, { width: 880, timeBins: 180, freqBands: 56 });
    filmstripCache.set(id, svg);
    if (activeId === id) vizEl.innerHTML = svg;
  }, 30);
}

function playGenre(id: string, song: Song, btn: HTMLButtonElement) {
  audio.start();
  if (activeId === id) {
    // toggle off
    stopCurrent?.();
    stopCurrent = null;
    activeId = null;
    clearActive();
    nowEl.textContent = '';
    return;
  }
  stopCurrent?.();
  clearActive();
  stopCurrent = audio.playSong(song, { loop: true });
  activeId = id;
  btn.classList.add('on');
  btn.textContent = '■ stop';
  btn.closest('.card')?.classList.add('active');
  const name = GENRES.find((g) => g.id === id)?.name ?? id;
  nowEl.textContent = `▸ now playing: ${name} (looping)`;
  showFilmstrip(id, song);
}

for (const g of GENRES) {
  const song = g.make();
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <h3>${g.name}</h3>
    <p>${g.description}</p>
    <div class="row">
      <button class="play" data-id="${g.id}">▶ play</button>
      <span class="badge">${song.bpm} bpm · ${song.tracks.length} tracks</span>
    </div>`;
  genresEl.appendChild(card);
  const btn = card.querySelector('button.play') as HTMLButtonElement;
  btn.addEventListener('click', () => playGenre(g.id, song, btn));
}

// ── SFX kit — each is a named SoundSpec (see docs/AUDIO.md) ──
const SFX: { name: string; pan?: number; spec: SoundSpec }[] = [
  { name: 'coin', spec: { freq: 988, wave: 'square', attack: 0.005, sustain: 0.04, release: 0.12, pitchJump: 7, pitchJumpTime: 0.05, volume: 0.5 } },
  { name: 'powerup', spec: { freq: 330, wave: 'square', sustain: 0.05, release: 0.2, slide: 24, detune: 8, volume: 0.42 } },
  { name: 'laser', spec: { freq: 900, wave: 'saw', slide: -24, sustain: 0.02, release: 0.18, lowpass: 3000, volume: 0.4 } },
  { name: 'jump', spec: { freq: 300, wave: 'triangle', slide: 12, attack: 0.005, sustain: 0.03, release: 0.1, volume: 0.5 } },
  { name: 'hurt', spec: { freq: 180, wave: 'square', slide: -8, noise: 0.3, sustain: 0.03, release: 0.14, volume: 0.5 } },
  { name: 'explosion', spec: { freq: 120, wave: 'noise', sustain: 0.05, release: 0.4, lowpass: 1200, slide: -6, volume: 0.6 } },
  { name: 'blip', spec: { freq: 640, wave: 'sine', sustain: 0.01, release: 0.05, volume: 0.4 } },
  { name: 'pickup', spec: { freq: 523, wave: 'triangle', sustain: 0.03, release: 0.15, pitchJump: 5, pitchJumpTime: 0.04, volume: 0.45 } },
];

for (const s of SFX) {
  const btn = document.createElement('button');
  btn.textContent = s.name;
  btn.addEventListener('click', () => {
    audio.start();
    audio.playSpec(s.spec, { pan: s.pan });
  });
  sfxEl.appendChild(btn);
}

volEl.addEventListener('input', () => {
  audio.setVolumes({ master: Number(volEl.value) / 100 });
});
