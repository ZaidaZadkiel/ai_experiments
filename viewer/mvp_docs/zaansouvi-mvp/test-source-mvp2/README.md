# test-source-mvp2

The test source of MVP 2 (decided by the user on 2026-11-09; `mvp_docs/97_second_implementation.md`, section 3.3; `mvp_docs/99_findings.md`, `FND-92`). It is the class-heavy TypeScript test written on 2026-11-09 to see what M1 misses (`FND-82`), copied here unchanged. On 2026-11-09 the user asked for subfolders with several files importing functions from `shapes.ts`, `app.ts` and each other (`FND-104`); `shapes.ts` and `app.ts` stay unchanged.

| File | What it exercises |
|---|---|
| `src/shapes.ts` | an interface, a type alias, an enum and a `const enum`; an abstract class with a static, a `readonly` and a `#private` field, parameter properties, a getter and setter, a decorated method; two subclasses, one generic; an overloaded function; a namespace with a function; a class expression; `as const satisfies`; re-exports and a default export |
| `src/util/numbers.ts` | added 2026-11-09 (`FND-104`): imports a function and a type from `shapes.ts` one folder up; calls a method of the imported interface; functions calling each other in one file |
| `src/report/format.ts` | added 2026-11-09: imports a function from a sibling folder (`../util/numbers`) |
| `src/report/summary.ts` | added 2026-11-09: imports `build` from `app.ts`, a namespace from `shapes.ts`, from the same folder (`./format`) and from a sibling folder; calls a method of `app.ts`'s `Scene`, a class `app.ts` doesn't export, on what `build()` returns |
| `src/report/charts/bars.ts` | added 2026-11-09: two folders down; imports the default export and a function from `shapes.ts` (`../../shapes`), from its parent folder (`../format`, `../summary`) and from `../../util/numbers`; arrow parameters; a function calling another in its file |
| `src/app.ts` | default, named, type-only and namespace imports from `shapes.ts`; a class of its own using them; member calls on imported classes; chained calls through a `this` return type; destructuring in a loop; `try`/`catch`/`finally` |

Deliberate, kept as written:
- **`export * from "./extra"`** in `shapes.ts` names a file that doesn't exist: an unresolved re-export.
- **No `tsconfig.json`:** compiler options come from wherever `TPG-D4` decides; until then TypeScript's defaults.
- **Built-ins are used** (`Math`, `Map`, `String`, `console`), to check they are told apart (`TPG-D5`).

Its expected graph is to be written by hand before `ts-program` is built (`mvp_docs/41_typescript_program_plan.md`, phase 2). What TypeScript's checker resolves on it, file by file, is in `FND-83`.
