import { runBrowser } from '@hayao';
import { driftlightGame } from './game';

const mount = document.getElementById('app')!;
runBrowser(driftlightGame, mount);
