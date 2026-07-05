import { runStudio } from '@hayao';
import { procgenLabGame } from './procgen-lab';

const mount = document.getElementById('app')!;
runStudio(procgenLabGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
