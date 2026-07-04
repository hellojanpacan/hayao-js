import { runBrowser } from '@hayao';
import { synthLabGame } from './synth-lab';

const mount = document.getElementById('app')!;
runBrowser(synthLabGame, mount);
