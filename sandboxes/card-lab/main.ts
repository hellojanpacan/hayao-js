import { runWorkshop } from '@hayao';
import { cardLabGame } from './card-lab';

const mount = document.getElementById('app')!;
runWorkshop(cardLabGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
