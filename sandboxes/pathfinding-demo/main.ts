import { runStudio } from '@hayao';
import { pathfindingDemoGame } from './pathfinding-demo';

const mount = document.getElementById('app')!;
runStudio(pathfindingDemoGame, mount, { hot: import.meta.hot });
import.meta.hot?.accept();
