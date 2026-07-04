import { runBrowser } from '@hayao';
import { pathfindingDemoGame } from './pathfinding-demo';

const mount = document.getElementById('app')!;
runBrowser(pathfindingDemoGame, mount);
