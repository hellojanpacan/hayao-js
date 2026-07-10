import { runStudio } from '@hayao';
import { heroLabGame } from './hero-lab';

const mount = document.getElementById('app')!;
runStudio(heroLabGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
