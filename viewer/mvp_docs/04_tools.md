# 04. Tools

The MVP's programs and tools: the list of every known program first (all of them, built, designed or planned), then the contract every tool shares, then `ts-program`, the only tool the Runner runs, and where the requirements of M1, M2 and M3 are. Data shapes are in `02_data_contracts.md`.

## Programs, known, implemented and future

**State:** *implemented* (built and checked), *designed* (a design in `mvp_docs/`, not built), *proposed* (a suggestion, not decided), *planned* (named in `toolset.md`, section 6, for the product, no design yet). **In the MVP 2 run:** whether the Runner runs it in MVP 2 (`RUN-33`: `ts-program` alone).

**Programs that are not tools** (they don't follow the tool contract below, and have no place in the run order):

| Program | State | In the MVP 2 run | Purpose | Described in |
|---|---|---|---|---|
| **Runner** `zaansouvi-run` | implemented 0.1.0, with MVP 2's run list and file listing (`RUN-33` to `RUN-35`) | runs the others | runs the whole process with one command: lists the files, works out which tools run and in what order from their `--info`, invokes each with JSON parameters, checks their outputs, keeps the database and the cache the Viewer reads | `03_runner.md`; `toolset.md` 6.1 |
| **Viewer** `zaansouvi-view` | implemented 0.1.0 | starts the Runner | the main entry point: a local server and a page in the browser that starts runs and shows the examined source as a graph, level by level, every element traced to its file and line | `05_viewer.md`, `50_viewer_ui.md`, `55_viewer_backend.md`; `toolset.md` 6.10 |
| **Shared library** `app/shared/` | implemented | (used by the Runner and the Viewer) | the types of `--info`, events and the cache; the log format; file helpers. Never used by tools | `mvp1/98_first_implementation.md`, 3.1 |
| **Tool helper** `app/tool-helper/` | implemented | (used by every tool) | the contract every tool shares, so a tool supplies only its `--info`, its checks and its work: options, JSON input, `last_run.json`, the dry run, errors, logs, `result.json`, atomic writes | this file, `TOOL-01` to `TOOL-09`, `TOOL-45` |

**Tools** (each does one thing, describes itself with `--info`, and is run by the Runner):

| Tool | State | In the MVP 2 run | Purpose | Described in |
|---|---|---|---|---|
| **M1** `file-symbols` | implemented 0.5.0 | **no** (kept as is, `TPG-01`) | reads one TypeScript file with the parser alone and lists its symbols and references, resolving names by hand within the file; functions and variables only (`FND-82`) | `summary/00_definitions_mvp1.md`; `mvp1/docs_2026-11-10/04_tools.md`, M1 |
| **M2** `cross-file-links` | implemented 0.2.0 | **no** | links each import, and each use of an imported name, to the declaration it names in another file, by matching names; reads M1's records, no files | `summary/00_definitions_mvp1.md`; `mvp1/docs_2026-11-10/04_tools.md`, M2 |
| **M3** `symbol-scope` | implemented 0.2.0 | **no** (`TPG-06`) | groups each file's symbols into the file scope and one scope per top-level function, each naming its owner, so the Viewer has levels | `summary/00_definitions_mvp1.md`; `mvp1/docs_2026-11-10/04_tools.md`, M3 |
| **`ts-program`** | implemented 0.2.0 (`FND-110`) | **yes, alone** | runs TypeScript's own compiler over the whole program and writes, per source file, every declaration, every use resolved to the declaration it means (across files, members, built-ins apart) and every import link, in the format the Viewer reads | `42_tool_ts_program.md`; plan `41_typescript_program_plan.md` |
| **`ts-config`** | designed (`TPG-D4`, decided) | **no, to start with** (`TPG-D4a`): `ts-program` runs on TypeScript's defaults until `ts-config` joins the list | reads one `tsconfig*.json` as written and outputs it as data; `ts-program` merges the configs with TypeScript's own API, so the options are exactly TypeScript's | `42_tool_ts_program.md`, 3.1 |
| **Kind checkers** (`ts-kind`, `tsx-kind`, one per file type) | proposed; deferred until after the MVP | no | look at each file's bytes and name, never parsing it, and give it a kind with evidence (TypeScript, a declaration file, a video named `.ts`, binary, generated…), so reading tools get only files they can read and the rest are reported | `40_tools_fileKind.md` (`FND-80`) |
| **File inventory** | planned; first after the MVP | no | determines whether each file can be read and what kind of data to expect from it; under one file type per tool, likely the kind checkers above | `toolset.md` 6.2 |
| **JavaScript and JSX symbol tools** | planned (`FND-81`, `TSP-D12`) | no | the same as `ts-program` for `.js`, `.jsx` and `.tsx`, one tool per file type, sharing its code | `mvp1/99_findings_mvp1.md`, `FND-81` |
| **Built-ins tool** | idea (`FND-77`) | no | gives built-in names (`Map`, `console`) nodes of their own inside one container; offered as the P4 experiment "a fourth, small tool" | `mvp1/99_findings_mvp1.md`, `FND-77`; `MVP_scope.md` 10.1 |
| **Git step** | planned (optional) | no | the only step dealing with git: connects files on disk to where they are published, for correct links; current state only, never history | `toolset.md` 6.3 |
| **Environment variables** | planned | no | records environment variables: their names, where each is defined and where it is read | `toolset.md` 6.4 |
| **Modules** | planned | no | records files and packages, the import and export graph, and dependencies between packages in a monorepo, reading the symbol tool's output | `toolset.md` 6.6 |
| **Infrastructure** | planned | no | maps the code to deployable units and external systems (services, databases, queues, cloud resources, config); one tool per type of runtime data, such as SQLite row counts | `toolset.md` 6.7 |
| **Project overview detectors** | planned | no | small steps each contributing facts about the project for the Viewer's first levels (its configuration, versions and scripts; what it produces, such as a command-line tool, a website or a library; small "is it present" details, such as editor or AI assistant configuration), all in one shape, so a new detector needs no change to the Viewer | `toolset.md` 6.8 |
| **Mermaid generator** | planned | no | produces static Mermaid diagrams from the tool outputs, with a companion mapping each node to its location, link and quote | `toolset.md` 6.9 |

## What every tool does

- **TOOL-01** Options: `--info`, `--dry-run`, `--json <path>`, `--stdin`, `--log <path>`.
- **TOOL-02** Parameters are read in the decided order (`toolset.md`, section 4.5): command-line arguments, then `--json` or `--stdin` (both together is an invocation error), then `last_run.json`. With none of these, the tool fails with an invocation error and writes nothing.
- **TOOL-03** Parameter check: only **shape** problems are invocation errors (exit 2, nothing written): a required parameter missing, a value of the wrong type, JSON that doesn't parse. **Value** problems are run errors (exit 1, logged).
- **TOOL-04** Once the parameters pass the check, the tool writes `last_run.json`, then does its work, writing its log as it goes.
- **TOOL-05** On success it writes its output and `result.json` with `succeeded`. On a run error it writes `result.json` with `failed` and the error, writes no output, and leaves the earlier output as it was. Output is written to a temporary name and renamed at the end, so it is never half-written.
- **TOOL-06** A dry run does the same work and prints its findings and a final `go` / `no-go` line to standard output (DATA-17). It reads what a real run reads (`TOOL-40`), but writes nothing at all: no output, no result, no log, no `last_run.json`, no internal state and no temporary file (`toolset.md`, section 4.3).
- **TOOL-07** `--log <path>` also copies the log to that file. The log in the tool's data folder is always written.
- **TOOL-08** Extra values in the JSON are ignored.
- **TOOL-45** **M1, M2, M3 and `ts-program` implement `TOOL-01` to `TOOL-08`, `TOOL-43` and `DATA-14` to `DATA-17` through the tool helper** in `app/tool-helper/` (`ARCH-02`, `TPG-10`). The helper knows nothing about any specific tool; each tool supplies only its `--info`, its parameter checks and its work.
- **TOOL-09** **A dry run works only from the input it is given, and says no-go when there is none.** It reads its input exactly as a real run would: M1 reads the source file; M2 and M3 read the earlier outputs in their JSON, which the Runner takes from the saved stores (`RUN-16`). A required input that is present but empty, for example `symbols: []`, is a run error: no-go with `E12` ("lacks what the tool needs"), exit 1, and a message naming the missing data name, for example `code.symbol`. The tool never previews from nothing. A missing source file is `E6`, as in a real run. The same rule holds in a real run, which fails with the same error. `ts-program` takes no other tool's output: its dry run reads the files it is given in `files`, as a real run does (`TPG-23`). It checks that `source_root` is a folder and that every listed file lies inside it, is a `.ts` file and exists, then builds the program and checks every file's syntax, with no checker; any of these failing is `E12` (a missing listed file included), no-go, exit 1. A source with no file for it to read is stopped by the Runner before `ts-program` starts (`RUN-34`).
- **TOOL-40** **What a tool reads:** its JSON, its `last_run.json`, its own store and internal state, and, for M1, the one file it is given. A tool that needs more than one file, or the database, is a design error in that tool (`toolset.md`, section 4.2). It writes only to its own store, and nothing in a dry run (`TOOL-06`). None of this is checked by the Runner (`RUN-24`). **The exception is a program tool** (`TSP-D3`; `toolset.md`, section 4.2, `TS-37`), which states `"scope": "program"` in its `readsFiles`: `ts-program` reads, in one invocation, every listed `.ts` file it is given in `files`, and TypeScript's own library, nothing else from the source (its compiler host shows TypeScript only those files, `TPG-20`; checked by its read log, `TOOL-52`).
- **TOOL-41** **Each tool is responsible for producing correct output** (`toolset.md`, section 4.2). It checks its parameters, and its result where it needs to, and fails with a run error rather than write something wrong. The Runner's refresh check (`RUN-17` to `RUN-22`) decides whether to run a tool; it doesn't make the tool's output correct.
- **TOOL-43** **Parameters that affect the output, and those that don't** (`toolset.md`, section 4.5).
  - Each parameter in `--info` carries `affectsOutput`. Those with `true` follow `TOOL-02` exactly.
  - Those with `false`, such as `store_path` (`DATA-21`), are optional. If one is missing, the tool uses its default, or works it out from the input by its own means, without affecting the Runner; if it can do neither, it fails early. For `store_path`, the default is `./zaansouvi/tools/<tool>/` in the working folder.
  - `last_run.json` is only ever a complete input (`TOOL-02`), never a source for one missing parameter.
  - The tool records, for each one, whether the input gave it or its default applied (`nonOutputParameterSources`: `input` or `default`) in its log and `result.json`.
  - The output never depends on these parameters.
- **TOOL-44** A tool returns its diagnostics with its work, and the tool helper writes them into `result.json` and onto the dry run's go line (`DATA-14`, `DATA-17`); they never go in an output file or `--info`. M1 does this from version 0.5.0.
- **TOOL-42** **Agreed key names** (`DATA-19`). Every key a tool writes, in its output, `--info`, `result.json`, `last_run.json` and dry-run lines, has the one meaning agreed for that name, as listed in the reference schema (`DATA-20`). A tool that needs a new meaning uses a new name. It reads the records in its input by those agreed names; it doesn't read another tool's `--info` (`DATA-18`).

## Error codes

| Code | Kind | Example |
|---|---|---|
| `E1` | invocation | both `--json` and `--stdin`; unknown option |
| `E2` | invocation | `--json` file missing; JSON doesn't parse |
| `E3` | invocation | no parameters and no usable `last_run.json` |
| `E13` | invocation | required parameter missing or of the wrong shape |
| `E14` | invocation | run from inside the examined source: the working folder is the source root or under it. The message says tools must never be run from the source path; nothing is written (`toolset.md`, section 4.5). Only tools given `source_root` can check it: M1 and `ts-program`, through the tool helper |
| `E6` | run | the file to read is missing or unreadable |
| `E12` | run | a value is incorrect, incongruent, or lacks what the tool needs; the file has syntax errors |
| `E8` | run | any unexpected failure |

These follow `toolset.md`, section 4.6.

## ts-program, the only tool run

- **TOOL-50** `ts-program` 0.2.0 (`app/tools/ts-program/`): runs TypeScript's own compiler over every listed `.ts` file in one invocation (a program tool, `toolset.md`, section 4.2, `TS-37`), and writes per source file its declarations, every use resolved to the declaration TypeScript names, and its import links. Design: `42_tool_ts_program.md`; what a correct output is: `41_typescript_program_plan.md`, section 1.1; records: the MVP 2 schema (`DATA-24`), with 0.2.0's `declaredWith`, `defaultExport` and the `override` and `accessor` modifiers (`FND-110`).
- **TOOL-51** Parameters: `source_root`, `files` (a list), `configs` (refused in 0.2.0, `TPG-D4a`), `store_path`. With no configuration, the options of `tsc --init`. Syntax errors stop it (`E12`); type errors are counted, never a stop. Its dry run checks the parameters and the syntax, with no checker.
- **TOOL-52** Checks: `tests/ts-program/check.mjs` (exact match with `expected-mvp2/`), `tests/ts-program/check-definitions.mjs` (every edge against TypeScript's "go to definition", `FND-99`), determinism, and the read log (only the listed files and TypeScript's library).

## M1, M2 and M3

M1, M2 and M3 are kept as built and are not run in MVP 2 (`TPG-01`, `RUN-33`). They are **stale and frozen**: not maintained, kept for future tests such as wrong data and wrong input (`97_second_implementation.md`, section 4). Their requirements are in `summary/00_definitions_mvp1.md` and `mvp1/docs_2026-11-10/04_tools.md`:

- M1 `file-symbols`: **TOOL-10** parse with the parser, no type checking; **TOOL-11** the symbols it lists; **TOOL-12** references, not property names after a dot; **TOOL-13** resolve references within the same file; **TOOL-14** reference kinds: declaration, write, call, read.
- M2 `cross-file-links`: **TOOL-20** link imports from the symbol records alone; **TOOL-21** package specifiers give `external`; **TOOL-22** M2 checks only its own input; **TOOL-23** use-site links for imported names; **TOOL-24** M2's remaining rules and invocation errors.
- M3 `symbol-scope`: **TOOL-30** a file scope and top-level function scopes; **TOOL-31** assigning symbols to scopes; **TOOL-32** a function without a `range` fails; **TOOL-33** each scope names its owner; **TOOL-34** where scopes are placed; **TOOL-35** the order of scopes and memberships; **TOOL-36** M3's run and invocation errors.
- The supported constructs of M1's happy path, and what counts as an acceptable failure (`MVP-11`).
