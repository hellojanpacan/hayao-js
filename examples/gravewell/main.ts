import { runStudio } from '@hayao';
import { gravewellGame } from './game';

const mount = document.getElementById('app')!;
runStudio(gravewellGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
