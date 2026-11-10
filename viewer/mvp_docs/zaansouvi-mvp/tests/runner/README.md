# Runner checks

## MVP 2: `run-tests.mjs`

The Runner's tests, as one script (`mvp_docs/06_test_plan.md`: `TEST-01` to `TEST-05`, `R1` to `R11`). It works on a temporary copy of `zaansouvi-mvp/` (with `node_modules` linked), so the real `data/` is never touched. It prints every check and exits 1 if any failed.

```
node tests/runner/run-tests.mjs     # from zaansouvi-mvp/; 28 checks
```

It covers:
- a run of `ts-program` on `test-source-mvp2`, its output matching the expected graph exactly;
- dry-run-only passes, after a run and on fresh data: the go / up-to-date / missing reasons, nothing written;
- the refresh steps: nothing changed, a file touched with the same content, a file changed, a `.ts` file added, the outputs deleted, a file no tool reads added;
- the cache: every listed entry in ID order, `ts-program` as the only tool with the others not listed, and the records (120 symbols, 182 references, 20 links);
- the Runner's errors, `R1` to `R8`, and what MVP 2 added, `R9` to `R11`: a listed tool with no folder, tool folders not listed, a source with no file to read.

## Stand-in tools: `tests/fixtures/tools/`

One program, `stub.mjs`, behaving according to the launcher that starts it: `stub-go` (go, and a valid output), `stub-no-go` (always no-go), `stub-crash` (exits without `result.json`), `stub-garbage` (a dry-run line that isn't JSON). `run-tests.mjs` copies the ones a check needs into its temporary copy's `app/tools/`; never copy them into the real one.

## Stale and frozen: MVP 1's by-hand scripts

`compare-expected.mjs`, `snapshot.mjs`, `check-dry-run.mjs` and `check-real-run.mjs` checked the Runner by hand against `expected/` while MVP 1 was built, with M1 to M3 in the run. They are kept, not maintained and not run in MVP 2 (`zaansouvi-mvp/README.md`, "Stale and frozen"). How they were used: `mvp_docs/mvp1/docs_2026-11-10/` and `mvp_docs/mvp1/98_first_implementation.md`.
