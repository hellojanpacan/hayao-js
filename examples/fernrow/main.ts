import { runStudio } from '@hayao';
import { fernrowGame } from './game';

runStudio(fernrowGame, document.getElementById('app')!, { hot: import.meta.hot });
import.meta.hot?.accept();
