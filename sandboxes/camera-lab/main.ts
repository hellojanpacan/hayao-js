import { runStudio } from '@hayao';
import { cameraLabGame } from './camera-lab';

const mount = document.getElementById('app')!;
runStudio(cameraLabGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
