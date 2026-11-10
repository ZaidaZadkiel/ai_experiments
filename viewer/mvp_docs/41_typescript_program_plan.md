# 41. Real TypeScript: `ts-program` on the whole program (plan)

The plan for MVP 2: understanding real TypeScript (classes, members, enums, namespaces, overloads, member calls across files, built-ins) by using TypeScript's own program and type checker over the whole examined source, which changes contracts. The work is done by a new tool, `ts-program` (`42_tool_ts_program.md`); M1 stays as is and is not run (`TPG-01`). Its grounds: `FND-82` (what M1 misses on class-heavy code), `FND-83` (TypeScript's checker on one file is feasible) and `FND-84` (reading the whole program).

**Main goal and priority** (`MVP_scope.md`, section 1.2): **MVP 2 produces a correct graph in the Viewer, from real TypeScript data, and correctness comes before consistency with the earlier work: every part of the MVP is reconsidered.**

**Status: every decision it needs (`TSP-D1` to `TSP-D12`, section 2) is decided; the phases, with their status, are in section 3.** Items use the prefix `TSP`.

## 1. Goal

- **TSP-01 [Decided]** **What a correct graph is:** section 1.1.
- **TSP-02 Met** **Built-ins are told apart** from real unresolved names, by TypeScript's library, with no list of globals (`FND-77`, `FND-83`). Shown met by `FND-98` (18 built-ins listed apart on `test-source-mvp2`) and `FND-99` (14% of uses on `app/`).
- **TSP-03 Open** **The current test source still passes**, its expected result changed only where the new contracts say so, each difference explained.
- **TSP-04 Met** **`ts-program` reads only the listed source files and TypeScript's own library**, checked by a test logging every file the compiler opens or probes (`FND-83`, strict host). Shown met by `FND-98`: the compiler read only the two listed files and 21 library files.
- **TSP-05 Met** **Timings measured** on a real codebase (the Runner's own code), with the share of uses resolved, unresolved and built-in (`TS-31`). Shown met by `FND-99`: measured on ZaAnSouVi's own `app/`.

### 1.1 What a correct graph is (`TSP-01`)

**[Decided].** Guiding idea: **the graph shows what TypeScript itself knows, and nothing it doesn't.** Every case is pinned down on `zaansouvi-mvp/test-source-mvp2/` (`FND-92`).

**A. Nodes: every declaration, once, in its container**
1. Every file and folder the Runner lists is a node (`UI-47`, `UI-48`).
2. Every declaration TypeScript binds is a node, its kind from the compiler: class, constructor, method, property, accessor, enum, enum member, namespace, function, variable, parameter, import, interface, type alias.
3. Exactly once each: the three signatures of `total` are one node; the getter and setter `label` are one node; each with the right name, kind and position (file, line and column of its name). Parameters of overload signatures (no body) are not nodes; the implementation's parameters are.
4. In its lexical container: file › namespace › class › member › its parameters and locals (`distance` in `Geometry`; `area` in `Circle`; the destructured `x`, `y` in `Rect.move`).

**B. Edges: every use, to the declaration TypeScript resolves it to**

5. Every use in a value position is one edge, of kind read, write, call or new. **From:** the innermost named declaration holding it: function, method, constructor, accessor, the class for a field initializer; a top-level variable, in a file or a namespace, for the uses in its own declaration (its type annotation and initializer: `registry`), locals inside functions not counting; the namespace for a use at the top level of a namespace; the file at top level. **To:** the declaration TypeScript's checker resolves it to, as "go to definition" in an editor would reach.
6. Resolution is static, by the declared type, not by what runs: `c.area()`, `c` a `Circle`, goes to `Circle.area`, not `Base.area`.
7. Across files, an edge goes to the original declaration, not to the import; the import has its own link (8). `new Circle(…)` in `app.ts` goes to the class `Circle` in `shapes.ts`.
8. Every import is one link to what it names, following re-exports to the original: the default import `Circle` to the class `Circle` (through `export default Circle`); the namespace import `all` to the file `shapes.ts`, and `all.Circle.unit()` gives edges to the class `Circle` and to `Circle.unit`.
9. No edge without a use: no duplicates, nothing inferred beyond what the checker says; a declaration itself is not an edge. `export { … }` and `export default …` are not edges: exports show through `exported`, and imports link through them (8).
10. What TypeScript can't resolve has no edge; it is listed with its reason (unresolved, package, missing module): `export * from "./extra"` is an unresolved re-export. Built-ins are listed apart (`Math.PI`, `Map`, `console.log`), not counted as unresolved.

**C. The cases the test source forces**

| Case | Decided |
|---|---|
| `s.area()` with `s: Shape`, an interface | an edge to `Shape.area`: **interfaces and type aliases are in the graph**; uses in type positions are edges of a separate kind, `type`, which the Viewer can hide (`TPG-D3`) |
| `shape.area()` with `shape` a `Circle \| Rect` (`app.ts`, line 25) | TypeScript returns both declarations: one edge to each, marked as a union |
| `constructor(public color …)`, a parameter property | one node, a property of the class, marked as declared in the constructor |
| `super(color)` in `Circle`'s constructor | a call edge to `Base`'s constructor |
| `class Circle extends Base`; `implements Shape` | an `extends` edge from `Circle` to `Base`; an `implements` edge to `Shape` |
| `@log` on `describe` | a call edge from the class `Base` to `log` (a decorator runs when the class is defined) |
| `(acc, s) => …` inside `total` | anonymous functions are not nodes; their parameters and uses belong to the nearest named declaration (`total`) |
| `const Anonymous = class extends Base {…}`, an anonymous class expression | its members belong to the variable `Anonymous`, as an anonymous function's parameters belong to the nearest named declaration; the `extends` edge comes from the variable |
| `const { x = 0, y = 0 } = by` | `x`, `y` are variables in `move`, and read edges to `Point.x` and `Point.y` |
| `{ x: 1, y: 2 }` passed where a `Point` is expected | no edge: property matching by context is out |
| `T` in `Rect<T extends Point>` | not a node; uses of a type parameter have no edge and are not listed |
| `Color.Red`, `Base.count`, `this.#tag` | edges to the enum member, the static property, the private field |
| `export { total as sumAreas }` | no node for the alias; an import of `sumAreas` would link to `total` |

**D. In the Viewer**

11. Lifting loses nothing and invents nothing: at every level, an edge between two visible nodes counts exactly the uses beneath them.
12. Every node and edge traces back to its file and line, and the source line shown is the right one.
13. The same source gives the same graph, byte for byte.

**E. How it is checked**
- **The reference:** the expected graph of `test-source-mvp2`, written by hand first: every node with its container, every edge with its kind and target, every unresolved use and built-in with its reason, and each view's lifted edges with their counts. `ts-program` and the Viewer's model must match it exactly.
- **A sanity check:** for every use, the edge's target compared with what TypeScript's language service gives for "go to definition"; the same compiler, but independent of `ts-program`'s extraction code, so it catches mistakes in the walk.
- **A person** checks the graph in the human review (P3).

**F. Left out on purpose** (known limits, stated, not silent gaps): runtime dispatch (which override actually runs); property matching by context; blocks as containers; anonymous functions as nodes; generic type parameters; anything in packages or `node_modules`.

## 2. Decisions

All decided (`97_second_implementation.md`, section 3.1).

| ID | Question | Decision | Changes |
|---|---|---|---|
| `TSP-D1` | **Inside the MVP, or after it** | **[Decided]** **a second stage of the MVP, MVP 2**, its main goal a correct graph from real TypeScript data, correctness before consistency (`MVP_scope.md`, section 1.2) | `MVP_scope.md` section 1.2; sections 3 to 8 to be rewritten for MVP 2 |
| `TSP-D2` | **How M1 runs** | **[Decided]** `ts-program`, not M1, runs once over the whole program (`invocation: "once"`) and writes one output file per source file (`42_tool_ts_program.md`, `TPG-12`) | `toolset.md` 4.2; `runner.md`; `DATA-08`; the Runner and the tool helper |
| `TSP-D3` | **The exception to "a tool reads one file per invocation"** | **[Decided]** a named class, **program tools** (`toolset.md`, section 4.2, `TS-37`): a tool may read every listed file of its one file type in one invocation when its language can only be understood as a whole program. It states so in `--info` (`"readsFiles": { "filePatterns": ["*.ts"], "scope": "program" }`). Every other tool keeps the rule | `toolset.md` 4.2, `TS-36`, `TS-37`; `data_topology.md` section 6 |
| `TSP-D4` | **What the program contains** | **[Decided]** only the listed `.ts` files (`.d.ts` included) and TypeScript's own library (`42_tool_ts_program.md`, `TPG-20`). No `node_modules`, no `@types`: imports from packages stay unresolved with a note | `security.md`; `DATA-09` |
| `TSP-D5` | **`tsconfig.json`** | **[Decided]** as `TPG-D4` (`42_tool_ts_program.md`, section 3.1): `ts-config` reads each config as written; `ts-program` merges them with TypeScript's API | new tool; `DATA-23` kept; `04_tools.md` |
| `TSP-D6` | **M2's fate** | **[Decided]** **M2 is not run**: `ts-program` gives the links, `code.link` records in M2's shape (`TPG-D2`, `TPG-06`). M2 stays in the repository as the record of the MVP's first stage. Noted against P4: one tool absorbed another's work, by design | `04_tools.md` M2; `DATA-06`; `FND`; P4 evidence in the findings note |
| `TSP-D7` | **What counts as a node** | **[Decided]** given by the definition of a correct graph (`TSP-01`, section 1.1, part A); types are in | `DATA-05`; `04_tools.md`, supported constructs (`TOOL-11`) |
| `TSP-D8` | **Nesting** | **[Decided]** nesting comes from `parent`: a symbol's `parent` is its **declaring symbol** (a method's is its class, a function's in a namespace is the namespace), or its file at top level. M3 is not run; the Viewer draws a frame for any entered container (`UI-37`) | `DATA-05`, `DATA-07`; `TOOL-30` to `TOOL-36`; `MVP-4` |
| `TSP-D9` | **Member uses** | **[Decided]** ordinary references marked `member` (`42_tool_ts_program.md`, section 5.2) | `DATA-05` |
| `TSP-D10` | **Built-ins** | **[Decided]** as `TPG-D5`: marked `built-in`, listed apart in Problems | `DATA-05`; `UI-35`, `UI-57` |
| `TSP-D11` | **Refresh** | **[Decided]** the Runner reruns `ts-program` when **any** of its input files or configs changed (its fingerprint covers all of them); it writes only the output files whose content changed; **no incremental state** (`.tsbuildinfo`) in the first version, one less thing that could make a result stale, to add if timings call for it | `RUN-17` to `RUN-22`; `toolset.md` 5.3 |
| `TSP-D12` | **JavaScript and JSX** | **[Decided]** out of MVP 2: `.tsx`, `.js` and `.jsx` are not read. The same program approach handles them later, one tool per file type (`FND-81`, `40_tools_fileKind.md`) | none |

## 3. Phases

Each phase ends with its checks passing. Days are rough, for one developer with AI. Each phase's status is the one in `97_second_implementation.md`, section 3.2.

### Phase 0: decisions (half a day)
- Take `TSP-D1` to `TSP-D12`; record each in the working file that owns it, as **[Decided]** (`CLAUDE.md`, conventions).
- **Status:** done: every decision taken.

### Phase 1: documents (one day)
- **Working files:** `toolset.md` (4.2 the program-tool exception and its `--info`; 5.3 refresh; 6.5 what the symbols tool does; `TS-36`, `TS-31`, `TS-14`); `runner.md` (a tool run once over the program, its refresh, its dry run); `data_topology.md` (section 6, and recheck its markings); `security.md` (reading the whole program, `tsconfig.json` `extends` and `paths`, no compiler plugins loaded); `MVP_scope.md` (per `TSP-D1`).
- **`mvp_docs/`:** `01_architecture.md` (flow, technology, `ts-program`'s store); `02_data_contracts.md` (`DATA-05` new kinds, nesting, member references, built-ins; `DATA-06` links from `ts-program`; `DATA-07` nested scopes; `DATA-08` `invocation: "once"` with per-file outputs and `scope: "program"`; `DATA-09`; the `ts-config` tool's output); `03_runner.md` (`RUN-06`, `RUN-17` to `RUN-23`, `RUN-19` the options as input); `04_tools.md` (`ts-program` and `ts-config` added, M2 retired, M3 nested; supported constructs; error cases); `05_viewer.md`, `50_viewer_ui.md`, `55_viewer_backend.md` (levels at any depth, shapes for the new kinds, the frame for a class, built-ins in Problems); `06_test_plan.md` (phase 2); `07_delivery.md` (time box).
- **A new reference schema** in `proposed_schema/`, the current one marked superseded (`DATA-20`).
- **Status:** partly: the MVP 2 schema, `DATA-24`, `VIEW-15`, `RUN-33` to `RUN-35`, `UI-47`, `UI-48`, `toolset.md` 4.2; `04`, `05`, `55` and `06` not yet rewritten for MVP 2.

### Phase 2: test sources and expected results, by hand, first (one day)
- **The class test** of `FND-82` **is MVP 2's test source, unchanged** (`FND-92`): `zaansouvi-mvp/test-source-mvp2/`.
- **Its expected result written by hand**, as the MVP did (`06_test_plan.md`): every symbol with its parent, every reference with its `to`, every link, the scopes, and the graph's views at each depth (file › class › method).
- **The current test source's expected result** updated to the new contracts, each difference listed.
- **The JavaScript test** of `FND-81` kept as a fixture for later (`TSP-D12`).
- **Status:** done: `expected-mvp2/`, by hand.

### Phase 3: the `ts-config` tool (half a day)
- Reads one `tsconfig*.json`, outputs its options, `include`, `exclude`, `files` and `extends` as data. On the tool helper, like M2 and M3.
- Checks: a config with `extends` to another listed config; one extending a package; none at all; a malformed one (a run error for that config).
- **Status:** deferred (`TPG-D4a`): MVP 2 runs without `ts-config`.

### Phase 4: the tool helper and the Runner (one and a half days)
- **Tool helper:** an `invocation: "once"` tool writing one output file per source file (`<file-key>` filled per file it writes), each atomic, with `outputChange` per file.
- **Runner:**
  - accept `readsFiles.scope: "program"` with `invocation: "once"`; send such a tool the list of its files (by its patterns) and `source_root`; refuse it otherwise inconsistent;
  - its fingerprint covers every input file's hash and its options (`TSP-D11`);
  - read a once tool's per-file outputs into the cache (`buildData`, `outputPath`);
  - pass `ts-config`'s output to `ts-program` as a parameter;
  - its dry run.
- Checks: the Runner's events and cache for a run with `ts-config`, `ts-program` and M3; a change to one file reruns `ts-program` once; nothing changed skips it.
- **Status:** done: the run list, the full listing with statuses and folders, list parameters, per-file outputs from a once tool, rerun on any change, the "no file to read" stop; the tool helper needed no change.

### Phase 5: build `ts-program` (two days)
- **Build the program** from the listed files and the options, through a compiler host that shows TypeScript only those files and its own library (the strict host of `FND-83`): no probing, no reading outside.
- **Extract per file:** declarations through the checker (`TSP-D7`), each with its parent (`TSP-D8`), its `range` and `location`; references from every identifier and member name in value positions, each resolved with `getSymbolAtLocation`, aliases followed across files, `to` the declaration's stable ID; overloads and getter/setter pairs merged; built-ins marked (`TSP-D10`); imports as `code.link` records (`TSP-D6`), default, namespace and re-exports included.
- **No incremental state** (`.tsbuildinfo`) in the first version (`TSP-D11`).
- **Notes, not errors:** type errors are not `ts-program`'s concern (it doesn't check types for correctness); a syntax error in any file stays a run error, naming the file.
- **Its dry run:** checks its parameters and that every listed file parses; it builds the program through the same host and checks syntax only, with no checker (`TPG-23`).
- Checks: exact match with phase 2's expected results; the strict host's log shows only listed files and TypeScript's library (`TSP-04`); the hand run (`TEST-08`) adapted.
- **Status:** done: `ts-program` matches the expected graph exactly. M1 is kept as is, not run (`TPG-01`).

### Phase 6: M3 nested (half a day)
- A scope for every owner (`TSP-D8`), each scope's parent the enclosing scope; memberships from `ts-program`'s parents.
- Checks: exact match with phase 2; order independence (`FND-58`).
- **Status:** not needed for now (`TPG-06`): M3 not run.

### Phase 7: the Viewer (one day)
- **Levels at any depth:** the model already lifts generically; check it at file › class › method, and the frame (`UI-37`) for a class or a method as owner.
- **Shapes** for the new kinds (`UI-41`): class, method, property, accessor, enum, namespace.
- **Built-ins** apart in Problems, out of the unresolved count (`TSP-D10`).
- Checks: `check-model.mjs` against phase 2's graph views; `check-server.mjs`; browse steps at each depth, with screenshots.
- **Status:** done, page only and model format 2: levels at any depth, shapes for the new kinds, built-ins apart, other keys in Details, the "Not connected" frame with folders and status icons; frames for containers other than scopes still open.

### Phase 8: measure and record (one day)
- **A real codebase:** run on the Runner's own code (`app/runner/src`) and on another real project; record timings (a full run, a rerun after one change, the Viewer's load) and the share of uses resolved, built-in and unresolved (`TSP-05`).
- **Findings:** `97_second_implementation.md` records MVP 2; `99_findings.md` the decisions and what the build found; the findings note (`07_delivery.md`) covers both stages.
- **Status:** measured on ZaAnSouVi's own `app/` (`FND-99`); findings note after the human review.

**Total:** about eight to nine days, with phase 0 first and phases 3 and 6 able to run beside 4 and 5.

## 4. Risks

| Risk | Mitigation |
|---|---|
| **Time on large codebases:** the whole program is checked in one invocation | measured in phase 8; TypeScript's incremental state added if timings call for it (`TSP-D11`); `TS-31` |
| **Memory** on large codebases | measured in phase 8; a limit noted if needed |
| **`tsconfig.json` variety:** `paths`, project references, `composite`, several configs | the first version supports one effective config; others reported as notes |
| **Declaration merging** (an interface and a namespace, a class and a namespace with one name) | one symbol, its ID from the first declaration; other declarations listed |
| **IDs moving** when code above a declaration changes (line and column in the ID) | as `DATA-02`; stable IDs across edits are a separate question |
| **The strict host missing a path** TypeScript needs, giving wrong results quietly | the read log as a test (`TSP-04`); a run on a real codebase compared with plain `tsc` resolution on a sample |
| **P4 evidence** weakened by `ts-program` absorbing M2 | stated in the findings note; the P4 tests after the MVP (`MVP_scope.md`, 10.1) still apply to M3, `ts-config` and the Viewer |

## 5. Done when

1. `TSP-01` to `TSP-05` hold, with their checks passing.
2. Every check of the current MVP passes on the updated expected results.
3. The documents of phase 1 say what was built; the reference schema is current.
4. The human review (P3) can be done on a real codebase.
