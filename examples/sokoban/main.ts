import { runWorkshop } from '@hayao';
import { sokobanGame } from './game';

const mount = document.getElementById('app')!;
runWorkshop(sokobanGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
