import { runWorkshop } from '@hayao';
import { particleWorkshopGame } from './particle-workshop';

const mount = document.getElementById('app')!;
runWorkshop(particleWorkshopGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
