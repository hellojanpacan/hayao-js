import { runStudio } from '@hayao';
import { glimmerfallGame } from './game';

runStudio(glimmerfallGame, document.getElementById('app')!, { hot: import.meta.hot });
import.meta.hot?.accept();
