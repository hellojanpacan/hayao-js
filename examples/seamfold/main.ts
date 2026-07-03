import { runBrowser } from '@hayao';
import { seamfoldGame } from './game';

const mount = document.getElementById('app')!;
runBrowser(seamfoldGame, mount);
