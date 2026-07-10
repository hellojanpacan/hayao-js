import { runWorkshop } from '@hayao';
import { lumenGame } from './game';

const mount = document.getElementById('app')!;
runWorkshop(lumenGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
