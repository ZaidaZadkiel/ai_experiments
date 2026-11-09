#!/usr/bin/env bash
# Broken inputs for M3, run by hand (06_test_plan.md: B11 to B15; TOOL-09, TOOL-32, TOOL-36).
# Uses a temporary store_path, so data/ is not touched; last_run.json sits in that store (toolset.md 4.5), so
# nothing outside the temporary folder is written. Needs M1's outputs: run `node tests/m1/check.mjs` first.
# Usage: bash tests/m3/broken.sh        Exit code 0 when every check passes.

set -u
ROOT=$(cd -- "$(dirname -- "$0")/../.." && pwd)
M3="$ROOT/app/tools/symbol-scope/symbol-scope"
TMP=$(mktemp -d)
STORE="$TMP/store"
PASS=0
FAIL=0

LAST_RUN="$STORE/last_run.json"
trap 'rm -rf "$TMP"' EXIT

check() { if [ "$3" -eq 0 ]; then PASS=$((PASS + 1)); echo "  ok    $1: $2"; else FAIL=$((FAIL + 1)); echo "  FAIL  $1: $2"; fi; }
run_in() { "$M3" "$@" >"$TMP/stdout" 2>"$TMP/stderr"; CODE=$?; }
expect_code() { [ "$CODE" -eq "$2" ]; check "$1" "exit code $2 (got $CODE)" $?; }
expect_stderr() { grep -q "$2" "$TMP/stderr"; check "$1" "standard error mentions $2" $?; }
store_hash() { { find "$STORE" -type f -exec sha256sum {} + 2>/dev/null | sort; sha256sum "$LAST_RUN" 2>/dev/null || echo "no last_run"; } | sha256sum; }
expect_unchanged() { [ "$(store_hash)" = "$BEFORE" ]; check "$1" "nothing written" $?; }
output_hash() { sha256sum "$STORE/output/scopes.json" 2>/dev/null || echo "no output"; }
result_is() { node -e 'const r=require(process.argv[1]);process.exit(r.status===process.argv[2]&&(r.error?.code??"")===process.argv[3]?0:1)' "$STORE/result.json" "$2" "$3"; check "$1" "result.json $2 ${3:-}" $?; }

# Fixtures: M1's symbol records for test-source, changed by a small script ($1: what to change).
fixture() {
  node -e '
const fs=require("fs"),path=require("path");
const [root,what,store,out]=process.argv.slice(1);
const files=["src/counter.ts","src/main.ts","src/math.ts"].map(f=>JSON.parse(fs.readFileSync(path.join(root,"data/tools/file-symbols/output",f.split("/").join("__")+".json"),"utf8")));
let symbols=files.flatMap(o=>o.symbols);
const p={symbols,store_path:store};
const fn=symbols.findIndex(s=>s.kind==="function");
switch(what){
  case "empty": p.symbols=[]; break;
  case "dup": p.symbols=[...symbols,symbols[0]]; break;
  case "no-range": p.symbols=symbols.map((s,i)=>{if(i!==fn)return s;const c={...s};delete c.range;return c;}); break;
  case "missing": delete p.symbols; break;
  case "not-array": p.symbols={}; break;
  case "not-object": p.symbols=[...symbols,"x"]; break;
  case "no-id": p.symbols=symbols.map((s,i)=>{if(i!==0)return s;const c={...s};delete c.id;return c;}); break;
  case "no-kind": p.symbols=symbols.map((s,i)=>{if(i!==0)return s;const c={...s};delete c.kind;return c;}); break;
  case "no-parent": p.symbols=symbols.map((s,i)=>{if(i!==0)return s;const c={...s};delete c.parent;return c;}); break;
  case "no-location": p.symbols=symbols.map((s,i)=>{if(i!==0)return s;const c={...s};delete c.location;return c;}); break;
  case "bad-range": p.symbols=symbols.map((s,i)=>i===fn?{...s,range:{file:s.parent}}:s); break;
}
fs.writeFileSync(out, JSON.stringify(p));
' "$ROOT" "$1" "$STORE" "$TMP/$1.json"
}
[ -f "$ROOT/data/tools/file-symbols/output/src__main.ts.json" ] || { echo "Missing M1 outputs: run node tests/m1/check.mjs first."; exit 2; }

echo "Setup: one good run"
fixture good; run_in --json "$TMP/good.json"; expect_code Setup 0; GOOD=$(output_hash)

echo "B11: no symbol records (TOOL-09)"
fixture empty
run_in --dry-run --json "$TMP/empty.json"; expect_code B11 1
tail -n 1 "$TMP/stdout" | grep -q '"no-go"'; check B11 "dry run says no-go" $?
grep -q "code.symbol" "$TMP/stdout"; check B11 "dry run names code.symbol" $?
run_in --json "$TMP/empty.json"; expect_code B11 1; expect_stderr B11 E12; result_is B11 failed E12
[ "$(output_hash)" = "$GOOD" ]; check B11 "earlier output kept" $?

echo "B12: two symbol records with the same id"
fixture dup; run_in --json "$TMP/dup.json"; expect_code B12 1; expect_stderr B12 E12; result_is B12 failed E12
[ "$(output_hash)" = "$GOOD" ]; check B12 "earlier output kept" $?

echo "B13: a function symbol without range (TOOL-32)"
fixture no-range; run_in --json "$TMP/no-range.json"; expect_code B13 1; expect_stderr B13 E12; result_is B13 failed E12
grep -q "src/counter.ts#add@5:17" "$TMP/stderr"; check B13 "names the symbol" $?

for c in missing not-array; do
  echo "B14: symbols $c (E13, nothing written)"
  fixture $c; BEFORE=$(store_hash); run_in --json "$TMP/$c.json"; expect_code B14 2; expect_stderr B14 E13; expect_unchanged B14
done

for c in not-object no-id no-kind no-parent no-location bad-range; do
  echo "B15: a symbol record: $c (E13, nothing written)"
  fixture $c; BEFORE=$(store_hash); run_in --json "$TMP/$c.json"; expect_code B15 2; expect_stderr B15 E13; expect_unchanged B15
done

echo "B15: dry run with a malformed record prints a no-go line marked as an invocation error"
run_in --dry-run --json "$TMP/no-id.json"; expect_code B15 2
[ "$(tail -n 1 "$TMP/stdout" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).errorKind))')" = "invocation" ]; check B15 "no-go line has errorKind invocation" $?

echo "R1: --store-path alone repeats the last run saved in that store exactly"
fixture good; run_in --json "$TMP/good.json"; H1=$(output_hash); run_in --store-path "$STORE"; expect_code R1 0
[ "$(output_hash)" = "$H1" ]; check R1 "same output" $?

echo
echo "passed: $PASS, failed: $FAIL"
[ "$FAIL" -eq 0 ]
