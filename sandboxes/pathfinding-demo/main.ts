import { runWorkshop } from '@hayao';
import { pathfindingDemoGame } from './pathfinding-demo';

const mount = document.getElementById('app')!;
runWorkshop(pathfindingDemoGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
