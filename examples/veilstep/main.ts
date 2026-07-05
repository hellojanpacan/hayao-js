import { runStudio } from '@hayao';
import { veilstepGame } from './game';

runStudio(veilstepGame, document.getElementById('app')!, { hot: import.meta.hot });
import.meta.hot?.accept();
