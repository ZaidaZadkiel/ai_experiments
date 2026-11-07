# 03. Runner

The Runner as built for the MVP. The full design is in `runner.md`; this file keeps only what the MVP needs.

## Command line

```
zaansouvi-run <source-root>                 run everything
zaansouvi-run <source-root> --dry-run-only  dry-run every step, write nothing
zaansouvi-run --read-cache                  print the stored data, run nothing
```

- **RUN-01** One command with only the source root runs the whole process (P2). There are no config files (`MVP_scope.md`, section 8.1).
- **RUN-02** Output is always the Viewer mode: JSON lines on standard output (`--human` is out of the MVP).
- **RUN-03** A missing or unreadable source root stops the Runner with exit code 2 and a clear message. It writes nothing.

## On start

- **RUN-04** Open or create the database. Check `config_version`; if it is unknown, stop with a clear message.
- **RUN-05** Find the three tools in `app/tools/`, call each one's `--info`, and fill `config_tools`. Derive the order from the `dataName`s and write `config_ordering` (`02_data_contracts.md`, DATA-11). Installation and removal are out of the MVP; the tools are simply there.

## The run

- **RUN-06** List every `*.ts` file under the source root (skipping `node_modules`), hash it, and write `project_files`. The Runner does this itself (`RN-13`).
- **RUN-07** For each tool in the ordering, build its JSON (`02_data_contracts.md`, DATA-12, DATA-13), in memory.
- **RUN-08** Dry-run the tool with `--dry-run --stdin`, passing the JSON. Parse the last line (DATA-17):
  - **go**: continue
  - **no-go** with exit code 2: an invocation error, so a Runner bug. Log it as such and stop
  - **no-go** with exit code 1: a problem in the data. Log it as the tool's error and stop
- **RUN-09** Run the tool for real with `--stdin` and the same JSON. Then read its `result.json`, its newest log and its output.
- **RUN-10** If the result is `failed`, stop. Otherwise write `project_outputs` and `project_tool_runs`, and go on.
- **RUN-11** M1 is invoked once per file, dry run then real run each time. For two or three files that is a handful of processes; record the time it takes as a finding (`TS-31`).
- **RUN-12** At the end, write `project_runs` and print `run_finished` with the outcome.

## Output events (Viewer mode)

Each line is one JSON object with an `event` field:

| Event | Fields |
|---|---|
| `run_started` | run ID, source root, time |
| `files_listed` | count |
| `tool_dry_run` | tool, file ID (M1 only), `go` or `no-go`, error |
| `tool_run` | tool, file ID (M1 only), `succeeded` or `failed`, error, log path |
| `run_finished` | outcome, time, Runner log path |
| `cache` | (only with `--read-cache`) the content below |

- **RUN-13** `--read-cache` prints one `cache` event with: the file list, the record of tools and the ordering, every tool's latest `result.json`, and the content of every output (M1's per-file outputs, `links.json`, `scopes.json`). It starts no tool and writes nothing.

## Log

- **RUN-14** Every run writes `data/runner/logs/<timestamp>.log` in the shared format (DATA-16), except a `--dry-run-only` pass, which writes nothing.
- **RUN-15** For every tool invocation, the log records the time, the exact command line, the JSON sent, the dry-run result and the real result. A user can repeat any step by hand from it.

## Errors

| Situation | Runner does |
|---|---|
| Unknown database version | Stops before anything, exit 2 |
| A tool's `--info` fails or isn't valid JSON | Stops before the run, names the tool |
| Dry run no-go | Stops, writes nothing more, reports the tool's error |
| Real run failed | Stops; earlier tools' outputs and database rows stay (no staging, `RN-16`) |
| A tool crashes (no result written) | Treated as a failed real run, with the exit code and standard error in the Runner log |
