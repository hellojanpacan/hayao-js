import { runStudio } from '@hayao';
import { particleStudioGame } from './particle-studio';

const mount = document.getElementById('app')!;
runStudio(particleStudioGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
