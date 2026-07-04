import { runBrowser } from '@hayao';
import { emberfoldGame } from './game';

const mount = document.getElementById('app')!;
runBrowser(emberfoldGame, mount);
