import { runStudio } from '@hayao';
import { cadenceGame } from './game';

runStudio(cadenceGame, document.getElementById('app')!, { hot: import.meta.hot });
import.meta.hot?.accept();
