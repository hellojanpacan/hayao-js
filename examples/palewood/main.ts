import { runStudio } from '@hayao';
import { palewoodGame } from './game';

runStudio(palewoodGame, document.getElementById('app')!, { renderer: 'canvas', hot: import.meta.hot });
import.meta.hot?.accept();
