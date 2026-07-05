import { runStudio } from '@hayao';
import { driftlightGame } from './game';

const mount = document.getElementById('app')!;
runStudio(driftlightGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
