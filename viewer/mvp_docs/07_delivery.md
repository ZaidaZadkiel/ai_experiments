# 07. Delivery

Answers `MVP-15` for the MVP.

## Traceability level

- **DEL-01** Every node and edge shows its file:line and the source line with the lines around it.
- **DEL-02** Out of the MVP: clickable links to a repository host or an editor, longer code quotes, and commit-pinned links.

## Deliverables

- **DEL-03** The code: Runner, Viewer, shared library, tool helper, M1, M2, M3, in one repository, with a short readme on how to install and run it.
- **DEL-04** The test source and the expected result (`06_test_plan.md`).
- **DEL-05** The test script for TEST-01 and TEST-02, and a record of B1–B10 and C1–C2 with their actual results.
- **DEL-06** The human review answers (`06_test_plan.md`).
- **DEL-07** The findings note (below).

## Time box

- **DEL-08** About **two weeks** of one developer working with AI. If the end of the time box is reached, stop and write the findings note with what exists: what didn't get done is itself a finding.
- **DEL-09** Rough split: test source and expected result, half a day; contracts and tool helper, one day; M1, two days; Runner, two days; M2 and M3, one day; Viewer, three days; tests, review and findings, one and a half days.

## Findings note

A short document, written at the end, feeding `MVP_scope.md` section 10 (post-MVP) and the feasibility part of `feasibility_and_execution_plan.md`.

1. **P1 to P3**: yes, no or partly, each with the evidence (tests passed, human review answers).
2. **Early P4 evidence**: did C1 work with no change elsewhere? Did any Viewer code need to know a tool's name (VIEW-14)?
3. **What was harder than expected**, and what was easier.
4. **The single database**: did it work, and what will matter when it is split into the configuration and codebase databases?
5. **Timings**: a full run, a dry run, one M1 invocation, the Viewer's load time. What they suggest for one process per file at scale (`TS-31`).
6. **Contracts**: did `--info`, the JSON parameters, the logs and `last_run.json` hold up? What had to change?
7. **Recommendations** for the post-MVP questions (`MVP_scope.md`, section 10.3): which to keep, drop or reorder.
