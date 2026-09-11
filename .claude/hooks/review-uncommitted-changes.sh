#!/bin/bash
# Stop hook: if uncommitted changes exist and haven't been reviewed yet,
# block the turn from ending and tell Claude to run the code-reviewer
# subagent on the diff before finishing.
#
# Usage:
#   review-uncommitted-changes.sh            check the diff, block if unreviewed
#   review-uncommitted-changes.sh --record    mark the current diff as reviewed
set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}"

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

# Hash stdin with whatever's available — shasum (macOS) or sha256sum (most
# Linux distros) — so the marker works across contributors' machines.
hash_stdin() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum | cut -d' ' -f1
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 | cut -d' ' -f1
  else
    cksum | cut -d' ' -f1
  fi
}

# git diff HEAD fails on a repo with no commits yet; treat that as "no
# tracked-file diff" rather than letting `set -e` abort the whole script.
diff_against_head() {
  git rev-parse --verify -q HEAD >/dev/null && git diff HEAD || true
}

current_diff_hash() {
  { diff_against_head; git status --porcelain; } | hash_stdin
}

marker=".claude/.last-reviewed-diff"

if [ "${1:-}" = "--record" ]; then
  current_diff_hash > "$marker"
  exit 0
fi

changes="$(git status --porcelain)"
if [ -z "$changes" ]; then
  exit 0
fi

current_hash="$(current_diff_hash)"
last_hash=""
[ -f "$marker" ] && last_hash="$(cat "$marker")"

if [ "$current_hash" = "$last_hash" ]; then
  exit 0
fi

cat <<EOF
{
  "decision": "block",
  "reason": "There are uncommitted changes that haven't been reviewed. Before ending this turn: (1) Invoke the code-reviewer subagent (.claude/agents/code-reviewer.md) via the Task tool, giving it the current diff ('git diff HEAD' plus any untracked files from 'git status --porcelain') to review. (2) Fix every concrete issue it reports, running 'npx tsc --noEmit', 'npx tsc -p tsconfig.test.json --noEmit', and 'npm test' to confirm the fixes are green and nothing else broke. (3) Record that this diff has been reviewed by running exactly: bash .claude/hooks/review-uncommitted-changes.sh --record (4) Then print exactly one line — 'Reviewer found N issues, fixed M' — with no other commentary, and end your turn. Do not skip step 3 or this review will re-trigger on every stop."
}
EOF
