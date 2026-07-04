import { runBrowser } from '@hayao';
import { juiceLabGame } from './juice-lab';

const mount = document.getElementById('app')!;
runBrowser(juiceLabGame, mount);
