// Browser wiring: the DOM sidebar is pure VIEW + intent. Buttons never mutate
// the economy — they press input actions, which the sim consumes next step, so
// clicking lives in the same deterministic input log as the keyboard.

import { runBrowser } from '@hayao';
import { cost, unlockedCount, TIERS, type EconomyState } from './logic';
import { lfState, lumenForgeGame } from './game';

const mount = document.getElementById('app')!;
const handle = runBrowser(lumenForgeGame, mount);

const panel = document.createElement('div');
panel.className = 'lf-panel';
panel.innerHTML = `
  <h1>Lumen Forge</h1>
  <div class="lf-motes"><span id="lf-motes">0</span> motes</div>
  <div class="lf-rate" id="lf-rate">0/s</div>
  <button class="lf-forge" id="lf-forge">Forge a mote ✦</button>
  <div id="lf-shop"></div>
`;
document.getElementById('ui')!.appendChild(panel);

panel.querySelector('#lf-forge')!.addEventListener('click', () => handle.input.press('forge'));

const rows: HTMLElement[] = TIERS.map((t, i) => {
  const row = document.createElement('button');
  row.className = 'lf-tier';
  row.innerHTML = `<b>${t.name}</b><i>${t.desc}</i><span class="lf-cost"></span><span class="lf-owned"></span>`;
  row.addEventListener('click', () => handle.input.press(`buy-${i}`));
  row.style.display = 'none';
  panel.querySelector('#lf-shop')!.appendChild(row);
  return row;
});

const fmt = (n: number): string => {
  if (n < 1_000) return n.toFixed(n < 10 ? 1 : 0);
  const units = ['k', 'M', 'B', 'T'];
  let u = -1;
  while (n >= 1_000 && u < units.length - 1) {
    n /= 1_000;
    u++;
  }
  return `${n.toFixed(1)}${units[u]}`;
};

setInterval(() => {
  const s: EconomyState = lfState(handle.world);
  const probe = handle.world.probe() as { perSec: number };
  panel.querySelector('#lf-motes')!.textContent = fmt(s.motes);
  panel.querySelector('#lf-rate')!.textContent = `${fmt(probe.perSec)}/s · forged by hand ${s.clicks}×`;
  const visible = unlockedCount(s);
  rows.forEach((row, i) => {
    row.style.display = i < visible ? '' : 'none';
    if (i >= visible) return;
    const c = cost(s, i);
    (row.querySelector('.lf-cost') as HTMLElement).textContent = `${fmt(c)} ✦`;
    (row.querySelector('.lf-owned') as HTMLElement).textContent = s.owned[i] ? `×${s.owned[i]}` : '';
    (row as HTMLButtonElement).disabled = s.motes < c;
  });
}, 100);
