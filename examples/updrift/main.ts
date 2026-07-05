import { runStudio } from '@hayao';
import { updriftGame } from './game';
import { variants } from './variants';

const mount = document.getElementById('app')!;
// Studio-instrumented: sessions record on the dev server, ?seed=/?tuning=/
// ?variant= override, window.__studio drives knobs from the Studio page, and
// `hot` carries the live world across code edits (snapshot → restore).
// Production builds behave like runBrowser (the endpoints just aren't there).
runStudio(updriftGame, mount, { variants, hot: import.meta.hot });
// Literal self-accept: Vite marks HMR boundaries by scanning source, so this
// line (not a call inside runStudio) is what prevents a full reload on edit.
import.meta.hot?.accept();
