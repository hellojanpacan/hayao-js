// Runway — a SEED-STAGE project: no game.ts yet, by design. The project is a
// Timeline and two atoms; the Workshop shows exactly those tabs and grows as
// the project does (docs/CONVENTIONS.md → project anatomy).

import { runProject } from '@hayao';
import { cards } from './atoms/cards';
import { sounds } from './atoms/sounds';

const mount = document.getElementById('app')!;
runProject({ title: 'Runway', atoms: [cards, sounds] }, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
