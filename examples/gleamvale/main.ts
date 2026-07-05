import { runStudio } from '@hayao';
import { gleamvaleGame } from './game';

runStudio(gleamvaleGame, document.getElementById('app')!, { hot: import.meta.hot });
import.meta.hot?.accept();
