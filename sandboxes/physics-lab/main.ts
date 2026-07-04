import { runBrowser } from '@hayao';
import { physicsLabGame } from './physics-lab';

const mount = document.getElementById('app')!;
runBrowser(physicsLabGame, mount);
