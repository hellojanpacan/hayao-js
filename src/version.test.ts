import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { VERSION } from './index';

// Guard against a stale exported version. `VERSION` drifted to 0.4.1 while the
// package was 0.4.2 (a hand-maintained constant nobody remembers to bump). This
// keeps the exported version — and docs/API.md which quotes it — honest by
// making drift a hard test failure. Runs in CI and in prepublishOnly, so a
// release can't ship a VERSION that disagrees with package.json.
describe('VERSION', () => {
  it('tracks package.json version', () => {
    const root = join(dirname(fileURLToPath(import.meta.url)), '..');
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    expect(VERSION).toBe(pkg.version);
  });
});
