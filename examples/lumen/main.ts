import { runStudio } from '@hayao';
import { lumenGame } from './game';

const mount = document.getElementById('app')!;
runStudio(lumenGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
