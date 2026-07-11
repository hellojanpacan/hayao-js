// The atom: a project's authored component — a sprite sheet, a scene mood, a
// set of audio cues — declared once and visible in the Workshop from the moment
// the file exists. Atoms are how a hayao project begins BEFORE it is a game:
// the Workshop's Visual/Scene/Audio tabs render them, the same knobs/HMR/
// session machinery games use rides along for free, and the `radiates:` line is
// the seed hook the Design Codex reads when the atom starts suggesting a game
// (design/00-process/the-seed.md).
//
// THE TRICK: an atom compiles to a miniature GameDefinition (`atomToGame`), so
// nothing downstream is new — createWorld runs it, runWorkshop records it,
// tuning knobs rebuild it, determinism gates hold it. An atom is a tiny world
// whose whole scene is cosmetic.
//
// Browser-clean: no Node/fs imports — atoms live in project code.

import type { GameDefinition } from '../app/game';
import type { TuningSpec } from '../app/tuning';
import type { World } from '../world';
import { Node } from '../scene/node';
import { Text } from '../scene/nodes';
import type { AudioBus } from '../audio/audio';
import { REGALIA } from '../art/palette';
import { fail } from '../core/errors';

export type AtomKind = 'visual' | 'scene' | 'audio';

/** One playable sound in an audio atom — a sfx cue or a track starter. */
export interface AtomCue {
  name: string;
  /** One-line description shown beside the play button. */
  note?: string;
  /** Fire the cue. The bus is already unlocked (the button click paid for it). */
  play: (bus: AudioBus) => void;
}

export interface AtomDefinition {
  kind: AtomKind;
  title: string;
  /**
   * The seed hook — one line naming what game this atom suggests (fantasy /
   * verb / tension). Read by the Codex's seed module and shown in the Workshop.
   * An atom that radiates nothing after honest iteration gets archived.
   */
  radiates?: string;
  /** Live-tunable knobs — the same tuning system games declare. */
  tuning?: TuningSpec;
  /** Build the catalog scene (visual/scene). Everything under it must be cosmetic. */
  build?: (world: World) => Node;
  /** The cues (audio). The pane renders a play button per cue. */
  cues?: AtomCue[];
  /** Re-attach behaviors after a knob rebuild — same contract as games. */
  attach?: (world: World) => void;
  seed?: number;
  width?: number;
  height?: number;
  background?: string;
}

/** Identity + validation, mirroring defineGame's shape-guard philosophy. */
export function defineAtom(def: AtomDefinition): AtomDefinition {
  if (def.kind !== 'visual' && def.kind !== 'scene' && def.kind !== 'audio') {
    fail({
      problem: `defineAtom got an unknown kind '${String(def.kind)}'.`,
      field: 'kind',
      expected: "'visual' | 'scene' | 'audio'",
      received: def.kind,
      hasReceived: true,
      anchor: 'define-atom',
    });
  }
  if ((def.kind === 'visual' || def.kind === 'scene') && typeof def.build !== 'function') {
    fail({
      problem: `A '${def.kind}' atom needs a build() that returns its catalog scene.`,
      field: 'build',
      expected: '(world) => Node',
      received: def.build,
      hasReceived: true,
      anchor: 'define-atom',
    });
  }
  if (def.kind === 'audio' && (!Array.isArray(def.cues) || def.cues.length === 0)) {
    fail({
      problem: 'An audio atom needs at least one cue.',
      field: 'cues',
      expected: '[{ name, play(bus) }]',
      received: def.cues,
      hasReceived: true,
      anchor: 'define-atom',
    });
  }
  return def;
}

/** What the Workshop shell needs to know about one atom (via window manifest). */
export interface AtomManifestEntry {
  id: string;
  kind: AtomKind;
  title: string;
  radiates?: string;
  /** Audio atoms: cue names + notes so the pane can label buttons. */
  cues?: Array<{ name: string; note?: string }>;
}

export const atomId = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Compile an atom to a miniature GameDefinition so the whole existing stack
 * (createWorld, runWorkshop, knobs, determinism checks) runs it unchanged.
 * Visual/scene atoms mount their catalog under a cosmetic root; audio atoms
 * get a placid title card (the cue buttons are DOM, added by runProject).
 */
export function atomToGame(atom: AtomDefinition): GameDefinition {
  return {
    title: atom.title,
    width: atom.width ?? 1280,
    height: atom.height ?? 720,
    seed: atom.seed ?? 1,
    background: atom.background ?? REGALIA.ground,
    tuning: atom.tuning,
    splash: false,
    build: (world) => {
      const root = new Node({ name: `atom-${atomId(atom.title)}` });
      root.cosmetic = true;
      if (atom.build) {
        root.addChild(atom.build(world as World));
      } else {
        // Audio atom stage: a quiet title card behind the DOM cue strip.
        const label = new Text({
          pos: { x: (atom.width ?? 1280) / 2, y: (atom.height ?? 720) / 2 },
          text: atom.title,
          size: 30,
          weight: 600,
          align: 'center',
          fill: REGALIA.softInk,
        });
        label.cosmetic = true;
        root.addChild(label);
      }
      return root;
    },
    attach: atom.attach as GameDefinition['attach'],
    probe: (world) => ({ frame: world.frame, hash: world.hash(), atom: atomId(atom.title), kind: atom.kind }),
  };
}

/** The manifest entry for one atom (what the shell's tab bar is built from). */
export function atomManifest(atom: AtomDefinition): AtomManifestEntry {
  return {
    id: atomId(atom.title),
    kind: atom.kind,
    title: atom.title,
    ...(atom.radiates ? { radiates: atom.radiates } : {}),
    ...(atom.cues ? { cues: atom.cues.map((c) => ({ name: c.name, ...(c.note ? { note: c.note } : {}) })) } : {}),
  };
}
