import { runStudio } from '@hayao';
import { physicsLabGame } from './physics-lab';

const mount = document.getElementById('app')!;
// runStudio = runBrowser + session recording + ?seed=/?tuning= overrides +
// window.__studio (setKnob / annotate / flush) for the Studio shell page.
const handle = runStudio(physicsLabGame, mount);

// ── Throwaway knob panel (M1 dogfood) ────────────────────────────────────────
// Proves the tuning loop end to end through the real API: slider → setKnob →
// rebuild-with-carryover → sim re-reads values in onReady → recorded as a knob
// event in the session. Replaced by the Studio leva panel in M5.
const panel = document.createElement('div');
panel.style.cssText =
  'position:fixed;right:12px;top:12px;z-index:40;background:#f8f3e9;border:1px solid #ddd3bf;border-radius:8px;padding:10px 14px;font:13px ui-monospace,monospace;color:#242019;display:grid;gap:6px;';
panel.innerHTML = '<b style="font-size:11px;letter-spacing:.08em">TUNING (throwaway)</b>';
const values = handle.knobValues();
for (const k of physicsLabGame.tuning?.knobs ?? []) {
  if (k.type !== 'number') continue;
  const row = document.createElement('label');
  row.style.cssText = 'display:grid;grid-template-columns:82px 1fr 46px;gap:8px;align-items:center;';
  const out = document.createElement('span');
  out.textContent = String(values[k.key]);
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(k.min ?? 0);
  input.max = String(k.max ?? 100);
  input.step = String(k.step ?? 1);
  input.value = String(values[k.key]);
  input.addEventListener('change', () => {
    out.textContent = input.value;
    handle.setKnob(k.key, Number(input.value));
  });
  row.append(Object.assign(document.createElement('span'), { textContent: k.key }), input, out);
  panel.append(row);
}
document.body.append(panel);
