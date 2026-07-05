import { runStudio } from '@hayao';
import { emberreignGame } from './game';

runStudio(emberreignGame, document.getElementById('app')!, { hot: import.meta.hot });
import.meta.hot?.accept();
