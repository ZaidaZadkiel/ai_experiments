# Snapshot: MVP 1 and the docs before the cleanup

**Frozen on 2026-11-10. Nothing in this folder is updated.** It keeps, for reference, the record of MVP 1 (the first implementation, 2026-11-07 to 2026-11-09) and every MVP document exactly as it stood before the docs were rewritten clean for MVP 2, with all its struck wording and history.

The docs in `mvp_docs/` describe MVP 2 only, without history. When you need to know what a requirement said before, why it changed, or what MVP 1 did, look here.

## Contents

| Item | What it is |
|---|---|
| `98_first_implementation.md` | What MVP 1 built, part by part, its checks and results, what changed while building it. Moved here from `mvp_docs/` |
| `99_findings_mvp1.md` | The findings of MVP 1, `FND-01` to `FND-84`, and the review before building, with the file's other sections (the decision log, the state sections). The MVP 2 findings continue in `../99_findings.md` |
| `docs_2026-11-10/` | Every Markdown file of `mvp_docs/` as it stood on 2026-11-10, before the clean rewrite: `01` to `07`, `40` to `42`, `50`, `55`, `97`, `98`, `99` and `README.md`, struck wording included. These hold the history of both stages |

## Elsewhere

- **The code of MVP 1:** `../mvp_2026-11-09_implementation_until_typescript.zip`, the user's backup of `zaansouvi-mvp/` from 2026-11-09, before MVP 2 started: code, tests, `expected/`, `test-source/`, data and session logs.
- **Everything before the cleanup:** `../mvp_2026-11-10_before_cleanup.zip`, the whole `viewer/` folder on 2026-11-10 (docs, code, data; without `node_modules` and older zips).
- **The readable summaries:** `../summary/10_mvp1.md` (what MVP 1 attempted, worked, didn't, decided) and `../summary/00_definitions_mvp1.md` (every MVP 1 ID with its text as settled at the end of MVP 1).
- **The code still in use:** `../zaansouvi-mvp/` keeps M1, M2 and M3 and MVP 1's checks; MVP 2 doesn't run them.
