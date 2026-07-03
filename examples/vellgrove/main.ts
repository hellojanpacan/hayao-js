import { runBrowser } from '@hayao';
import { vellgroveGame } from './game';

runBrowser(vellgroveGame, document.getElementById('app')!);
