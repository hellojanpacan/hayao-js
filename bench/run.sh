#!/usr/bin/env bash
# bench/run.sh <spec.md> — one full bench run: worktree → clean claude -p session → score.
# Env: CLAUDE_BIN (default: claude), BENCH_MODEL (e.g. opus), BENCH_WORKTREE_DIR (default /tmp/hayao-bench),
#      BENCH_MAX_TURNS (default 200), BENCH_KEEP_WORKTREE=1 to skip the removal hint.
set -euo pipefail

SPEC=${1:?usage: bench/run.sh bench/specs/NN-slug.md}
REPO=$(cd "$(dirname "$0")/.." && pwd)
SPEC=$(cd "$(dirname "$SPEC")" && pwd)/$(basename "$SPEC")
SLUG=$(head -1 "$SPEC" | sed -n 's/^slug:[[:space:]]*//p')
[ -n "$SLUG" ] || { echo "spec must start with 'slug: <slug>'" >&2; exit 1; }

CLAUDE_BIN=${CLAUDE_BIN:-claude}
command -v "$CLAUDE_BIN" >/dev/null || {
  echo "claude CLI not found. Install + log in, or set CLAUDE_BIN." >&2
  echo "Alternatively run any fresh agent session with cwd=<worktree> and the" >&2
  echo "prompt below, then score with: npx tsx bench/collect.ts --worktree <wt> --slug $SLUG" >&2
  exit 1
}

ID=$(date +%Y%m%d-%H%M%S)-$SLUG
WT=${BENCH_WORKTREE_DIR:-/tmp/hayao-bench}/$ID
mkdir -p "$(dirname "$WT")" "$REPO/bench/runs"

git -C "$REPO" worktree add --detach "$WT" HEAD >/dev/null
ln -s "$REPO/node_modules" "$WT/node_modules"
echo "worktree: $WT (HEAD $(git -C "$WT" rev-parse --short HEAD))"

PROMPT=$(sed "s/{{SLUG}}/$SLUG/g" "$REPO/bench/prompt.md"; echo; cat "$SPEC")
LOG="$REPO/bench/runs/$ID.stream.jsonl"

START=$(date +%s)
set +e
(cd "$WT" && "$CLAUDE_BIN" -p "$PROMPT" \
  --output-format stream-json --verbose \
  --max-turns "${BENCH_MAX_TURNS:-200}" \
  ${BENCH_MODEL:+--model "$BENCH_MODEL"} \
  --dangerously-skip-permissions > "$LOG" 2> "$REPO/bench/runs/$ID.stderr.log")
AGENT_EXIT=$?
set -e
WALL=$(( $(date +%s) - START ))
echo "agent session done (exit=$AGENT_EXIT, ${WALL}s). scoring…"

npx tsx "$REPO/bench/collect.ts" \
  --worktree "$WT" --slug "$SLUG" --spec "$SPEC" --log "$LOG" \
  --wall "$WALL" --agent-exit "$AGENT_EXIT" \
  --out "$REPO/bench/runs/$ID.json"

if [ "${BENCH_KEEP_WORKTREE:-}" != "1" ]; then
  echo "inspect the worktree, then: git -C $REPO worktree remove --force $WT"
fi
