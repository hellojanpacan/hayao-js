import { runStudio } from '@hayao';
import { emberfoldGame } from './game';

const mount = document.getElementById('app')!;
runStudio(emberfoldGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
