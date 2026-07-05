import { runStudio } from '@hayao';
import { duskveilGame } from './game';

runStudio(duskveilGame, document.getElementById('app')!, { renderer: 'canvas', hot: import.meta.hot });
import.meta.hot?.accept();
