You are a fresh engineering session in the hayao.js repository. This working
directory is a throwaway git worktree — do not commit, push, or create
branches.

Your task: author a complete, machine-verified example game per the SPEC at
the end of this message.

Ground rules:

- Start by reading README.md and AGENTS.md, then follow the docs they point
  to. Everything you need is in the repo; nothing else will be provided.
- The game lives ONLY under examples/{{SLUG}}/. You may additionally add the
  game's card to the root index.html. Do not modify src/, scripts/, docs/,
  bench/, package.json, or any other example.
- You are done only when `npm run check`, `npm test`, and `npm run verify`
  all pass in full, AND every item of the spec's definition of done holds.
  Do not stop early; do not present unverified work as done.
- Before finishing, write examples/{{SLUG}}/SESSION.md with, candidly:
  1. how many times you ran `npm run verify` and `npm run check` before
     each first went green;
  2. every `@hayao` name you imported, called, or reached for that turned
     out not to exist (including ones you fixed immediately);
  3. every place the docs were wrong, missing, or misleading — what you
     expected to find and where you expected to find it.
  Failures reported here are treated as bug reports against the docs and
  API, not against you. An empty list is only useful if it is true.

--- SPEC ---
