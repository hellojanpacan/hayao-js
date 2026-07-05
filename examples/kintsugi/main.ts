import { runStudio } from '@hayao';
import { kintsugiGame } from './game';

const mount = document.getElementById('app')!;
runStudio(kintsugiGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
