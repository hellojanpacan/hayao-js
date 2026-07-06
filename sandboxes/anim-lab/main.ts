import { runStudio } from '@hayao';
import { animLabGame } from './anim-lab';

const mount = document.getElementById('app')!;
runStudio(animLabGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
