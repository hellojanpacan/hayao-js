import { runStudio } from '@hayao';
import { updriftGame } from './game';
import { variants } from './variants';

const mount = document.getElementById('app')!;
// Studio-instrumented: sessions record on the dev server, ?seed=/?tuning=/
// ?variant= override, window.__studio drives knobs from the Studio page.
// Production builds behave like runBrowser (the endpoints just aren't there).
runStudio(updriftGame, mount, { variants });
