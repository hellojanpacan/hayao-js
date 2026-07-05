import { runStudio } from '@hayao';
import { emberwakeGame } from './game';

// Canvas backend: hundreds of moving primitives is where retained-mode SVG
// stops being the right projection.
runStudio(emberwakeGame, document.getElementById('app')!, { renderer: 'canvas', hot: import.meta.hot });
import.meta.hot?.accept();
