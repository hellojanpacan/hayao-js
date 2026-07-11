import { describe, it, expect } from 'vitest';
import { renderAudioCard } from './audioCard';
import { renderSong } from '../audio/music';
import { loop } from '../audio/loops';

describe('renderAudioCard (human delivery surface)', () => {
  const buf = renderSong(loop('kick-snare')!.make());

  it('emits a self-contained standalone document with the audio inlined', () => {
    const html = renderAudioCard(buf, { title: 'Funky Kick-Snare', bpm: 100, quality: 99 });
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('data:audio/wav;base64,'); // embedded, no external fetch
    expect(html).toContain('Funky Kick-Snare');
    expect(html).toContain('100 bpm');
    expect(html).toContain('99'); // quality meter
    expect(html).toContain('data-play'); // a real transport
    // no external resources fetched at runtime (xmlns namespace URIs don't count)
    expect(html).not.toContain('src="http');
    expect(html).not.toContain('href="http');
    expect(html).not.toContain('@import');
  });

  it('emits a body fragment (no doctype) for embedding hosts like Artifacts', () => {
    const frag = renderAudioCard(buf, { title: 'Funky Kick-Snare', standalone: false });
    expect(frag.startsWith('<!doctype')).toBe(false);
    expect(frag).toContain('hayao-audio-card');
    expect(frag).toContain('data:audio/wav;base64,');
  });

  it('is deterministic — same buffer, byte-identical card', () => {
    const a = renderAudioCard(buf, { title: 'X', bpm: 100 });
    const b = renderAudioCard(buf, { title: 'X', bpm: 100 });
    expect(a).toBe(b);
  });

  it('escapes user copy into the markup', () => {
    const html = renderAudioCard(buf, { title: 'A & B <script>', standalone: false });
    expect(html).toContain('A &amp; B &lt;script&gt;');
  });
});
