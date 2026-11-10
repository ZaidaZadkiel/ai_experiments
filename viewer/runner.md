# ZaAnSouVi Runner

The Runner is the program that runs the ZaAnSouVi tools: it works out which tools to run and in what order, invokes them, and records what happened. This file holds every decision and open question about it.

Each item is marked:
- **[Decided]**: agreed in discussion.
- **[Proposed]**: inferred, to be confirmed or changed.
- **To define**: a point the analysis must still work out.

Related files: `toolset.md` (what every tool has in common, shared data, the other tools), `viewer.md` (the Viewer, which starts runs and shows Runner configurations), `data_topology.md` (how tools describe what they read and write, and how the order is derived from it), `security.md` (security concerns, including the Runner's).

## 1. Purpose and place

- **[Decided]** Runs the full process with **one command**, using defaults, from TypeScript source to the tool outputs and the Mermaid diagrams. The Viewer builds its own display data from those outputs (`toolset.md`, section 6.10).
- **[Decided]** **Working out the order is the Runner's job alone.** Each tool is unaware of the other tools and of the order they run in (`toolset.md`, section 4.2).
- **[Decided]** **All invocations are equal.** The Runner behaves and logs the same way whether it was started from the Viewer or the command line. It has no Viewer-specific behavior.
- **[Decided]** **Reading the database is the Runner's responsibility.** Tools never read it; they get what they need as parameters the Runner builds (`toolset.md`, section 4.2).
- **[Decided]** **The Viewer doesn't create tool parameters of its own.** It delegates that to the Runner.
- **[Decided]** **The Runner may have Viewer-specific parameters; no tool may have any.**
- **[Decided]** **For running the tools, the Runner can be replaced by a user's own scripts**, using only the tool contract (decided by the user on 2026-11-08; `toolset.md`, section 2). It holds no knowledge a tool's correct output depends on. **The Viewer uses only the Runner's output**, so a user's scripts don't feed the Viewer; changing that would be a new decision.
- **[Proposed]** "All invocations are equal" and Viewer-specific parameters fit together like this: Viewer-specific parameters change only how the Runner reports back to the Viewer (for example progress updates or the form of its answers), never which tools run, with which parameters, or what is written. A command-line run and a Viewer run with the same configuration produce the same results and the same logs (`RN-17`).
- **[Proposed]** Sane defaults belong to the Runner: a tool invoked with no parameters only repeats its last run or fails (`toolset.md`, section 4.5), so the one-command run works because the Runner builds every tool's parameters from its defaults.
- **[Decided]** **It checks for sane defaults when it runs on its own.** It never assumes the Viewer or a saved configuration exists.
- **[Proposed]** The Runner is a program, not an analysis tool. Apart from the file list (section 1.1), which is data no tool produces (section 4), it writes no facts about the examined code. Whether it still follows the common tool conventions, such as the common options, a dry run and `--info`, is open (`RN-9`).

### 1.0 Stack and the record of tools

- **[Decided]** **The Runner is written in TypeScript, like the Viewer. The Runner and the Viewer are considered a unit.**
- **[Decided]** **Tools may run on any stack.** The Runner considers only **how to invoke each tool**, as stated in the **record of tools**. It gets that record either by running the tool directly or when the tool is installed.
- **[Proposed]** The record of tools holds, for each installed tool, how to start it (for example the program to run and any fixed arguments) and what its `--info` returned. It is generated from the tool itself, never written by hand, so it isn't a manifest and can't drift from the tool (`data_topology.md`, `DT-1`).
- **[Proposed]** When the record is filled at installation, the Runner doesn't call `--info` before every run. It refreshes the entry when the tool's version changes, or when the user reinstalls the tool.
- **[Proposed]** Since the Runner and the Viewer are a unit in one language, the contracts they share (configuration database access and version check, the Runner's Viewer output and go / no-go results, the log reader, `--info` types) can be one shared TypeScript library for the two of them. Codebase database access stays in the Runner only (`viewer.md`, section 3.1).
- **[Decided]** **The configuration database may hold the record of available tools.**
- **[Decided]** **Only the Runner can install a tool.**
- **[Decided]** The Viewer can **upload a file that the Runner reads for installation**. The Viewer itself installs nothing.
- **[Decided]** How installation works in detail is **deferred**, to be defined later (`RN-19`).
- **[Proposed]** Installing is when the Runner fills the tool's entry in the record of tools (how to start it, its `--info`) and works out the ordering again (section 2). Removal does the reverse.

### 1.1 The run process

- **[Decided]** A run goes through these steps:
  1. **Read the configuration.**
  2. **Find the examined source directory.**
  3. **Read all files and update the file list.**
  4. **Decide which tools to run, and in what order.**
  5. For each tool, in that order:
     1. For a tool whose `--info` says it reads files, **invoke it once per file**: a tool reads only one file per invocation (`toolset.md`, section 4.2). A program tool is invoked once, with every listed file of its type (`toolset.md`, section 4.2, `TS-37`). The file's path goes in the parameters.
     2. **Send the tool its parameters as a JSON structure** with well-defined parameters: database values, file locations and all other relevant information. Which parameters depend on the tool. The JSON goes on standard input with `--stdin`, or as a file with `--json <path>` (`toolset.md`, section 4.5).
     3. When the tool finishes, **read its log and its output from the tool's store**.
     4. **The same tool may be run several times**: to gather information it needs, to work out the required parameters, and as a **dry run to make sure the tool will process correctly**.
     5. Once the tool has run for the actual, updated result, **read the result, update the database, and continue with the next tool**.
- **[Proposed]** The file list comes before deciding the order because which tools apply, and which inputs changed, depend on the files (section 2).
- **[Decided]** **The Runner reads and writes the database to build each tool's JSON**, formatted according to what the tool states with `--info` (`toolset.md`, section 4.5).
- **[Decided]** **The Runner builds the JSON in memory**, in the form the tool requires.
- **[Decided]** **The Runner checks that the JSON is correct with a dry run** of the tool before the real run.
- **[Decided]** **The tool saves the JSON to its `last_run.json` once it is correct**, that is, once the tool has validated that the run can begin (`toolset.md`, section 4.5).
- **[Proposed]** Since the JSON lives only in memory, the Runner passes it with `--stdin`, to the dry run and then to the real run, unchanged. It doesn't need a parameters file in temp; `--json <path>` stays for manual runs and other callers.
- **[Proposed]** If the dry run reports an invocation error, the JSON is wrong. That is a Runner bug: the Runner stops, logs it as such, and doesn't start the real run.
- **[Decided]** **Each invocation must make sure it can create the JSON the tool requires.** If a required value can't be produced, the Runner doesn't start the tool; starting it anyway would be a Runner bug.
- **[Decided]** The JSON may contain any number of extra, unused values besides the required ones.
- **[Proposed]** So the Runner may build one JSON with everything it knows and hand the same one to several tools, or build a smaller one per tool. Both are valid.
- **[Proposed]** The JSON parameters are the tool's whole contract with the Runner. Tools never read the database (`toolset.md`, section 4.2).
- **[Decided]** **The Runner checks a tool only through its input and its output**, never what the tool reads or does. A tool that reads more than ~~its one file~~ the files it is given, or the database, is a design error in that tool (`toolset.md`, section 4.2).
- **[Decided]** Each tool states its own parameters and outputs with `--info` (`data_topology.md`, `DT-1`).
- **[Proposed]** The structure of the JSON parameters is the one the tool states with `--info`. The Runner checks the parameters against it before it starts the tool, and the tool checks them when it reads them. A missing or malformed parameter (a shape problem) is an invocation error; that is a Runner bug, caught by the dry run. A value problem, such as incongruent values, is a run error of the tool (`toolset.md`, section 4.4).
- **[Proposed]** When the dry run reports a value problem, the Runner doesn't start the real run either. It records the tool's run error in its log, not as a Runner bug, since the values came from the data.
- **[Proposed]** Every invocation in step 5, including the preparatory runs and the dry runs, is logged in the Runner's log with its timestamp, its exact command line and the JSON parameters it received (section 7), so any step can be repeated by hand.
- **[Decided]** A dry run only writes to standard output, so the Runner reads a tool's dry-run results from there, not from a log file (`toolset.md`, section 4.5).
- **[Decided]** An invocation that throws an error updates nothing in the tool's folder or store (`toolset.md`, section 4.5).
- **[Proposed]** For such an error, the Runner's own log is the only record, so it records the error it got back from the tool.
- **[Proposed]** The dry run before the real run is also the status check of `toolset.md`, section 4.3, done per tool: if it reports a failure that can be prevented, the Runner stops before the real run, and the work data stays untouched.
- **[Proposed]** Since the database is updated after each tool, a later tool sees the facts loaded from earlier tools in the same run. How this fits the one-snapshot rule when a later tool fails is `RN-16` (related to `RN-3`).
- **[Decided]** The file list is the Runner's; the file inventory tool determines each file's kind (`RN-13`, `toolset.md`, section 6.2).
- **To define:** which repeated runs are allowed (`RN-15`).

## 2. Run order

- **[Decided]** **The configuration database is the source of the ordering**, derived from each tool's `--info`.
- **[Decided]** **A named configuration may hold whether each tool runs.**
- **[Decided]** So there are two layers:
  - **the ordering**, in the configuration database: every available tool, in the order derived from what each one's `--info` states it takes and produces. It is ZaAnSouVi-wide, the same for every codebase, and is worked out again whenever the record of tools changes (a tool added, removed or updated). How it is derived is in `data_topology.md`, section 8.
  - **the selection for one run**: the Runner takes the ordering, drops the tools the named configuration says not to run, drops tools that don't apply to this codebase, and skips tools whose inputs haven't changed.
- **[Decided]** The Viewer always lists every recorded tool and marks whether it runs, and lets the user enable or disable each one in the named configuration. The Viewer keeps the configuration always valid: disabling or enabling a tool does the same for every tool it requires or that requires it, and a configuration with no tool enabled can't be saved (`viewer.md`, section 4.11).
- **[Proposed]** Because the ordering is stored, the Viewer can show it directly from the configuration database (`viewer.md`, section 3.1), and the order of a run can always be explained from it.
- **[Decided]** Which tools are in the order can be changed: **tools can be added or omitted**.
- **[Decided]** **Files are handled in one fixed order: sorted by file ID**, by plain string comparison (decided by the user for the MVP on 2026-11-07, `mvp_docs/03_runner.md`, `RUN-28`; adopted for the product on 2026-11-08). A tool run once per file is invoked in that order, and every list the Runner builds by file follows it: the file list, the data it sends to tools, and its cache. The order changes no tool's output; it makes the stop point after a failure, the run log, the decision whether a tool needs to run again, and the cache the same on every run, as the product's repeatability needs (`toolset.md`, section 2).
- **[Proposed]** Adding or omitting tools chooses which tools run. The order between them always comes from the ordering in the configuration database, never written by hand.
- **[Proposed]** Without a named configuration (section 3), the Runner uses every available tool that applies to the codebase, in the stored ordering. This keeps the decided one-command run with no configuration (`toolset.md`, section 4.1).
- **[Proposed]** ~~Since tools assume the stores are current and valid~~ Since a tool is unaware of the other tools and checks only what it is given (`toolset.md`, section 4.2), deciding what is current is the Runner's job: it checks that a tool's inputs are not older than the source before starting it.
- **To define:** what the Runner does when a tool's input is missing or out of date (`RN-6`), and when an omitted tool's data is needed by an included tool (`RN-7`).

## 3. Configuration

- **[Decided]** **The Runner's configuration lives in the Runner's data as a named file.** The invocation must name the file to use it.
- **[Decided]** The Viewer keeps its own order and can **save it as a named Runner configuration**, to override the command-line run (`viewer.md`, section 4.11). It is written in the format the Runner declares.
- **[Proposed]** Saving a configuration from the Viewer doesn't change a command-line run by itself. The command line uses it only when the invocation names that file.
- **[Proposed]** When a named configuration is given, the Runner checks it before running anything, as part of failing early:
  - the file exists and can be read
  - every tool it names is known and installed
  - every included tool's inputs are produced by an included tool or are already present

  A problem stops the run before any tool starts. The dry run reports the same checks.
- **[Proposed]** These checks matter for configurations written by hand. One saved by the Viewer is always valid, including having at least one tool enabled (`viewer.md`, section 4.11); the Runner still checks it, since a file can change after it was saved.
- **To define:** how the named configuration relates to the config files and precedence order of the other tools (`RN-8`), and how the files are named (`RN-5`).

## 4. Invoking tools

- **[Decided]** Sends each tool its parameters as a JSON structure with well-defined parameters (section 1.1).
- **[Decided]** **For each parameter, the Runner sends only the records of the data name the tool asks for**, taken from the output of the tool that produces it, never the rest of that output file (decided by the user for the MVP on 2026-11-08, `mvp_docs/03_runner.md`, `RUN-19`; adopted for the toolset on 2026-11-08). This follows from the principle that each tool depends on as little as possible from other tools' outputs (`toolset.md`, section 2).
- **[Decided]** Passes the JSON with `--stdin` or `--json <path>`, both in the same format. The path may be in temp or in another tool's store (`toolset.md`, section 4.5).
- **[Decided]** After each tool run, **reads the tool's log and the output it produced**.
- **[Decided]** **Calling a tool without the parameters it needs to begin work and read its inputs is a bug in the Runner.** An invocation error writes nothing and isn't logged by the tool (`toolset.md`, sections 4.5 and 4.6).
- **[Proposed]** So the Runner checks the parameters against the tool's declared structure, and the inputs it names, before the real run. The dry run and the preparatory runs (section 1.1) are where this is checked.
- **[Proposed]** When a tool still reports an invocation error, the Runner stops the run, writes the tool's error into its own log marked as a Runner bug, and reports it as such. It doesn't retry with other parameters. Every tool writes its own log in the same format as the Runner's.
- **[Proposed]** Passes the common command-line options on to every tool as command-line arguments, which take precedence over the JSON (`toolset.md`, section 4.5).
- **[Proposed]** The Runner's run log refers to each tool's log for that run and copies the entries it needs, such as results, failures and diagnostics. The tool's log stays the full record of the tool's run.
- **[Proposed]** After each tool, reads the tool's result record from the tool's own store: success or failure, the failure message, when it ran, its version and what it read. The tool never reports to the Runner directly.
- **[Proposed]** Runs tools one at a time, keeping the toolset's no-concurrency rule (`toolset.md`, section 4.2).
- **[Proposed]** **Starts every tool in its own data folder**, never in the folder the Runner itself was started from, so a Runner started from inside the examined source still never runs a tool there (E14, `toolset.md`, section 4.5). The Runner always passes each tool's store, so the tools' working-folder default never applies to its runs.

**One run at a time** (decided by the user on 2026-11-07)
- **[Decided]** **When a run starts, the Runner takes a lock, so another run can't start** while it lasts.
- **[Decided]** **Tools need no locking.** They are assumed to run only from the Runner (`toolset.md`, section 4.2).
- **[Decided]** **A user may still start a tool by hand.** If its output changes, that is the user's action, not an error.
- **[Decided]** **A problem from such a change shows up only when wrong input is read.** Whoever reads it, a tool or the Runner, then detects the failure and writes an error and a diagnostic.
- **[Proposed]** A dry run of the Runner takes the lock too, since it may write (section 9); "read cache" doesn't, since it only reads and the cache is replaced in one step.
- **[Proposed]** A lock left behind by a run that crashed must not block every later run: the lock records which process holds it, and a lock whose process is gone is taken over, with a note in the log.

**Data the Runner provides** (decided by the user on 2026-11-07)
- **[Decided]** **The Runner attempts to provide the data that tools require but no tool produces**, such as the file list, the order, and the values of the store paths.
- **[Decided]** **It reads that data from the saved configuration; if it isn't there, it tries to create it from defaults. If the data isn't valid, the Runner fails.**
- **[Decided]** The source root goes only to tools that read files: a tool declares `source_root` for that, and every file path it receives depends on it (`toolset.md`, section 4.2; decided by the user on 2026-11-08).
- **[Decided]** **Some of this data depends on the user's configuration**, for example the path of the examined source. Such data is internal to the Runner and the Viewer; the tools don't need it as such. **If user-defined data is missing, the Runner outputs a diagnostic saying what is missing, and fails.**
- **[Proposed]** A required parameter whose data name is neither produced by a tool nor provided by the Runner is a missing value too: the Runner fails before any tool starts, naming the tool and the parameter. An optional parameter that doesn't affect the output is simply not sent, and the tool uses its default (`toolset.md`, section 4.5).

## 5. Loading the database

- **[Decided]** **Only the Runner writes to the codebase database**, based on the outputs of the tools. Tools write only to their own stores (`toolset.md`, sections 4.2 and 5.2).
- **[Decided]** Once a tool has run for the actual result, the Runner reads the result, updates the database, and only then continues with the next tool (section 1.1).
- **[Decided]** **The Runner reads the output of each tool and decides, for each value, whether it belongs in the database, based on what the value represents.**
- **[Decided]** **On each tool call, the Runner is responsible for working out and building the correct JSON and sending it to the tool.** It builds it from whatever it has: the database and the tool outputs it has read.
- **[Proposed]** "Based on what it represents": values that are global facts (files, git facts, env vars, which outputs exist) go into the database; detailed work data of one tool, such as M1's symbols and references, stays in that tool's store, and the Runner reads it from there when a later tool needs it. This keeps "tool-specific work data never goes in the database" (`toolset.md`, section 5.2).
- **[Proposed]** The Runner knows what a value represents from the outputs the tool states with `--info` (`DT-1`). How exactly `--info` says it is `RN-12`.
- **[Proposed]** After a tool succeeds, the Runner reads its output from the tool's store and loads the values that belong in the database into that tool's part of it. It also records which outputs exist, their schema versions and what they were built from.
- **[Proposed]** When a tool fails, the Runner loads nothing from it, and that tool's part of the database stays as it was.
- **[Decided]** **The Runner may write the database whenever it's useful, in a dry run or a real run** (decided by the user on 2026-11-07). It may keep data of its own there (Runner-specific data, not tool work data, so `toolset.md`, section 5.2 still holds), and read it back to build the JSON for a tool invocation.
- **[Proposed]** In a dry run, the Runner loads no tool output into the database, and writes nothing that claims a tool ran for real or that an output is current. Otherwise a later real run could skip work it still has to do.
- **To define:** how the Runner knows what to load from each output and where, without built-in knowledge of each tool (`RN-12`), and the rule for which values go in the database (`RN-12`).

## 6. Configuration listing

- **[Decided]** **The Runner can list its saved configurations**, through an option similar to `--list-config` (the exact invocation is undecided). For every named configuration it lists all known facts about its runs, including when it last ran, the list of failures and errors, and the files processed.
- **[Proposed]** To list them, the Runner records the facts of each run per named configuration, in its own data next to the configuration files. The run without a named configuration is recorded under a reserved default name, so it can be listed too.
- **[Proposed]** The listing only reads. It writes nothing and runs no tool.
- **[Proposed]** Its output is careful output: parsable, with stable field names, so the Viewer's run configurations view (`viewer.md`, section 4.14) reads it like any other fact.
- **[Proposed]** These recorded facts are run provenance (`data_topology.md`, section 4).
- **To define:** what else the listing includes, and how much history it keeps (`RN-1`).

## 7. Run log

- **[Decided]** **The Runner writes a text log of each run**: which files it read, which tool it invoked with which options, what result each tool had, and similar details.
- **[Decided]** Each log is saved **under the Runner's own folder, with a timestamp**.
- **[Decided]** For each tool invocation the log shows the **timestamp** of the invocation and the **exact command line** used to invoke the tool. It logs **failures**, and **diagnostics** when they are available.
- **[Decided]** **The log carries human-readable comments.** Each comment line starts with a marker at the beginning of the line. A parser can ignore comment lines, or search them for labels.
- **[Decided]** The format of a comment can indicate its type or similar metadata, so comments can be told apart and searched by kind.
- **[Proposed]** So the log has two layers: entries a parser reads (invocations, command lines, results, failures, diagnostics) and comment lines for people. Removing every comment line leaves a complete, parsable log; the comments explain, they never hold facts found nowhere else.
- **[Proposed]** Comment types could include, for example: section headings per tool, explanations of why a tool was skipped, where an option value came from (`toolset.md`, section 4.1), and hints on how to fix a failure. **To define:** the list of comment types and labels.
- **[Proposed]** The exact command line is enough to repeat a single tool's step by hand, which supports the rule that a run can be explained and repeated (`toolset.md`, section 4.1).
- **[Proposed]** Failures and diagnostics keep their source locations, as file:line references, like everywhere else (`toolset.md`, section 3).
- **[Proposed]** The log names the Runner configuration used, or the default, so it can be matched to the configuration listing (section 6). The listing's facts and the log describe the same run.
- **[Proposed]** The log is not work data. It is written even when a run fails early, and ends with the reason it stopped.
- **To define:** dry-run logs, how long logs are kept, and skip reasons (`RN-2`).

## 8. Failures and the one-snapshot rule

- **[Decided]** A real run fails early at the first error (`toolset.md`, section 4.4).
- **[Decided]** A failing tool never writes partial data to its store, and tools write only current data (`toolset.md`, sections 4.4 and 5.3).
- **[Decided]** Each run treats the source as one consistent snapshot (`toolset.md`, section 5.3).
- **[Decided]** Temporary files are used for **staging** (and for tools' internal intermediate data), never for dry runs (`toolset.md`, section 4.2).
- **[Proposed]** A failed run leaves the work data as it was before the run. When an earlier tool in the same run already succeeded, this conflicts with the one-snapshot rule (`RN-3`).
- **To define:** what a cancelled run leaves behind (`RN-10`).

## 9. Dry run

- **[Decided]** A dry run can be started from the Viewer, and never changes work data (`toolset.md`, section 4.3).
- **[Decided]** A tool's dry run writes no record to the file system or the database. It prints all its data to standard output, and **the Runner reads it from there** (`toolset.md`, section 4.3).
- **[Proposed]** A dry run of the Runner chains the steps through what each tool prints, so later steps work from the earlier steps' dry-run results instead of the saved work data. The whole process can be tried without changing any work data. Since the Runner may keep its own data in the database and read it into a tool's JSON (section 5), it could hold an earlier step's dry-run data there and pass it on. **To define:** how a later tool receives an earlier tool's dry-run data, since tools normally read only from the stores (`RN-11`).
- **[Decided]** **The no-write rule of a dry run binds the tools only** (decided by the user on 2026-11-07; `toolset.md`, section 4.3). In a dry run, the Runner and the Viewer may write whenever it's useful: the Runner's log, listing facts, the database and its own data. The Runner still prints its plan and results to standard output. This answers the dry-run part of `RN-2`: a tool's dry run writes no log; the Runner's may.
- **[Proposed]** It also runs the configuration checks in section 3, and reports which tools would run, which would be skipped, and why.

## 10. The Runner and the Viewer

- **[Decided]** **The Runner doesn't check content for the Viewer** (decided by the user on 2026-11-08). Its checks of tool outputs stay checks of shape; whether a run's output is valid and useful as Viewer data is the Viewer's to check (`viewer.md`, section 6).

- **[Decided]** Runs started from the Viewer go through the Runner and are logged and recorded exactly like command-line runs (section 1).
- **[Decided]** After each run, the Viewer re-reads what is relevant according to the Runner's output for that run (`viewer.md`, section 3.2).
- **[Decided]** The Viewer lists every Runner configuration with its last known state, in its run configurations view (`viewer.md`, section 4.14).
- **[Proposed]** The default one-command run ends by starting the Viewer.
- **[Decided]** **The Viewer calls the Runner with parameters useful for visualization**, for example:
  - **dry-run only**: run only the dry runs, to find out the status and whether everything would process correctly. No tool writes anything (`toolset.md`, section 4.3); the Runner may still write its log and the database (section 9).
  - **read cache**, or similar: get exactly what the Runner cached for a run configuration, without running anything (section 10.2). (This replaces "the data currently stored by the tools".)
- **[Decided]** **The Runner and all the tools share data through the Runner.** What a tool gets, and what anyone else gets from a tool, depends on the Runner.
- **[Decided]** **Real runs stay unchanged.** Viewer-oriented parameters only choose what the Runner does and reports; they never change how a real run behaves or what it writes, so "all invocations are equal" still holds.
- **[Decided]** **The same data must be recreatable by the user calling the Runner by hand.** Everything the Viewer gets from the Runner, the user can get with the same Runner call on the command line, and gets the same result.
- **[Proposed]** So every Viewer-oriented parameter is an ordinary, documented command-line parameter of the Runner, and the Viewer shows the exact Runner command it used, like the logged command lines (section 7), so the user can repeat it.

### 10.1 Output modes

- **[Decided]** **The Runner has two output modes:**
  - **for the Viewer**: easily parsable data, for the Viewer's backend
  - **for people**: text only, formatted for a person to review. For example, dates are shown in the user's time zone and format, such as `dd/mm/yyyy`, instead of a numeric date.
- **[Decided]** The human mode is selected with **`--human`**, a parameter **exclusive to the Runner**. No tool has it.
- **[Proposed]** Without `--human`, the Runner uses the preferred output from the configuration database, and the Viewer mode if none is set. The Viewer asks for its mode explicitly, so a user running the same command by hand gets exactly what the Viewer got (section 10).
- **[Proposed]** Both modes carry the same data; `--human` changes only how it is presented. Nothing about what the Runner runs or writes depends on it.
- **[Proposed]** Output mode affects only what the Runner prints. Its log files keep their one format (section 7), with timestamps stored in an unambiguous form; human formatting is applied when they are shown.
- **[Decided]** **The `--human` format is configurable, and the configuration is kept in the configuration database**: ZaAnSouVi's global configuration, shared by every codebase, not the codebase database (`toolset.md`, section 5.2).
- **[Decided]** The configuration database also holds the **preferred output**.
- **[Proposed]** The preferred output is the mode used when a command gives neither `--human` nor an explicit Viewer mode. The Viewer always asks for its mode explicitly, so a user's preference never changes what the Viewer gets, and a user who copies the Viewer's command gets the same output (section 10).
- **[Decided]** The configuration database is shared by the Runner and the Viewer's backend, which may edit it directly; the two must stay in sync on it as part of development (`toolset.md`, section 5.2).
- **Pending:** how these settings are changed from the command line is not defined yet (`TS-34`); not in the MVP's scope. The earlier proposal follows, kept until that is settled. The Runner could change these settings itself: through a Runner parameter, for a user working from the command line. The Viewer's config manager edits the configuration database directly.
- **[Proposed]** What is configurable: at least the date format and the time zone. Possibly also durations, sizes and how paths are shown (`RN-18`).
- **[Decided]** These settings are global, not per codebase.
- **[Proposed]** A "read cache" call returns the Runner's cache for the run configuration (section 10.2), in a form the Viewer server can parse, together with provenance (which tool, version, when). It reads only; it starts no tool.

### 10.2 The Runner's cache

- **[Decided]** **The Runner keeps a cache for each run configuration, and "read cache" shows exactly what that cache holds** (decided by the user on 2026-11-07).
- **[Decided]** **Each run replaces the Runner's cache** for its run configuration (decided by the user on 2026-11-07).
- **[Decided]** **The cache is the Runner's alone.** It covers the input of the run, its result and its intermediate data (decided by the user on 2026-11-07). Tools never read it: they always work from their inputs, and manage their own cache if they need one (their internal state, `data_topology.md`, section 4).
- **[Decided]** **The Viewer examines the data, preferring to read the Runner's cache** (decided by the user on 2026-11-07; `viewer.md`, section 3.1).
- **[Decided]** **Manual runs are assumed to rewrite the cache in a way that is useful for the Runner and the Viewer** (decided by the user on 2026-11-07).
- **[Decided]** **A manual run is a run of the Runner started from the command line, or by a Viewer function the user uses to reload the Viewer's graph** (decided by the user on 2026-11-07). The Viewer never starts a run on its own (`viewer.md`, section 3.2). Both kinds replace the cache in the same way, which fits "all invocations are equal" (section 1).
- **[Proposed]** What the cache holds, per run: the run's identity and outcome; the file list; the record of tools and the order used; for each invocation, the JSON sent, the dry-run result, the tool's result, and whether it was skipped and why; and the data the tools produced, including outputs of tools skipped as up to date, so the cache always describes the whole current state. This is "the input, the result and the intermediate data".
- **[Proposed]** A failed run replaces the cache too, with what it got, so its failure is visible. The Viewer keeps showing its last saved run from its own cache, as decided (`viewer.md`, sections 3.3 and 5).
- **[Decided]** **A dry run updates only data useful for the Runner, and leaves alone the cache the Viewer uses** (decided by the user on 2026-11-07). It may add diagnostic information for the Viewer to display, but nothing that affects the graph visualization (`viewer.md`, section 3.2).
- **[Decided]** The dry run's diagnostics sit in a separate part of the cache. The next dry run replaces that part; a real run, which replaces the whole cache, drops them, since they no longer describe the current state (agreed by the user on 2026-11-07).
- **[Proposed]** Data of a tool no longer in the record, or of a file no longer in the file list, isn't in the next run's cache. This answers `RN-7` for what the Viewer sees.
- **To define:** where and in what form the cache is kept (the Runner's work space or the database, `project_organization.md`), and how big it may grow when it copies data passed between tools (`RN-21`, related to `TS-31`).

## 11. Security

The Runner's security concerns are tracked in `security.md`, section 7: named configurations are looked up only in the Runner's data, the listing only reads, logs may quote the source and must never hold credentials, and only known, installed tools can be added.

## 12. Open questions

Questions moved here from other files keep a note of their old ID, which is struck through where it was.

- `RN-1` **Listing contents** *(was `TS-17`)*: besides last run, failures and errors, and files processed, what else does the configuration listing include? For example duration, tool versions, which tools were skipped as unchanged, and whether the last run was a dry run. Is only the last run kept per configuration, or a short history?
- `RN-2` **Run logs** *(was `TS-18`; dry-run part answered: a tool's dry run writes no log, the Runner's dry run may, section 9)*: does a dry run write a log too, and if so where, given that a dry run never changes work data? How long are logs kept: all of them, the last few per configuration, or until the user clears them? Does the log record why each tool was skipped (unchanged inputs, not applicable, omitted)?
- `RN-3` **Snapshot when a later tool fails** *(was `TS-19`; partly answered: staging exists and uses temporary files, section 8)*: a tool that fails writes nothing partial, but tools earlier in the same run may already have written their new current data. The outputs on disk would then mix new and old states, which goes against the one-snapshot rule. Options: tools write to a staging area and the Runner makes the whole run current in one step only when every tool succeeds (where the staging area would sit: `project_organization.md`, section 8); or the mix is allowed and recorded, so the Viewer and the status page can mark the outputs that are older than the rest.
- `RN-4` ~~**Omitting a tool others depend on**~~: resolved. Disabling a tool also disables the tools that depend on its output, and enabling one enables the tools it needs; the Viewer keeps the configuration valid (`viewer.md`, section 4.11). A named configuration written by hand is still checked by the Runner before a run (section 3).
- `RN-5` **Naming saved configurations** *(was `VW-34`)*: how are the named Runner configuration files named when saved from the Viewer? Can there be several, for example a quick one and a full one, and can the Viewer overwrite one that was written by hand?
- `RN-6` **Missing or outdated inputs** *(was a "To define" in `toolset.md`, section 5.1)*: when a tool's input is missing or older than the source, does the Runner run the tool that produces it first, or fail early? Proposed in `data_topology.md`, section 8: a run aimed at a target includes the missing upstream tools, while a tool run on its own fails early.
- `RN-7` **Data from omitted tools:** if an omitted tool's earlier output is still in the store, may included tools read it, or does omitting a tool also mean its data counts as missing?
- `RN-8` **Configuration in the Runner's data:** other tools keep their config in config files with a precedence order (`toolset.md`, section 4.1), but the Runner's configuration is a named file in its data. Is the Runner the exception, does it also have an ordinary config file, and where does a named configuration sit in the precedence order? Related: `TS-16`, `ORG-3`.
- `RN-9` **The Runner and the tool conventions** *(note: the Runner has at least one option of its own, `--human`, section 10.1)*: does the Runner follow the common tool conventions, such as the common options, a dry-run option, `--info` and `--log`, even though it is not an analysis tool?
- `RN-10` **Cancelled runs:** the Viewer can cancel a run (`viewer.md`, section 3.3). What does a cancelled run leave in the stores, and how is it recorded in the log and the listing?
- `RN-11` **Passing dry-run data between tools** *(partly answered: the Runner can hand data to a tool in its JSON parameters, on standard input with `--stdin`, `toolset.md`, section 4.5; and it may keep data of its own in the database, even in a dry run, and read it into a tool's JSON, section 5)*: in a dry run of the whole process, a later tool needs the data an earlier tool only printed. Does the Runner hand it over on the later tool's standard input, does each tool's dry run read only the saved stores (so the chain previews each step against the last real run), or something else?
- `RN-12` **What to load into the database** *(partly answered: the Runner decides per value, based on what it represents, `TS-28`; section 5)*: how does `--info` state what each output value represents, so the Runner can decide whether it goes in the database and into which part, without built-in knowledge of each tool? What happens to a tool's part of the database when the tool is omitted or no longer applies?
- `RN-13` ~~**File list: Runner or tool**~~ Resolved (decided by the user on 2026-11-07): the Runner provides the file list, as data no tool produces (section 4); the file inventory stays a tool that determines each file's kind with its own heuristics, such as code, SQL or configuration, to improve the details the Runner and the Viewer have (`toolset.md`, section 6.2). Original question *(earlier leaning: a tool reads one file per invocation, so listing all files fits the Runner, which isn't a tool; `toolset.md`, section 4.2)*: the run process has the Runner read all files and update the file list itself. Does the file inventory tool (`toolset.md`, section 6.2) become part of the Runner, or is it a tool the Runner always runs first? If it becomes part of the Runner, the Runner writes facts about the examined code, and the run order no longer has a "discovery" stage of tools (`data_topology.md`, section 8).
- `RN-14` ~~**How the JSON parameters reach the tool**~~: resolved. With `--stdin` (JSON from the calling app) or `--json <path>` (a JSON file in temp or at a specific path), both in the same format. Command-line arguments are read first. Someone running a tool by hand uses the same options, or relies on `last_run.json` (`toolset.md`, section 4.5). Precedence against config files remains open as `TS-22`.
- `RN-15` **Repeated runs of a tool** *(partly answered: the dry run before the real run checks that the JSON is correct, section 1.1)*: which kinds are allowed (describing the tool, preparatory runs to gather information or work out parameters, dry run, real run), in what order, and is there a limit? Doing a dry run before every real run roughly doubles the work on large codebases (`TS-13`): may the Runner skip it when nothing relevant changed? Do preparatory runs need a mode of their own, since they are neither dry nor real runs?
- `RN-16` **Database updated per tool:** the database is updated after each tool, so if a later tool fails, the database already holds the new facts of earlier tools. Does staging (`RN-3`) also cover the database, so the whole run's database changes become current together, or are per-tool updates accepted and recorded?
- `RN-17` **Viewer-specific parameters of the Runner** *(partly answered: dry-run only and read cache, or similar; section 10)*: what is the full list, and how are they kept from changing what a real run does, so all invocations stay equal?
- `RN-18` **Human format settings** *(mostly answered: global configuration, in the configuration database, section 10.1)*: which defaults apply before anything is configured (for example `dd/mm/yyyy` and the system time zone)? Besides dates, does the format cover durations, sizes or paths? Does the Viewer UI use the same settings?
- `RN-19` **Tool installation** *(deferred: the specifics are to be defined later; decided so far: the record of tools may be kept in the configuration database, only the Runner installs, and the Viewer may upload a file the Runner reads for installation; installation and removal are out of the MVP's scope; section 1.0)*: what does installing a tool involve, what is the uploaded file, where does it sit until the Runner reads it, and how does the Runner learn that a tool was added, removed or updated?
- `RN-20` ~~**Dry runs and the cache:**~~ Resolved: a dry run updates only data useful for the Runner and leaves the Viewer's cache alone; it may add diagnostics for the Viewer, never anything that affects the graph (section 10.2). Original question: a dry run of the Runner is a run, and "each run replaces the cache". Does a dry run replace the cache of real runs, keep a dry-run cache of its own, or leave the cache alone? Proposed: it leaves the real-run cache alone (section 10.2).
- `RN-21` **Where the cache lives:** in the Runner's work space, as files per run configuration, or in the database; and whether data passed between tools is copied into it or referenced (section 10.2, `project_organization.md`).

## 13. Deferred to the final technology section

- the exact name of the listing option (`--list-config` or other) and of the option that names a configuration
- the format of the named configuration files, down to the field
- the log format: the comment marker, the syntax for comment types and labels, and the timestamp format
