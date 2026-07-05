import { runStudio } from '@hayao';
import { hollowdeepGame } from './game';

runStudio(hollowdeepGame, document.getElementById('app')!, { hot: import.meta.hot });
import.meta.hot?.accept();
