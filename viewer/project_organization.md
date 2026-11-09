# ZaAnSouVi Project Organization

How ZaAnSouVi's own programs and data are organized on disk: where the tools, the Runner and the Viewer each have their own work space, and where the shared store sits that every tool, the Runner and the Viewer can read.

**Nothing in this file is decided yet.** Every item is **[Proposed]**, apart from the scope rule below, which is decided in `toolset.md`, section 1.

Related files: `toolset.md` (shared data, isolation between codebases), `runner.md` (Runner configurations, logs, `RN-3` and `RN-8`), `viewer.md` (Viewer internal storage), `data_topology.md` (data names), `security.md`.

## 1. Scope

- **[Decided]** Only ZaAnSouVi's own tools, Runner and Viewer are a concern here. Where outside programs (git, the language runtime, package managers, the browser) are installed and what they write is not (`toolset.md`, section 1).

## 2. Principles

- **[Proposed]** **One root folder.** Everything ZaAnSouVi's own programs keep (programs, settings, configuration, databases, tool outputs, results, logs and Viewer data) lives under a single ZaAnSouVi root. Nothing is written to user data folders outside it.
- **[Proposed]** **System temp is the only exception**, and only for staging and tools' intermediate data (section 8).
- **[Proposed]** **Nothing is written into the examined project.** It stays strictly read-only.
- **[Proposed]** **Programs are kept apart from data** inside the root, so upgrading ZaAnSouVi never touches settings or stores. ~~One decided exception: each tool's `last_run.json` lives next to its program (section 3).~~ No exception remains: `last_run.json` lives in the tool's store, and program folders are never written (decided by the user on 2026-11-08, `toolset.md`, section 4.5).
- **[Proposed]** **Each program has its own work space**: one per tool, one for the Runner, one for the Viewer.
- **[Proposed]** **One shared store per codebase** holds what tools publish. Every tool, the Runner and the Viewer can read it.
- **[Proposed]** **One writer per path.** The exceptions are the config areas, written by the user and by the Viewer after confirmation, and the configuration database, shared by the Runner and the Viewer's backend ([Decided], `toolset.md`, section 5.2). The codebase database has one writer: the Runner.
- **[Proposed]** **Public and private are separated by folder.** Deleting a private folder that holds internal state or a cache loses speed, never correctness.

## 3. Layout

- **[Decided]** Tools may run on any stack; the Runner starts each one as stated in the record of tools (`runner.md`, section 1.0). The record may be kept in the configuration database ([Decided], `runner.md`, section 1.0).
- ~~**[Decided]** Each tool's folder holds its program and its `last_run.json`: `tool_name/tool_name.bin` and `tool_name/last_run.json` (`toolset.md`, section 4.5). How this fits one store per codebase is `TS-25`.~~
- **[Decided]** Each tool's folder holds only its program: `tool_name/tool_name.bin`. Its `last_run.json` lives in its store, `stores/<codebase-id>/tools/<tool>/last_run.json` (decided by the user on 2026-11-08; `toolset.md`, section 4.5; this resolves `TS-25`). The layout below was updated to match.

```
<zaansouvi-root>/
  app/                                  programs; never written during a run
    tools/<tool_name>/                  one folder per tool
      <tool_name>.bin                   the tool's program
    runner/
    viewer/
    lib/                                the shared library

  settings/
    config.sqlite                       the configuration database: ZaAnSouVi's global
                                        configuration (date format, preferred output, ...),
                                        for every codebase under this root

  stores/
    <codebase-id>/                      one store per codebase (identity key)
      store.*                           identity: key, source root, project name

      config/                           project-wide and per-tool config
        project.*
        tools/<tool>.*                  in the format each tool declares

      shared/                           THE SHARED STORE
        codebase.sqlite                 the codebase database, written only by the Runner:
                                        global facts + catalog of tool outputs

      tools/<tool>/                     each tool's own store and work space
        output/<data-name>/             its outputs, named after what they hold
        result.*                        last result
        logs/<timestamp>.log            the tool's own log, one per real run
        last_run.json                   parameters and outcome of its last real run
        state/                          internal state kept between runs

      runner/                           the Runner's work space
        configs/<name>.*                named Runner configurations
        runs/<name>.*                   facts per configuration (for the listing)
        logs/<timestamp>-<name>.log     run logs

      viewer/                           the Viewer's work space, any form
                                        (preferences, views, positions, cache,
                                        and its own database if it needs one)

<system temp>/zaansouvi-*/              staging, tools' intermediate data during a run,
                                        and JSON parameter files passed with --json
```

## 4. Who reads and writes what

| Area | Written by | Read by |
|---|---|---|
| `app/` | only installing or upgrading ZaAnSouVi | everyone |
| ~~`app/tools/<tool_name>/last_run.json`~~ `stores/<id>/tools/<tool>/last_run.json` | that tool, on every real run, including failed ones | that tool, Runner, Viewer |
| `settings/config.sqlite` (configuration, record of tools, ordering) | the Runner and the Viewer's backend, kept in sync as part of development | Runner, Viewer (never tools) |
| `stores/<id>/config/` | the user, the Viewer (after confirmation) | everyone |
| `stores/<id>/shared/codebase.sqlite` | the Runner only, from the tools' outputs | the Runner only; the Viewer through the Runner (never tools) |
| `stores/<id>/tools/<tool>/output/` | that tool | Runner, Viewer (other tools only as parameters the Runner builds) |
| `stores/<id>/tools/<tool>/result.*` | that tool | Runner, Viewer |
| `stores/<id>/tools/<tool>/logs/` | that tool (not in a dry run) | that tool, Runner, Viewer |
| `stores/<id>/tools/<tool>/state/` | that tool | that tool only |
| system temp | Runner (staging, JSON parameter files), a tool (its intermediate data) | the same program, or the tool given the file with `--json` |
| `stores/<id>/runner/configs/` | the user, the Viewer (after confirmation) | Runner, Viewer |
| `stores/<id>/runner/runs/`, `runner/logs/` | Runner | Viewer |
| `stores/<id>/viewer/` | Viewer | Viewer only |
| the examined project | nobody | every tool, Viewer |

- **[Decided]** Each tool writes only to its own store. Tools never read the database; they read only their JSON input, `last_run.json` and their internal state. Only the Runner reads and writes the database (`toolset.md`, sections 4.2 and 5.2). These are design rules: the Runner checks a tool only through its input and output.
- **[Proposed]** **Tools stay unaware of each other** (`toolset.md`, section 4.2). A tool reads its JSON parameters, which the Runner builds from the database, its `last_run.json` and its own work space. It doesn't read `config/` either (`TS-29`). It finds data **by name** through the catalog in `codebase.sqlite`, which the Runner keeps: for each data name, where it is, which tool produced it and its version.
- **[Proposed]** Outputs sit in folders named after the data they hold, inside the producing tool's store, matching the decision that each tool's output is "named after what it produces" (`toolset.md`, section 4.1).
- **[Proposed]** Every run, from the Viewer or the command line, leaves the same trace: tool results, the Runner's per-configuration facts and timestamped logs. This matches "all invocations are equal" (`runner.md`, section 1).

## 5. Finding the root

- **[Proposed]** By default, each program works out the root from its own location under `app/`, so a copied or portable root works as it is.
- **[Proposed]** A common `--root` option overrides it. It would join the common command-line options (`toolset.md`, section 4.1), and appear in every logged command line.
- **[Decided]** **A tool finds its store from a parameter** (decided by the user on 2026-11-07; `toolset.md`, section 4.5): from the command line or the JSON input (or `last_run.json` when that is the whole input), else ~~its own program folder~~ `./zaansouvi/tools/<tool>/` in the folder it was started from (decided by the user on 2026-11-08; `toolset.md`, section 4.5). A tool run by hand therefore never depends on the Runner to locate its store. (This replaces the proposal that a tool run by hand works out its store from the root.)
- ~~**[Proposed]** The Runner always passes the store, so stores land in the layout above, and the program-folder default is only for runs by hand. That default is a second exception to "programs are kept apart from data" (section 2), besides `last_run.json`.~~
- **[Proposed]** The Runner always passes the store, so stores land in the layout above, and the working-folder default is only for runs by hand. A copy of `stores/<codebase-id>/`, named `zaansouvi`, has the shape a tool run by hand expects (`tools/<tool>/`).

## 6. Paths and moving the root

- **[Proposed]** Paths inside the root are stored **relative to the root**. The codebase identity key and every internal reference never include the root's absolute path, so moving or copying the root keeps every store working.
- **[Proposed]** Paths to the examined project stay absolute, since it lives outside the root. Each store records its source root in `store.*`.
- **[Proposed]** One root holds everything about the codebases it examined. Backing up, cleaning up or copying a whole setup is one folder; one codebase is one `stores/<codebase-id>/` folder.

## 7. Settings, upgrades and users

- **[Proposed]** "Personal global settings" (`toolset.md`, section 4.1) become **settings per root**: they apply to every codebase examined from this root. With one root per user this is the same thing. Several roots give independent setups, for example per team, per ZaAnSouVi version, or a throwaway test root.
- **[Proposed]** Upgrading ZaAnSouVi replaces `app/` only. Stores written by an older version are handled by schema versions, never by deleting them.
- **[Proposed]** The root must be writable by its user. A system-wide install shared by several users doesn't fit this model unless each user has their own root.

## 8. System temp and staging

- **[Decided]** Temporary files are used only for **staging** and for **tool runs that need internal intermediate data** to produce their outputs (`toolset.md`, section 4.2). A tool's dry run writes nothing to the file system; the Runner and the Viewer may write during a dry run (`toolset.md`, section 4.3).
- **[Decided]** A JSON parameters file passed with `--json` may sit in temp, or at a specific path such as another tool's store (`toolset.md`, section 4.5).
- **[Proposed]** The Runner builds its JSON in memory ([Decided], `runner.md`, section 1.1) and passes it with `--stdin`, so it writes no parameter files to temp. Parameter files in temp are for other callers.
- **[Proposed]** Temporary files go to system temp, outside every store, and are removed when the run ends, whether it succeeded or failed.
- **[Proposed]** Staging in system temp means the step that makes a staged run current may cross disks, where a single move isn't possible. The step must still never leave a half-current store. How this is done is deferred to the technology section.

## 9. Viewer UI state

- **[Proposed]** The Viewer UI keeps preferences, views and node positions in the Viewer's work space, through the server, not in the browser's own storage. The browser is an outside program, but where the Viewer saves its own state is ZaAnSouVi's choice, and keeping it under the root keeps the single-folder rule.

## 10. Alternative considered: data inside the examined project

A `.zaansouvi/` folder inside each examined codebase was considered and doesn't fit the current decisions:
- it writes into the examined source, which is meant to stay read-only
- the file inventory would see ZaAnSouVi's own files, and git would report them as untracked
- global settings would have nowhere to live
- a toolset used across several codebases would need one setup per codebase

## 11. Open questions

- `ORG-1` **Single root:** adopt the single-root organization in this file?
- `ORG-2` **Where tool results live:** in each tool's work space (`tools/<tool>/result.*`), as the user's wording "on its own store" suggests, or in `shared/results/<tool>.*`, so tool work spaces stay fully private?
- `ORG-3` **Runner configurations:** in `runner/configs/`, as decided ("in the Runner's data"), or in `config/runner/`, with every config in one place? Related to `RN-8`.
- `ORG-4` **Config committed in the examined project:** may tools read a project-wide config committed in the examined repository, with lower precedence than `config/project.*`, as long as they never write it?
- `ORG-5` **Finding the root:** program location by default with `--root` to override, or another way, such as an environment variable?
- `ORG-6` **Several users:** is one root per user enough, or must several users share one install?

## 12. Deferred to the final technology section

- the default location of the root
- file names and extensions inside the layout (`store.*`, `result.*`, configuration files)
- the format of the catalog in the codebase database
- how a staged run is made current safely when system temp is on another disk
