import { runStudio } from '@hayao';
import { shardAscentGame } from './game';

runStudio(shardAscentGame, document.getElementById('app')!, { hot: import.meta.hot });
import.meta.hot?.accept();
