import { runStudio } from '@hayao';
import { brasswickGame } from './game';

runStudio(brasswickGame, document.getElementById('app')!, { hot: import.meta.hot });
import.meta.hot?.accept();
