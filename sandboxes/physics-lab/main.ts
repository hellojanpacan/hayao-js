import { runWorkshop } from '@hayao';
import { physicsLabGame } from './physics-lab';
import { variants } from './variants';

const mount = document.getElementById('app')!;
// runWorkshop = runBrowser + session recording + ?seed=/?tuning=/?variant=
// overrides + window.__workshop for the Workshop page (/workshop/), whose leva panel
// drives the declared knobs. Play this gym through the Workshop to tune it.
runWorkshop(physicsLabGame, mount, { variants, hot: import.meta.hot });
// Literal self-accept — Vite's static HMR scan needs it here, not in the lib.
import.meta.hot?.accept();
