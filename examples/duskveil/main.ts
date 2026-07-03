import { runBrowser } from '@hayao';
import { duskveilGame } from './game';

runBrowser(duskveilGame, document.getElementById('app')!, { renderer: 'canvas' });
