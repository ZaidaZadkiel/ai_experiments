#!/usr/bin/env bash
# Broken inputs and unresolved imports for M2, run by hand (06_test_plan.md: B8, B9; TOOL-20 to TOOL-23).
# Uses a temporary store_path, so data/ is not touched; last_run.json sits in that store (toolset.md 4.5), so
# nothing outside the temporary folder is written. Needs M1's outputs: run `node tests/m1/check.mjs` first.
# Usage: bash tests/m2/broken.sh        Exit code 0 when every check passes.

set -u
ROOT=$(cd -- "$(dirname -- "$0")/../.." && pwd)
M2="$ROOT/app/tools/cross-file-links/cross-file-links"
TMP=$(mktemp -d)
STORE="$TMP/store"
PASS=0
FAIL=0

LAST_RUN="$STORE/last_run.json"
trap 'rm -rf "$TMP"' EXIT

check() { if [ "$3" -eq 0 ]; then PASS=$((PASS + 1)); echo "  ok    $1: $2"; else FAIL=$((FAIL + 1)); echo "  FAIL  $1: $2"; fi; }
run_in() { "$M2" "$@" >"$TMP/stdout" 2>"$TMP/stderr"; CODE=$?; }
expect_code() { [ "$CODE" -eq "$2" ]; check "$1" "exit code $2 (got $CODE)" $?; }
expect_stderr() { grep -q "$2" "$TMP/stderr"; check "$1" "standard error mentions $2" $?; }
store_hash() { { find "$STORE" -type f -exec sha256sum {} + 2>/dev/null | sort; sha256sum "$LAST_RUN" 2>/dev/null || echo "no last_run"; } | sha256sum; }
expect_unchanged() { [ "$(store_hash)" = "$BEFORE" ]; check "$1" "nothing written" $?; }
# Prints the link whose `from` is $2 in the output, as "kind|to|reason".
link_of() { node -e 'const o=require(process.argv[1]);const l=o.links.find(l=>l.from===process.argv[2]);console.log(l?[l.kind,String(l.to),l.reason??""].join("|"):"none")' "$STORE/output/links.json" "$1"; }

# Fixtures: M1's records for test-source, changed by a small script ($1: what to change).
fixture() {
  node -e '
const fs=require("fs"),path=require("path");
const [root,what,store,out]=process.argv.slice(1);
const files=["src/counter.ts","src/main.ts","src/math.ts"].map(f=>JSON.parse(fs.readFileSync(path.join(root,"data/tools/file-symbols/output",f.split("/").join("__")+".json"),"utf8")));
let symbols=files.flatMap(o=>o.symbols), references=files.flatMap(o=>o.references);
const loc=(line,col,len)=>({file:"src/main.ts",start:{line,column:col},end:{line,column:col+len}});
const imp=(name,line,spec,imported,extra={})=>({id:`src/main.ts#${name}@${line}:10`,name,kind:"import",exported:false,location:loc(line,10,name.length),range:loc(line,10,name.length),parent:"src/main.ts",import:{moduleSpecifier:spec,importedName:imported,...extra}});
const p={symbols,references,store_path:store};
switch(what){
  case "dup": p.symbols=[...symbols,symbols[0]]; break;
  case "empty": p.symbols=[]; break;
  case "bad-symbol": p.symbols=[...symbols,{id:"x",kind:"variable"}]; break;
  case "bad-reference": p.references=[...references,{id:"r",kind:"read",from:"src/main.ts"}]; break;
  case "no-references": delete p.references; break;
  case "missing": p.symbols=[...symbols,imp("thing",13,"./missing","thing")]; break;
  case "external": p.symbols=[...symbols,imp("React",14,"react","React")]; break;
  case "default": p.symbols=[...symbols,imp("dflt",15,"./math","default")]; break;
  case "namespace": p.symbols=[...symbols,imp("ns",16,"./math","*")]; break;
  case "not-exported": p.symbols=[...symbols,imp("factor",17,"./math","factor")]; break;
  case "type-only": p.symbols=[...symbols,imp("PRECISION2",18,"./math","PRECISION",{typeOnly:true})]; break;
  case "extension": p.symbols=[...symbols,imp("round2",19,"./math.js","round")]; break;
}
fs.writeFileSync(out, JSON.stringify(p));
' "$ROOT" "$1" "$STORE" "$TMP/$1.json"
}
[ -f "$ROOT/data/tools/file-symbols/output/src__main.ts.json" ] || { echo "Missing M1 outputs: run node tests/m1/check.mjs first."; exit 2; }

echo "Setup: one good run"
fixture good; run_in --json "$TMP/good.json"; expect_code Setup 0

echo "B8: two symbol records with the same id"
fixture dup; run_in --json "$TMP/dup.json"; expect_code B8 1; expect_stderr B8 E12
node -e 'const r=require(process.argv[1]);process.exit(r.status==="failed"&&r.error.code==="E12"?0:1)' "$STORE/result.json"; check B8 "result.json failed with E12" $?

echo "E1: no symbol records (TOOL-09)"
fixture empty; run_in --json "$TMP/empty.json"; expect_code E1 1; expect_stderr E1 E12

echo "E2: a malformed symbol record (E13, nothing written)"
fixture bad-symbol; BEFORE=$(store_hash); run_in --json "$TMP/bad-symbol.json"; expect_code E2 2; expect_stderr E2 E13; expect_unchanged E2

echo "E3: a malformed reference record (E13, nothing written)"
fixture bad-reference; BEFORE=$(store_hash); run_in --json "$TMP/bad-reference.json"; expect_code E3 2; expect_stderr E3 E13; expect_unchanged E3

echo "E4: references missing (E13, nothing written)"
fixture no-references; BEFORE=$(store_hash); run_in --json "$TMP/no-references.json"; expect_code E4 2; expect_stderr E4 E13; expect_unchanged E4

echo "E5: dry run with a malformed record prints a no-go line marked as an invocation error"
run_in --dry-run --json "$TMP/bad-symbol.json"; expect_code E5 2
[ "$(tail -n 1 "$TMP/stdout" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).errorKind))')" = "invocation" ]; check E5 "no-go line has errorKind invocation" $?

echo "B9: an import from ./missing"
fixture missing; run_in --json "$TMP/missing.json"; expect_code B9 0
[ "$(link_of 'src/main.ts#thing@13:10')" = "import|null|no such file" ]; check B9 "link to null, reason no such file" $?

echo "U1: a package import"
fixture external; run_in --json "$TMP/external.json"; expect_code U1 0
[ "$(link_of 'src/main.ts#React@14:10')" = "import|null|external" ]; check U1 "reason external" $?

echo "U2: a default import, and a namespace import"
fixture default; run_in --json "$TMP/default.json"; [ "$(link_of 'src/main.ts#dflt@15:10')" = "import|null|unsupported" ]; check U2 "default: reason unsupported" $?
fixture namespace; run_in --json "$TMP/namespace.json"; [ "$(link_of 'src/main.ts#ns@16:10')" = "import|null|unsupported" ]; check U2 "namespace: reason unsupported" $?

echo "U3: importing a name the file doesn't export"
fixture not-exported; run_in --json "$TMP/not-exported.json"; [ "$(link_of 'src/main.ts#factor@17:10')" = "import|null|not exported" ]; check U3 "reason not exported" $?

echo "U4: a type-only import is linked like any other"
fixture type-only; run_in --json "$TMP/type-only.json"; [ "$(link_of 'src/main.ts#PRECISION2@18:10')" = "import|src/math.ts#PRECISION@1:14|" ]; check U4 "linked to the declaration" $?

echo "U5: a specifier written with an extension is an acceptable failure (MVP-11)"
fixture extension; run_in --json "$TMP/extension.json"; [ "$(link_of 'src/main.ts#round2@19:10')" = "import|null|no such file" ]; check U5 "reason no such file" $?

echo "R1: --store-path alone repeats the last run saved in that store exactly"
fixture good; run_in --json "$TMP/good.json"; H1=$(sha256sum "$STORE/output/links.json"); run_in --store-path "$STORE"; expect_code R1 0
[ "$(sha256sum "$STORE/output/links.json")" = "$H1" ]; check R1 "same output" $?

echo
echo "passed: $PASS, failed: $FAIL"
[ "$FAIL" -eq 0 ]
