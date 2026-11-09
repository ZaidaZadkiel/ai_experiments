# Tool helper

The contract every ZaAnSouVi MVP tool shares, written once (`mvp_docs/04_tools.md`, `TOOL-45`; `ARCH-02`). M1 (`file-symbols`) and M2 (`cross-file-links`) use it; M3 will.

It **knows nothing about any specific tool**. Everything tool-specific comes from the tool itself: its `--info`, which also drives the parameter options and the shape check; its help text; its extra shape checks; and its work. It uses only Node built-ins, and imports nothing from a tool, the Runner or the Viewer.

## What it does

| Part | Rule |
|---|---|
| Options: `--info`, `--help`, `--version`, `--dry-run`, `--json`, `--stdin`, `--log`, and one option per string parameter in `--info` (`some_key` gives `--some-key`) | `TOOL-01`, `FND-14` |
| Parameters: command line, then `--json` or `--stdin`, then `last_run.json`, only ever as a complete input | `TOOL-02`, `TOOL-43` |
| Shape check from `--info`: required parameters present, strings non-empty, arrays arrays; then the tool's own checks. Invocation errors write nothing | `TOOL-03` |
| The store: `store_path`, else `./zaansouvi/tools/<tool>/` in the working folder; `last_run.json` in the store, without `store_path`; `E14` when started from inside `source_root`; `nonOutputParameterSources` in the log and `result.json` | `DATA-21`, `TOOL-43` |
| `last_run.json` at the start of a real run and at its end | `TOOL-04`, `DATA-15` |
| The log, in the shared format; `--log` copies it | `DATA-16`, `TOOL-07` |
| Outputs written to a temporary name and renamed; `result.json`, with the tool's `diagnostics`; one summary line on standard output | `TOOL-05`, `DATA-14` |
| The dry run: the same work, nothing written, log lines on standard output, an optional preview line, a final go / no-go line carrying the tool's `diagnostics` | `TOOL-06`, `DATA-17` |
| Error and exit codes | `04_tools.md`, "Error codes" |

## How a tool uses it

```ts
import { runTool, runError, invocationError } from "../../../tool-helper/tool.ts";
import type { ToolSpec } from "../../../tool-helper/tool.ts";

const SPEC: ToolSpec = {
  info: INFO,                 // the tool's --info
  help: HELP,
  programDir: PROGRAM_DIR,    // the launcher's folder, for the log only: nothing is written there
  checkShape: (p) => { ... }, // optional: throw invocationError("E13", ...)
  work: ({ params, store, log, mode }) => ({ outputs: [{ path: "output/x.json", content }], summary: { counts }, diagnostics }),
  identity: (p) => ({ ... }), // optional: what the run is about, in its output lines
  logName: (p) => "...",      // optional: log file name suffix
  hints: { E12: "..." },      // optional: logged after a run error
  preview: true,              // optional: print each would-be output in a dry run
};
process.exitCode = runTool(SPEC, process.argv.slice(2));
```
