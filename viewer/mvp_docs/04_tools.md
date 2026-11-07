# 04. Tools

M1, M2 and M3 as built for the MVP. Data shapes are in `02_data_contracts.md`.

## What every tool does

- **TOOL-01** Options: `--info`, `--dry-run`, `--json <path>`, `--stdin`, `--log <path>`.
- **TOOL-02** Parameters are read in the decided order (`toolset.md`, section 4.5): command-line arguments, then `--json` or `--stdin` (both together is an invocation error), then `last_run.json`. With none of these, the tool fails with an invocation error and writes nothing.
- **TOOL-03** Parameter check: only **shape** problems are invocation errors (exit 2, nothing written): a required parameter missing, a value of the wrong type, JSON that doesn't parse. **Value** problems are run errors (exit 1, logged).
- **TOOL-04** Once the parameters pass the check, the tool writes `last_run.json`, then does its work, writing its log as it goes.
- **TOOL-05** On success it writes its output and `result.json` with `succeeded`. On a run error it writes `result.json` with `failed` and the error, writes no output, and leaves the earlier output as it was. Output is written to a temporary name and renamed at the end, so it is never half-written.
- **TOOL-06** A dry run does the same work, writes nothing, and prints its findings and a final `go` / `no-go` line to standard output (DATA-17).
- **TOOL-07** `--log <path>` also copies the log to that file. The log in the tool's data folder is always written.
- **TOOL-08** Extra values in the JSON are ignored.

## Error codes

| Code | Kind | Example |
|---|---|---|
| `E1` | invocation | both `--json` and `--stdin`; unknown option |
| `E2` | invocation | `--json` file missing; JSON doesn't parse |
| `E3` | invocation | no parameters and no usable `last_run.json` |
| `E13` | invocation | required parameter missing or of the wrong shape |
| `E6` | run | the file to read is missing or unreadable |
| `E12` | run | a value is incorrect, incongruent, or lacks what the tool needs; the file has syntax errors |
| `E8` | run | any unexpected failure |

These follow `toolset.md`, section 4.6.

## M1: file-symbols

Reads one TypeScript file and lists its symbols and references.

- **TOOL-10** Parse the file with the TypeScript compiler's parser (`ts.createSourceFile`), without type checking. If the parser reports syntax errors, fail with `E12`.
- **TOOL-11** Symbols, in the supported constructs below: function declarations, `const` / `let` / `var` declarations, function parameters, and named imports. Mark `exported` when declared with `export`.
- **TOOL-12** References: every identifier that is a declaration name, a call target, a read or an assignment target. **Property names after a dot are not references**: in `Math.round(...)`, `Math` is a reference and `round` is not.
- **TOOL-13** Resolve each reference to a symbol **in the same file** by name: the nearest declaration in the enclosing functions, then the file. If none, `symbol` is `null`. No cross-file work: that is M2's job.
- **TOOL-14** Kinds: `declaration` for the declaring name; `write` for the left side of `=`, `+=` and the like; `call` for the callee of a call; `read` otherwise.

## M2: cross-file-links

Links each import to the declaration it imports. Reads no files.

- **TOOL-20** For every symbol of kind `import`, resolve `import.from` relative to the importing file: try `<from>.ts`, then `<from>/index.ts`. Find in that file's M1 output an exported symbol named `import.name`. If found, output a link; if not, list it as `unresolved` with the reason.
- **TOOL-21** Module specifiers that don't start with `.` (packages) are listed as `unresolved` with reason `external`.
- **TOOL-22** Incongruent parameters are a run error (`E12`): for example a reference whose `symbol` isn't among the file's symbols, or two M1 outputs for the same file.

## M3: symbol-scope

Groups each file's symbols into scopes. Reads no files.

- **TOOL-30** For each file, create the file scope and one scope per **top-level** function (from symbols of kind `function` whose `range` is not inside another function's `range`). Functions inside functions don't get their own scope.
- **TOOL-31** Assign every symbol to the function scope whose `range` contains the symbol's `location`; otherwise to the file scope. A function's own name belongs to the scope it is declared in, not its own.
- **TOOL-32** A function symbol without a `range` is a run error (`E12`): the value lacks what M3 needs.

## Supported constructs (`MVP-11`)

Supported, on the happy path:
- `function` declarations, with parameters, including `export function`
- `const`, `let` and `var` with a simple name (no destructuring)
- named imports, `import { a, b } from "./x"`, from relative paths
- calls, reads, and assignments to a simple name
- nested blocks (`if`, loops) inside functions

Everything else is an **acceptable failure**: it may be skipped, mislabeled or reported as unresolved, but must not crash a tool. That includes classes and methods, arrow functions, default and namespace imports, re-exports, destructuring, type-only symbols, overloads, decorators, dynamic property access, and JavaScript files.
