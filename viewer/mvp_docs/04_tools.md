# 04. Tools

M1, M2 and M3 as built for the MVP. Data shapes are in `02_data_contracts.md`.

## What every tool does

- **TOOL-01** Options: `--info`, `--dry-run`, `--json <path>`, `--stdin`, `--log <path>`.
- **TOOL-02** Parameters are read in the decided order (`toolset.md`, section 4.5): command-line arguments, then `--json` or `--stdin` (both together is an invocation error), then `last_run.json`. With none of these, the tool fails with an invocation error and writes nothing.
- **TOOL-03** Parameter check: only **shape** problems are invocation errors (exit 2, nothing written): a required parameter missing, a value of the wrong type, JSON that doesn't parse. **Value** problems are run errors (exit 1, logged).
- **TOOL-04** Once the parameters pass the check, the tool writes `last_run.json`, then does its work, writing its log as it goes.
- **TOOL-05** On success it writes its output and `result.json` with `succeeded`. On a run error it writes `result.json` with `failed` and the error, writes no output, and leaves the earlier output as it was. Output is written to a temporary name and renamed at the end, so it is never half-written.
- **TOOL-06** A dry run does the same work and prints its findings and a final `go` / `no-go` line to standard output (DATA-17). It reads what a real run reads (`TOOL-40`), but writes nothing at all: no output, no result, no log, no `last_run.json`, no internal state and no temporary file (`toolset.md`, section 4.3).
- **TOOL-07** `--log <path>` also copies the log to that file. The log in the tool's data folder is always written.
- **TOOL-08** Extra values in the JSON are ignored.
- **TOOL-45** **M1, M2 and M3 implement `TOOL-01` to `TOOL-08`, `TOOL-43` and `DATA-14` to `DATA-17` through the tool helper** in `app/tool-helper/` (accepted by the user for the MVP on 2026-11-08; `ARCH-02`). The helper knows nothing about any specific tool; each tool supplies only its `--info`, its parameter checks and its work. M1 moved onto it in version 0.4.0, at the user's request on 2026-11-08, with no change in behavior (this replaces "M1 stays self-contained").
- **TOOL-09** **A dry run works only from the input it is given, and says no-go when there is none.** It reads its input exactly as a real run would: M1 reads the source file; M2 and M3 read the earlier outputs in their JSON, which the Runner takes from the saved stores (`RUN-16`). A required input that is present but empty, for example `symbols: []`, is a run error: no-go with `E12` ("lacks what the tool needs"), exit 1, and a message naming the missing data name, for example `code.symbol`. The tool never previews from nothing. A missing source file is `E6`, as in a real run. The same rule holds in a real run, which fails with the same error.
- **TOOL-40** **What a tool reads:** its JSON, its `last_run.json`, its own store and internal state, and, for M1, the one file it is given. A tool that needs more than one file, or the database, is a design error in that tool (`toolset.md`, section 4.2). It writes only to its own store, and nothing in a dry run (`TOOL-06`). None of this is checked by the Runner (`RUN-24`).
- **TOOL-41** **Each tool is responsible for producing correct output** (`toolset.md`, section 4.2). It checks its parameters, and its result where it needs to, and fails with a run error rather than write something wrong. The Runner's refresh check (`RUN-17` to `RUN-22`) decides whether to run a tool; it doesn't make the tool's output correct.
- **TOOL-43** **Parameters that affect the output, and those that don't** (decided by the user on 2026-11-07; `toolset.md`, section 4.5).
  - Each parameter in `--info` carries `affectsOutput`. Those with `true` follow `TOOL-02` exactly.
  - Those with `false`, such as `store_path` (`DATA-21`), are optional. If one is missing, the tool uses its default, or works it out from the input by its own means, without affecting the Runner; if it can do neither, it fails early. For `store_path`, the default is ~~the tool's own program folder~~ `./zaansouvi/tools/<tool>/` in the working folder (`FND-59`).
  - `last_run.json` is only ever a complete input (`TOOL-02`), never a source for one missing parameter.
  - The tool records, for each one, whether the input gave it or its default applied (`nonOutputParameterSources`: `input` or `default`) in its log and `result.json`.
  - The output never depends on these parameters.
- ~~**TOOL-44** **Diagnostics** go under the common data name `diagnostic`.~~ Replaced on 2026-11-08 (option C, accepted by the user for the MVP on 2026-11-08): a tool returns its diagnostics with its work, and the tool helper writes them into `result.json` and onto the dry run's go line (`DATA-14`, `DATA-17`); they never go in an output file or `--info`. M1 does this from version 0.5.0.
- **TOOL-42** **Agreed key names** (`DATA-19`). Every key a tool writes, in its output, `--info`, `result.json`, `last_run.json` and dry-run lines, has the one meaning agreed for that name, as listed in the reference schema (`DATA-20`). A tool that needs a new meaning uses a new name. It reads the records in its input by those agreed names; it doesn't read another tool's `--info` (`DATA-18`).

## Error codes

| Code | Kind | Example |
|---|---|---|
| `E1` | invocation | both `--json` and `--stdin`; unknown option |
| `E2` | invocation | `--json` file missing; JSON doesn't parse |
| `E3` | invocation | no parameters and no usable `last_run.json` |
| `E13` | invocation | required parameter missing or of the wrong shape |
| `E14` | invocation | run from inside the examined source: the working folder is the source root or under it. The message says tools must never be run from the source path; nothing is written (decided by the user on 2026-11-08, `toolset.md`, section 4.5; `FND-59`). Only tools given `source_root` can check it, so in the MVP only M1 |
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

- **TOOL-20** M2 works from the symbol records alone (agreed by the user for the MVP on 2026-11-08; `DATA-13`). For every symbol of kind `import`, resolve `import.moduleSpecifier` relative to the importing file, the symbol's `parent`: try `<moduleSpecifier>.ts`, then `<moduleSpecifier>/index.ts`. Among the symbols whose `parent` is that file, find an exported one named `import.importedName`. `no such file` means no symbol of that file is in the input: M2 gets no file list, so a file that declares nothing looks missing, an acceptable failure. If found, output a link; if not, output a link with `to: null` and the `reason`: `no such file` or `not exported` (agreed by the user for the MVP on 2026-11-07, FND-42).
- **TOOL-21** Module specifiers that don't start with `.` (packages) give a link with `to: null` and reason `external`.
- **TOOL-24** **M2's remaining rules** (accepted by the user for the MVP on 2026-11-08):
  - default and namespace imports (`importedName` `"default"` or `"*"`) give a link with `to: null` and reason `unsupported`;
  - type-only imports (`typeOnly: true`) are linked like any other import;
  - a specifier written with an extension (`"./math.js"`) resolves to `no such file`: an acceptable failure (`MVP-11`);
  - invocation errors (`E13`, nothing written): `symbols` or `references` missing or not an array; a symbol record that isn't an object or lacks `id`, `kind`, `parent` or `location` (and `import` with `moduleSpecifier` and `importedName` on an import); a reference record that isn't an object or lacks `id`, `kind`, `from`, `to` (a string or `null`) or `location`;
  - the dry run prints only its log lines and the final go / no-go line (`DATA-17`), no preview line.
- **TOOL-23** **Use-site links** (option A, accepted by the user for the MVP on 2026-11-08; resolves `FND-03`, as `MVP_scope.md`, section 2 [Decided], describes). M2 also reads M1's references (`references`, data name `code.reference`; still only M1's records, never its files). For every reference that isn't a declaration and whose `to` is an import symbol M2 resolved, it outputs a link: `id` `<reference id>-><declaration>`, `from` the reference's `from` (the enclosing function, or the file at file level), `to` the declaration, `kind` the reference's kind (`call`, `read` or `write`), `location` the reference's, and the import's `moduleSpecifier`. A use of an unresolved import gives no extra link: the import's own link already says it is unresolved. Import links and use-site links are ordered together by position (file ID, line, column).
- **TOOL-22** M2 checks only its own input (agreed by the user for the MVP on 2026-11-08). Run errors (`E12`): `symbols` empty (`TOOL-09`), or two symbol records with the same `id`. Whether M1's records are right is M1's responsibility (`TOOL-41`); M2 doesn't check M1's references; it reads them only to find uses of imported names (`TOOL-23`). (This replaces checking that each reference points to a known symbol, and two M1 outputs for the same file.)

## M3: symbol-scope

Groups each file's symbols into scopes. Reads no files.

- **TOOL-30** For each file, create the file scope and one scope per **top-level** function (from symbols of kind `function` whose `range` is not inside another function's `range`). Functions inside functions don't get their own scope.
- **TOOL-31** Assign every symbol to the function scope whose `range` contains the symbol's `location`; otherwise to the file scope. A function's own name belongs to the scope it is declared in, not its own.
- **TOOL-32** A function symbol without a `range` is a run error (`E12`): the value lacks what M3 needs.
- **TOOL-33** **Each scope names its `owner`** (decided by the user on 2026-11-08, `MVP-4`, option C with C1): the function symbol whose declaration it is, for a function scope; the file ID, for the file scope. These are the IDs M1's references use as `from` (`FND-02`), so the Viewer can start a use from its scope (`VIEW-13`). M3 still reads only symbols; it shows no uses itself.
- **TOOL-34** **Where scopes are placed** (decided by the user on 2026-11-08; resolves `FND-11` and `FND-12`). A function scope's ID and location start at the function's declaration start, the start of its `range` (`3:1` for `export function round`, not the `function` keyword at `3:8`); its location is that `range`. The file scope's location runs from line 1, column 1 to the furthest end among the file's symbols (the end of their `range`, or of their `location` when a symbol has no `range`). It can fall short of the file's real end (trailing comments, blank lines); that is acceptable for the MVP, and it keeps M3 reading only M1's symbols (no file lengths from the Runner). A file with no symbols gets no scopes at all: an acceptable failure (`MVP-11`).
- **TOOL-35** **Order** (agreed by the user for the MVP on 2026-11-08). Scopes by file ID; within a file, the file scope first, then function scopes by position (line, then column). ~~Memberships in the order of the symbols received (`RUN-19`: file ID order, then M1's order).~~ Memberships by file ID, then the symbol's position (line, then column), then its ID, whatever the order of the input (changed on 2026-11-08 by the user's rule that a tool's output never depends on the order of its input records, `toolset.md`, section 2; `FND-58`; M3 0.2.0). For the Runner's input the result is the same as before.
- **TOOL-36** **Errors** (agreed by the user for the MVP on 2026-11-08). Run errors (`E12`): `symbols` empty (`TOOL-09`), two symbol records with the same `id`, or a function symbol without a `range` (`TOOL-32`). Invocation errors (`E13`, nothing written): `symbols` missing or not an array; a symbol record that isn't an object or lacks `id`, `kind`, `parent` or `location`, or has a `range` that is present but isn't a Location (filled in while building M3 on 2026-11-08, `FND-57`: a malformed record, as distinct from a function with no `range` at all, `TOOL-32`). As in M2 (`TOOL-22`), M3 checks only its own input; whether M1's records are right is M1's responsibility (`TOOL-41`).

## Supported constructs (`MVP-11`)

Supported, on the happy path:
- `function` declarations, with parameters, including `export function`
- `const`, `let` and `var` with a simple name (no destructuring)
- named imports, `import { a, b } from "./x"`, from relative paths
- calls, reads, and assignments to a simple name
- nested blocks (`if`, loops) inside functions

Everything else is an **acceptable failure**: it may be skipped, mislabeled or reported as unresolved, but must not crash a tool. That includes classes and methods, arrow functions, default and namespace imports, re-exports, destructuring, type-only symbols, overloads, decorators, dynamic property access, and JavaScript files.
