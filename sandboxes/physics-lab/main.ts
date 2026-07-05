import { runStudio } from '@hayao';
import { physicsLabGame } from './physics-lab';
import { variants } from './variants';

const mount = document.getElementById('app')!;
// runStudio = runBrowser + session recording + ?seed=/?tuning=/?variant=
// overrides + window.__studio for the Studio page (/studio/), whose leva panel
// drives the declared knobs. Play this gym through the Studio to tune it.
runStudio(physicsLabGame, mount, { variants, hot: import.meta.hot });
// Literal self-accept — Vite's static HMR scan needs it here, not in the lib.
import.meta.hot?.accept();
