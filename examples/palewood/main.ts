import { runBrowser } from '@hayao';
import { palewoodGame } from './game';

runBrowser(palewoodGame, document.getElementById('app')!, { renderer: 'canvas' });
