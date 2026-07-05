import { runStudio } from '@hayao';
import { vellgroveGame } from './game';

runStudio(vellgroveGame, document.getElementById('app')!, { hot: import.meta.hot });
import.meta.hot?.accept();
