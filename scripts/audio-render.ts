// Render the audio showbook to WAV + audio-filmstrip SVG and print measured
// features — the "Measure" step of the audio loop. Usage:
//   tsx scripts/audio-render.ts [outDir]
import { writeFileSync, mkdirSync } from 'node:fs';
import {
  GENRES, renderSong, songDuration, encodeWav, features, lintSong,
  renderAudioFilmstrip, scoreTrack, GENRE_PROFILES,
} from '../src/index';

const outDir = process.argv[2] ?? './audio-out';
mkdirSync(outDir, { recursive: true });

console.log(`Rendering ${GENRES.length} genre tracks → ${outDir}\n`);
for (const g of GENRES) {
  const song = g.make();
  const lint = lintSong(song);
  const buf = renderSong(song);
  writeFileSync(`${outDir}/${g.id}.wav`, encodeWav(buf));
  writeFileSync(`${outDir}/${g.id}.svg`, renderAudioFilmstrip(buf, { title: `hayao · ${g.name}` }));
  const f = features(buf.left);
  const q = scoreTrack(buf, GENRE_PROFILES[g.id]);
  console.log(
    `${g.name.padEnd(20)} ${songDuration(song).toFixed(1).padStart(4)}s  ` +
    `bpm~${String(Math.round(f.tempoBpm)).padStart(3)}  ` +
    `peak ${f.peakDb.toFixed(1).padStart(5)}dB  rms ${f.rms.toFixed(3)}  ` +
    `centroid ${String(Math.round(f.centroidHz)).padStart(5)}Hz  ` +
    `${lint.ok ? 'lint✓' : 'lint✗'}  quality ${q.score}/100`,
  );
}
console.log(`\nWAV + SVG artifacts in ${outDir}`);
