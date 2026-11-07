# Test plan material

Files that `06_test_plan.md` describes. That file stays the reference: if anything here differs from it, this folder is corrected.

## `test-source/`: the basic examined source

The three files under `test-source/src/` are copied character for character from `06_test_plan.md`. **Line and column numbers matter**, because the expected result refers to them, so don't reformat these files or add lines to them.

Everything else in `test-source/` exists only so the app can be type-checked and run:

| File | Purpose |
|---|---|
| `package.json` | Scripts, and TypeScript pinned as the only dev dependency |
| `tsconfig.json` | Strict mode, CommonJS output (so `"./math"` works without a file extension), `src/` compiled to `dist/` |

Run it:

```
cd test-source
npm install
npm run check   # type-check only
npm start       # compile and run
```

Expected output:

```
precision 2 1.23
```

`add(1.234)` sets `total` to 1.234, and `round` keeps two decimals (`PRECISION`).

## Notes for the Runner

- Use `test-source` as the source root. The file IDs are then `src/math.ts`, `src/counter.ts` and `src/main.ts`, as in the expected result.
- `node_modules/` holds TypeScript's own `.d.ts` files. The Runner skips it (`RUN-06`).
- `dist/` holds only `.js` files, since declarations are not emitted, so a `*.ts` file list never picks it up.

## Still to add

- `expected/`: the expected result as tables a script can compare (`TEST-01`)
- the broken inputs B1 to B10, and the extra checks C1 and C2
