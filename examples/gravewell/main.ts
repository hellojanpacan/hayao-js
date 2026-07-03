import { runBrowser } from '@hayao';
import { gravewellGame } from './game';

const mount = document.getElementById('app')!;
runBrowser(gravewellGame, mount);
