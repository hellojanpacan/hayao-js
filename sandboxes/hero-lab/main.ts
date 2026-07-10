import { runWorkshop } from '@hayao';
import { heroLabGame } from './hero-lab';

const mount = document.getElementById('app')!;
runWorkshop(heroLabGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
