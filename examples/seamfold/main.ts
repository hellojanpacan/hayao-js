import { runStudio } from '@hayao';
import { seamfoldGame } from './game';

const mount = document.getElementById('app')!;
runStudio(seamfoldGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
