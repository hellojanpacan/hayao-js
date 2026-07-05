import { runStudio } from '@hayao';
import { tarnholmGame } from './game';

runStudio(tarnholmGame, document.getElementById('app')!, { hot: import.meta.hot });
import.meta.hot?.accept();
