import { runBrowser } from '@hayao';
import { procgenLabGame } from './procgen-lab';

const mount = document.getElementById('app')!;
runBrowser(procgenLabGame, mount);
