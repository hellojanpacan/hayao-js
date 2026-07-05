import { runStudio } from '@hayao';
import { thornspireGame } from './game';

runStudio(thornspireGame, document.getElementById('app')!, { hot: import.meta.hot });
import.meta.hot?.accept();
