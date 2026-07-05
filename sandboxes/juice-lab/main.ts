import { runStudio } from '@hayao';
import { juiceLabGame } from './juice-lab';

const mount = document.getElementById('app')!;
runStudio(juiceLabGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
