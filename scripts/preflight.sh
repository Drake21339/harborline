#!/usr/bin/env bash
set -u

pass_count=0
warn_count=0
fail_count=0

pass() { pass_count=$((pass_count + 1)); printf 'PASS: %s\n' "$1"; }
warn() { warn_count=$((warn_count + 1)); printf 'WARN: %s\n' "$1"; }
fail() { fail_count=$((fail_count + 1)); printf 'FAIL: %s\n' "$1"; }
finish() {
  if [ "$fail_count" -eq 0 ]; then
    printf 'PREFLIGHT: OK (%s PASS, %s WARN, %s FAIL)\n' "$pass_count" "$warn_count" "$fail_count"
    exit 0
  fi
  printf 'PREFLIGHT: FAIL (%s PASS, %s WARN, %s FAIL)\n' "$pass_count" "$warn_count" "$fail_count"
  exit 1
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MARKER="${REPO_ROOT}/package.json"
UPDATE_SHAPE=0
[ "${1:-}" = "--update-shape" ] && UPDATE_SHAPE=1

if [ -f "$MARKER" ]; then
  pass "repo identity confirmed at $REPO_ROOT"
else
  fail "you are not where you think you are: missing $MARKER"
fi

if ! command -v "git" >/dev/null 2>&1; then
  fail "git missing; cannot inspect checkout"
elif git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  branch="$(git -C "$REPO_ROOT" branch --show-current 2>/dev/null || true)"
  [ -n "$branch" ] || branch="(detached HEAD)"
  pass "branch: $branch"
  git_dir="$(git -C "$REPO_ROOT" rev-parse --git-dir 2>/dev/null || true)"
  git_common="$(git -C "$REPO_ROOT" rev-parse --git-common-dir 2>/dev/null || true)"
  if [ "$git_dir" != "$git_common" ]; then
    pass "checkout: linked worktree ($git_dir -> $git_common)"
  else
    pass "checkout: primary worktree ($git_dir)"
  fi
  dirty_count="$(git -C "$REPO_ROOT" status --porcelain 2>/dev/null | wc -l | tr -d '[:space:]')"
  if [ "$dirty_count" -gt 0 ]; then
    warn "working tree dirty: $dirty_count file(s)"
  else
    pass "working tree clean"
  fi
  last_commit="$(git -C "$REPO_ROOT" log --oneline -1 2>/dev/null || true)"
  [ -n "$last_commit" ] && pass "last commit: $last_commit" || fail "last commit unavailable"
else
  fail "git repo missing at $REPO_ROOT"
fi

shape_file="${SCRIPT_DIR}/.preflight-shape"
shape_now="$({ find "$REPO_ROOT" -mindepth 1 -maxdepth 1 -type d ! -name '.*' ! -name 'build*' ! -name 'node_modules' ! -name '__pycache__' ! -name '.venv' ! -name 'venv' -exec basename {} \; | sed 's/^/dir:/'; for d in tests test Tests; do [ -d "${REPO_ROOT}/${d}" ] && printf 'tests:%s\n' "$d"; done; find "${REPO_ROOT}/src" -maxdepth 1 -type d -name 'test*' -exec basename {} \; 2>/dev/null | sed 's#^#tests:src/#'; for f in CMakeLists.txt package.json pyproject.toml requirements.txt Makefile makefile pnpm-lock.yaml package-lock.json yarn.lock vite.config.js vite.config.ts svelte.config.js tsconfig.json AGENTS.md CLAUDE.md README.md; do [ -f "${REPO_ROOT}/${f}" ] && printf 'file:%s\n' "$f"; done; if [ -f "${REPO_ROOT}/CMakeLists.txt" ]; then sed -n '/juce_add_plugin/,/)/p' "${REPO_ROOT}/CMakeLists.txt" | tr '\n' ' ' | sed -n 's/.*FORMATS[[:space:]]*\([^)]*\).*/cmake:formats:\1/p' | sed 's/[[:space:]][[:space:]]*/ /g'; fi; if [ -f "${REPO_ROOT}/package.json" ]; then sed -n '/"scripts"[[:space:]]*:/,/}/p' "${REPO_ROOT}/package.json" | sed -n 's/^[[:space:]]*"\([^"]*\)"[[:space:]]*:.*/npm:script:\1/p'; fi; } | LC_ALL=C sort)"
shape_count="$(printf '%s\n' "$shape_now" | sed '/^$/d' | wc -l | tr -d '[:space:]')"
if [ "$UPDATE_SHAPE" -eq 1 ]; then
  printf '%s\n' "$shape_now" > "$shape_file"
  pass "shape recorded ($shape_count facts)"
elif [ ! -f "$shape_file" ]; then
  warn "repo shape sidecar missing: run $0 --update-shape"
elif ! cmp -s "$shape_file" <(printf '%s\n' "$shape_now"); then
  added="$(comm -13 "$shape_file" <(printf '%s\n' "$shape_now") | paste -sd ',' - | cut -c1-160)"
  removed="$(comm -23 "$shape_file" <(printf '%s\n' "$shape_now") | paste -sd ',' - | cut -c1-160)"
  warn "repo shape changed (added: ${added:-none}; removed: ${removed:-none}) -- review preflight + DoD"
else
  pass "repo shape unchanged ($shape_count facts)"
fi


PACKAGE_JSON="${REPO_ROOT}/package.json"

command -v "node" >/dev/null 2>&1 && pass "node: $(command -v "node")" || fail "required tool missing: node"
command -v "npm" >/dev/null 2>&1 && pass "npm: $(command -v "npm")" || fail "required tool missing: npm"
for script_name in "check" "test" "build"; do
  if grep -q "\"$script_name\"[[:space:]]*:" "$PACKAGE_JSON" 2>/dev/null; then
    pass "package.json script exists: $script_name"
  else
    fail "package.json missing required script: $script_name"
  fi
done
[ -d "${REPO_ROOT}/node_modules" ] && pass "node_modules present" || warn "node_modules missing: run npm install"

finish

