// Fernclash entry: one game, three ways to play it.
//  · Local duel — two players, one keyboard (plain runBrowser).
//  · Host / Join — real lockstep netplay between browser tabs over
//    BroadcastChannel (open the page twice), or across machines via the
//    WebSocket relay (`npm run relay`, then ?ws=ws://host:8787).
// Pick a room with ?room=name (default 'fernclash').

import {
  BroadcastChannelTransport,
  connectWebSocket,
  hideScreen,
  runBrowser,
  runBrowserNet,
  showScreen,
  type NetGameHandle,
  type Transport,
} from '@hayao';
import { FC_LOCAL_INPUT_MAP, fernclashGame } from './game';

const mount = document.getElementById('app')!;
const params = new URLSearchParams(location.search);
const room = params.get('room') ?? 'fernclash';
const wsUrl = params.get('ws'); // e.g. ws://localhost:8787

async function makeTransport(): Promise<Transport> {
  if (wsUrl) return connectWebSocket(`${wsUrl.replace(/\/$/, '')}/${room}`);
  return new BroadcastChannelTransport(room);
}

function startLocal(): void {
  hideScreen();
  runBrowser({ ...fernclashGame, inputMap: FC_LOCAL_INPUT_MAP }, mount);
}

async function startNet(role: 'host' | 'join'): Promise<void> {
  hideScreen();
  const transport = await makeTransport();
  let handle: NetGameHandle;
  const lobby = (status: string) => {
    if (handle?.game) return; // in game — status lands in the console instead
    showScreen({
      title: role === 'host' ? 'Hosting Fernclash' : 'Joining Fernclash',
      body: `${status}\nroom “${room}” · ${wsUrl ? 'relay' : 'this browser, second tab'}`,
      actions:
        role === 'host'
          ? [{ label: `Start with ${handle?.roster.length ?? 1} player(s)`, primary: true, onSelect: () => { hideScreen(); handle.start(); } }]
          : [],
    });
  };
  handle = runBrowserNet(fernclashGame, mount, {
    transport,
    role,
    config: { mode: 'lockstep', inputDelay: 2 },
    maxPlayers: 2,
    onStatus: (status) => {
      console.log(`[fernclash net] ${status}`);
      if (!handle?.game) lobby(status);
      else hideScreen();
    },
    onDesync: (info) => {
      console.error('[fernclash net] DESYNC', info);
      showScreen({ title: 'Desync detected', body: `frame ${info.frame} — the input log was dumped to the console.`, actions: [] });
    },
  });
  lobby(role === 'host' ? 'waiting for a second tab…' : 'looking for a host…');
}

showScreen({
  title: 'Fernclash',
  body: 'Two circles, one fern ring. Push the rival out — first to three rounds.',
  actions: [
    { label: 'Local duel (one keyboard)', primary: true, onSelect: startLocal },
    { label: 'Host netplay', onSelect: () => void startNet('host') },
    { label: 'Join netplay', onSelect: () => void startNet('join') },
  ],
});
