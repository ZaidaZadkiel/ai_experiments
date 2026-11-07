# 06. Test plan

Answers `MVP-14` for the MVP. The expected result is written by hand **before** the tools exist.

## The basic examined source

Three files under `test-source/src/`. Line numbers matter: the expected result refers to them.

`src/math.ts`
```ts
export const PRECISION = 2;

export function round(value: number): number {
  const factor = 10 ** PRECISION;
  return Math.round(value * factor) / factor;
}
```

`src/counter.ts`
```ts
import { round } from "./math";

let total = 0;

export function add(amount: number): number {
  total = total + amount;
  return round(total);
}
```

`src/main.ts`
```ts
import { add } from "./counter";
import { PRECISION } from "./math";

function run(): void {
  const first = add(1.234);
  if (first > 0) {
    const label = "precision " + PRECISION;
    console.log(label, first);
  }
}

run();
```

What it covers: calls across files (`add`, `round`), a variable read across files (`PRECISION`), a module variable that is written and read (`total`), parameters, local variables, a nested block, unresolved globals (`Math`, `console`), and a property name that matches a symbol (`Math.round` versus `round`).

## Expected result

Kept in `expected/` as a readable table; the comparison with the tools' output is done by a small script that checks names, kinds, lines and links (`TEST-01`).

### Symbols (M1)

| File | Name | Kind | Line | Exported | Scope (M3) |
|---|---|---|---|---|---|
| math.ts | PRECISION | variable | 1 | yes | file |
| math.ts | round | function | 3 | yes | file |
| math.ts | value | parameter | 3 | no | round |
| math.ts | factor | variable | 4 | no | round |
| counter.ts | round | import | 1 | no | file |
| counter.ts | total | variable | 3 | no | file |
| counter.ts | add | function | 5 | yes | file |
| counter.ts | amount | parameter | 5 | no | add |
| main.ts | add | import | 1 | no | file |
| main.ts | PRECISION | import | 2 | no | file |
| main.ts | run | function | 4 | no | file |
| main.ts | first | variable | 5 | no | run |
| main.ts | label | variable | 7 | no | run |

### References other than declarations (M1)

| File | Line | Name | Kind | Refers to |
|---|---|---|---|---|
| math.ts | 4 | PRECISION | read | math.ts PRECISION |
| math.ts | 5 | Math | read | none |
| math.ts | 5 | value | read | math.ts value |
| math.ts | 5 | factor | read | math.ts factor (twice) |
| counter.ts | 6 | total | write | counter.ts total |
| counter.ts | 6 | total | read | counter.ts total |
| counter.ts | 6 | amount | read | counter.ts amount |
| counter.ts | 7 | round | call | counter.ts round (the import) |
| counter.ts | 7 | total | read | counter.ts total |
| main.ts | 5 | add | call | main.ts add (the import) |
| main.ts | 6 | first | read | main.ts first |
| main.ts | 7 | PRECISION | read | main.ts PRECISION (the import) |
| main.ts | 8 | console | read | none |
| main.ts | 8 | label | read | main.ts label |
| main.ts | 8 | first | read | main.ts first |
| main.ts | 12 | run | call | main.ts run |

`round` in `Math.round` (math.ts, line 5) and `log` in `console.log` (main.ts, line 8) must **not** appear.

### Links (M2)

| From | To |
|---|---|
| counter.ts `round` (import, line 1) | math.ts `round` (line 3) |
| main.ts `add` (import, line 1) | counter.ts `add` (line 5) |
| main.ts `PRECISION` (import, line 2) | math.ts `PRECISION` (line 1) |

No unresolved imports.

### Scopes (M3)

| File | Scopes |
|---|---|
| math.ts | file; `round` (lines 3–6) |
| counter.ts | file; `add` (lines 5–8) |
| main.ts | file; `run` (lines 4–10); the `if` block belongs to `run` |

### File edges (Viewer)

counter.ts → math.ts; main.ts → counter.ts; main.ts → math.ts.

## Automatic checks

- **TEST-01** A script runs `zaansouvi-run test-source`, then compares the outputs with `expected/`: symbols by file, name, kind and line; references by file, line, name, kind and target; links; scopes and membership. It prints every difference.
- **TEST-02** `zaansouvi-run test-source --dry-run-only` reports `go` for every step and leaves the data folder and the database unchanged (compare file hashes before and after).

## Broken inputs

Each one is run and must give the stated result. "By hand" means invoking the tool directly.

| # | Input | How | Expected |
|---|---|---|---|
| B1 | M1 with both `--json` and `--stdin` | by hand | invocation error `E1`, exit 2, nothing written, `last_run.json` unchanged |
| B2 | M1 with `--json` pointing to a missing file | by hand | `E2`, exit 2, nothing written |
| B3 | M1 with JSON missing `file_id` | by hand | `E13`, exit 2, nothing written |
| B4 | M1 with no parameters, after deleting `last_run.json` | by hand | `E3`, exit 2, nothing written |
| B5 | M1 with no parameters, `last_run.json` present | by hand | repeats the last run exactly, same output |
| B6 | M1 on a file path that doesn't exist | by hand, valid JSON | run error `E6`, exit 1, `result.json` failed, `last_run.json` updated, earlier output kept |
| B7 | a file with a syntax error added to the source | Runner | M1's dry run is no-go (`E12`) for that file, the Runner stops, the Viewer shows it in red |
| B8 | M2 with an M1 output whose reference points to a missing symbol | by hand | run error `E12`, exit 1, logged |
| B9 | an import from `"./missing"` added to the source | Runner | not an error: M2 lists it as unresolved, the run succeeds |
| B10 | source root that doesn't exist | Runner | Runner exit 2, nothing written |

## Extra checks

- **C1. Without M3.** Move M3 out of `app/tools/`, restart, run. The Viewer shows files › symbols, two levels, with no change to M1, M2, the Runner or the Viewer (`MVP_scope.md`, section 5.1).
- **C2. Rename.** Rename `round` to `roundTo` in math.ts and counter.ts, run again. All three tools use the new IDs, the link is still there, and nothing refers to the old ID.

## Human review of the Viewer (P3)

The person deciding whether the Viewer passes goes through these and answers yes, no or partly, with a note:
1. Can you start a run and a dry run from the page, and see each tool's go / no-go and result?
2. Does level 1 show the three files and the three file edges, with sensible counts?
3. Can you go into `main.ts`, see the `run` scope, and go into it to see `first` and `label`?
4. Do the links leaving a file lead you to the right symbol in the other file?
5. Does selecting any node or edge show the right file:line and source line?
6. When B7 is run, is the error clear enough to know what to fix?
7. Overall: would this be worth building further? Why or why not?

The answers go into the findings note (`07_delivery.md`).
