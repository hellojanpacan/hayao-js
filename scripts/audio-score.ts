// Score the genre songbook on the objective quality rubric — the hard gate for
// "is this actually good?". Prints per-track score + any failing dimensions.
import { GENRES, renderSong, scoreTrack, GENRE_PROFILES } from '../src/index';

let total = 0;
console.log('Quality scores (0–100):\n');
for (const g of GENRES) {
  const buf = renderSong(g.make());
  const profile = GENRE_PROFILES[g.id];
  const q = scoreTrack(buf, profile);
  total += q.score;
  const bar = '█'.repeat(Math.round(q.score / 5)).padEnd(20, '·');
  console.log(`${g.name.padEnd(20)} ${bar} ${q.score}`);
  if (q.notes.length) for (const nt of q.notes) console.log(`    ⚠ ${nt}`);
}
console.log(`\naverage: ${Math.round(total / GENRES.length)}`);
