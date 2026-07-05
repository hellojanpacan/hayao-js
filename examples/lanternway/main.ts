import { runStudio } from '@hayao';
import { lanternwayGame } from './game';

const mount = document.getElementById('app')!;
runStudio(lanternwayGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
