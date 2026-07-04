import { describe, it, expect } from 'vitest';
import {
  noteToMidi,
  midiToName,
  midiToFreq,
  scaleMidis,
  scalePitchClasses,
  diatonicChord,
  progression,
} from './theory';

describe('theory', () => {
  it('parses scientific pitch to MIDI (C4=60, A4=69)', () => {
    expect(noteToMidi('C4')).toBe(60);
    expect(noteToMidi('A4')).toBe(69);
    expect(noteToMidi('C-1')).toBe(0);
    expect(noteToMidi('F#3')).toBe(54);
    expect(noteToMidi('Bb3')).toBe(58);
  });

  it('round-trips MIDI ↔ name for sharps', () => {
    expect(midiToName(60)).toBe('C4');
    expect(midiToName(69)).toBe('A4');
    expect(noteToMidi(midiToName(73))).toBe(73);
  });

  it('rejects malformed note names', () => {
    expect(() => noteToMidi('H4')).toThrow();
    expect(() => noteToMidi('C')).toThrow();
  });

  it('midiToFreq matches equal temperament', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 5);
    expect(midiToFreq(57)).toBeCloseTo(220, 3); // A3
    expect(midiToFreq(81)).toBeCloseTo(880, 3); // A5
    expect(midiToFreq(60)).toBeCloseTo(261.63, 1); // C4
  });

  it('builds a C major scale', () => {
    const s = scaleMidis(noteToMidi('C4'), 'major', 1);
    expect(s.map(midiToName)).toEqual(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']);
  });

  it('reports scale pitch classes for in-key checks', () => {
    const pcs = scalePitchClasses(noteToMidi('C4'), 'major');
    expect(pcs.has(0)).toBe(true); // C
    expect(pcs.has(1)).toBe(false); // C#
    expect(pcs.has(11)).toBe(true); // B
  });

  it('stacks correct diatonic chord qualities in C major', () => {
    const C4 = noteToMidi('C4');
    // I = C major triad C E G
    expect(diatonicChord(C4, 'major', 0).map(midiToName)).toEqual(['C4', 'E4', 'G4']);
    // ii = D minor triad D F A
    expect(diatonicChord(C4, 'major', 1).map(midiToName)).toEqual(['D4', 'F4', 'A4']);
    // V7 = G B D F
    expect(diatonicChord(C4, 'major', 4, 4).map(midiToName)).toEqual(['G4', 'B4', 'D5', 'F5']);
  });

  it('realizes a roman-numeral progression', () => {
    const chords = progression(noteToMidi('C4'), 'major', ['I', 'V', 'vi', 'IV']);
    expect(chords[0].map(midiToName)).toEqual(['C4', 'E4', 'G4']); // I
    expect(chords[1].map(midiToName)).toEqual(['G4', 'B4', 'D5']); // V
    expect(chords[2].map(midiToName)).toEqual(['A4', 'C5', 'E5']); // vi
    expect(chords[3].map(midiToName)).toEqual(['F4', 'A4', 'C5']); // IV
  });
});
