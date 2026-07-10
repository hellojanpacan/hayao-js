// Render the "Palace Hours" game soundtrack to WAV + audio-filmstrip SVG and
// print measured features + the background-quality score. This is the "Measure"
// step for the score: it proves, headlessly, that each cue keeps its SFX pocket
// (dark centroid, healthy crest) while still scoring as professional underscore.
//   tsx scripts/soundtrack-render.ts [outDir]
import { writeFileSync, mkdirSync } from 'node:fs';
import {
  SOUNDTRACK, BACKGROUND_PROFILE, renderSong, songDuration, encodeWav,
  features, crestFactorDb, lintSong, renderAudioFilmstrip, scoreTrack,
} from '../src/index';

const outDir = process.argv[2] ?? './audio-out/soundtrack';
mkdirSync(outDir, { recursive: true });

console.log(`\n${SOUNDTRACK.title} — ${SOUNDTRACK.subtitle}`);
console.log(`Rendering ${SOUNDTRACK.cues.length} cues → ${outDir}\n`);

let sum = 0;
for (const c of SOUNDTRACK.cues) {
  const song = c.make();
  const lint = lintSong(song);
  const buf = renderSong(song);
  writeFileSync(`${outDir}/${c.id}.wav`, encodeWav(buf));
  writeFileSync(`${outDir}/${c.id}.svg`, renderAudioFilmstrip(buf, { title: `Palace Hours · ${c.title}` }));
  const f = features(buf.left);
  const crest = crestFactorDb(buf.left);
  const q = scoreTrack(buf, BACKGROUND_PROFILE);
  sum += q.score;
  console.log(
    `${c.title.padEnd(18)} ${String(c.state).padEnd(8)} ${songDuration(song).toFixed(1).padStart(4)}s  ` +
    `bpm~${String(Math.round(f.tempoBpm)).padStart(3)}  ` +
    `centroid ${String(Math.round(f.centroidHz)).padStart(5)}Hz  ` +
    `rms ${f.rms.toFixed(3)}  crest ${crest.toFixed(1).padStart(4)}dB  ` +
    `${lint.ok ? 'lint✓' : 'lint✗'}  bg-quality ${q.score}/100`,
  );
}
console.log(`\naverage bg-quality ${(sum / SOUNDTRACK.cues.length).toFixed(1)}/100`);
console.log(`WAV + SVG artifacts in ${outDir}`);
