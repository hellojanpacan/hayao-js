import { runStudio } from '@hayao';
import { rootwardGame } from './game';

runStudio(rootwardGame, document.getElementById('app')!, { hot: import.meta.hot });
import.meta.hot?.accept();
