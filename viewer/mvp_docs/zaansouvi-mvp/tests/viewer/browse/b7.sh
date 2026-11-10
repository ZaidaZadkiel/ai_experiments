#!/bin/bash
# B7 through the page, for MVP 2 (06_test_plan.md, B7; FND-99): a broken input gives a clear no-go, which the Viewer shows,
# keeping the last good graph. Copies test-source-mvp2 to a temporary folder, runs it through the Viewer (good), breaks
# app.ts with a syntax error, runs again, and prints what the page shows. Adds the copy to the Viewer's sources, at a
# fixed path (/tmp/zaansouvi-sources/b7-source, recreated every time), so the list of sources doesn't grow with each run.
# Usage, from zaansouvi-mvp/: tests/viewer/browse/b7.sh [<screenshot folder>]
HERE="$(cd "$(dirname "$0")" && pwd)"
MVP="$(cd "$HERE/../../.." && pwd)"
WORK="$(mktemp -d)"
SRC=/tmp/zaansouvi-sources/b7-source
rm -rf "$SRC"; mkdir -p "$(dirname "$SRC")"
cp -r "$MVP/test-source-mvp2" "$SRC"
for f in first second; do sed "s|__SRC__|$SRC|g" "$HERE/b7-$f.json" > "$WORK/$f.json"; done
"$HERE/browse.sh" "$WORK/first.json" "${1:-$WORK}" | grep -v '^screenshots'
echo 'export class Broken {' >> "$SRC/src/app.ts"          # a syntax error: an unclosed class
"$HERE/browse.sh" "$WORK/second.json" "${1:-$WORK}" | grep -v '^screenshots'
rm -rf "$WORK"
