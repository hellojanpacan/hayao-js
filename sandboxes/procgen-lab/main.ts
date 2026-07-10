import { runWorkshop } from '@hayao';
import { procgenLabGame } from './procgen-lab';

const mount = document.getElementById('app')!;
runWorkshop(procgenLabGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
