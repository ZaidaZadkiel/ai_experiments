# Definitions: the working files

Every ID in the product design's working files, in order of ID, with its current settled text only: no history, no struck wording, no "was" and "is". Almost all are questions: a resolved one gives its answer, a partly answered one what is settled and what is open, an open one the question. Each entry gives the ID, its status and the file that owns it; the owner file holds the reasons and the history. Written 2026-11-10, updated the same day for the merged questions. Summary: `00_where_we_are.md`.

**Prefixes:** [`DOC`](#doc), [`DT`](#dt), [`MVP`](#mvp), [`ORG`](#org), [`RN`](#rn), [`SEC`](#sec), [`TS`](#ts), [`VW`](#vw).

## DOC

The deliverable, from `CLAUDE.md`.

- **DOC-1** · *Resolved* · `CLAUDE.md`
  **Format and location.** One Markdown file, `feasibility_and_execution_plan.md`, with this folder attached. It is written after enough has been decided; not a concern for now. Recorded in `CLAUDE.md`, "What this repository is".
- **DOC-2** · *Resolved* · `CLAUDE.md`
  **Outline.** A very short, human-readable description with links to the documents in this folder. The exact sections follow when the file is written. Recorded in `CLAUDE.md`, "What this repository is".
- **DOC-3** · *Resolved* · `CLAUDE.md`
  **Readers of the document.** The developer in charge of the implementation, working with AI assistance and their own expertise. Recorded in `CLAUDE.md`, "What this repository is".
- **DOC-4** · *Resolved* · `CLAUDE.md`
  **Language and length.** English, roughly 1 to 5 pages, at the very highest level; all details live in the working files. Recorded in `CLAUDE.md`, "What this repository is".

## DT

Data topology, from `data_topology.md`.

- **DT-1** · *Resolved* · `data_topology.md`
  **Which option, or which combination.** Option D: each tool describes itself with `--info`, stating its own parameters and outputs. No manifest. Recorded in `data_topology.md`, "Chosen: option D, no manifest".
- **DT-2** · *Open* · `data_topology.md`
  **Shared names.** Is there a shared list of data names, and is it a full dictionary (A or B) or a plain list of names?
- **DT-3** · *Open* · `data_topology.md`
  **Containment** *(leaning: declared by the child with `containedIn` in `--info`, plus parent IDs in the data; sections 5 and 7)*: declared, read from the data, or both? May a parent also list the children it expects?
- **DT-4** · *Open* · `data_topology.md`
  **Granularity.** How fine-grained is a data name (section 3)?
- **DT-5** · *Open* · `data_topology.md`
  **Subsets.** How does a category say it's a subset of another, such as TypeScript files out of all files (section 5)?
- **DT-6** · *Open* · `data_topology.md`
  **Several parents.** Can a category sit under several parents (section 5)?
- **DT-7** · *Open* · `data_topology.md`
  **Kind inheritance.** Is it worth having from the start (section 2)?
- **DT-8** · *Open* · `data_topology.md`
  **Internal state.** The three questions in section 4.

## MVP

MVP scope, from `MVP_scope.md`.

- **MVP-1** · *Resolved* · `MVP_scope.md`
  **Basic examined source.** For the MVP, the test source is in `mvp_docs/test_plan/` (a runnable app) and `mvp_docs/zaansouvi-mvp/test-source/`, and its expected result in `mvp_docs/zaansouvi-mvp/expected/`, written by the developer. Recorded in `mvp_docs/07_delivery.md`, `DEL-04`; `FND-21`.
- **MVP-2** · *Resolved* · `MVP_scope.md`
  **How M1 is called.** Once per file: a tool reads only one file per invocation. Recorded in `toolset.md`, section 4.2.
- **MVP-3** · *Resolved* · `MVP_scope.md`
  **Deduplication.** For the MVP, one symbol per declaration and every occurrence a reference; M1 does this and its tests check it. Recorded in `mvp_docs/04_tools.md`, `TOOL-11` to `TOOL-14`; `FND-21`.
- **MVP-4** · *Resolved* · `MVP_scope.md`
  **What "scope of related symbols" shows.** M3 records the lexical scope only, from M1's symbols alone: the file scope and one scope per top-level function, each scope naming its `owner` (the function symbol, or the file for the file scope). The symbols a scope is used with are shown by the Viewer, which lifts M1's references and M2's links up to the nearest visible container with a generic rule, the one it already uses for file edges. Nested and block scopes are kept for after the MVP (section 10.3). Recorded in `mvp_docs/04_tools.md`, `TOOL-33`, and `05_viewer.md`, `VIEW-13`; `mvp_docs/99_findings.md`, `FND-55`.
- **MVP-5** · *Open* · `MVP_scope.md`
  **Contracts kept.** Is the list in section 4 the right amount of the full design for a proof of concept, or should the MVP drop more (for example the database) to stay smaller? The MVP includes incremental runs, the Runner's cache, a run lock and a tool helper.
- **MVP-6** · *Resolved* · `MVP_scope.md`
  **Viewer in the MVP.** The graph has at least two levels, defined once the tools are decided on. Recorded in `MVP_scope.md`, section 5.
- **MVP-7** · *Resolved* · `MVP_scope.md`
  **Tokenizing versus parsing.** Use an existing library or built-in feature when it solves the requirement, so M1 uses an existing TypeScript parser rather than a hand-made tokenizer. Which one is a technology choice. Recorded in `MVP_scope.md`, section 1.
- **MVP-8** · *Open* · `MVP_scope.md`
  **Success criteria.** Are the criteria in section 7 the right ones, and is a run time target needed?
- **MVP-9** · *Resolved* · `MVP_scope.md`
  **What each tool hands on.** For the MVP, what a symbol, a reference, a cross-file link and a scope contain, and which of them M2 and M3 receive, is defined in `mvp_docs/02_data_contracts.md`, accepted for that folder (`mvp_docs/README.md`).
- **MVP-10** · *Resolved* · `MVP_scope.md`
  **Each tool's `--info`.** For the MVP, the parameters (data name, shape, required) and outputs of M1, M2 and M3 are defined in `mvp_docs/02_data_contracts.md`, accepted for that folder (`mvp_docs/README.md`).
- **MVP-11** · *Resolved* · `MVP_scope.md`
  **Supported constructs.** For the MVP, the TypeScript constructs M1–M3 must handle are defined in `mvp_docs/04_tools.md`, accepted for that folder (`mvp_docs/README.md`); everything else is an acceptable failure.
- **MVP-12** · *Resolved* · `MVP_scope.md`
  **Stable ID rule.** For the MVP, the minimal rule that lets M2 and M3 refer to M1's symbols is defined in `mvp_docs/02_data_contracts.md`, accepted for that folder (`mvp_docs/README.md`).
- **MVP-13** · *Resolved* · `MVP_scope.md`
  **Layout on disk.** For the MVP, where the single database, each tool's store, logs and `last_run.json`, and the Runner's log go is defined in `mvp_docs/01_architecture.md`, accepted for that folder (`mvp_docs/README.md`).
- **MVP-14** · *Resolved* · `MVP_scope.md`
  **Test plan.** For the MVP, where the expected result lives, whether the comparison is automatic, which broken inputs are tried and the go / no-go each should give, and what the person judging the Viewer looks at are defined in `mvp_docs/06_test_plan.md`, accepted for that folder (`mvp_docs/README.md`).
- **MVP-15** · *Resolved* · `MVP_scope.md`
  **Traceability level, deliverables and time box.** For the MVP, how much traceability it shows, what it hands over, and how long it may take are defined in `mvp_docs/07_delivery.md`, accepted for that folder (`mvp_docs/README.md`).

## ORG

Project organization, from `project_organization.md`.

- **ORG-1** · *Open* · `project_organization.md`
  **Single root.** Adopt the single-root organization in this file?
- **ORG-2** · *Open* · `project_organization.md`
  **Where tool results live.** In each tool's work space (`tools/<tool>/result.*`), as the user's wording "on its own store" suggests, or in `shared/results/<tool>.*`, so tool work spaces stay fully private?
- **ORG-3** · *Open* · `project_organization.md`
  **Runner configurations.** In `runner/configs/`, as decided ("in the Runner's data"), or in `config/runner/`, with every config in one place? Related to `RN-8`.
- **ORG-4** · *Open* · `project_organization.md`
  **Config committed in the examined project.** May tools read a project-wide config committed in the examined repository, with lower precedence than `config/project.*`, as long as they never write it?
- **ORG-5** · *Open* · `project_organization.md`
  **Finding the root.** Program location by default with `--root` to override, or another way, such as an environment variable?
- **ORG-6** · *Open* · `project_organization.md`
  **Several users.** Is one root per user enough, or must several users share one install?

## RN

Runner, from `runner.md`.

- **RN-1** · *Open* · `runner.md`
  **Listing contents.** Besides last run, failures and errors, and files processed, what else does the configuration listing include? For example duration, tool versions, which tools were skipped as unchanged, and whether the last run was a dry run. Is only the last run kept per configuration, or a short history?
- **RN-2** · *Partly answered* · `runner.md`
  **Run logs.** A tool's dry run writes no log; the Runner's dry run may (section 9). Open: if the Runner's dry run writes a log, where, given that a dry run never changes work data? How long are logs kept: all of them, the last few per configuration, or until the user clears them? Does the log record why each tool was skipped (unchanged inputs, not applicable, omitted)?
- **RN-3** · *Partly answered* · `runner.md`
  **Snapshot when a later tool fails.** Staging exists and uses temporary files (section 8). Open: a tool that fails writes nothing partial, but tools earlier in the same run may already have written their new current data. The outputs on disk would then mix new and old states, which goes against the one-snapshot rule. Options: tools write to a staging area and the Runner makes the whole run current in one step only when every tool succeeds (where the staging area would sit: `project_organization.md`, section 8); or the mix is allowed and recorded, so the Viewer and the status page can mark the outputs that are older than the rest.
- **RN-4** · *Resolved* · `runner.md`
  **Omitting a tool others depend on.** Disabling a tool also disables the tools that depend on its output, and enabling one enables the tools it needs; the Viewer keeps the configuration valid (`viewer.md`, section 4.11). A named configuration written by hand is still checked by the Runner before a run. Recorded in `runner.md`, section 3.
- **RN-5** · *Open* · `runner.md`
  **Naming saved configurations.** How are the named Runner configuration files named when saved from the Viewer? Can there be several, for example a quick one and a full one, and can the Viewer overwrite one that was written by hand?
- **RN-6** · *Open* · `runner.md`
  **Missing or outdated inputs.** When a tool's input is missing or older than the source, does the Runner run the tool that produces it first, or fail early? Proposed in `data_topology.md`, section 8: a run aimed at a target includes the missing upstream tools, while a tool run on its own fails early.
- **RN-7** · *Open* · `runner.md`
  **Data from omitted tools.** If an omitted tool's earlier output is still in the store, may included tools read it, or does omitting a tool also mean its data counts as missing?
- **RN-8** · *Open* · `runner.md`
  **Configuration in the Runner's data.** Other tools keep their config in config files with a precedence order (`toolset.md`, section 4.1), but the Runner's configuration is a named file in its data. Is the Runner the exception, does it also have an ordinary config file, and where does a named configuration sit in the precedence order? Related: `TS-16`, `ORG-3`.
- **RN-9** · *Open* · `runner.md`
  **The Runner and the tool conventions** *(note: the Runner has at least one option of its own, `--human`, section 10.1)*: does the Runner follow the common tool conventions, such as the common options, a dry-run option, `--info` and `--log`, even though it is not an analysis tool?
- **RN-10** · *Open* · `runner.md`
  **Cancelled runs.** The Viewer can cancel a run (`viewer.md`, section 3.3). What does a cancelled run leave in the stores, and how is it recorded in the log and the listing?
- **RN-11** · *Partly answered* · `runner.md`
  **Passing dry-run data between tools.** The Runner can hand data to a tool in its JSON parameters, on standard input with `--stdin` (`toolset.md`, section 4.5); and it may keep data of its own in the database, even in a dry run, and read it into a tool's JSON (section 5). Open: in a dry run of the whole process, a later tool needs the data an earlier tool only printed. Does the Runner hand it over on the later tool's standard input, does each tool's dry run read only the saved stores (so the chain previews each step against the last real run), or something else?
- **RN-12** · *Partly answered* · `runner.md`
  **What to load into the database.** The Runner decides per value, based on what it represents (`TS-28`; section 5). Open: how does `--info` state what each output value represents, so the Runner can decide whether it goes in the database and into which part, without built-in knowledge of each tool? What happens to a tool's part of the database when the tool is omitted or no longer applies?
- **RN-13** · *Resolved* · `runner.md`
  **File list: Runner or tool.** The Runner provides the file list, as data no tool produces (section 4); the file inventory stays a tool that determines each file's kind with its own heuristics, such as code, SQL or configuration, to improve the details the Runner and the Viewer have (`toolset.md`, section 6.2). Recorded in `runner.md`, section 4.
- **RN-14** · *Resolved* · `runner.md`
  **How the JSON parameters reach the tool.** With `--stdin` (JSON from the calling app) or `--json <path>` (a JSON file in temp or at a specific path), both in the same format. Command-line arguments are read first. Someone running a tool by hand uses the same options, or relies on `last_run.json`. Precedence against config files remains open as `TS-22`. Recorded in `toolset.md`, section 4.5.
- **RN-15** · *Partly answered* · `runner.md`
  **Repeated runs of a tool.** The dry run before the real run checks that the JSON is correct (section 1.1). Open: which kinds are allowed (describing the tool, preparatory runs to gather information or work out parameters, dry run, real run), in what order, and is there a limit? Doing a dry run before every real run roughly doubles the work on large codebases (`TS-13`): may the Runner skip it when nothing relevant changed? Do preparatory runs need a mode of their own, since they are neither dry nor real runs?
- **RN-16** · *Open* · `runner.md`
  **Database updated per tool.** The database is updated after each tool, so if a later tool fails, the database already holds the new facts of earlier tools. Does staging (`RN-3`) also cover the database, so the whole run's database changes become current together, or are per-tool updates accepted and recorded?
- **RN-17** · *Partly answered* · `runner.md`
  **Viewer-specific parameters of the Runner.** They include dry-run only and read cache, or similar (section 10). Open: what is the full list, and how are they kept from changing what a real run does, so all invocations stay equal?
- **RN-18** · *Partly answered* · `runner.md`
  **Human format settings.** They are global configuration, in the configuration database (section 10.1). Open: which defaults apply before anything is configured (for example `dd/mm/yyyy` and the system time zone)? Besides dates, does the format cover durations, sizes or paths? Does the Viewer UI use the same settings?
- **RN-19** · *Deferred* · `runner.md`
  **Tool installation.** The specifics are to be defined later. Settled so far: the record of tools may be kept in the configuration database, only the Runner installs, and the Viewer may upload a file the Runner reads for installation; installation and removal are out of the MVP's scope (section 1.0). Open: what does installing a tool involve, what is the uploaded file, where does it sit until the Runner reads it, and how does the Runner learn that a tool was added, removed or updated?
- **RN-20** · *Resolved* · `runner.md`
  **Dry runs and the cache.** A dry run updates only data useful for the Runner and leaves the Viewer's cache alone; it may add diagnostics for the Viewer, never anything that affects the graph. Recorded in `runner.md`, section 10.2.
- **RN-21** · *Open* · `runner.md`
  **Where the cache lives.** In the Runner's work space, as files per run configuration, or in the database; and whether data passed between tools is copied into it or referenced (section 10.2, `project_organization.md`).

## SEC

Security, from `security.md`.

- **SEC-1** · *Resolved* · `security.md`
  **Redaction.** No redaction; the user may see every part of the examined source. Recorded in `security.md`, section 2.
- **SEC-2** · *Open* · `security.md`
  **Paths outside the project.** Should following symbolic links outside the examined project be allowed at all, even with a setting?
- **SEC-3** · *Open* · `security.md`
  **Limits.** Which limits (file size, file count, nesting) are on by default, and can the user change them?
- **SEC-4** · *Open* · `security.md`
  **Sharing.** If a static export for sharing is added (`VW-9`), what does it leave out by default?
- **SEC-5** · *Open* · `security.md`
  **Runtime connections.** If runtime data becomes in scope, which environments may it connect to, and how does the user confirm it?
- **SEC-6** · *Open* · `security.md`
  **Enforcing what a tool reads and writes.** The limits on what a tool reads and writes are design rules the Runner doesn't check (`toolset.md`, section 4.2). Is that enough, or should a later version enforce them, for example with sandboxing from the operating system? If so, what is off limits by default?

## TS

Toolset, from `toolset.md`.

- **TS-1** · *Partly answered* · `toolset.md`
  **Missing tools.** The project overview steps are listed in section 6.8, and there is one tool per type of runtime data, such as SQLite details or file type checks (section 6.7). Open: are there more tools not yet listed? Candidates: a database schema step, or one per kind of infrastructure source.
- **TS-2** · *Open* · `toolset.md`
  **Code quotes.** Which step extracts the code quotes? Each tool for its own records, the shared library, or a separate step?
- **TS-3** · *Open* · `toolset.md`
  **Links.** Where are source links built? In the Viewer and the Mermaid generator when they display them, or by one step that writes them out for both?
- **TS-4** · *Open* · `toolset.md`
  **Infrastructure as one step or several.** One step for all infrastructure sources, or one per kind of source (deployment files, cloud definitions, container definitions)?
- **TS-5** · *Partly answered* · `toolset.md`
  **Runtime data.** Each type of runtime data falls to its own tool, for example SQLite row counts read from a SQLite file in the project (section 6.7). Open: is reading from a running database or service, rather than from files in the project, in scope? If it is, it is a separate optional tool with its own concerns (`security.md`, section 10). `VW-18` is merged into this question.
- **TS-6** · *Partly answered* · `toolset.md`
  **Which levels need which tools.** Levels 1 and 2 need the project overview steps (section 6.8). Open: the rest of the Viewer's level hierarchy (`VW-19`) decides which further tools must exist.
- **TS-7** · *Resolved* · `toolset.md`
  **Dry run in the Viewer.** The Viewer can start a dry run and shows its result. Recorded in `viewer.md`, section 3.2.
- **TS-8** · *Resolved* · `toolset.md`
  **Standard output or temporary files.** A dry run prints everything to standard output and uses no temporary files. Recorded in `toolset.md`, section 4.3.
- **TS-9** · *Resolved* · `toolset.md`
  **Implementation stack.** The Runner and the Viewer are TypeScript and form a unit. Tools may run on any stack; the Runner only needs how to invoke each tool, from the record of tools (`runner.md`, section 1.0). For the MVP, tools are TypeScript (`MVP_scope.md`).
- **TS-10** · *Open* · `toolset.md`
  **Infrastructure sources.** Which kinds of infrastructure definitions are in scope, for example deployment files, container definitions, cloud definitions written in TypeScript, or other configuration-language files?
- **TS-11** · *Open* · `toolset.md`
  **TypeScript scope.** Is mixed JavaScript in scope? Which frameworks need special handling, for example decorators, dependency injection or UI components? Which monorepo setups must be supported?
- **TS-12** · *Open* · `toolset.md`
  **Paths across platforms.** How are paths handled on Windows and POSIX systems, including case sensitivity and symbolic links? This affects stable IDs and links.
- **TS-13** · *Open* · `toolset.md`
  **Performance targets.** What size of codebase must ZaAnSouVi handle (files, lines of code), and what run times are acceptable for a first run and an incremental run?
- **TS-14** · *Open* · `toolset.md`
  **Existing tools.** Which existing tools already cover parts of this, and what is built new versus reused?
- **TS-15** · *Partly answered* · `toolset.md`
  **Planning.** The MVP scope is in `MVP_scope.md`. Open: what is the first version (MVP), how is the work phased, and what are the risks and success criteria?
- **TS-16** · *Open* · `toolset.md`
  **Where global settings sit.** Confirm the proposed precedence order with global settings (section 4.1). When a setting is set both globally and per project, the per-project value presumably wins. `VW-26` is merged into this question.
- **TS-17** · *Moved* · `toolset.md`
  Moved to `RN-1`.
- **TS-18** · *Moved* · `toolset.md`
  Moved to `RN-2`.
- **TS-19** · *Moved* · `toolset.md`
  Moved to `RN-3`.
- **TS-20** · *Resolved* · `toolset.md`
  **`--log` with a dry run and other output.** A dry run never writes a record to the file system or the database, and prints all its data to standard output for the Runner. Recorded in `toolset.md`, section 4.3.
- **TS-21** · *Resolved* · `toolset.md`
  **What tools read from the database.** The Runner reads and writes the database to build each tool's JSON parameters, according to what the tool states with `--info`. Each invocation must make sure it can create the required JSON, and a JSON may carry extra, unused values. Follow-up: `TS-28`. Recorded in `toolset.md`, section 4.5.
- **TS-22** · *Partly answered* · `toolset.md`
  **Precedence of JSON input and `last_run.json`.** Both `--json` and `--stdin` together is an error; tools have no defaults of their own (section 4.5). Open: where do the JSON input and `last_run.json` sit relative to the tool's config file, the project-wide config, global settings and built-in defaults (4.1, `TS-16`)? Does the Runner build the JSON from the config files, so config reaches a tool only through the JSON?
- **TS-23** · *Resolved* · `toolset.md`
  **`last_run.json` after a failed run.** A failed run updates `last_run.json` too, so running again with no changed data fails again. Recorded in `toolset.md`, section 4.5.
- **TS-24** · *Resolved* · `toolset.md`
  **The role of `--log`.** `--log` is optional and redirects the log to another program or file; every tool always writes its own log. Recorded in `toolset.md`, section 4.5.
- **TS-25** · *Resolved* · `toolset.md`
  **`last_run.json` and isolation between codebases.** `last_run.json` lives in the tool's store, and stores are separate per codebase (5.4); with no store given, the store is `./zaansouvi/tools/<tool>/` in the working folder (4.5). Recorded in `toolset.md`, sections 4.5 and 5.4.
- **TS-26** · *Resolved* · `toolset.md`
  **Missing defaults: invocation error or run failure?** A tool that can't begin work, including one with no usable `last_run.json` and no sane defaults, doesn't log and writes nothing. Recorded in `toolset.md`, sections 4.5 and 4.6.
- **TS-27** · *Resolved* · `toolset.md`
  **Inadequate parameters versus inadequate data.** Only the tool's internal check of the parameters it reads is an invocation error (E13, nothing logged). Once the parameters are read correctly, any error is a run error and is logged. Recorded in `toolset.md`, sections 4.5 and 4.6.
- **TS-28** · *Resolved* · `toolset.md`
  **Work data for later tools.** The Runner reads each tool's output and decides, per value, whether it belongs in the database based on what it represents. On each tool call it works out and builds the correct JSON from the database and the outputs it has read. How large the JSON may become on big codebases is part of `TS-31`. Recorded in `runner.md`, section 5.
- **TS-29** · *Open* · `toolset.md`
  **Who reads config files.** Tools read only their JSON input, `last_run.json` and their internal state (4.2), so they don't read their own config file, the project-wide config or global settings. Does the Runner read all of them and put the effective values into each tool's JSON? If so, the precedence order in 4.1 is applied by the Runner, and "the format each tool declares for its config" (in which the Viewer writes tool config) becomes the parameters the tool states with `--info`.
- **TS-30** · *Open* · `toolset.md`
  **Command-line arguments with no JSON.** A tool invoked with no parameters repeats exactly its last run. If it is invoked with some command-line arguments but no JSON input, does it take `last_run.json` and override those values, or does it need a JSON input?
- **TS-31** · *Open* · `toolset.md`
  **One file per invocation at scale, and JSON size.** A tool reads one file per invocation, so a codebase with thousands of files means thousands of tool processes per file-reading tool, each with its own JSON, dry run and log. And a tool like M2 that needs every file's results gets one very large JSON. Are both acceptable (`TS-13`), or may the Runner keep a tool process running and feed it one file after another, as long as each invocation still reads one file?
- **TS-32** · *Open* · `toolset.md`
  **"All analysis details" in the codebase database.** The codebase database holds "the file list and all analysis details" (5.2), but tool-specific work data never goes in the database, and the Runner decides per value what goes there. Does "all analysis details" replace the work-data rule, so the Runner may put everything into the codebase database, or does it mean every detail the Runner judges to belong there?
- **TS-33** · *Partly answered* · `toolset.md`
  **The configuration database.** It is shared by the Runner and the Viewer's backend, which may edit it directly (5.2). Open: which settings does it hold: only the Runner's output preferences, or all personal global settings (4.1), replacing a settings file? Where does it sit in the precedence order (`TS-16`)?
- **TS-34** · *Deferred* · `toolset.md`
  **Changing global settings from the command line.** Deferred; not in the MVP's scope. How is the process defined for changing ZaAnSouVi's global settings, in the configuration database, from the command line? For example a Runner parameter, a separate small program, or none (Viewer only). It must keep the Runner and the Viewer in sync, respect the structure version, and show what will change, like the Viewer's confirmation dialog.
- **TS-35** · *Open* · `toolset.md`
  **Shared library for tools on any stack.** Tools may run on any stack, but 5.5 decided a common library used by every tool. Is the shared part only the language-neutral contract (formats for parameters, `--info`, logs, `last_run.json`, outputs), with an optional TypeScript library implementing it? How is a tool on another stack checked against the contract?
- **TS-36** · *Resolved* · `toolset.md`
  **One file per invocation, if tools may read anything.** Tools don't read anything they like: a tool reads one file per invocation, except program tools (`TS-37`), and never the database. A tool that needs more is a design error in that tool. The Runner doesn't check it; it checks a tool only through its input and output. Recorded in `toolset.md`, section 4.2.
- **TS-37** · *Resolved* · `toolset.md`
  **Program tools.** Program tools are allowed as a named exception: a tool may read every listed file of its one file type in one invocation, declared in `--info`. Recorded in `toolset.md`, section 4.2; `mvp_docs/99_findings.md`, `FND-96`.

## VW

Viewer, from `viewer.md`.

- **VW-1** · *Resolved* · `viewer.md`
  **Stale or partial.** Partly malformed output becomes a pending version, marked visually, and the user decides whether to save it. Recorded in `viewer.md`, section 5.
- **VW-2** · *Open* · `viewer.md`
  **How much to skip.** Is skipping single malformed records acceptable, or does one malformed record make the whole file untrusted?
- **VW-3** · *Resolved* · `viewer.md`
  **Other tools' config.** The config manager edits the configuration of the entire toolset, globally or per project, with manual save and confirmation. Recorded in `viewer.md`, sections 4.11 and 4.13.
- **VW-4** · *Open* · `viewer.md`
  **Unresolved edges.** Shown as marked placeholder nodes by default, or hidden with only a count?
- **VW-5** · *Resolved* · `viewer.md`
  **Fixing from the Viewer.** The UI shows what failed and offers options to fix it, and running a tool again is as simple as invoking it from the UI. Recorded in `viewer.md`, section 4.14.
- **VW-6** · *Open* · `viewer.md`
  **Codebases per server.** One server for all stored codebases with a switcher in the UI, or one server per codebase?
- **VW-7** · *Resolved* · `viewer.md`
  **Watching for changes.** No watching. The user always starts runs or refreshes manually. Recorded in `viewer.md`, section 3.2.
- **VW-8** · *Open* · `viewer.md`
  **Source access.** May the server serve source text beyond the recorded quotes, for example the whole file around a reference?
- **VW-9** · *Open* · `viewer.md`
  **Static export.** Is a read-only export of a view that works without the server needed, for sharing with someone who didn't run the tools?
- **VW-10** · *Open* · `viewer.md`
  **Combined views.** Are views that combine several tool outputs in scope from the start, or only one view per output at first?
- **VW-11** · *Open* · `viewer.md`
  **Comparing two states.** Is it in scope to compare two states of the same codebase, for example before and after a change?
- **VW-12** · *Resolved* · `viewer.md`
  **Decide per run or per view.** One decision per run. Recorded in `viewer.md`, section 5.
- **VW-13** · *Resolved* · `viewer.md`
  **Several pending versions.** A newer run replaces a pending version that is still waiting. Recorded in `viewer.md`, section 5.
- **VW-14** · *Open* · `viewer.md`
  **Showing the difference.** When asking, should the Viewer highlight what differs between the pending version and the previous complete one, not only what is malformed?
- **VW-15** · *Open* · `viewer.md`
  **Color assignment.** Which grouping level gets identity colors by default (file, module, package), and can the user pin a color to a specific object?
- **VW-16** · *Open* · `viewer.md`
  **Style catalog customization.** Can users change the shared icons, colors and line styles, for example in the Viewer config, as long as the same concept stays consistent across views?
- **VW-17** · *Open* · `viewer.md`
  **Arranging and saved positions.** When the user runs automatic arranging, does it override manual positions, or only place nodes that were never moved by hand?
- **VW-18** · *Moved* · `viewer.md`
  Merged into `TS-5`, the same question.
- **VW-19** · *Partly answered* · `viewer.md`
  **The full level hierarchy.** Levels 1 and 2 are defined in 4.9.1. Open: which levels exist below level 2, and in what order? Where do the infrastructure, module and symbol views fit? Which lower views does each kind of node open into?
- **VW-20** · *Open* · `viewer.md`
  **Several lower views.** A node may have more than one useful lower view. For example, a server could open into its modules, its routes or its env vars. Which one does zooming in open, and can the user pick another from the drawer?
- **VW-21** · *Open* · `viewer.md`
  **Switching views at the same level.** Besides moving up and down, can the user switch sideways between views of the same object, for example from a module's variables view to its calls view?
- **VW-22** · *Open* · `viewer.md`
  **Ctrl + wheel conflicts.** In browsers, Ctrl + wheel normally zooms the whole page, and pinch-to-zoom on a trackpad usually reaches the page the same way as Ctrl + wheel. Should the Viewer take over Ctrl + wheel inside the graph area? How should trackpad users zoom inside a view without changing level by accident? Is there a keyboard alternative for moving between levels?
- **VW-23** · *Open* · `viewer.md`
  **Status bar contents.** Is the proposed content of the status bar right (4.8), and where are runs and dry runs started from: the status bar, the header, or the drawer?
- **VW-24** · *Open* · `viewer.md`
  **Status page structure.** How is the text overview organized? For example, by level (infrastructure, modules, symbols), by tool, or by file. Is it one long page or split into sections?
- **VW-25** · *Resolved* · `viewer.md`
  **Manual save everywhere.** Only changes to how the tools operate and to saved run data are saved manually; UI state such as the current view and node positions is saved automatically. Recorded in `viewer.md`, section 4.13.
- **VW-26** · *Moved* · `viewer.md`
  Merged into `TS-16`, the same question.
- **VW-27** · *Open* · `viewer.md`
  **Naming.** "Viewer" names both the whole UI and the graph page. Should the graph page get its own name, for example "Graph"?
- **VW-28** · *Open* · `viewer.md`
  **Run configurations** *(related: the Runner configurations of ZaAnSouVi have their own view, 4.14)*: in level 1, does "run configurations" mean how the examined project is run (for example its scripts and launch settings), how ZaAnSouVi was run on it, or both?
- **VW-29** · *Open* · `viewer.md`
  **AI-enabled.** What makes a project count as "AI-enabled"? For example, configuration or instruction files for AI coding assistants, or the use of AI libraries in the code. Should the overview list which assistants or libraries it found?
- **VW-30** · *Open* · `viewer.md`
  **Versions.** Which versions does level 1 show? For example, the project's own version, the TypeScript and runtime versions it targets, and the versions of its main dependencies.
- **VW-31** · *Open* · `viewer.md`
  **Several packages.** In a monorepo, does level 1 show one overview for the whole repository, with each package as a node, or one overview per package? Does each package have its own known outputs in level 2?
- **VW-32** · *Open* · `viewer.md`
  **Level 2 as one view or several.** Are the configuration details, the directory structure and the known outputs one combined view, or separate views of the same level?
- **VW-33** · *Moved* · `viewer.md`
  Moved to `RN-4`.
- **VW-34** · *Moved* · `viewer.md`
  Moved to `RN-5`.
- **VW-35** · *Open* · `viewer.md`
  **Where the run configurations view lives.** Is it part of the config manager page, or a fourth page in the header (4.10)?
- **VW-36** · *Resolved* · `viewer.md`
  **Direct reads or through the Runner.** The configuration database is read directly; the codebase database goes through the Runner. Tool stores are proposed to go through the Runner too. For the MVP this detail may be omitted (`MVP_scope.md`). Recorded in `viewer.md`, section 3.1.
- **VW-37** · *Resolved* · `viewer.md`
  **Enabling a tool with disabled inputs.** Enabling a tool also enables the tools that produce its inputs; the Viewer keeps the configuration always valid, and won't save one with no tool enabled. Recorded in `viewer.md`, section 4.11.
- **VW-38** · *Deferred* · `viewer.md`
  **A desktop window around the page.** Deferred until the MVP's findings; the browser is kept for now. Wrap the same HTML page in a desktop window (one that ships its own browser engine, or one that uses the system's), so closing the window stops the Viewer, there is no open local port or token, and only one instance runs. Against: a large dependency, packaging, and an app harder to inspect than a page. It would replace the [Decided] browser and local server in section 2, so it needs a new decision. To answer it: how much the browser's lifecycle (stopping, a second start) and its security handling (token, origin checks) cost in practice in the MVP. Starting it from GNOME Files or a shortcut needs the same care either way.
- **VW-39** · *Deferred* · `viewer.md`
  **Layout strategy.** Deferred until the MVP's findings. How each view places its nodes (4.5). Directions found in the MVP (`mvp_docs/99_findings.md`, `FND-72`, `FND-73`), none decided: layouts by rule, where a node's place follows from what it is (the entered scope as a frame, its contents inside, other places around it); a layered layout following the direction of edges (tied to which way arrows point, `FND-71`); frames for containers such as scopes; positions the user moved, remembered per codebase and per view (4.5, [Proposed]); and stability across code changes, so a familiar view stays familiar from run to run (4.6). To answer it: which layouts read best for each level and view, how they scale to large graphs, and whether they can be predictable without being rigid. Evidence from MVP 2 on real code (`mvp_docs/99_findings.md`, `FND-99`): inside one 1,000-line file of ZaAnSouVi's own code, 110 nodes and 349 edges drawn on a grid inside a frame were unreadable, though built and drawn in under a second.
- **VW-40** · *Deferred* · `viewer.md`
  **Arrow direction.** Deferred until after the MVP. Should an edge's arrow point from a definition to where it is used, instead of from the using end to the definition, as the MVP draws it (`mvp_docs/50_viewer_ui.md`, `UI-39`)? The user would prefer the first; it may be improved after the MVP. Section 4.3 states no direction yet. Tied to a layered layout that follows the direction of edges (`VW-39`) (`mvp_docs/99_findings.md`, `FND-71`).
- **VW-41** · *Deferred* · `viewer.md`
  **Navigating between nodes and searching the project.** Deferred until after the MVP. Navigation between nodes needs to be more explicit, and the user needs a way to search for what is within the project. The MVP moves only by double-clicking a node and by the breadcrumb; a dropdown in the breadcrumb listing the nodes that can be entered was offered and not built (`mvp_docs/99_findings.md`, `FND-71`). Related: search by name, path or ID (4.4, [Proposed]); moving between levels (4.9).
