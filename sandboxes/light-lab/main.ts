import { runWorkshop } from '@hayao';
import { lightLabGame } from './light-lab';

const mount = document.getElementById('app')!;
runWorkshop(lightLabGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
