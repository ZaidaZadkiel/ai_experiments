# ts-program

MVP 2's only tool in the run (`mvp_docs/42_tool_ts_program.md`; `RUN-33`). It runs TypeScript's own compiler (parser, binder and type checker) over the whole examined program and writes, for each source file, every declaration, every use resolved to the declaration TypeScript says it means, and every import link, in the records the Viewer reads. A program tool (`toolset.md`, section 4.2, `TS-37`): every listed `.ts` file in one invocation, and nothing else from the source.

## Install and run

Needs Node 22.18 or later (TypeScript run directly). `npm ci` in this folder (TypeScript 5.6.3, exact from `package-lock.json`).

```
./ts-program --info
echo '{"source_root":"../../../test-source-mvp2","files":["src/app.ts","src/shapes.ts"]}' | ./ts-program --stdin
```

Run it from a folder outside the examined source (`E14`). The store defaults to `./zaansouvi/tools/ts-program/` in the working folder; the Runner passes `data/tools/ts-program`.

## Parameters

`source_root` (required), `files` (required: the program's file IDs, a list), `configs` (not supported in 0.2.0: the options of `tsc --init` apply, `TPG-D4a`), `store_path`.

## Output

`output/<file-key>.json` per file: `symbols` (`code.symbol`), `references` (`code.reference`), `links` (`code.link`), as the MVP 2 schema, section 4.5, describes. A symbol also has `declaredWith` (a variable's `const`, `let`, `var`) and `defaultExport` (what the file's default export names), and `modifiers` includes `override` and `accessor`. `result.json` adds `program`: the files and library files read, the options, the count of type errors (never a stop). Syntax errors stop the run (`E12`).

## Check

From `zaansouvi-mvp/`: `node tests/ts-program/check.mjs`, against `expected-mvp2/expected-graph.json`, written by hand; `node tests/ts-program/check-definitions.mjs`, every edge against TypeScript's "go to definition".
