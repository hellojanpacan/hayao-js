// Story — the plot beats of Kintsugi and a light presenter for them. The arc: a
// broken world, five recovered powers each a line of self-remembering, five
// guardians of grief, and the relit kiln. Beats surface as fading area-title
// cards and short in-world lines — non-blocking, so play never fully stops.

import { Node, Text, KENTO } from '@hayao';

export const PROLOGUE = 'The heart-kiln shattered. The light bled out, and the world drifted apart. You wake — the Mender — a needle of gold in your chest.';

/** A line the Mender remembers when a golden power returns. */
export const ABILITY_LINES: Record<string, string> = {
  goldstep: 'Goldstep — the air holds me now.',
  goldrush: 'Goldrush — distance folds.',
  wallmend: 'Wallmend — even broken walls will bear me.',
  goldwing: 'Goldwing — the wind forgives.',
  emberlight: 'Emberlight — no seal will hold against it.',
};

export const SHARD_LINE = 'An ember shard. A little more light to carry.';

/** Guardian rooms → the beat spoken on first entry. */
export const GUARDIAN_INTRO: Record<string, string> = {
  cistern_bell: 'The Drowned Bell tolls. It has guarded this seam so long it forgot the shape of water.',
  ember_warden: 'The Cinder Warden stirs — grief hardened to coal around the forge’s last heat.',
  sky_gale: 'The Gale takes a keeper’s shape. It could not hold the sky, and will not let you.',
  heart_grief: 'The Grief waits at the cold hearth, the last ember cupped in its hands.',
};

interface Card {
  nodes: Text[];
  t: number;
  dur: number;
}

/** Fading story cards + in-world lines, parented to a HUD node. */
export class StoryCards {
  private cards: Card[] = [];
  constructor(private host: Node) {}

  /** A centered area-title card: a big title over a small subtitle. */
  card(title: string, subtitle: string, dur = 5): void {
    const t1 = new Text({ name: 'cardTitle', text: title, pos: { x: 640, y: 250 }, z: 108, size: 46, align: 'center', fill: KENTO.gofun, font: 'Georgia, serif' });
    const t2 = new Text({ name: 'cardSub', text: subtitle, pos: { x: 640, y: 300 }, z: 108, size: 20, align: 'center', fill: KENTO.kinako, font: 'Georgia, serif' });
    this.host.addChild(t1);
    this.host.addChild(t2);
    this.cards.push({ nodes: [t1, t2], t: 0, dur });
  }

  /** A short line that drifts up from a world point and fades. */
  line(text: string, x: number, y: number, dur = 3.2): void {
    const t = new Text({ name: 'line', text, pos: { x, y }, z: 108, size: 20, align: 'center', fill: KENTO.ko, font: 'Georgia, serif' });
    this.host.addChild(t);
    this.cards.push({ nodes: [t], t: 0, dur });
  }

  update(dt: number): void {
    for (let i = this.cards.length - 1; i >= 0; i--) {
      const c = this.cards[i];
      c.t += dt;
      const fadeIn = Math.min(1, c.t / 0.6);
      const fadeOut = Math.min(1, Math.max(0, c.dur - c.t) / 1.2);
      const a = Math.min(fadeIn, fadeOut);
      for (const n of c.nodes) {
        n.paint.opacity = a;
        n.pos.y -= dt * 6; // gentle drift
      }
      if (c.t >= c.dur) {
        for (const n of c.nodes) n.parent?.removeChild(n);
        this.cards.splice(i, 1);
      }
    }
  }

  clear(): void {
    for (const c of this.cards) for (const n of c.nodes) n.parent?.removeChild(n);
    this.cards = [];
  }
}
