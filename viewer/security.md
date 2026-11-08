# ZaAnSouVi Security Concerns

Working list of security concerns for the whole ZaAnSouVi toolset: the analysis tools, the codebase database, the Viewer server and the Viewer UI.

This is a **later step**. It gets refined once the high-level concepts are settled, and before libraries and specifics. Until then, concerns are noted here as they come up during the concept work, without driving it. Mechanisms and libraries belong in the final technology section.

Each item is marked:
- **[Decided]**: agreed in discussion.
- **[Proposed]**: noted during discussion, to be confirmed or changed.

## 0. Scope

- **[Decided]** Where outside programs (git, the language runtime, package managers, the browser) are installed and what they write is not a concern. Only ZaAnSouVi's own tools, Runner and Viewer are. This doesn't cover running code: an outside program that ZaAnSouVi starts must still never run code from the examined source (section 1, and section 3 for git).

- **[Proposed]** The proposed single-root organization (`project_organization.md`) keeps everything ZaAnSouVi writes under one root, never writes into the examined project, and gives each program its own work space with one writer per path.

## 1. Never run code from the examined source

- **[Decided]** **Nothing in ZaAnSouVi ever runs code from the examined source.** This applies to every tool, every detector, the dry run, the Viewer server and the Viewer UI.
- **[Decided]** All analysis is static: tools only read files.
- **[Proposed]** This rules out, among others:
  - code that looks like configuration or infrastructure definitions, which may be tempting to run in order to discover infrastructure or settings
  - the project's scripts, build steps, tests and run configurations; they are read and reported, never started
  - installing the project's dependencies
  - plugins or extensions the project declares for its own tooling, such as compiler or editor plugins
  - commands or servers described in AI assistant, editor or other configuration files
  - hooks or helper programs the project configures for git (section 3)
  - anything from the examined source shown in the browser: it is displayed as text, never run as markup or script (section 8)
- **[Proposed]** Where reading a file would normally mean running it, for example a configuration file written as code, the tools read it as text only and report what they can find that way. What can't be found without running it is reported as unknown, never guessed.
- **[Proposed]** Hostile or unusual input must not crash a tool or exhaust the machine: very large files, deeply nested code, or huge numbers of files. Tools need limits and must report what they skipped.
- **[Proposed]** File access stays inside the examined project. Links or paths that point outside it, including symbolic links, are not followed without an explicit setting.

## 2. Secrets and visibility of the examined source

- **[Decided]** **No redaction.** The user is allowed to see every part of the examined source. Quotes, values and secrets found in the source are shown as they are, with no redaction and no files excluded from quoting.
- **[Proposed]** Environment variable values found in the source, for example in env files, may be recorded and shown like any other part of the source.
- **[Proposed]** The only remaining concern is data **leaving the user's machine**. Outputs, the codebase database, Viewer data and exports hold the source's content, including any secrets in it. If a way to share them with other people is added (`SEC-4`), it must be clear what they contain.

## 3. The git step

- **[Proposed]** Running git inside an untrusted repository can, depending on the repository's own git configuration, cause git to run other programs. The git step must run git in a way that does not trust the repository's configuration.
- **[Proposed]** The git step only reads. It never changes the repository, the working tree or the git configuration.

## 4. Project overview detectors

- **[Decided]** Detectors only read configuration files. They never run the commands or start the servers that such configuration may describe (section 1).
- **[Proposed]** No redaction applies to what detectors record (section 2).

## 5. Internal data and isolation between codebases

- **[Proposed]** Each codebase's internal data stays in its own store. No tool, and not the Viewer server, reads or writes another codebase's store unless asked to explicitly.
- **[Decided]** Each tool is responsible for producing correct output (`toolset.md`, section 4.2). (This replaces the earlier "Tools assume the data in the stores is current and valid, and do only the checking they require".)
- **[Proposed]** That checking must still cover what keeps a damaged or hand-edited output from crashing a tool or making it misbehave: readable, the expected format and schema version, within limits (section 1). The Runner decides whether the data is current; a tool may check it too.
- **[Proposed]** The Viewer still treats tool outputs as possibly malformed and follows its best-effort rule: check, skip and report.
- **[Decided]** There are two databases: a configuration database for ZaAnSouVi as a whole, and a codebase database per examined source whose analysis details are never shared between analyses (`toolset.md`, section 5.2).
- **[Decided]** The configuration database has two writers, the Runner and the Viewer's backend (`toolset.md`, section 5.2).
- **[Decided]** The Viewer never reads the codebase database itself; it gets codebase data through the Runner (`viewer.md`, section 3.1).
- **[Proposed]** A setting that points tools outside the examined project, or turns off a safety limit, is flagged in the change preview when the Viewer edits it, as for config files (section 7).
- **[Proposed]** The configuration database holds no content from any examined source, so sharing it across analyses leaks nothing between codebases.
- **[Decided]** Tools never read the codebase database; only the Runner reads it.
- **[Decided]** Only tools whose `--info` says they read files read them, and only one file per invocation (`toolset.md`, section 4.2). This keeps each tool's access to the examined project narrow, **by design, not by enforcement**: the Runner checks a tool only through its input and output, never what it reads. A tool that reads more is a design error in that tool.
- **[Proposed]** Concern raised by that decision: since nothing enforces those limits, a buggy or replaced tool could read other tools' stores, the databases or, on a shared machine, other codebases' stores, against the isolation between codebases (`toolset.md`, section 5.4). The same holds for writing outside its own store. Ways to catch it: review each tool's design against its `--info`, or, later, run tools with limits from the operating system on what they can read and write (`SEC-2`). **To define** in the security step (`SEC-6`).
- **[Proposed]** The path of the file to read must be inside the examined project; a tool checks this before opening it (section 1).
- **[Decided]** Only the Runner writes to the codebase database; tools write only to their own stores (`toolset.md`, section 5.2). A tool can't damage another tool's facts in the database.
- **[Decided]** A failing tool never writes partial data to its store (`toolset.md`, section 4.4), so a failure can't leave a half-written output for other tools or the Viewer to trust.

## 6. Temporary files

- **[Decided]** A tool's dry run never writes a record to the file system or the database; it prints its data to standard output (`toolset.md`, section 4.3). That removes most of this concern. The rule binds the tools only: the Runner and the Viewer may write during a dry run, but not temporary files beyond those allowed below.
- **[Decided]** Temporary files are used only for staging and for tools' intermediate data during a run (`toolset.md`, section 4.2).
- **[Proposed]** They can hold the same details from the examined source as real outputs. They are created so only the user can read them, kept outside shared locations where possible, and removed when the run ends, whether it succeeded or failed.

## 7. Viewer server

A local server that runs tools and reads files is a real attack surface.

- **[Proposed]** It is reachable only from the local machine, never from the network.
- **[Proposed]** It rejects requests from other web pages open in the same browser, by checking where each request comes from and requiring a token issued at startup.
- **[Proposed]** It runs only the fixed set of tool steps, with validated options. There is no general way to run arbitrary commands.
- **[Proposed]** It reads files only inside the examined project and the toolset's own folders.
- **[Proposed]** It never executes the examined code (see section 1).
- **[Proposed]** The config manager can change the configuration of the entire toolset, globally and per project (`viewer.md`, section 4.11). The server writes only configuration files, only after the user confirms the change preview, and only to the known config locations.
- **[Decided]** The server writes tool configuration in the format each tool declares, and nothing else of the tools': no tool outputs, nothing in the codebase database.
- **[Proposed]** The Runner's "read cache" call from the Viewer only reads. Its "dry-run only" call starts no real run and no tool writes anything, but the Runner may write its log and the database (`toolset.md`, section 4.3). So a dry-run request reaching the server can change the Runner's data: it needs the same startup token and origin check as a real run, and what the Runner writes in a dry run must not make a later real run skip work (`runner.md`, section 5).
- **[Proposed]** The Runner's cache (`runner.md`, section 10.2) holds the inputs and outputs of a run, so content from the examined source: it gets the same care as tool outputs, isolated per codebase and readable only by the user.
- **[Proposed]** The Viewer's internal storage (cache, views, preferences, and its own database if it has one) holds content from the examined source, so it gets the same care as tool outputs: isolated per codebase, readable only by the user.
- **[Proposed]** The Runner (`runner.md`): the named Runner configuration given in the invocation is looked up only in the Runner's data, by name. A name can't point to a file elsewhere.
- **[Proposed]** The Runner's configuration listing only reads. Its failure and error lists may quote the examined source, so it gets the same care as other outputs (section 2).
- **[Proposed]** The Runner's run logs list files read, exact command lines, tool options, failures and diagnostics, which may quote the examined source. Since command lines are logged exactly, no credentials may ever be passed to a tool on its command line (see section 10). They stay in the codebase's own store, readable only by the user (sections 2 and 5).
- **[Proposed]** The JSON parameters the Runner sends a tool are logged in full, so they must never carry credentials. File locations in them must point inside the examined project or the ZaAnSouVi root, and the tool checks this rather than trusting them (section 1).
- **[Proposed]** A tool given `--json <path>` only reads that file. The path must point inside the ZaAnSouVi root or system temp. An explicit JSON input that is missing or malformed fails the tool early.
- **[Proposed]** Since `last_run.json` sits next to the tool's program, the program folders must be writable during a run. A tool writes only its own `last_run.json` there, and its store when it is run with no store given (`toolset.md`, section 4.5); never its own or another program.
- **[Proposed]** `last_run.json` records the store path, so a tool run again with no parameters writes where the last run did (`toolset.md`, section 4.5). An edited `last_run.json` can therefore redirect where a tool writes. The usual care for `last_run.json` applies: readable and writable only by the user.
- **[Proposed]** `last_run.json` and the tools' logs hold parameters and diagnostics that may quote the examined source; they get the same care as other outputs. A damaged `last_run.json` makes the tool fall back to defaults and say so in its log, never guess.
- **[Decided]** Only the Runner installs tools. The Viewer may upload a file for the Runner to read for installation (`runner.md`, section 1.0).
- **[Proposed]** Installing a tool means ZaAnSouVi will later run that tool's program, so an uploaded installation file is trusted code, not data. Installing needs the user's explicit confirmation, shows what will be installed and how it will be started, and never takes anything from the examined project. To be worked out with the installation details (`RN-19`).
- **[Proposed]** The record of tools sits in the configuration database, which the Viewer's backend may edit directly. The parts that say how to start a tool must still be written only from installed tools (by the Runner or installation), never typed in through the Viewer, or the Viewer could be used to make the Runner start an arbitrary program. Whether a tool runs (the named configuration) is the part the user changes.
- **[Proposed]** Tools may run on any stack, and the Runner starts them as the record of tools says. The record must come only from installed tools, never from the examined project, so the Runner can never be made to start an arbitrary program.
- **[Decided]** A tool may use programs internal to it, including built-in shell commands such as `stat` or `file`, with proper wrapping and error checking (`toolset.md`, section 2).
- **[Proposed]** Wrapping such a program means: file names and other values from the examined project are passed as separate arguments, never built into a shell command string, so a crafted file name can't run a command; the program is one that only reads; and its failures become the tool's errors (`toolset.md`, section 4.6).
- **[Proposed]** Omitting a tool from the Runner's order is a configuration change too. Adding a tool means the Runner will run it, so only known, installed tools can be added, never an arbitrary program.
- **[Proposed]** Configuration changes the behavior of every tool. A setting that points tools outside the examined project, or turns off a safety limit, should be clearly flagged in the change preview.

## 8. Viewer UI

- **[Proposed]** Everything shown in the UI comes from the examined code: names, paths, quotes and labels. It must always be displayed as text and never interpreted as markup or script. Otherwise a crafted symbol name or comment could run code in the developer's browser.
- **[Proposed]** Links come from config templates and tool outputs. Only expected link types are opened (repository host, editor, local file). Anything else is shown but not followed.
- **[Proposed]** The UI loads nothing from the internet. Everything it needs is bundled.

## 9. Generated diagrams and exports

- **[Proposed]** Mermaid diagrams and other exports include text from the examined code. It must be escaped so a label can't change the diagram's structure or inject content where the diagram is rendered.
- **[Proposed]** Exports contain the source's content as it is, including any secrets (section 2). That matters only if they are shared with other people.

## 10. Runtime data

- **[Decided]** Each type of runtime data falls to its own tool, for example one that reads row counts from a SQLite file in the examined project (`toolset.md`, section 6.7).
- **[Proposed]** Reading a data file in the project is like reading any other file: it runs no code from the examined source, stays inside the project, and is subject to the same limits (section 1).
- **[Proposed]** Connecting to a running database or service is a different case, still open (`VW-18`, `SEC-5`). If it becomes in scope:
  - it is a separate optional step, off by default, and the rest of the toolset never needs it
  - it needs connection details and credentials, which must never be stored in tool outputs, the codebase database, Viewer data or exports
  - it only reads, and it reads summary information (names, counts), never the stored data itself
  - the user must be able to see which environment it connected to, so a production database is never queried by mistake

## 11. Open questions

- `SEC-1` ~~**Redaction**~~: resolved. No redaction; the user may see every part of the examined source (section 2).
- `SEC-2` **Paths outside the project:** should following symbolic links outside the examined project be allowed at all, even with a setting?
- `SEC-3` **Limits:** which limits (file size, file count, nesting) are on by default, and can the user change them?
- `SEC-4` **Sharing:** if a static export for sharing is added (`VW-9`), what does it leave out by default?
- `SEC-5` **Runtime connections:** if runtime data becomes in scope, which environments may it connect to, and how does the user confirm it?
- `SEC-6` **Enforcing what a tool reads and writes:** the limits on what a tool reads and writes are design rules the Runner doesn't check (`toolset.md`, section 4.2). Is that enough, or should a later version enforce them, for example with sandboxing from the operating system? If so, what is off limits by default?
