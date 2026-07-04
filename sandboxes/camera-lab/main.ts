import { runBrowser } from '@hayao';
import { cameraLabGame } from './camera-lab';

const mount = document.getElementById('app')!;
runBrowser(cameraLabGame, mount);
