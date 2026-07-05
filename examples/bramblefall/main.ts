import { runStudio } from '@hayao';
import { bramblefallGame } from './game';

runStudio(bramblefallGame, document.getElementById('app')!, { renderer: 'canvas', hot: import.meta.hot });
import.meta.hot?.accept();
