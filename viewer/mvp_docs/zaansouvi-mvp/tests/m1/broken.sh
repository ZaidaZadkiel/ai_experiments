#!/usr/bin/env bash
# Broken-input tests for M1 run by hand (06_test_plan.md, B1 to B7), plus a few extras.
# Runs in a temporary working folder outside the examined source. Its default store (zaansouvi/tools/file-symbols,
# toolset.md 4.5) is also the store passed as store_path, so the real store in data/ is not touched, and
# last_run.json sits in that store. The program folder is never written.
# Usage: bash tests/m1/broken.sh        Exit code 0 when every check passes.

set -u
ROOT=$(cd -- "$(dirname -- "$0")/../.." && pwd)
M1="$ROOT/app/tools/file-symbols/file-symbols"
PROG="$ROOT/app/tools/file-symbols"
SRC="$ROOT/test-source"
TMP=$(mktemp -d)
WORK="$TMP/work"            # the working folder of every run, unless a test says otherwise
OUT="$WORK/zaansouvi/tools"
STORE="$OUT/file-symbols"   # passed as store_path; also the default store in $WORK
LAST_RUN="$STORE/last_run.json"
PASS=0
FAIL=0

mkdir -p "$WORK" && cd "$WORK" || exit 2
# What the program folder holds besides its code: must stay the same (nothing is written there).
prog_state() { ls -A "$PROG" | grep -v -e '^node_modules$' -e '^src$' -e '^package' -e '^tsconfig' -e '^README' -e '^file-symbols$'; }
PROG_BEFORE=$(prog_state)
trap 'rm -rf "$TMP"' EXIT

# Run M1, keep stdout, stderr and the exit code.
run() { "$M1" "$@" >"$TMP/stdout" 2>"$TMP/stderr"; CODE=$?; }
run_in() { local input=$1; shift; "$M1" "$@" <"$input" >"$TMP/stdout" 2>"$TMP/stderr"; CODE=$?; }

# Hash of everything a run could write: the temporary store and last_run.json.
store_hash() {
  { find "$OUT" -type f -exec sha256sum {} + 2>/dev/null | sort; sha256sum "$LAST_RUN" 2>/dev/null || echo "no last_run"; } | sha256sum
}

check() { # check <name> <condition text> <0|1>
  if [ "$3" -eq 0 ]; then PASS=$((PASS + 1)); echo "  ok    $1: $2"; else FAIL=$((FAIL + 1)); echo "  FAIL  $1: $2"; fi
}
expect_code() { [ "$CODE" -eq "$2" ]; check "$1" "exit code $2 (got $CODE)" $?; }
expect_stderr() { grep -q "$2" "$TMP/stderr"; check "$1" "standard error mentions $2" $?; }
expect_unchanged() { [ "$(store_hash)" = "$BEFORE" ]; check "$1" "nothing written" $?; }
json_field() { node -e 'const fs=require("fs");const v=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));console.log(process.argv[2].split(".").reduce((o,k)=>o?.[k],v))' "$1" "$2"; }
last_stdout_field() { tail -n 1 "$TMP/stdout" > "$TMP/last_line"; json_field "$TMP/last_line" "$1"; }

cat >"$TMP/good.json" <<EOF
{ "source_root": "$SRC", "file_id": "src/math.ts", "file_path": "$SRC/src/math.ts", "store_path": "$STORE" }
EOF

echo "Setup: one good run"
run --json "$TMP/good.json"
expect_code "setup" 0
GOOD_OUTPUT=$(sha256sum "$STORE/output/src__math.ts.json" | cut -d' ' -f1)

echo "B1: both --json and --stdin"
BEFORE=$(store_hash)
run_in "$TMP/good.json" --json "$TMP/good.json" --stdin
expect_code B1 2; expect_stderr B1 E1; expect_unchanged B1

echo "B2: --json pointing to a missing file"
BEFORE=$(store_hash)
run --json "$TMP/missing.json"
expect_code B2 2; expect_stderr B2 E2; expect_unchanged B2

echo "B2b: --json pointing to a file that isn't JSON"
echo "{ not json" >"$TMP/bad.json"
BEFORE=$(store_hash)
run --json "$TMP/bad.json"
expect_code B2b 2; expect_stderr B2b E2; expect_unchanged B2b

echo "B3: JSON missing file_id"
echo "{ \"source_root\": \"$SRC\", \"store_path\": \"$STORE\" }" >"$TMP/no_file_id.json"
BEFORE=$(store_hash)
run --json "$TMP/no_file_id.json"
expect_code B3 2; expect_stderr B3 E13; expect_unchanged B3

echo "B3b: file_id of the wrong shape (a number)"
echo "{ \"source_root\": \"$SRC\", \"file_id\": 42, \"store_path\": \"$STORE\" }" >"$TMP/bad_shape.json"
BEFORE=$(store_hash)
run --json "$TMP/bad_shape.json"
expect_code B3b 2; expect_stderr B3b E13; expect_unchanged B3b

echo "B4: no parameters, last_run.json deleted"
rm -f "$LAST_RUN"
BEFORE=$(store_hash)
run
expect_code B4 2; expect_stderr B4 E3; expect_unchanged B4
[ ! -f "$LAST_RUN" ]; check B4 "last_run.json not created" $?

echo "B5: no parameters, last_run.json present: repeats the last run"
run --json "$TMP/good.json"
LOGS_BEFORE=$(ls "$STORE/logs" | wc -l)
run
expect_code B5 0
[ "$(sha256sum "$STORE/output/src__math.ts.json" | cut -d' ' -f1)" = "$GOOD_OUTPUT" ]; check B5 "same output as before" $?
[ "$(ls "$STORE/logs" | wc -l)" -eq $((LOGS_BEFORE + 1)) ]; check B5 "one new log" $?
[ "$(json_field "$STORE/result.json" parameterSource)" = "last_run" ]; check B5 "result says the parameters came from last_run" $?

echo "B6: a file that doesn't exist (valid JSON)"
cat >"$TMP/nofile.json" <<EOF
{ "source_root": "$SRC", "file_id": "src/nope.ts", "store_path": "$STORE" }
EOF
run --json "$TMP/nofile.json"
expect_code B6 1; expect_stderr B6 E6
[ "$(json_field "$STORE/result.json" status)" = "failed" ]; check B6 "result.json failed" $?
[ "$(json_field "$STORE/result.json" error.code)" = "E6" ]; check B6 "result.json error E6" $?
[ "$(json_field "$LAST_RUN" file_id)" = "src/nope.ts" ]; check B6 "last_run.json updated" $?
[ "$(json_field "$LAST_RUN" _last_run.outcome)" = "failed" ]; check B6 "last_run.json records the failure" $?
[ "$(sha256sum "$STORE/output/src__math.ts.json" | cut -d' ' -f1)" = "$GOOD_OUTPUT" ]; check B6 "earlier output kept" $?
[ ! -f "$STORE/output/src__nope.ts.json" ]; check B6 "no output for the failed file" $?

echo "B7: syntax error, dry run (as the Runner does it)"
mkdir -p "$TMP/src7/src"
printf 'export function broken(a: number {\n  return a;\n}\n' >"$TMP/src7/src/broken.ts"
cat >"$TMP/broken.json" <<EOF
{ "source_root": "$TMP/src7", "file_id": "src/broken.ts", "store_path": "$STORE" }
EOF
BEFORE=$(store_hash)
run --dry-run --json "$TMP/broken.json"
expect_code B7 1
[ "$(last_stdout_field dryRun)" = "no-go" ]; check B7 "last line is no-go" $?
[ "$(last_stdout_field error.code)" = "E12" ]; check B7 "error E12" $?
[ "$(last_stdout_field error.location.start.line)" = "1" ]; check B7 "error points at line 1" $?
expect_unchanged B7

echo "B7b: syntax error, real run"
run --json "$TMP/broken.json"
expect_code B7b 1; expect_stderr B7b E12
[ "$(json_field "$STORE/result.json" error.code)" = "E12" ]; check B7b "result.json error E12" $?

echo "X1: dry run on a good file: go, preview, nothing written"
BEFORE=$(store_hash)
run --dry-run --json "$TMP/good.json"
expect_code X1 0
[ "$(last_stdout_field dryRun)" = "go" ]; check X1 "last line is go" $?
grep -q '"type":"preview"' "$TMP/stdout"; check X1 "preview line printed" $?
expect_unchanged X1

echo "X2: unknown option (TS-30 / FND-14)"
BEFORE=$(store_hash)
run --json "$TMP/good.json" --nope
expect_code X2 2; expect_stderr X2 E1; expect_unchanged X2

echo "X3: dry run with an invocation error also prints no-go (FND-13)"
BEFORE=$(store_hash)
run --dry-run --json "$TMP/missing.json"
expect_code X3 2
[ "$(last_stdout_field errorKind)" = "invocation" ]; check X3 "no-go line marked as an invocation error" $?
expect_unchanged X3

echo "X4: file_path and file_id disagree (value problem: run error)"
cat >"$TMP/incongruent.json" <<EOF
{ "source_root": "$SRC", "file_id": "src/main.ts", "file_path": "$SRC/src/math.ts", "store_path": "$STORE" }
EOF
run --json "$TMP/incongruent.json"
expect_code X4 1; expect_stderr X4 E12

echo "X5: command-line parameter overrides the JSON"
run --json "$TMP/good.json" --file-id src/main.ts --file-path "$SRC/src/main.ts"
expect_code X5 0
[ -f "$STORE/output/src__main.ts.json" ]; check X5 "main.ts output written" $?

echo "X6: --log copies the log"
run --json "$TMP/good.json" --log "$TMP/copy.log"
expect_code X6 0
grep -q "run_finished" "$TMP/copy.log"; check X6 "copy has the full log" $?

echo "X7: store_path affects no output: from the input, else <working folder>/zaansouvi/tools/file-symbols; last_run.json sits in the store, without the store"
STORE2="$TMP/store2"
out_sha() { sha256sum "$1/output/src__math.ts.json" 2>/dev/null | cut -d' ' -f1; }
# command line beats the JSON
run --json "$TMP/good.json" --store-path "$STORE2"
expect_code X7 0
[ -f "$STORE2/output/src__math.ts.json" ]; check X7 "--store-path beats store_path in the JSON" $?
[ -f "$STORE2/last_run.json" ]; check X7 "last_run.json written in the store used" $?
[ "$(json_field "$STORE2/last_run.json" store_path)" = "undefined" ]; check X7 "last_run.json doesn't record the store" $?
# --store-path alone: repeats the last run saved in that store, into that store
rm -rf "$STORE2/output"
run --store-path "$STORE2"
expect_code X7 0
[ -f "$STORE2/output/src__math.ts.json" ]; check X7 "--store-path alone repeats that store's last run into it" $?
# JSON without store_path: the default store in the working folder
rm -rf "$OUT"
cat >"$TMP/good_no_store.json" <<EOF
{ "source_root": "$SRC", "file_id": "src/math.ts", "file_path": "$SRC/src/math.ts" }
EOF
run --json "$TMP/good_no_store.json"
expect_code X7 0
[ -f "$STORE/output/src__math.ts.json" ] && [ -f "$STORE/result.json" ] && [ -f "$STORE/last_run.json" ]; check X7 "no store_path: store and last_run.json in ./zaansouvi/tools/file-symbols" $?
[ "$(json_field "$STORE/result.json" nonOutputParameterSources.store_path)" = "default" ]; check X7 "result.json says store_path is the default" $?
# the guarantee: the output is the same whatever store was chosen
[ "$(out_sha "$STORE")" = "$GOOD_OUTPUT" ]; check X7 "same output in the default store" $?
[ "$(prog_state)" = "$PROG_BEFORE" ]; check X7 "nothing written in the program folder" $?

echo "X11: a copied store repeats into itself, not into the folder it was copied from"
mkdir -p "$TMP/copy/zaansouvi/tools" && cp -r "$STORE" "$TMP/copy/zaansouvi/tools/"
ORIG=$(find "$STORE" -type f -exec sha256sum {} + | sort | sha256sum)
rm -rf "$TMP/copy/zaansouvi/tools/file-symbols/output"
(cd "$TMP/copy" && "$M1" >"$TMP/stdout" 2>"$TMP/stderr"); CODE=$?
expect_code X11 0
[ "$(out_sha "$TMP/copy/zaansouvi/tools/file-symbols")" = "$GOOD_OUTPUT" ]; check X11 "output written in the copy" $?
[ "$(find "$STORE" -type f -exec sha256sum {} + | sort | sha256sum)" = "$ORIG" ]; check X11 "the original store untouched" $?

echo "X12: run from inside the examined source (E14, nothing written)"
for d in "$SRC" "$SRC/src"; do
  BEFORE=$(store_hash)
  (cd "$d" && "$M1" --json "$TMP/good.json" >"$TMP/stdout" 2>"$TMP/stderr"); CODE=$?
  expect_code X12 2; expect_stderr X12 E14; expect_stderr X12 "never be run from the source path"; expect_unchanged X12
  [ ! -e "$d/zaansouvi" ]; check X12 "no zaansouvi folder created in ${d#"$ROOT"/}" $?
done
(cd "$SRC/src" && "$M1" --dry-run --json "$TMP/good.json" >"$TMP/stdout" 2>"$TMP/stderr"); CODE=$?
expect_code X12 2
tail -n 1 "$TMP/stdout" | grep -q '"errorKind":"invocation"'; check X12 "dry run: no-go marked as an invocation error" $?

echo "X8: source_root is required for a tool that reads files (toolset.md 4.2)"
BEFORE=$(store_hash)
cat >"$TMP/no_root.json" <<EOF
{ "file_id": "src/math.ts", "file_path": "$SRC/src/math.ts", "store_path": "$STORE" }
EOF
run --json "$TMP/no_root.json"
expect_code X8 2; expect_stderr X8 E13; expect_unchanged X8

echo "X9: a relative file_path is resolved against source_root"
cat >"$TMP/rel_path.json" <<EOF
{ "source_root": "$SRC", "file_id": "src/math.ts", "file_path": "src/math.ts", "store_path": "$STORE" }
EOF
run --json "$TMP/rel_path.json"
expect_code X9 0

echo "X10: a file_path outside source_root is a run error"
cat >"$TMP/outside.json" <<EOF
{ "source_root": "$SRC/src", "file_id": "math.ts", "file_path": "$ROOT/expected/README.md", "store_path": "$STORE" }
EOF
run --json "$TMP/outside.json"
expect_code X10 1; expect_stderr X10 E12

echo
echo "passed: $PASS, failed: $FAIL"
[ "$FAIL" -eq 0 ]
