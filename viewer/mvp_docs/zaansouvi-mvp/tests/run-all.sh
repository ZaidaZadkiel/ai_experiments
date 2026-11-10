#!/bin/bash
# Runs every MVP 2 check, in an order that works on any data/, an empty one included. Prints one line per check;
# exits 1 if any failed. Each check's full output goes to <output folder>/<check>.txt, with the browser steps'
# screenshots beside it.
# Usage, from anywhere:  bash tests/run-all.sh [<output folder>]          (default: a new folder in the system temp)
#                        bash tests/run-all.sh --no-browser [<folder>]    (the five scripted checks only)
# The browser steps use the real data/ (tests/viewer/browse/README.md): stop your own Viewer first.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BROWSER=1; [ "$1" = "--no-browser" ] && { BROWSER=0; shift; }
OUT="${1:-$(mktemp -d -t zaansouvi-checks-XXXXXX)}"; mkdir -p "$OUT"
FAILED=0
check() {  # check <name> <command...>
  local n="$1"; shift
  "$@" > "$OUT/$n.txt" 2>&1; local s=$?
  [ $s -eq 0 ] && echo "ok    $n" || { echo "FAIL  $n (exit $s, see $OUT/$n.txt)"; FAILED=1; }
}

cd "$ROOT" || exit 2
check ts-program            node tests/ts-program/check.mjs
check ts-program-definitions node tests/ts-program/check-definitions.mjs
check runner                node tests/runner/run-tests.mjs
check viewer-server         node tests/viewer/check-server.mjs
check viewer-model          node tests/viewer/check-model.mjs

if [ $BROWSER -eq 1 ]; then
  if pgrep -f "viewer/server/src/server.ts" >/dev/null; then
    echo "a Viewer is running on this data/: stop it, then run again (or use --no-browser)"; exit 2
  fi
  B="$ROOT/tests/viewer/browse"
  # The sources the steps need: MVP 2's, MVP 1's frozen one (the steps that name no source use its IDs), a copy of the
  # Runner's code named "runner" (problems.json), and the status source mvp2.json adds. Fixed paths, recreated each
  # time, so the Viewer's list of sources doesn't grow with every run.
  SRCS=/tmp/zaansouvi-sources; rm -rf "$SRCS"; mkdir -p "$SRCS/runner"
  (cd "$ROOT/app/runner" && tar cf - --exclude=node_modules .) | (cd "$SRCS/runner" && tar xf -)
  bash "$B/make-status-source.sh" > /dev/null
  python3 -I "$B/seed.py" "$OUT/seed-steps.json" "$SRCS/runner" "$ROOT/test-source-mvp2" "$ROOT/test-source"
  browse() { local n="$1"; mkdir -p "$OUT/browse-$n"; check "browse-$n" timeout 300 bash "$B/browse.sh" "$2" "$OUT/browse-$n"; }
  browse seed "$OUT/seed-steps.json"
  # MVP 1's source current: the steps that name no source, then the ones that switch to test-source or runner and back.
  for n in activity-count contains enter-marks frame-views layout-repeat problem-items selection zoom-controls problems tools-pane; do
    browse "$n" "$B/$n.json"
  done
  # The steps that open test-source-mvp2 themselves.
  for n in builtins folders frame-notes frame-notes-run frame-title members range-text subfolders mvp2; do
    browse "$n" "$B/$n.json"
  done
  check browse-b7 timeout 300 bash "$B/b7.sh"
fi

echo "output: $OUT"
exit $FAILED
