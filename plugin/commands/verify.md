---
description: Run the hayao verify harness (types, tests, invariants, solver proofs, determinism) and fix root causes of any failure.
argument-hint: [slug]
---

Verify this hayao project (scope: "$ARGUMENTS" if given, else everything).

Load the plugin's **verify-determinism** skill, then:

1. Run `npm run check`, `npm test`, then `npm run verify` (append the slug
   argument if the project's verify script accepts one).
2. If anything fails, diagnose per the skill's failure guide — fix the root
   cause (nondeterminism leak, missing `cosmetic`, unwinnable level), never
   weaken a check or delete a proof.
3. Report each stage's result plainly, including failures verbatim.
