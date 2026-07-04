import { runBrowser } from '@hayao';
import { updriftGame } from './game';

const mount = document.getElementById('app')!;
runBrowser(updriftGame, mount);
