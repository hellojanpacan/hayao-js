import { runBrowser } from '@hayao';
import { bramblefallGame } from './game';

runBrowser(bramblefallGame, document.getElementById('app')!, { renderer: 'canvas' });
