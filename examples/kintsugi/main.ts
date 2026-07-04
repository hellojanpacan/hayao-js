import { runBrowser } from '@hayao';
import { kintsugiGame } from './game';

const mount = document.getElementById('app')!;
runBrowser(kintsugiGame, mount);
