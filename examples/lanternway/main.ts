import { runBrowser } from '@hayao';
import { lanternwayGame } from './game';

const mount = document.getElementById('app')!;
runBrowser(lanternwayGame, mount);
