import { runBrowser } from '@hayao';
import { emberwakeGame } from './game';

// Canvas backend: hundreds of moving primitives is where retained-mode SVG
// stops being the right projection.
runBrowser(emberwakeGame, document.getElementById('app')!, { renderer: 'canvas' });
