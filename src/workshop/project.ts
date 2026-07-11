// runProject: the project's single entry for its whole life. A hayao project
// exists before its game does (docs/CONVENTIONS.md → project anatomy): day zero
// it is a TIMELINE.md and an atom or two; weeks later it grows a game.ts. This
// module makes that continuous — one main.ts, one URL, one Workshop pane:
//
//   runProject({ title, game?, atoms? }, mount, { hot: import.meta.hot })
//
// Routing: `?atom=<id>` runs that atom's compiled world (knobs, HMR, sessions —
// the whole runWorkshop stack rides along); no `?atom=` runs the game when one
// exists, else the first atom, else a quiet "empty project" card. The Workshop
// shell reads `window.__hayaoProject` to learn which tabs exist — a tab appears
// only when its content does, so the UI grows exactly as the project grows.
//
// Audio atoms get a DOM cue strip (buttons are chrome — DOM, per the house
// rule); the first click unlocks the AudioBus with the gesture it already paid.

import type { GameDefinition } from '../app/game';
import { audio } from '../audio/audio';
import { Node } from '../scene/node';
import { Text } from '../scene/nodes';
import { REGALIA } from '../art/palette';
import { runWorkshop, type WorkshopHandle, type WorkshopOptions } from './run';
import { atomToGame, atomManifest, atomId, type AtomDefinition, type AtomManifestEntry } from './atom';

export interface ProjectDefinition {
  title: string;
  /** The playable game — OPTIONAL until loop assembly begins. */
  game?: GameDefinition;
  /** The project's authored atoms, in display order. */
  atoms?: AtomDefinition[];
}

/** What the Workshop shell learns about a project from its iframe. */
export interface ProjectManifest {
  project: string;
  hasGame: boolean;
  atoms: AtomManifestEntry[];
  /** Which pane this frame is showing: 'game' or an atom id. */
  showing: string;
}

declare global {
  interface Window {
    __hayaoProject?: ProjectManifest;
  }
}

/** DOM strip of play buttons for an audio atom's cues. Chrome, not world. */
function cueStrip(atom: AtomDefinition, mount: HTMLElement): void {
  const strip = document.createElement('div');
  strip.setAttribute('data-hayao-cues', '');
  // Fixed to the frame's viewport: the world's letterboxed box is not a layout
  // anchor a DOM strip can trust (design-space height ≠ viewport height).
  strip.style.cssText =
    'position:fixed;left:50%;bottom:26px;transform:translateX(-50%);display:flex;flex-direction:column;gap:8px;' +
    'font:14px system-ui,sans-serif;z-index:30;max-height:70vh;overflow:auto;';
  for (const cue of atom.cues ?? []) {
    const row = document.createElement('button');
    row.type = 'button';
    row.style.cssText =
      'display:flex;align-items:center;gap:10px;padding:9px 16px;border-radius:999px;cursor:pointer;' +
      'background:#1d2542;color:#eef1f9;border:1.5px solid #303a63;text-align:left;';
    const label = document.createElement('b');
    label.textContent = `▶ ${cue.name}`;
    row.appendChild(label);
    if (cue.note) {
      const note = document.createElement('span');
      note.textContent = cue.note;
      note.style.cssText = 'opacity:.65;font-size:12px;';
      row.appendChild(note);
    }
    row.addEventListener('click', () => {
      audio.start(); // the click is the unlock gesture
      cue.play(audio);
    });
    strip.appendChild(row);
  }
  mount.appendChild(strip);
}

/** A placid card for a project with no game and no atoms yet — day zero. */
function emptyProjectGame(title: string): GameDefinition {
  return {
    title,
    width: 1280,
    height: 720,
    seed: 1,
    background: REGALIA.ground,
    splash: false,
    build: () => {
      const root = new Node({ name: 'empty-project' });
      root.cosmetic = true;
      const mk = (y: number, text: string, size: number, fill: string): void => {
        const t = new Text({ pos: { x: 640, y }, text, size, weight: 600, align: 'center', fill });
        t.cosmetic = true;
        root.addChild(t);
      };
      mk(340, title, 30, REGALIA.paperInk);
      mk(386, 'an empty project — add an atom, or a game', 15, REGALIA.softInk);
      return root;
    },
    probe: (world) => ({ frame: world.frame, hash: world.hash(), empty: true }),
  };
}

/**
 * Run the project's pane. Same signature spirit as runWorkshop — pass
 * `{ hot: import.meta.hot }` and keep the literal `import.meta.hot?.accept();`
 * line in your entry, exactly as before.
 */
export function runProject(project: ProjectDefinition, mount: HTMLElement, opts: WorkshopOptions = {}): WorkshopHandle {
  const atoms = project.atoms ?? [];
  const wanted = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('atom') : null;
  const found = wanted ? atoms.find((a) => atomId(a.title) === wanted) : undefined;

  let def: GameDefinition;
  let showing: string;
  let shown: AtomDefinition | undefined;
  if (found) {
    def = atomToGame(found);
    showing = atomId(found.title);
    shown = found;
  } else if (project.game) {
    def = project.game;
    showing = 'game';
  } else if (atoms.length > 0) {
    def = atomToGame(atoms[0]);
    showing = atomId(atoms[0].title);
    shown = atoms[0];
  } else {
    def = emptyProjectGame(project.title);
    showing = 'empty';
  }

  const manifest: ProjectManifest = {
    project: project.title,
    hasGame: !!project.game,
    atoms: atoms.map(atomManifest),
    showing,
  };
  if (typeof window !== 'undefined') window.__hayaoProject = manifest;

  const handle = runWorkshop(def, mount, opts);
  // The cue strip mounts AFTER the driver (which owns/clears the mount's DOM).
  if (shown?.kind === 'audio') cueStrip(shown, mount);
  return handle;
}
