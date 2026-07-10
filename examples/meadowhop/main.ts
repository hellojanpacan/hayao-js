import { runStudio } from '@hayao';
import { meadowhopGame } from './game';

const mount = document.getElementById('app')!;
runStudio(meadowhopGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
