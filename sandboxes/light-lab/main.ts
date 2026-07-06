import { runStudio } from '@hayao';
import { lightLabGame } from './light-lab';

const mount = document.getElementById('app')!;
runStudio(lightLabGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
