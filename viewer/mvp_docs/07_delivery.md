# 07. Delivery

Answers `MVP-15` for the MVP.

## Traceability level

- **DEL-01** Every node and edge shows its file:line and its source: for a node whose record has a range, the text the range covers, one column per range (`UI-52`); otherwise, the source line with the lines around it.
- **DEL-02** Out of the MVP: clickable links to a repository host or an editor, longer code quotes, and commit-pinned links.

## Deliverables

- **DEL-03** The code: Runner, Viewer, shared library, tool helper, `ts-program` (the only tool the Runner runs, `RUN-33`), and M1, M2, M3 (kept as built, not run, `TPG-01`), in one repository, with a short readme on how to install and run it (`97_second_implementation.md`, section 3).
- **DEL-04** The test source and the expected result (`06_test_plan.md`): `test-source-mvp2/` and the expected graph written by hand, `expected-mvp2/`. MVP 1's `test-source/` and `expected/` stay with M1, M2 and M3.
- **DEL-05** The test scripts: `tests/runner/run-tests.mjs` for TEST-01 to TEST-04 (with `TEST-05` and `R1` to `R11`), `ts-program`'s checks (`TOOL-52`: `tests/ts-program/check.mjs`, `tests/ts-program/check-definitions.mjs`, determinism and the read log) and `tests/viewer/check-server.mjs` (`TEST-10`); and a record of the broken inputs and changes with their actual results. Of B1–B10 and C1–C2, MVP 2 runs `B7` and `B10` (`06_test_plan.md`); the others are M1, M2 and M3's, and `C1` is not in force in MVP 2.
- **DEL-06** The human review answers (`06_test_plan.md`).
- **DEL-07** The findings note (below).
- **DEL-10** The reference JSON schema, built alongside the code and current with it (`DATA-20`).

## Time box

- **DEL-08** About **two weeks** of one developer working with AI. If the end of the time box is reached, stop and write the findings note with what exists: what didn't get done is itself a finding.
- **DEL-09** Rough split, by MVP 2's phases (`41_typescript_program_plan.md`, section 3): decisions, half a day; documents, one day; test sources and expected results, one day; the `ts-config` tool, half a day; the tool helper and the Runner, one and a half days; `ts-program`, two days; M3 nested, half a day; the Viewer, one day; measure and record, one day; about eight to nine days in all. Each phase's state is in `97_second_implementation.md`, section 5 (`ts-config` deferred, M3 nested not needed).

## Findings note

A short document, written at the end, feeding `MVP_scope.md` section 10 (post-MVP) and the feasibility part of `feasibility_and_execution_plan.md`.

1. **P1 to P3**: yes, no or partly, each with the evidence (tests passed, human review answers).
2. **Early P4 evidence**: did C1 work with no change elsewhere? Did any Viewer code need to know a tool's name (VIEW-14)?
3. **What was harder than expected**, and what was easier.
4. **The single database**: did it work, and what will matter when it is split into the configuration and codebase databases?
5. **Timings**: a full run, a dry run, one M1 invocation, the Viewer's load time. What they suggest for one process per file at scale (`TS-31`).
6. **Contracts**: did `--info`, the JSON parameters, the logs and `last_run.json` hold up? What had to change?
7. **Recommendations** for the post-MVP questions (`MVP_scope.md`, section 10.3): which to keep, drop or reorder.
