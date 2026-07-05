import { runStudio } from '@hayao';
import { rookspireGame } from './game';

runStudio(rookspireGame, document.getElementById('app')!, { hot: import.meta.hot });
import.meta.hot?.accept();
