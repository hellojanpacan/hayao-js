import { runBrowser } from '@hayao';
import { sokobanGame } from './game';

const mount = document.getElementById('app')!;
runBrowser(sokobanGame, mount);
