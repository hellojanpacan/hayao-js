import { runBrowser } from '@hayao';
import { shardAscentGame } from './game';

runBrowser(shardAscentGame, document.getElementById('app')!);
