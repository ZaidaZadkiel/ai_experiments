# Runner checks

Scripts used on 2026-11-08 to check the Runner by hand against `expected/` and the MVP docs (`mvp_docs/99_findings.md`, `FND-45`, `FND-51`, `FND-52`). All of them only read. They are the starting point for the automatic `TEST-01` to `TEST-05` and R1 to R8 in `mvp_docs/06_test_plan.md`, which aren't written yet.

| Script | What |
|---|---|
| `compare-expected.mjs` | Compares a run's events, the Runner's cache and the tools' output files with `expected/`, by the rules in `expected/README.md` (placeholders checked for shape, extra keys allowed, arrays in order except links, scopes and memberships) |
| `snapshot.mjs` | Prints a snapshot of the tool stores, each tool's `last_run.json`, the cache's graph part and the database's real-run rows |
| `check-dry-run.mjs` | Checks a dry-run-only pass against the rules (`RUN-14` to `RUN-31`, `TOOL-06`, `DATA-12`, `DATA-13`, `DATA-17`) |
| `check-real-run.mjs` | Checks a real run, then a second run with nothing changed (`RUN-08` to `RUN-31`, `TOOL-04`, `FND-29`, the expected second run) |

Run from `zaansouvi-mvp/`. `W` is any work folder, for example in the system temp.

```
# compare a run with expected/ (use an empty data/ folder for no difference of starting state, as TEST-01 does)
app/runner/zaansouvi-run test-source > "$W/events.jsonl"
node tests/runner/compare-expected.mjs "$PWD" "$W/events.jsonl"

# a dry-run-only pass
node tests/runner/snapshot.mjs "$PWD" > "$W/before.json"
app/runner/zaansouvi-run test-source --dry-run-only > "$W/events.jsonl"
node tests/runner/snapshot.mjs "$PWD" > "$W/after.json"
node tests/runner/check-dry-run.mjs "$PWD" "$W"

# a real run, then a second run
node tests/runner/snapshot.mjs "$PWD" > "$W/before.json"
app/runner/zaansouvi-run test-source > "$W/events.jsonl"
cp data/runner/cache.json "$W/cache-after-first.json"
node tests/runner/snapshot.mjs "$PWD" > "$W/after.json"
app/runner/zaansouvi-run > "$W/events2.jsonl"
node tests/runner/check-real-run.mjs "$PWD" "$W"
```

`check-dry-run.mjs` and `check-real-run.mjs` were written for the state on 2026-11-08 (M1 and M2 present, M3 not built; the refresh reasons that state gives). Adjust their expectations when M3 exists or the starting state differs.

## Stand-in tools: `tests/fixtures/tools/`

One program, `stub.mjs`, behaving according to the launcher that starts it: `stub-go` (go, and a valid output), `stub-no-go` (always no-go), `stub-crash` (exits without `result.json`), `stub-garbage` (a dry-run line that isn't JSON). Each takes M1's symbol records, as M2 does, and reads no files.

To use them, work on a copy of `zaansouvi-mvp/`, never the real one, and copy `stub.mjs` plus the launcher folders you need into the copy's `app/tools/`. The Runner skips `stub.mjs` itself, since it isn't a folder. Tools run in name order after M1, so `stub-crash`, `stub-garbage` and `stub-no-go` each stop the run before any tool that sorts after them.
