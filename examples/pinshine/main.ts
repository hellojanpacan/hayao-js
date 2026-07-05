import { runStudio } from '@hayao';
import { pinshineGame } from './game';

runStudio(pinshineGame, document.getElementById('app')!, { hot: import.meta.hot });
import.meta.hot?.accept();
