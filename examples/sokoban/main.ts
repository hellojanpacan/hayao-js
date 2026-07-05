import { runStudio } from '@hayao';
import { sokobanGame } from './game';

const mount = document.getElementById('app')!;
runStudio(sokobanGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
