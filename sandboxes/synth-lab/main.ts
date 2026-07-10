import { runWorkshop } from '@hayao';
import { synthLabGame } from './synth-lab';

const mount = document.getElementById('app')!;
runWorkshop(synthLabGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
