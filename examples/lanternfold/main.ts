import { runStudio } from '@hayao';
import { lanternfoldGame } from './game';

const mount = document.getElementById('app')!;
runStudio(lanternfoldGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
