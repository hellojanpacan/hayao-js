import { runStudio } from '@hayao';
import { sproutveilGame } from './game';

runStudio(sproutveilGame, document.getElementById('app')!, { hot: import.meta.hot });
import.meta.hot?.accept();
