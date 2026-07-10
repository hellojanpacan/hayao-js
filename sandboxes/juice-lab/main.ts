import { runWorkshop } from '@hayao';
import { juiceLabGame } from './juice-lab';

const mount = document.getElementById('app')!;
runWorkshop(juiceLabGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
