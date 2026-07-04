import { describe, it, expect } from 'vitest';
import { chordNotes, rootless, chordChanges } from './chord';
import { midiToName, noteToMidi } from './theory';

const names = (midi: number[]) => midi.map(midiToName);

describe('chord vocabulary', () => {
  it('builds core triads and sevenths', () => {
    expect(names(chordNotes('C', 4))).toEqual(['C4', 'E4', 'G4']);
    expect(names(chordNotes('Cm', 4))).toEqual(['C4', 'D#4', 'G4']);
    expect(names(chordNotes('Cmaj7', 4))).toEqual(['C4', 'E4', 'G4', 'B4']);
    expect(names(chordNotes('C7', 4))).toEqual(['C4', 'E4', 'G4', 'A#4']);
    expect(names(chordNotes('Cm7', 4))).toEqual(['C4', 'D#4', 'G4', 'A#4']);
  });

  it('handles half-diminished, diminished, and altered dominants', () => {
    expect(names(chordNotes('Dm7b5', 4))).toEqual(['D4', 'F4', 'G#4', 'C5']);
    expect(names(chordNotes('C dim7'.replace(' ', ''), 4))).toEqual(['C4', 'D#4', 'F#4', 'A4']);
    // G7alt = b9 #9 b13, no 5
    const alt = chordNotes('G7alt', 4);
    expect(alt[0]).toBe(noteToMidi('G4'));
    expect(alt).toContain(noteToMidi('G4') + 4); // major 3rd (B)
    expect(alt).toContain(noteToMidi('G4') + 13); // b9 (Ab)
    expect(alt).toContain(noteToMidi('G4') + 20); // b13 (Eb)
  });

  it('builds extended chords (9/11/13)', () => {
    expect(chordNotes('C9', 4)).toContain(noteToMidi('D5')); // the 9th
    expect(chordNotes('C13', 4)).toContain(noteToMidi('A5')); // the 13th
    expect(chordNotes('Cm11', 4)).toContain(noteToMidi('F5')); // the 11th
  });

  it('supports slash bass below the chord', () => {
    const c = chordNotes('C/E', 4);
    expect(midiToName(c[0])).toBe('E3'); // bass an octave below
    expect(c[0]).toBeLessThan(c[1]);
  });

  it('throws on an unknown quality (catches typos)', () => {
    expect(() => chordNotes('Cxyz', 4)).toThrow();
  });

  it('rootless voicing drops the root and can recenter', () => {
    const c = chordNotes('Cmaj7', 3); // C3 E3 G3 B3
    const rl = rootless(c);
    expect(rl.length).toBe(3);
    expect(midiToName(rl[0])).toBe('E3'); // root C dropped
    const centered = rootless(c, noteToMidi('C4'));
    const avg = centered.reduce((a, b) => a + b, 0) / centered.length;
    expect(Math.abs(avg - noteToMidi('C4'))).toBeLessThan(7);
  });

  it('chordChanges resolves a whole progression', () => {
    const changes = chordChanges(['Dm7', 'G7', 'Cmaj7']);
    expect(changes.length).toBe(3);
    expect(names(changes[2])).toEqual(['C4', 'E4', 'G4', 'B4']);
  });
});
