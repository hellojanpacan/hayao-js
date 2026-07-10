import { runWorkshop } from '@hayao';
import { cameraLabGame } from './camera-lab';

const mount = document.getElementById('app')!;
runWorkshop(cameraLabGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
