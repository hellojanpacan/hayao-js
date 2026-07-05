import { runStudio } from '@hayao';
import { vantageGame } from './game';

runStudio(vantageGame, document.getElementById('app')!, { hot: import.meta.hot });
import.meta.hot?.accept();
