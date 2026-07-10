import { runWorkshop } from '@hayao';
import { animLabGame } from './anim-lab';

const mount = document.getElementById('app')!;
runWorkshop(animLabGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
