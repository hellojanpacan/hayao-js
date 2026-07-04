import { runBrowser } from '@hayao';
import { lanternfoldGame } from './game';

const mount = document.getElementById('app')!;
runBrowser(lanternfoldGame, mount);
