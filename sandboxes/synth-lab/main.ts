import { runStudio } from '@hayao';
import { synthLabGame } from './synth-lab';

const mount = document.getElementById('app')!;
runStudio(synthLabGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
