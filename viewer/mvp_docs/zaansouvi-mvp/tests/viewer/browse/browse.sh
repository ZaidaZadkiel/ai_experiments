#!/bin/bash
# Drive the Viewer's page in headless Firefox: start the Viewer on port 4399 and Firefox with a fresh, empty profile,
# run a drive.py steps file (every "go" URL is replaced by the Viewer's URL with its token), then stop both.
# Usage: browse.sh <steps.json> [<output folder for screenshots>]
# Needs: Firefox, Python 3, the Viewer built (app/viewer: npm install, npm run build) and a source added with a run.
HERE="$(cd "$(dirname "$0")" && pwd)"
VIEWER="$(cd "$HERE/../../../app/viewer" && pwd)"
STEPS="$(realpath "$1")" || exit 2
WORK="$(mktemp -d)"
OUT="$(realpath "${2:-$WORK}")"
PROFILE="$WORK/ffprofile"
# Firefox's own temporary files, the tmp-*.xpi it writes on every start among them, go into the work folder, not /tmp, so
# they are removed with it (405 of them, 1.7 GB, had built up in /tmp, 2026-11-10).
FFTMP="$WORK/fftmp"
PORT=4399

# Stop by process ID: a pattern given to pkill -f would also match this shell's own command line.
stop_ff() { for p in $(pgrep -f -- "--profile $PROFILE"); do kill "$p" 2>/dev/null; done; }
stop_viewer() { for p in $(pgrep -f -- "server.ts --port $PORT"); do kill "$p" 2>/dev/null; done; }
# Every exit cleans up, a failed or interrupted run included: Firefox and the Viewer stopped, and the work folder, which
# holds the Viewer's output with its token, removed, keeping only screenshots taken there.
cleanup() {
  stop_ff; stop_viewer
  rm -rf "$PROFILE" "$FFTMP" "$WORK/view.out" "$WORK/steps.json"
  if [ "$OUT" = "$WORK" ]; then rmdir "$WORK" 2>/dev/null; else rm -rf "$WORK"; fi # kept only if it holds screenshots
}
trap cleanup EXIT
trap 'exit 130' INT TERM
stop_viewer
mkdir -p "$PROFILE" "$FFTMP" "$OUT"

cd "$VIEWER" || exit 1
./zaansouvi-view --port "$PORT" > "$WORK/view.out" 2>&1 &
for i in $(seq 40); do grep -q token "$WORK/view.out" && break; sleep 0.3; done
URL=$(grep -o 'http://[^ ]*' "$WORK/view.out" | head -1)
[ -n "$URL" ] || { echo "the Viewer didn't start:"; cat "$WORK/view.out"; stop_viewer; exit 1; }

# A copy of the steps with every "go" URL filled in; the token is never written into the steps file itself.
python3 -I -c 'import json,sys; s=json.load(open(sys.argv[1])); [st.__setitem__(1, sys.argv[2]) for st in s if st[0] == "go"]; json.dump(s,open(sys.argv[3],"w"))' \
  "$STEPS" "$URL" "$WORK/steps.json"

# A fresh profile every time: a profile left locked by an earlier Firefox makes Marionette unreachable.
TMPDIR="$FFTMP" firefox --headless --marionette --profile "$PROFILE" --no-remote >/dev/null 2>&1 &
cd "$OUT" && python3 -I "$HERE/drive.py" "$WORK/steps.json"
status=$?
echo "screenshots, if any: $OUT"
exit $status
