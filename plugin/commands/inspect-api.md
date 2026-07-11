---
description: Look up the REAL hayao API surface for a symbol or capability — the anti-hallucination command. Never write a hayao import without this.
argument-hint: <symbol or capability, e.g. "particles" or "assertDeterministic">
---

Find the real, installed hayao API for: $ARGUMENTS

Search in this order and report what actually exists (exact names +
signatures), noting anything you expected that is absent:

1. **Engine repo**: grep `docs/API.md` (regenerate with `npm run api` if
   exports changed this session).
2. **Consumer project**: grep `node_modules/hayao/dist/index.d.ts` — the
   installed `.d.ts` is the reference for the version actually in use.
3. If the symbol exists but its usage is unclear, read the matching
   `sandboxes/<x>-lab` in the engine repo — one primitive in isolation — not a
   whole example game.

Do not answer from memory. If nothing matches, say so and suggest the nearest
real capability.
