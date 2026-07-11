// Render the drum-loop library → WAV + audio-filmstrip SVG + a self-contained
// HTML audio card (the polished, press-play delivery). Also prints measured
// features and the mix-quality score — the "Measure" step of the audio loop.
//   tsx scripts/loops-render.ts [outDir]
import { writeFileSync, mkdirSync } from 'node:fs';
import {
  LOOPS, renderSong, songDuration, encodeWav, features, lintSong,
  renderAudioFilmstrip, renderAudioCard, scoreTrack, GENRE_PROFILES,
} from '../src/index';

const outDir = process.argv[2] ?? './audio-out/loops';
mkdirSync(outDir, { recursive: true });

console.log(`Rendering ${LOOPS.length} drum loop(s) → ${outDir}\n`);
for (const l of LOOPS) {
  const song = l.make();
  const lint = lintSong(song);
  const buf = renderSong(song);
  const q = scoreTrack(buf, GENRE_PROFILES[l.profile]);
  const f = features(buf.left);

  writeFileSync(`${outDir}/${l.id}.wav`, encodeWav(buf));
  writeFileSync(`${outDir}/${l.id}.svg`, renderAudioFilmstrip(buf, { title: `hayao · ${l.name}` }));
  writeFileSync(
    `${outDir}/${l.id}.html`,
    renderAudioCard(buf, {
      title: l.name,
      subtitle: l.description,
      bpm: song.bpm,
      quality: q.score,
      facts: { feel: 'straight 4/4', snare: 'body + wires' },
    }),
  );

  console.log(
    `${l.name.padEnd(20)} ${songDuration(song).toFixed(1).padStart(4)}s  ` +
    `bpm~${String(Math.round(f.tempoBpm)).padStart(3)}  ` +
    `peak ${f.peakDb.toFixed(1).padStart(5)}dB  rms ${f.rms.toFixed(3)}  ` +
    `centroid ${String(Math.round(f.centroidHz)).padStart(5)}Hz  ` +
    `onsets ${f.onsetDensity.toFixed(1)}/s  ` +
    `${lint.ok ? 'lint✓' : 'lint✗'}  quality ${q.score}/100`,
  );
  if (!lint.ok) for (const e of lint.errors) console.log(`   lint error: ${e}`);
  for (const w of lint.warnings) console.log(`   lint warn: ${w}`);
}
console.log(`\nWAV + SVG + HTML card artifacts in ${outDir}`);
