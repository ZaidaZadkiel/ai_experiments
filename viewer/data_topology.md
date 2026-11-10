# ZaAnSouVi Data Topology

How ZaAnSouVi describes its data: what kinds of data exist, which tool takes and produces what, how the Runner works out the run order, and how the Viewer works out its view levels.

Decided so far: the Viewer's place (below), the choice of option D with no manifest (below), and the facts marked [Decided] with a pointer to `toolset.md` or `runner.md`. Everything else is still open. The file collects every option discussed so far. Each point is marked:
- **[Makes sense]**: sound as it stands, and consistent with the decisions in the other files.
- **[Needs refinement]**: useful, but with a problem that must be solved first.
- **[Superseded]**: no longer fits a decision made since. Kept so the reasoning stays visible, with the decision that replaced it.

Related files: `toolset.md` (tools, parameters, shared data), `runner.md` (the Runner), `viewer.md` (view levels, open questions `VW-19` and `VW-20`), `security.md`.

## Decisions this file depends on

These were made in other files and shape every section below:
- **[Decided]** Tools describe themselves with `--info`, stating their own parameters and outputs. There is no manifest (`DT-1`).
- **[Decided]** Tools never read the database. A tool reads only its JSON parameters, its `last_run.json` and its internal state derived from the examined source (`toolset.md`, section 4.2). Needing more is a design error in the tool; the Runner checks only a tool's input and output.
- **[Decided]** Only tools whose `--info` says they read files read them, one file per invocation, or, for a program tool, every listed file of its type in one invocation (`toolset.md`, section 4.2, `TS-37`).
- **[Decided]** The Runner reads and writes the database, reads every tool's output, decides per value whether it belongs in the database based on what it represents, and builds each tool's JSON (`runner.md`, sections 1.1 and 5).
- **[Decided]** The Runner reads all files and updates the file list itself (`runner.md`, section 1.1).

So "a tool reads data X" now always means "the Runner hands the tool data X as parameters". Tools never take data from each other or from the database directly.

## The Viewer is outside the topology

- **[Decided]** The Viewer is independent of the tools' format. It has no `--info` or manifest, no category or datatype of its own and no place in the run order. Like the Runner, it reads the stored facts as it needs them.
- **[Decided]** It writes tool configuration in the format each tool declares, and keeps its own data (preferences, views, positions, cache) in internal storage of any kind. Since tools no longer read config files, what "the format each tool declares" becomes is `TS-29`.
- **[Decided]** The Viewer doesn't create tool parameters; it delegates that to the Runner (`runner.md`, section 1).
- **[Makes sense]** So the tools' descriptions serve the Runner first. The Viewer is one more reader of them, mainly to learn which tool produced which data and which settings each tool has.

## Options at a glance

| Option | Idea | Pros | Cons | Status |
|---|---|---|---|---|
| **A. One category dictionary** (section 2) | One catalog of categories. Each entry lists the entities, relations and facts it provides. | One place to look. Ties tools, styles and overview together. | Mixes coarse grouping with specific data shapes. Hard to version finely. | Not ruled out: a dictionary could still give `--info` its names (`DT-2`) |
| **B. Category and datatype dictionaries, plus a manifest file per tool** (section 3) | Categories group data. Datatypes are the specific data. A manifest per tool lists the categories it uses and the datatypes it reads and writes. | Clear contracts per datatype. Precise incremental runs. Lets "one thing well" be checked. | Two dictionaries to maintain. Manifest files can drift from what the tool really does. | Manifest rejected; the dictionaries are still open (`DT-2`) |
| **C. Manifest with input, output, depends on and contains** (section 5) | The manifest also says what lies one level below the tool's output. | Gives the Viewer its level hierarchy. Extensible one level at a time. | "Input" and "depends on" overlap. Declaring children only on the parent's side hurts extensibility. | Manifest rejected; containment can move into `--info` (`DT-3`) |
| **D. Self-describing tools: `--info`** (section 6) | Each tool prints what it takes and produces, as parsable text, when called with `--info`. | One source of truth, can't drift. No registration step. Fits the common command-line options. | Names must match exactly. Says nothing about containment by itself. | **Chosen** (`DT-1`) |

### Chosen: option D, no manifest

- **[Decided]** **Tools describe themselves with `--info`.** Each tool is responsible for stating its own **parameters** and **outputs**.
- **[Decided]** **No manifest.** Options B and C, which rely on a manifest file per tool, are not used.
- **[Decided]** The Runner builds each tool's JSON parameters according to what the tool states with `--info`, from the database and from the tool outputs it has read (`toolset.md`, section 4.5; `runner.md`, section 5).
- **[Makes sense]** What `--info` states must be enough for:
  - the Runner: whether the tool reads files, and which kinds (for example `*.ts`); a tool that reads files declares `source_root`, and one that reads none says so ([Decided], `toolset.md`, section 4.2), since only such tools read files, one per invocation (program tools: all their listed files in one, `TS-37`); the parameters it needs, so the Runner can work out the order (section 8), build the JSON and check it with a dry run; and its outputs, with what each represents, so the Runner can decide what goes in the database (`RN-12`)
  - the Viewer: which tool produced which data, and the tool's settings for the config manager
- **[Makes sense]** For each parameter, `--info` says what it is in terms the Runner can look up: a data name, its **shape**, and whether it is required. The shape is what the tool's parameter check tests; a shape problem is an invocation error (`toolset.md`, section 4.4).
- **[Makes sense]** Ideas from the other options can still be carried inside `--info` where they help, such as a containment hint (`containedIn`, section 7) or names from a shared list (`DT-2`). The dictionaries of options A and B are not ruled out by this decision, only the manifests.
- **[Makes sense]** `--info` is answered by the tool's own code, without reading the examined source, the stores or any parameters, so it always works and never fails for lack of data.

Two topics apply whichever option is chosen:
- **Internal state of tools** (section 4): data a tool keeps for itself, outside any dictionary.
- **How the Viewer finds its levels** (section 7): declared, read from the data, or both.

## 1. Shared building blocks

Discussed with option A, but useful in every option.

- **[Makes sense]** A few small building blocks that every kind of data reuses:

| Building block | What it is |
|---|---|
| ID | A stable identifier derived from the source |
| Location | File ID plus start and end line and column |
| Quote | Source text for a location (no redaction, see `security.md`) |
| Link | Built from a location, the ref and the URL template; derived, not stored |
| Entity | A thing: file, symbol, package, table… Becomes a node |
| Relation | A typed connection between two entities, with its own location. Becomes an edge |
| Fact | Category, name, value and location. Feeds the overview |
| Diagnostic | Severity, code, message, location and the tool that reported it |
| Provenance | Which tool, which version, which snapshot |

- **[Makes sense]** Every location points to a file ID, so the file list is the root that everything is anchored to. The Runner builds the file list (`runner.md`, section 1.1; ~~whether a tool still owns it is `RN-13`~~ the Runner owns it, `RN-13`, resolved), so file IDs reach tools as parameters.
- **[Makes sense]** Two structures sit side by side:
  - a **containment tree**, for example repository › package › directory › file › symbol, which the view levels follow
  - a **relation graph** across the tree, for example reads, imports or deploys-to, which views draw as edges

## 2. Option A: one category dictionary

One catalog lists every category of data and what each provides.

- Categories proposed: run, configuration, files, repository, project, optional details, environment, symbols, references, modules, infrastructure, database schema. Plus data owned by presentation (Viewer data, Mermaid, status text) and UI state.
- Example entry: category `references`, with the relations `reads`, `writes` and `calls`, the fact `referenceCount`, contained in `files.file`, stored in tool files.

What it connects:
- **[Makes sense]** `--info` names dictionary categories instead of free text, so the Runner can check that every parameter a tool needs is produced by some tool, and that versions match.
- **[Makes sense]** The Viewer's style catalog uses one style per dictionary kind, which gives "same concept, same look" a key.
- **[Makes sense]** Overview facts come from the dictionary, so the overview can show "not checked yet" before a tool has run.
- **[Needs refinement]** Each entry says whether the data lives in the codebase database or in tool files. Since then it was decided that the Runner decides this per value, based on what the value represents (`runner.md`, section 5). A dictionary entry could be how the Runner knows what a value represents; that is part of `RN-12`.
- **[Makes sense]** A core dictionary ships with ZaAnSouVi, and tools can add namespaced entries such as `db.tables`.
- **[Needs refinement]** One entry mixes the coarse grouping with the specific data shapes. Versioning a whole category when one relation changes is too coarse. Option B splits the two.
- **[Needs refinement]** Kind inheritance, for example `db.table` is a kind of `infra.store`, helps views and styles handle new kinds, but adds complexity. Not settled whether it's worth it from the start (`DT-7`).

## 3. Option B: category dictionary, datatype dictionary and a manifest per tool

| Piece | Answers | Example |
|---|---|---|
| Category dictionary | What areas of data exist? | `files`, `code`, `infrastructure` |
| Datatype dictionary | What specific data exists, and what shape does it have? | `code.variable`, `code.reads`, `code.symbolCount` |
| Tool manifest | What does this tool touch? | categories used; datatypes read and written |

The manifest is rejected (`DT-1`); its role is taken by `--info`. The dictionaries are still open (`DT-2`).

- **[Makes sense]** Clear contracts: each datatype has one shape and one version. That is "careful with output" at the smallest useful unit, and it gives `--info` the shapes its parameters and outputs refer to.
- **[Makes sense]** Precise incremental runs: the Runner tracks changes per datatype, so only tools whose parameters include a changed datatype re-run.
- **[Makes sense]** "One thing well" becomes checkable: a tool whose `--info` states outputs across many categories is a visible warning.
- **[Makes sense]** The Viewer's styles are keyed by datatype, and an unknown datatype falls back to its category's style.
- **[Makes sense]** Each datatype has exactly one producing tool. Two tools stating the same output is a conflict the Runner reports, unless the datatype is marked multi-writer, for example facts from several detectors.
- **[Makes sense]** Parameters are marked required (drives the order and the invocation check) or optional (affects the order only).
- **[Needs refinement]** "Storage is a property of the category", for example `files` and `environment` in the codebase database, `code` in tool files. Fits the decided rule if it is read as "what the value represents", which the Runner uses to decide (`runner.md`, section 5; `RN-12`).
- **[Makes sense]** The dictionaries are the core plus additions from installed tools. The Runner's dry run checks them for clashes and dangling references.
- **[Superseded]** ~~Categories in the manifest repeat what the datatypes already say.~~ There is no manifest (`DT-1`).
- **[Needs refinement]** Granularity: is `code.reads` its own datatype, or one `code.reference` with a kind field? Finer means more precise runs and styles. Coarser means fewer entries (`DT-4`).
- **[Superseded]** ~~Manifest files kept apart from the tools can drift from what the tools really do.~~ Solved by option D: the description lives in the tool.
- ~~**[Needs refinement]** Not settled whether the Viewer's own data (views, cache, UI state) belongs in the dictionaries.~~ Settled: it doesn't. It lives in the Viewer's internal storage (see "The Viewer is outside the topology").

## 4. Internal state of tools (applies to every option)

A tool may keep state for itself, such as parse caches, indexes or checkpoints.

| Kind of data | Example | Who can read it? | In the shared description? |
|---|---|---|---|
| Public data | `code.reads`, `files.file` | The Runner and the Viewer. Other tools only as parameters built by the Runner | Yes, as outputs in `--info` |
| Parameters of the last run | `last_run.json` | The tool, the Runner, the Viewer | No: it has the shape of the tool's parameters |
| Run provenance | When a tool last ran, its version, outcome, duration | The Runner and the Viewer | Yes, in a `run` category written by the Runner |
| Internal state | Caches, checkpoints | The tool only | No: the tool only says it exists |
| Private but kept | The Viewer's UI state: current view, positions, preferences | The Viewer only | No, but it is never thrown away silently |

- **[Makes sense]** **Internal state may make a tool faster, never make its output different.** Delete it, run again with the same parameters, the same file and the same tool version, and the output must be identical.
- **[Makes sense]** `last_run.json` is not internal state. It holds the parameters of the last real run, and a tool invoked with no parameters repeats it exactly ([Decided], `toolset.md`, section 4.5).
- **[Makes sense]** "Last time executed" looks internal, but the status page and staleness checks need it. It belongs to run provenance, not to internal state.
- **[Makes sense]** The Runner's timestamped text log of each run ([Decided]; `runner.md`) and each tool's own log ([Decided]; `toolset.md`, section 4.5) are run provenance meant for people. They sit in each program's own folder, not in the shared description.
- **[Makes sense]** The Runner records run provenance per named Runner configuration and lists it with its listing option ([Decided]; `runner.md`).
- **[Makes sense]** State that does change the output isn't internal. It is an input and must reach the tool as a parameter, built by the Runner.
- **[Makes sense]** Internal state lives in the tool's own folder in the codebase's store, so isolation and cleanup cover it. It is versioned with the tool and discarded on upgrade, never migrated.
- **[Makes sense]** Intermediate data needed only during one run goes to temporary files, the only use of temp besides staging ([Decided], `toolset.md`, section 4.2).
- **[Makes sense]** Damaged internal state is not an error: the tool discards it, works from its parameters and the file it reads, and notes it in its log (`toolset.md`, section 4.6, E9).
- **[Makes sense]** A dry run may read internal state but never updates it.
- **[Makes sense]** The Viewer's cache, UI state and view definitions are all in its internal storage, outside this table's shared description. The "private but kept" row describes how the Viewer treats its UI state.
- **[Needs refinement]** Resuming an interrupted run from checkpoints is allowed only if the result is identical to a full run. That is the hardest case to guarantee (`RN-10`).
- **[Needs refinement]** Should a "clear tool state" action exist in the config manager or the status page? It changes no outputs, so it might not need the manual-save confirmation.
- **[Needs refinement]** Is "private but kept" unique to the Viewer, or can other tools have it?

## 5. Option C: manifest with input, output, depends on and contains

The manifest is rejected (`DT-1`). The containment ideas can move into `--info`.

Example from discussion:

| Field | Value |
|---|---|
| Input | file list |
| Output | code structure folder list |
| Contains | TS files, env files, static asset files |
| Depends on | file list |

- **[Makes sense]** Containment places the tool's output in the containment tree. The tree grows one level per tool, and zooming in the Viewer follows it.
- **[Makes sense]** The hierarchy is still defined by the app, because the tools ship with ZaAnSouVi. This matches the decision that users can't configure the levels.
- **[Makes sense]** A containment slot is a slot, not a promise. If no installed tool provides a contained category, the Viewer shows it as not available.
- **[Makes sense]** Containment is kept separate from run order. A folder list can exist before anything looks inside the files.
- **[Superseded]** ~~A "depends on" that names other tools.~~ Tools are unaware of each other and there is no manifest; `--info` names data, never tools (`toolset.md`, section 4.2).
- **[Superseded]** ~~"Input" and "depends on" overlap.~~ `--info` states parameters; the Runner derives the dependencies from the data names they refer to.
- **[Makes sense]** Containment declared by the child (`containedIn`), not by the parent. A tool can only describe itself, so a parent can't list children it doesn't know about. The Runner's dry run checks the assembled tree for cycles and missing parents. Whether a parent may also list expected children is part of `DT-3`.
- **[Needs refinement]** "TS files", "env files" and "static asset files" are kinds of files, not separate data. A category needs a way to be a subset of another, for example "files whose kind is TypeScript". Otherwise several tools record the same files (`DT-5`). For source files, the file kinds a tool states in `--info` already express this.
- **[Needs refinement]** Can a category have several parents? An env file could sit under a folder and under project configuration. Several parents fit the code better, but then zooming must remember the path the user came down (`DT-6`).
- **[Needs refinement]** When a node contains several categories, is the lower level one combined view or one view per category? This is `VW-20`.

## 6. Option D: self-describing tools with `--info`

- **[Decided]** This is the chosen option. Each tool states its own parameters and outputs; there is no manifest (see "Chosen: option D, no manifest").
- **[Makes sense]** Fits the decision that each tool is unaware of the other tools and of the run order (`toolset.md`, section 4.2): a tool names the data it takes and produces, and only the Runner connects them.
- **[Makes sense]** `--info` describes the tool; `--log` ([Decided]) redirects a run's log. They are separate options.

Each tool prints a description of itself when called with `--info`. First example from discussion, kept for history:

```json
{"read": {"fileType": "*.ts"},
 "write": {"categories": ["storage.file_list", "storage.file_types", "files.locations", "file.extensions"],
           "stores": ["sql.filetypes.typescript"]},
 "input": "folder_path"}
```

For the Runner:
- **[Makes sense]** One source of truth: the description lives in the tool, so it can't drift from what the tool does.
- **[Makes sense]** No registration step: the Runner calls `--info` on every installed tool and connects each output to the tools whose parameters need it. That gives the run order and the incremental rebuilds.
- **[Makes sense]** `--info` is one more common option, like help and dry run, with parsable output.
- **[Makes sense]** The Runner's dry run can find, before anything runs, parameters that neither a tool produces nor the Runner provides (`runner.md`, section 4: the Runner provides data no tool produces, from saved configuration or defaults), data produced by two tools, and cycles.
- **[Makes sense]** Calling `--info` runs a ZaAnSouVi tool, never code from the examined source. The result is kept in the record of tools, filled by running the tool or at installation ([Decided], `runner.md`, section 1.0), and refreshed per tool version.
- **[Makes sense]** Two kinds of input, now settled by decisions: **source files**, which a tool reads itself only if `--info` says so, one per invocation (program tools: all their listed files in one, `TS-37`), with the kinds it reads (for example `*.ts`); and **other tools' data**, by name, which reaches the tool only as parameters built by the Runner (`toolset.md`, section 4.2).
- **[Needs refinement]** Names must match exactly. The example has both `files.locations` and `file.extensions`. Without a shared list of names to check against, a one-letter difference silently disconnects two tools (`DT-2`).
- **[Needs refinement]** Parameters are marked required or optional, with a shape (section "Chosen"). Outputs still need a version, and a way to say what each represents (`RN-12`).
- **[Needs refinement]** The first example's `input` with a "default": tools have no defaults of their own any more, since a tool invoked with no parameters repeats its last run or fails ([Decided], `toolset.md`, section 4.5). Defaults belong to the Runner. Whether `--info` may still suggest a default for the Runner to use is part of `TS-29`.
- **[Superseded]** ~~The example tool reads `*.ts` from a folder itself, overlapping with the file inventory.~~ A tool reads one file per invocation (program tools excepted, `TS-37`), and the Runner builds the file list ([Decided]). A tool that "lists TypeScript files" would read no files at all: it would get the file list as parameters.
- **[Superseded]** ~~The `stores` entry.~~ Tools never write to the database, and the Runner decides per value what goes there (`runner.md`, section 5). A declaration of what each output represents replaces it (`RN-12`).

Second example, refined during discussion, kept for history. Parts of it are superseded: `read.data` (tools take data only as parameters), `stores` (only the Runner writes the database), the folder scan (one file per invocation) and the `default` (tools have no defaults):
```json
{
  "tool": "list-typescript-files",
  "version": "1.0.0",
  "input": { "folder_path": { "description": "Root folder to scan", "default": "source root" } },
  "read": {
    "sources": ["*.ts", "*.tsx"],
    "data": [ { "name": "files.list", "required": true } ]
  },
  "write": {
    "data": [
      { "name": "files.typescript", "version": 1 },
      { "name": "files.extensions", "version": 1 }
    ],
    "stores": ["sql.filetypes.typescript"]
  },
  "containedIn": "files.folder"
}
```

- **[Needs refinement]** Example under the current decisions, using the MVP's file-symbols tool (`MVP_scope.md`, M1). Illustrative only; the exact fields are deferred to the technology section, and `represents` is one possible answer to `RN-12`:
```json
{
  "tool": "file-symbols",
  "version": "0.1.0",
  "readsFiles": { "kinds": ["*.ts", "*.tsx"] },
  "parameters": {
    "file_path": { "dataName": "files.file.path", "shape": "string", "required": true },
    "file_id":   { "dataName": "files.file.id",   "shape": "string", "required": true }
  },
  "outputs": [
    { "dataName": "code.symbol",    "version": 1, "represents": "work data" },
    { "dataName": "code.reference", "version": 1, "represents": "work data" }
  ],
  "containedIn": "files.file"
}
```

For the Viewer:
- **[Makes sense]** The Viewer learns which tool produced which data (for provenance and the status page), which views are possible, and, if `--info` lists settings, what the config manager can show (how settings reach tools is `TS-29`).
- **[Needs refinement]** Parameters and outputs describe how data **flows**, not what **contains** what, so they don't give the view levels by themselves. See section 7.

## 7. How the Viewer finds its view levels (applies to every option)

Data flow and containment often point the same way, but not always:
- The symbol tool reads TS files, and symbols sit inside files. Flow and containment match.
- The module tool takes symbols as parameters, but modules contain symbols. Containment points the opposite way.

| Approach | Pros | Cons |
|---|---|---|
| **Declared:** the tool's `--info` says where its output sits, for example `containedIn` | Levels known before anything runs; "not checked yet" slots can be shown | Can disagree with the real data |
| **Read from the data:** every record carries its parent's ID | Always matches the real data | Levels exist only after a run |
| **Both** | Expected shape plus the real tree; the dry run can compare them | Two things to keep consistent |

- **[Makes sense]** Using both: the declaration in `--info` gives the expected shape and the "not checked yet" slots, and the parent IDs in the data give the real tree.
- **[Needs refinement]** Depends on the choices in section 5 about several parents, and about one or several views per level.

## 8. Run order and stages (applies to every option)

- **[Makes sense]** Stages give a coarse order that is easy to understand:
  0. discovery: the file list, built by the Runner itself ([Decided], `runner.md`, sections 1.1 and 4), then the file inventory tool, once per file, for each file's kind (code, SQL, configuration; [Decided], `toolset.md`, section 6.2)
  1. project facts: git, project configuration, known outputs, detectors, env vars
  2. code analysis: symbols
  3. relations: modules, infrastructure, database schema
  4. presentation: Mermaid

  The Viewer is not a stage. It builds its data and the status text itself from what the stages wrote.
- **[Makes sense]** A tool's parameters may only come from data produced in its own stage or an earlier one, so a backwards dependency is easy to spot.
- **[Decided]** The ordering is kept in the configuration database, derived from each tool's `--info` (`runner.md`, section 2).
- **[Makes sense]** The exact order is derived, never hand-written. Steps 1, 3, 4 and 5 build the stored ordering when the record of tools changes; steps 2, 6 and 7 select from it for each run:
  1. collect every tool's `--info` from the record of tools
  2. drop tools that don't apply and record them as not applicable, and drop tools omitted by the named Runner configuration, if one is given ([Decided]; `runner.md`), recording them as omitted
  3. connect each tool's parameters to the outputs that produce them
  4. check the graph
  5. order by dependencies, breaking ties by stage then name so every run has the same order
  6. skip tools whose parameters haven't changed
  7. for a tool that reads files, plan one invocation per file ([Decided], `toolset.md`, section 4.2) *(except a program tool, which reads every listed file of its type in one invocation: `toolset.md`, section 4.2, `TS-37`, decided 2026-11-09)*
- **[Makes sense]** "Applies when" is a description such as "files match a pattern" or "a path exists", not code, stated in `--info`. The Runner and the dry run can evaluate it without running the tool.
- **[Makes sense]** When the Runner is asked for a target, its plan includes missing or outdated upstream tools. A tool run on its own with missing parameters fails with an invocation error instead, and the dry run says which tool to run first. Open as `RN-6`.
- **[Needs refinement]** Is "applies when" enough for every check? Some may need more than file patterns and flags, for example "the examined project's package manifest declares a command-line entry point".

## 9. Open questions

- `DT-1` ~~**Which option, or which combination**~~: resolved. Option D: each tool describes itself with `--info`, stating its own parameters and outputs. No manifest (see "Chosen: option D, no manifest").
- `DT-2` **Shared names:** is there a shared list of data names, and is it a full dictionary (A or B) or a plain list of names?
- `DT-3` **Containment** *(leaning: declared by the child with `containedIn` in `--info`, plus parent IDs in the data; sections 5 and 7)*: declared, read from the data, or both? May a parent also list the children it expects?
- `DT-4` **Granularity:** how fine-grained is a data name (section 3)?
- `DT-5` **Subsets:** how does a category say it's a subset of another, such as TypeScript files out of all files (section 5)?
- `DT-6` **Several parents:** can a category sit under several parents (section 5)?
- `DT-7` **Kind inheritance:** worth having from the start (section 2)?
- `DT-8` **Internal state:** the three questions in section 4.
