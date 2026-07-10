import { runWorkshop } from '@hayao';
import { smallFlameGame } from './game';

const mount = document.getElementById('app')!;
runWorkshop(smallFlameGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
