# Rules for rewriting the MVP docs clean (2026-11-10)

## Context
ZaAnSouVi is a proposed toolset that analyzes TypeScript codebases: independent command-line tools, a Runner that runs them, and a Viewer (browser + local server) showing a node graph. The folder `/home/zaida/viewer/mvp_docs/` holds the requirements for its MVP.

- **MVP 1** (2026-11-07 to 2026-11-09): hand-written tools M1 `file-symbols`, M2 `cross-file-links`, M3 `symbol-scope`, on a three-file `test-source/`. Findings `FND-01` to `FND-84`.
- **MVP 2** (from 2026-11-09, the current stage): one tool, `ts-program`, runs TypeScript's own program and checker over every listed `.ts` file and is the only tool the Runner runs (`RUN-33`). M1, M2 and M3 are **kept as built and not run**. Test source `test-source-mvp2/`, expected graph `expected-mvp2/`. Goal: a correct graph, correctness first. Findings `FND-85` on.

The user decided (2026-11-10): **the MVP docs are rewritten clean, describing MVP 2 as it now stands, with no history.** The originals, with all struck wording and history, are kept frozen in `mvp_docs/mvp1/docs_2026-11-10/` (identical copies of the files as they were before this rewrite). That is why history can go.

## Sources you may read (do not edit any of them)
- The file you rewrite (identical to its copy in `mvp_docs/mvp1/docs_2026-11-10/`).
- `mvp_docs/summary/00_definitions_mvp2.md`: every ID MVP 2 added or changed, with its **current text, already cleaned**, plus IDs not in force in MVP 2.
- `mvp_docs/summary/00_definitions_mvp1.md`: every MVP 1 ID with its text as settled at the end of MVP 1, already cleaned. **For an ID not in `00_definitions_mvp2.md`, this text is also its current text.**
- `mvp_docs/97_second_implementation.md` (section 3.1 decisions, 3.2 phases, 3.3 parts to reconsider), `mvp_docs/99_findings.md` (MVP 2 findings), `mvp_docs/summary/20_mvp2.md` (a summary of MVP 2).
- The code under `mvp_docs/zaansouvi-mvp/` (read only), when you need to know what was actually built (e.g. `tests/`, `app/`).

## What to produce
Rewrite the file **in place** so it describes MVP 2 as it now stands:

1. **No history.** Remove all struck text (`~~…~~`) and all change notes: "(replaced by …)", "(changed …)", "reopened", "was …", "since …", "before, …", "earlier …", "superseded …", "(For MVP 2, …)", "for the first stage …", "decided/accepted by the user on <date>", "(at the user's request)", dates of decisions, "as built on <date>". No "MVP 1 did X, MVP 2 does Y" phrasing: state what holds. Remove finding references (`FND-nn`) that only record history; keep references (IDs, files, sections, findings) that define meaning or say where something is specified or evidenced.
2. **Status markers stay** ([Decided], [Proposed], [Known], [Suggested], [Accepted], To define), since they are status, not history. Use the current status (see `00_definitions_mvp2.md`).
3. **Keep every ID that is in the file, each one written out literally** (a later script checks each ID string is still present). Each ID's text is its current text: prefer the cleaned text in `00_definitions_mvp2.md`, else `00_definitions_mvp1.md`; if you find a mistake in those, follow the file and report it.
4. **IDs not in force in MVP 2** (known: `ARCH-04`, `VIEW-21`, `BE-50`; report any other you find that describes only MVP 1's run and has no MVP 2 meaning): one line, `- **ID** Not in force in MVP 2: <what applies instead, with its ID>. MVP 1 text: \`mvp1/docs_2026-11-10/<file>\`.`
5. **Requirements that belong to M1, M2 or M3 only** (for example `TOOL-10` to `TOOL-36`, M3's tests): replace their detailed text by one short section: "M1, M2 and M3 are kept as built and are not run in MVP 2 (`TPG-01`, `RUN-33`). Their requirements are in `summary/00_definitions_mvp1.md` and `mvp1/docs_2026-11-10/<file>`:" followed by every such ID written out (a compact list, each with its 3-to-8-word title). Do this only where an ID is about M1, M2 or M3 alone; a contract that `ts-program` or the Runner also follows stays in full.
6. **Do not invent.** Where MVP 2's form of something is not documented anywhere (the docs were never fully updated for MVP 2) and you can't establish it from the docs or the code, keep the text and add, right after it, `*To update for MVP 2:* <what is out of date, in a few words>`. Report each one.
7. **Non-ID prose** (intros, tables, layout on disk, diagrams, examples) follows the same rules: current state, no history. Don't drop content that still holds. Keep Mermaid diagrams, updated only where they plainly show MVP 1's run (then say so in the report).
8. **References:** `98_first_implementation.md` is now `mvp1/98_first_implementation.md`. `99_findings.md` holds `FND-85` on only; MVP 1's findings are in `mvp1/99_findings_mvp1.md` (cite them by ID as before). The file's header, if it describes how the file was kept or its history, becomes one plain sentence on what the file holds.
9. **Meaning:** don't change what anything means, don't decide anything, don't improve wording beyond what removals need. Repair grammar where removals break a sentence.
10. **Touch only your assigned files.** Never edit `mvp1/`, `summary/`, `zaansouvi-mvp/`, `proposed_schema/`, or any other file.

## Check before finishing (for each file)
- Every ID present in the original (`mvp1/docs_2026-11-10/<file>`) still appears literally in the rewritten file. Write a small script to check it (read files only; use `python3 -I`).
- No `~~` remains; no decision dates remain (dates that are part of data, examples or version names may stay).
- Code fences balanced.

## Report (your final message)
Per file: size before and after; what kinds of things you removed; IDs marked not in force; M1–M3-only IDs moved to the pointer section; every `*To update for MVP 2:*` you added; conflicts between sources; anything you were unsure about.
