# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This repository produces a **document, not software**. The deliverable is human-readable text that assesses the **feasibility and requirements** of a proposed toolset named **ZaAnSouVi**, short for "Zaida's Analysis of Source and Viewer". Use this name in the document. There is nothing to build, lint or test. Work here means researching, analyzing, discussing and writing.

The deliverable is **one Markdown file, `feasibility_and_execution_plan.md`, with this folder attached**. The file is a very short, human-readable description with links to the working files below, which carry the detail. It is written only after enough has been decided. **Don't work on it for now**; the current work is the working files.

- **Reader:** the developer who will be in charge of implementing ZaAnSouVi, working with AI assistance and their own expertise. They read the short file for the overall picture and open the working files for the detail.
- **Language:** English.
- **Length:** roughly 1 to 5 pages, so it stays at the very highest level. Every detail lives in its own working file, where the developer can check it.

The central feasibility question is **whether a tool-based source code visualizer can be implemented**.

ZaAnSouVi analyzes **TypeScript codebases** and shows how the code relates at every level (symbols, modules, infrastructure). Its main part is the **Viewer**, an interactive node graph viewer in the browser, backed by a local server, which is also the main entry point to the toolset. The tools also produce static Mermaid diagrams. It analyzes only the current state of the code, never its history.

## Working files

The design is worked out in these files. Each topic lives in exactly one of them:

| File | Contents |
|---|---|
| `toolset.md` | Scope and audience, design principles, traceability, what every tool has in common, shared data (the configuration and codebase databases, incremental runs, isolation between codebases), every known tool, open questions about the toolset |
| `runner.md` | The Runner in detail: run order, named configurations, invoking tools, the configuration listing, the run log, failures and snapshots, dry run, its relation to the Viewer, open questions about the Runner |
| `viewer.md` | The Viewer in detail: server, its pages (Viewer, config manager, status, run configurations; the number is not decided), views, visual language, navigation, saving changes, cache, malformed data, open questions about the Viewer |
| `data_topology.md` | How data is described: the options discussed (dictionaries, manifests, self-describing tools with `--info`), internal state of tools, how the run order and the view levels are worked out. Decided: the Viewer's place outside the topology, and self-describing tools with `--info` (no manifest) |
| `project_organization.md` | How ZaAnSouVi's own programs and data are organized on disk: the single root folder, each program's work space, the shared store, who reads and writes what. Nothing is decided there of its own; its [Decided] items repeat other files' decisions |
| `MVP_scope.md` | The minimum viable product: a proof of concept with the Runner, the Viewer and three tools (file symbols, cross-file links, symbol scope), its test source, what it keeps and leaves out, success criteria |
| `security.md` | Security concerns for the whole toolset (a later step) |
| `mvp_docs/` | Requirements for building the MVP, inferred from the working files. Accepted **only within that folder**: it fills the MVP's gaps (`MVP-9` to `MVP-15`) without changing any decision in the working files. Where it conflicts with a [Decided] item elsewhere, the working file wins and `mvp_docs/` is corrected. It describes MVP 2 as it stands, with no history and no struck wording; MVP 1 and the docs before 2026-11-10 are frozen in `mvp_docs/mvp1/`. See `mvp_docs/README.md` |
| `summary/` | The short reading path for the working files: `00_where_we_are.md` (what the design attempts, what is settled, open, superseded) and `00_definitions.md` (every question ID with its current settled text). The MVP's are in `mvp_docs/summary/` |

When a decision is made or changed, update the file that owns the topic, and fix any other file that refers to it. Don't put design content in this file; it holds only working rules and pointers.

### Conventions in the working files
- Mark each item **[Decided]** (agreed by the user) or **[Proposed]** (inferred, to be confirmed). Use **To define** for points the analysis must still work out. Never mark an inference as decided.
- Every open question has an ID that is unique across all files: a prefix naming its file, a hyphen and a number. Prefixes: `DOC` (this file, the deliverable), `TS` (`toolset.md`), `RN` (`runner.md`), `VW` (`viewer.md`), `DT` (`data_topology.md`), `ORG` (`project_organization.md`), `MVP` (`MVP_scope.md`), `SEC` (`security.md`). Example: `VW-18`. Always refer to a question by its ID, in every file.
- These conventions, struck wording included, apply to the working files. `mvp_docs/` has its own: items rewritten to their current text, history in `mvp_docs/96_mvp2_change_log.md`, MVP 2's open questions as `M2Q-` in `mvp_docs/97_second_implementation.md` (`mvp_docs/README.md`).
- IDs are stable. New questions take the next free number in their file. When one is resolved, strike it through and note the answer and where it is recorded, instead of renumbering or deleting it. When one moves to another file, it gets a new ID there, and the old one is struck through with a pointer to the new one. Mark deferred questions as deferred.
- `data_topology.md` weighs options instead, so it marks points **[Makes sense]**, **[Needs refinement]** or **[Superseded]** (no longer fits a later decision, kept for the reasoning). Recheck those markings whenever a decision elsewhere touches tools, parameters, the Runner or the database.
- Write at the level of concepts: responsibilities, data, behavior and requirements.

## Order of work

1. **High-level concepts first.** This is the current focus.
2. **Security next.** Security concerns are a separate later step, to be addressed once the concepts are settled and before libraries and specifics. Whenever a decision raises or changes a security concern, record it in `security.md`, but don't let security drive the concept work.
3. **Technology last.** Specific libraries, commands, file formats down to the field, and other low-level details are not the current concern. They belong in a final section written last. Don't let a library choice shape a requirement. Each working file lists what it defers to that section.

## Session logs (ailog)

When asked to write the session log, write a verbatim log of the whole Claude Code session into `mvp_docs/zaansouvi-mvp/ailog/`.

- **File name:** `yy-mm-dd HHMMSS <topic>.md`: the date and time of the session's first message, in UTC, then a topic under 120 characters naming what the session did. Example: `26-11-08 023638 M1 key names, Runner design and build, tool helper, M2 cross-file-links, expected results and reference schema.md`.
- **Source:** the session's transcript, `~/.claude/projects/<project folder>/<session id>.jsonl`. The project folder is the working directory with `/` replaced by `-` (for `/home/zaida/viewer/mvp_docs`: `-home-zaida-viewer-mvp-docs`); the session ID is the last folder of the scratchpad path.
- **Write it with** `python3 -I mvp_docs/zaansouvi-mvp/ailog/make_ailog.py <transcript.jsonl> "<out.md>"`. Don't write it by hand.
- **Format:** `# AI conversation log`, then one paragraph naming the session ID, the model and the working directory, and saying that times are UTC and what is left out. Then, in order:
  - `## <yyyy-mm-dd HH:MM:SS> — User`, `## … — Claude`, `## … — Context summary (conversation compacted)`: messages, as written;
  - `### … — Tool call: <tool name>`: the input, in a `json` code block;
  - `### … — Tool result` or `### … — Tool result (error)`: the output as recorded, in a code block.

  Code fences are longer than any run of backticks inside them. Internal reasoning, system attachments and sidechains are left out; account and organization identifiers are redacted.
- **Check before reporting:** every code fence closes, and the log holds no credentials or account details. The log ends at the request to write it; run the script again to include more.

## Expectations for the final document

These apply to the deliverable as a whole: the short `feasibility_and_execution_plan.md` together with the working files it links to. Most of the detail below lives in the working files.

- Separate **feasibility** (can it be done, what are the hard limits and risks) from **requirements** (what the tools must do: functional and non-functional requirements, inputs and outputs, the contracts between tools).
- Define what passes between the tools: each tool's inputs and outputs, the folder and file layout, the project-wide and per-tool config files and their defaults, and how the one-command run orders the tools. These contracts are what make "one thing well" and "careful output" work.
- Weigh every requirement, design option and risk against the two design principles in `toolset.md`, and call out explicitly where they conflict with other goals.
- Address the hard problems listed in `toolset.md`, section 9, at the level of concepts.
- Write for human readers: clear headings, plain prose, Mermaid diagrams where they help explain the toolset's own architecture.
- Hold the document to the same traceability standard as the toolset. Back technical claims with links to the relevant documentation, quotes where they matter, and exact versions in the final technology section. Check that any library or capability mentioned actually exists; don't invent tool names, features or benchmarks.

## Open questions about the deliverable

- `DOC-1` ~~**Format and location**~~: resolved. One Markdown file, `feasibility_and_execution_plan.md`, with this folder attached. Written after enough has been decided; not a concern for now (see "What this repository is").
- `DOC-2` ~~**Outline**~~: resolved. A very short, human-readable description with links to the documents in this folder (see "What this repository is"). The exact sections follow when the file is written.
- `DOC-3` ~~**Readers of the document**~~: resolved. The developer in charge of the implementation, working with AI assistance and their own expertise (see "What this repository is").
- `DOC-4` ~~**Language and length**~~: resolved. English, roughly 1 to 5 pages, at the very highest level; all details live in the working files (see "What this repository is").
- `DOC-5` **Original assumptions overtaken by the MVP:** the working files take in what the implementation found, in MVP 1 and MVP 2, and some original assumptions no longer stand (`MVP_scope.md`, note at the top; `summary/00_where_we_are.md`, section 4). Review them when writing `feasibility_and_execution_plan.md`: which still hold, which are superseded, and what the feasibility part says about each.
