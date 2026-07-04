// Render + score the "Neon Precinct" album. Writes WAV + audio-filmstrip SVG per
// track and prints measured features + a quality score (jazz-funk profile).
import { writeFileSync, mkdirSync } from 'node:fs';
import {
  ALBUM, renderSong, songDuration, encodeWav, lintSong,
  renderAudioFilmstrip, scoreTrack, GENRE_PROFILES,
} from '../src/index';

const outDir = process.argv[2] ?? './album-out';
mkdirSync(outDir, { recursive: true });

// jazz-funk profile, widened tempo band (the album ranges 62–128 bpm across cues)
const profile = { ...GENRE_PROFILES.jazzfunk, tempo: [55, 135] as [number, number] };

console.log(`♪ ${ALBUM.title} — ${ALBUM.subtitle}\n`);
let total = 0;
for (const t of ALBUM.tracks) {
  const song = t.make();
  const lint = lintSong(song);
  const buf = renderSong(song);
  writeFileSync(`${outDir}/${t.id}.wav`, encodeWav(buf));
  writeFileSync(`${outDir}/${t.id}.svg`, renderAudioFilmstrip(buf, { title: `Neon Precinct · ${t.title}` }));
  const q = scoreTrack(buf, profile);
  total += q.score;
  const bar = '█'.repeat(Math.round(q.score / 5)).padEnd(20, '·');
  console.log(`${t.title.padEnd(20)} ${songDuration(song).toFixed(0).padStart(2)}s ${song.bpm}bpm  ${bar} ${q.score}  ${lint.ok ? '' : 'LINT✗'}`);
  if (q.notes.length) for (const nt of q.notes) console.log(`     ⚠ ${nt}`);
}
console.log(`\naverage: ${Math.round(total / ALBUM.tracks.length)}/100`);
