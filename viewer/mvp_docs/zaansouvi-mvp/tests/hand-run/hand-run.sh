#!/usr/bin/env bash
# TEST-08: the Runner can be replaced by a user's own script (toolset.md, section 2; FND-58).
# Runs M1, M2 and M3 by hand, using only the tool contract (JSON on standard input, exit codes, output files),
# with the files in REVERSE file ID order on purpose, then checks that every tool output is byte-identical to
# the Runner's. Uses a temporary folder as the hand run's working folder; every store, and with it each tool's
# last_run.json, is inside it (toolset.md 4.5). Needs jq. First runs the Runner on test-source/, so data/ holds a
# current real run.
# Usage: bash tests/hand-run/hand-run.sh        Exit code 0 when every output matches.

set -u
ROOT=$(cd -- "$(dirname -- "$0")/../.." && pwd)
SRC="$ROOT/test-source"
TOOLS="$ROOT/app/tools"
WORK=$(mktemp -d)
FAIL=0
trap 'rm -rf "$WORK"' EXIT

echo "Runner: a real run on test-source"
(cd "$ROOT/app/runner" && ./zaansouvi-run "$SRC" > "$WORK/events.jsonl") || { echo "FAIL: the Runner run failed"; exit 1; }

# ---- The hand run: what a user's script might look like. Nothing below uses the Runner or its data.
cd "$WORK"
echo "Hand run: M1 per file, in reverse order"
for f in $(cd "$SRC" && find src -name '*.ts' | LC_ALL=C sort -r); do
  jq -n --arg r "$SRC" --arg f "$f" '{source_root: $r, file_id: $f, store_path: "zaansouvi/tools/file-symbols"}' \
    | "$TOOLS/file-symbols/file-symbols" --stdin > /dev/null || { echo "FAIL: M1 on $f"; exit 1; }
done
# M1's whole output files, merged in reverse order, extra keys and all: the tools take what they need.
M1_OUT=$(ls -r zaansouvi/tools/file-symbols/output/*.json)
echo "Hand run: M2 on the merged records"
jq -s '{symbols: map(.symbols) | add, references: map(.references) | add, store_path: "zaansouvi/tools/cross-file-links"}' $M1_OUT \
  | "$TOOLS/cross-file-links/cross-file-links" --stdin > /dev/null || { echo "FAIL: M2"; exit 1; }
echo "Hand run: M3 on whole M1 output files merged as they are"
jq -s '(map(.symbols) | add) as $s | .[0] + {symbols: $s, store_path: "zaansouvi/tools/symbol-scope"}' $M1_OUT \
  | "$TOOLS/symbol-scope/symbol-scope" --stdin > /dev/null || { echo "FAIL: M3"; exit 1; }

# ---- Every output file the Runner's run produced must exist in the hand run, byte for byte.
echo "Comparing outputs"
for t in file-symbols cross-file-links symbol-scope; do
  for f in "$ROOT/data/tools/$t/output/"*.json; do
    name=$(basename "$f")
    if cmp -s "$f" "zaansouvi/tools/$t/output/$name"; then echo "  ok    $t/$name"; else echo "  FAIL  $t/$name differs or is missing"; FAIL=1; fi
  done
done
[ "$FAIL" -eq 0 ] && echo "PASS: the hand run's outputs are byte-identical to the Runner's" || echo "FAIL"
exit "$FAIL"
