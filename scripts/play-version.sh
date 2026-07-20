#!/usr/bin/env bash
# Boot a historical Harborline tag in a sibling git worktree (leaves main checkout alone).
set -euo pipefail

TAG="${1:-}"
if [[ -z "$TAG" ]]; then
  echo "Usage: $0 <tag>   e.g. $0 v0.1.0"
  echo "Known tags:"
  git tag -l 'v*' | sed 's/^/  /' || true
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SAFE_NAME="${TAG//\//-}"
WT="$(cd "$ROOT/.." && pwd)/harborline-${SAFE_NAME}"

cd "$ROOT"

if ! git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
  echo "Tag $TAG not found locally — fetching from origin…"
  git fetch origin "refs/tags/$TAG:refs/tags/$TAG"
fi

if [[ -d "$WT" ]]; then
  echo "Worktree already exists: $WT"
else
  echo "Creating worktree $WT at $TAG"
  git worktree add "$WT" "$TAG"
fi

cd "$WT"
if [[ ! -d node_modules ]]; then
  npm install
fi

echo ""
echo "Starting Harborline $TAG from $WT"
echo "Stop with Ctrl+C. Remove worktree later:"
echo "  git -C \"$ROOT\" worktree remove \"$WT\""
echo ""
npm run dev
