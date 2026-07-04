import { runBrowser } from '@hayao';
import { particleStudioGame } from './particle-studio';

const mount = document.getElementById('app')!;
runBrowser(particleStudioGame, mount);
