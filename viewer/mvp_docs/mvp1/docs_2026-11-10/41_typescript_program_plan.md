# 41. Real TypeScript: M1 on the whole program (plan)

A plan to make M1 understand real TypeScript (classes, members, enums, namespaces, overloads, member calls across files, built-ins) by using TypeScript's own program and type checker over the whole examined source, which changes contracts. Written on 2026-11-09 at the user's request, after `FND-82` (what M1 misses on class-heavy code), `FND-83` (TypeScript's checker on one file is feasible) and `FND-84` (M1 reading the whole program, considered).

**Main goal and priority** (decided by the user on 2026-11-09; `MVP_scope.md`, section 1.2): **MVP 2 produces a correct graph in the Viewer, from real TypeScript data, and correctness comes before consistency with the earlier work: every part of the MVP is reconsidered.** The suggested answers in section 2 were written to change as little as possible (M2's shape kept, the refresh rule kept, the ID rule kept); each is to be **re-examined with correctness first**, and replaced where a more correct answer exists.

**Since 2026-11-09:** M1 stays as is and is not run; a new tool, `ts-program`, runs TypeScript instead (`42_tool_ts_program.md`). Phase 5 below ("M1 on the program") is replaced by building `ts-program`; where this plan says M1 is rewritten, read `ts-program`.

**Status: a plan; `TSP-D1` decided, the rest not; nothing built.** ~~**Status: a plan. Nothing in it is decided or built.**~~ Section 2 lists the decisions it needs, each with a suggested answer; the work starts once they are taken, and the rest of the plan follows the suggested answers until then. Items use the prefix `TSP`. The user has a backup of the whole folder from before this plan (2026-11-09).

## 1. Goal

- **TSP-01** ~~On the class test of `FND-82` (moved into the project as a test source, phase 2), the graph is **correct**: every declaration a node in its container (a class in its file, a method in its class, a function in its namespace); every use an edge from the function or method that holds it to the declaration it means, member calls included, across files; every import, default and namespace imports and re-exports included, reaching the declaration it names.~~ *(Replaced on 2026-11-09 by section 1.1.)* **What a correct graph is:** section 1.1, decided as the starting point.
- **TSP-02** **Built-ins are told apart** from real unresolved names, by TypeScript's library, with no list of globals (`FND-77`, `FND-83`).
- **TSP-03** **The current test source still passes**, its expected result changed only where the new contracts say so, each difference explained.
- **TSP-04** **M1 reads only the listed source files and TypeScript's own library**, checked by a test logging every file the compiler opens or probes (`FND-83`, strict host).
- **TSP-05** **Timings measured** on a real codebase (the Runner's own code), with the share of uses resolved, unresolved and built-in (`TS-31`).

### 1.1 What a correct graph is (`TSP-01`)

**Decided by the user on 2026-11-09 as the starting point** (`FND-93`): proposed then, accepted as suggested, to be refined as the build and the checks show more. Each refinement is recorded here, the replaced wording struck. Guiding idea: **the graph shows what TypeScript itself knows, and nothing it doesn't.** Every case is pinned down on `zaansouvi-mvp/test-source-mvp2/` (`FND-92`).

**A. Nodes: every declaration, once, in its container**
1. Every file and folder the Runner lists is a node (`UI-47`, `UI-48`).
2. Every declaration TypeScript binds is a node, its kind from the compiler: class, constructor, method, property, accessor, enum, enum member, namespace, function, variable, parameter, import, interface, type alias.
3. Exactly once each: the three signatures of `total` are one node; the getter and setter `label` are one node; each with the right name, kind and position (file, line and column of its name).
4. In its lexical container: file › namespace › class › member › its parameters and locals (`distance` in `Geometry`; `area` in `Circle`; the destructured `x`, `y` in `Rect.move`).

**B. Edges: every use, to the declaration TypeScript resolves it to**

5. Every use in a value position is one edge, of kind read, write, call or new. **From:** the innermost named declaration holding it: function, method, constructor, accessor, the class for a field initializer, or a variable whose value is a function (`registry`); the file at top level. **To:** the declaration TypeScript's checker resolves it to, as "go to definition" in an editor would reach.
6. Resolution is static, by the declared type, not by what runs: `c.area()`, `c` a `Circle`, goes to `Circle.area`, not `Base.area`.
7. Across files, an edge goes to the original declaration, not to the import; the import has its own link (8). `new Circle(…)` in `app.ts` goes to the class `Circle` in `shapes.ts`.
8. Every import is one link to what it names, following re-exports to the original: the default import `Circle` to the class `Circle` (through `export default Circle`); the namespace import `all` to the file `shapes.ts`, and `all.Circle.unit()` gives edges to the class `Circle` and to `Circle.unit`.
9. No edge without a use: no duplicates, nothing inferred beyond what the checker says; a declaration itself is not an edge.
10. What TypeScript can't resolve has no edge; it is listed with its reason (unresolved, package, missing module): `export * from "./extra"` is an unresolved re-export. Built-ins are listed apart (`Math.PI`, `Map`, `console.log`), not counted as unresolved.

**C. The cases the test source forces**

| Case | Decided (starting point) |
|---|---|
| `s.area()` with `s: Shape`, an interface | an edge to `Shape.area`: **interfaces and type aliases are in the graph**; uses in type positions are edges of a separate kind, `type`, which the Viewer can hide (answers `TPG-D3`) |
| `shape.area()` with `shape` a `Circle \| Rect` (`app.ts`, line 25) | TypeScript returns both declarations: one edge to each, marked as a union |
| `constructor(public color …)`, a parameter property | one node, a property of the class, marked as declared in the constructor |
| `super(color)` in `Circle`'s constructor | a call edge to `Base`'s constructor |
| `class Circle extends Base`; `implements Shape` | an `extends` edge from `Circle` to `Base`; an `implements` edge to `Shape` |
| `@log` on `describe` | a call edge from the class `Base` to `log` (a decorator runs when the class is defined) |
| `(acc, s) => …` inside `total` | anonymous functions are not nodes; their parameters and uses belong to the nearest named declaration (`total`) |
| `const { x = 0, y = 0 } = by` | `x`, `y` are variables in `move`, and read edges to `Point.x` and `Point.y` |
| `{ x: 1, y: 2 }` passed where a `Point` is expected | no edge: property matching by context is out |
| `T` in `Rect<T extends Point>` | not a node |
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

**Refinements** (2026-11-09, found while writing the expected graph of `test-source-mvp2`, `FND-97`):
- **R1.** An anonymous class expression (`const Anonymous = class extends Base {…}`): its members belong to the variable, as an anonymous function's parameters belong to the nearest named declaration; the `extends` edge comes from the variable.
- **R2.** Parameters of overload signatures (no body) are not nodes; the implementation's parameters are.
- **R3.** ~~or a variable whose value is a function (`registry`)~~ (point 5) **A top-level variable, in a file or a namespace, is the "from" of the uses in its own declaration** (its type annotation and initializer): `registry` holds a `Map`, not a function, so point 5's example meant this. Locals inside functions don't count.
- **R4.** A use at the top level of a namespace comes from the namespace, as a top-level use comes from the file.
- **R5.** `export { … }` and `export default …` are not edges: exports show through `exported`, and imports link through them (point 8).
- **R6.** Uses of a type parameter (`T`) have no edge and are not listed, since type parameters are not nodes (part F).

**F. Left out on purpose** (known limits, stated, not silent gaps): runtime dispatch (which override actually runs); property matching by context; blocks as containers; anonymous functions as nodes; generic type parameters; anything in packages or `node_modules`.

## 2. Decisions needed first

| ID | Decision | Suggested answer | Changes |
|---|---|---|---|
| `TSP-D1` | **Inside the MVP, or after it** | **Decided** (2026-11-09): **a second stage of the MVP, MVP 2**, its main goal a correct graph from real TypeScript data, correctness before consistency (`MVP_scope.md`, section 1.2). ~~A second stage of the MVP ("MVP 2"): the current build is backed up and its findings stand; the human review (P3) and the findings note are done on MVP 2, which is what a real codebase needs~~ | `MVP_scope.md` section 1.2 (done); sections 3 to 8 to be rewritten for MVP 2 |
| `TSP-D2` | **How M1 runs** | **Decided** (2026-11-09, `FND-96`): overtaken: `ts-program` runs once over the program, per-file outputs (`42`, `TPG-12`). Was suggested: **`invocation: "once"`**: M1 reads the whole program in one invocation and writes **one output file per source file**, so M3 and the Viewer keep per-file records. Honest about what it reads; no "compute all, serve one" cache trick (`FND-84`) | `toolset.md` 4.2; `runner.md`; `DATA-08`; the Runner and the tool helper |
| `TSP-D3` | **The exception to "a tool reads one file per invocation"** | **Decided** (2026-11-09, `FND-96`): as `TS-37` in `toolset.md`: program tools, a named exception. Was suggested: **A named class, program tools:** a tool may read every listed file of its one file type in one invocation when its language can only be understood as a whole program. It states so in `--info` (`"readsFiles": { "filePatterns": ["*.ts"], "scope": "program" }`). Every other tool keeps the rule | `toolset.md` 4.2 ([Decided] item amended), `TS-36` reopened and answered; `data_topology.md` section 6 |
| `TSP-D4` | **What the program contains** | **Decided** (2026-11-09, `FND-96`): listed `.ts` files and TypeScript's library only (`42`, `TPG-20`). Was suggested: **Only the listed `*.ts` files** (`.d.ts` included, since they are TypeScript) **and TypeScript's own library**. No `node_modules`, no `@types`: imports from packages stay unresolved with a note, as today. Keeps reading inside the source, and `security.md` simple | `security.md`; `DATA-09` |
| `TSP-D5` | **`tsconfig.json`** | **Decided** (2026-11-09) as `TPG-D4`: `42_tool_ts_program.md`, section 3.1 (`ts-config` reads each config as written; `ts-program` merges them with TypeScript's API). Was suggested: **A small new tool, `ts-config`**, reads each `tsconfig*.json` (one file type, one file per invocation) and outputs its options as data; the Runner passes them to M1. `extends` between listed configs is followed in the data; an `extends` to a package, or no config at all, gives TypeScript's defaults with a note. Project references are out of the first version | new tool; `DATA-23` kept; `04_tools.md` |
| `TSP-D6` | **M2's fate** | **Retired from the run**: M1 now resolves imports itself and outputs `code.link` records for them, in M2's shape, so the Viewer and M3 see no difference. M2 stays in the repository as the record of the MVP's first stage. Noted against P4: one tool absorbed another's work, by design | `04_tools.md` M2; `DATA-06`; `FND`; P4 evidence in the findings note |
| `TSP-D7` | **What counts as a node** | **Decided** (2026-11-09, `FND-96`): overtaken by section 1.1, types in. Was suggested: Classes, constructors, methods, properties (parameter properties included), accessors (getter and setter merged), enums and enum members, namespaces, functions (overloads merged into one, at the implementation), variables, parameters, imports. **Types left out** of the first version: interfaces, type aliases and uses in type positions, as today (`TOOL-11`) | `DATA-05`; `04_tools.md`, supported constructs |
| `TSP-D8` | **Nesting** | A symbol's `parent` is its **declaring symbol** (a method's is its class, a function's in a namespace is the namespace), or its file at top level. M3 makes a scope for every owner: file, function, method, constructor, accessor, class, namespace; scopes nest (option D of `MVP-4`, blocks still out) | `DATA-05`, `DATA-07`; `TOOL-30` to `TOOL-36`; `MVP-4` |
| `TSP-D9` | **Member uses** | **Decided** (2026-11-09, `FND-96`): references marked `member` (`42`, section 5.2). Was suggested: An ordinary reference (`read`, `write`, `call`) whose `to` is the member's stable ID, marked `member: true`. The ID rule is unchanged: `file#name@line:column` already names each member (`DATA-02`) | `DATA-05` |
| `TSP-D10` | **Built-ins** | **Decided** (2026-11-09, `FND-96`): as `TPG-D5`. Was suggested: A reference to a declaration in TypeScript's library keeps `to: null`, with `reason: "built-in"` and the library name (`builtin: "Map"`). The Viewer lists them apart in Problems and leaves them out of the unresolved count. Built-in nodes, if wanted, come later | `DATA-05`; `UI-35`, `UI-57` |
| `TSP-D11` | **Refresh** | **Decided** (2026-11-09, `FND-96`): the Runner reruns `ts-program` when **any** of its input files or configs changed (its fingerprint covers all of them); it writes only the output files whose content changed; **no incremental state** (`.tsbuildinfo`) in the first version, one less thing that could make a result stale, to add if timings call for it. ~~The Runner reruns M1 when **any** of its input files or its options changed: its fingerprint covers all of them. M1 keeps TypeScript's incremental state in its store, so a rerun is cheaper, and writes only the output files whose content changed. No fine-grained cache of its own in the first version~~ | `RUN-17` to `RUN-22`; `toolset.md` 5.3 |
| `TSP-D12` | **JavaScript and JSX** | **Decided** (2026-11-09, `FND-96`): out of MVP 2. Was suggested: Out of this plan: `.tsx`, `.js` and `.jsx` stay unlisted. The same program approach handles them later, one tool per file type (`FND-81`, `40_tools_fileKind.md`) | none |

## 3. Phases

Each phase ends with its checks passing. Days are rough, for one developer with AI.

### Phase 0: decisions (half a day)
- Take `TSP-D1` to `TSP-D12`; record each in the working file that owns it, as **[Decided]**, striking replaced wording (`CLAUDE.md`, conventions).

### Phase 1: documents (one day)
- **Working files:** `toolset.md` (4.2 the program-tool exception and its `--info`; 5.3 refresh; 6.5 what the symbols tool does; `TS-36`, `TS-31`, `TS-14`); `runner.md` (a tool run once over the program, its refresh, its dry run); `data_topology.md` (section 6, and recheck its markings); `security.md` (reading the whole program, `tsconfig.json` `extends` and `paths`, no compiler plugins loaded); `MVP_scope.md` (per `TSP-D1`).
- **`mvp_docs/`:** `01_architecture.md` (flow, technology, M1's store); `02_data_contracts.md` (`DATA-05` new kinds, nesting, member references, built-ins; `DATA-06` links from M1; `DATA-07` nested scopes; `DATA-08` `invocation: "once"` with per-file outputs and `scope: "program"`; `DATA-09`; the `ts-config` tool's output); `03_runner.md` (`RUN-06`, `RUN-17` to `RUN-23`, `RUN-19` the options as input); `04_tools.md` (M1 rewritten, `ts-config` added, M2 retired, M3 nested; supported constructs; error cases); `05_viewer.md`, `50_viewer_ui.md`, `55_viewer_backend.md` (levels at any depth, shapes for the new kinds, the frame for a class, built-ins in Problems); `06_test_plan.md` (phase 2); `07_delivery.md` (time box).
- **A new reference schema** in `proposed_schema/`, the current one marked superseded (`DATA-20`).

### Phase 2: test sources and expected results, by hand, first (one day)
- **The class test** of `FND-82` ~~moved into `zaansouvi-mvp/test-source-classes/`, with a `tsconfig.json`, and a third file using inheritance across files (a subclass in another file, `super` calls, an inherited member used through the subclass).~~ **is MVP 2's test source, unchanged** (decided by the user on 2026-11-09, `FND-92`): `zaansouvi-mvp/test-source-mvp2/`. The additions once suggested here (a `tsconfig.json`, a third file with inheritance across files) are not made.
- **Its expected result written by hand**, as the MVP did (`06_test_plan.md`): every symbol with its parent, every reference with its `to`, every link, the scopes, and the graph's views at each depth (file › class › method).
- **The current test source's expected result** updated to the new contracts, each difference listed.
- **The JavaScript test** of `FND-81` kept as a fixture for later (`TSP-D12`).

### Phase 3: the `ts-config` tool (half a day)
- Reads one `tsconfig*.json`, outputs its options, `include`, `exclude`, `files` and `extends` as data. On the tool helper, like M2 and M3.
- Checks: a config with `extends` to another listed config; one extending a package; none at all; a malformed one (a run error for that config).

### Phase 4: the tool helper and the Runner (one and a half days)
- **Tool helper:** an `invocation: "once"` tool writing one output file per source file (`<file-key>` filled per file it writes), each atomic, with `outputChange` per file.
- **Runner:**
  - accept `readsFiles.scope: "program"` with `invocation: "once"`; send such a tool the list of its files (by its patterns) and `source_root`; refuse it otherwise inconsistent;
  - its fingerprint covers every input file's hash and its options (`TSP-D11`);
  - read a once tool's per-file outputs into the cache (`buildData`, `outputPath`), which today fills `<file-key>` only for per-file tools;
  - pass `ts-config`'s output to M1 as a parameter;
  - its dry run.
- Checks: the Runner's events and cache for a run with `ts-config`, M1 and M3; a change to one file reruns M1 once; nothing changed skips it.

### Phase 5: M1 on the program (two days)
- **Build the program** from the listed files and the options, through a compiler host that shows TypeScript only those files and its own library (the strict host of `FND-83`): no probing, no reading outside.
- **Extract per file:** declarations through the checker (`TSP-D7`), each with its parent (`TSP-D8`), its `range` and `location`; references from every identifier and member name in value positions, each resolved with `getSymbolAtLocation`, aliases followed across files, `to` the declaration's stable ID; overloads and getter/setter pairs merged; built-ins marked (`TSP-D10`); imports as `code.link` records (`TSP-D6`), default, namespace and re-exports included.
- **Keep** TypeScript's incremental state in the store (`.tsbuildinfo`), so a rerun reuses it.
- **Notes, not errors:** type errors are not M1's concern (it doesn't check types for correctness); a syntax error in any file stays a run error, naming the file.
- **Its dry run:** checks its parameters and that every listed file parses; builds no program.
- Checks: exact match with phase 2's expected results; the strict host's log shows only listed files and TypeScript's library (`TSP-04`); the hand run (`TEST-08`) adapted.

### Phase 6: M3 nested (half a day)
- A scope for every owner (`TSP-D8`), each scope's parent the enclosing scope; memberships from M1's parents.
- Checks: exact match with phase 2; order independence (`FND-58`).

### Phase 7: the Viewer (one day)
- **Levels at any depth:** the model already lifts generically; check it at file › class › method, and the frame (`UI-37`) for a class or a method as owner.
- **Shapes** for the new kinds (`UI-41`): class, method, property, accessor, enum, namespace.
- **Built-ins** apart in Problems, out of the unresolved count (`TSP-D10`).
- Checks: `check-model.mjs` against phase 2's graph views; `check-server.mjs`; browse steps at each depth, with screenshots.

### Phase 8: measure and record (one day)
- **A real codebase:** run on the Runner's own code (`app/runner/src`) and on another real project; record timings (a full run, a rerun after one change, the Viewer's load) and the share of uses resolved, built-in and unresolved (`TSP-05`).
- **Findings:** `98_first_implementation.md` gets a section for MVP 2; `99_findings.md` the decisions and what the build found; the findings note (`07_delivery.md`) covers both stages.

**Total:** about eight to nine days, with phase 0 first and phases 3 and 6 able to run beside 4 and 5.

## 4. Risks

| Risk | Mitigation |
|---|---|
| **Time on large codebases:** the whole program is checked in one invocation | TypeScript's incremental state in the store; measured in phase 8; `TS-31` |
| **Memory** on large codebases | measured in phase 8; a limit noted if needed |
| **`tsconfig.json` variety:** `paths`, project references, `composite`, several configs | the first version supports one effective config; others reported as notes |
| **Declaration merging** (an interface and a namespace, a class and a namespace with one name) | one symbol, its ID from the first declaration; other declarations listed |
| **IDs moving** when code above a declaration changes (line and column in the ID) | unchanged from today (`DATA-02`); stable IDs across edits are a separate question |
| **The strict host missing a path** TypeScript needs, giving wrong results quietly | the read log as a test (`TSP-04`); a run on a real codebase compared with plain `tsc` resolution on a sample |
| **P4 evidence** weakened by M1 absorbing M2 | stated in the findings note; the P4 tests after the MVP (`MVP_scope.md`, 10.1) still apply to M3, `ts-config` and the Viewer |

## 5. Done when

1. `TSP-01` to `TSP-05` hold, with their checks passing.
2. Every check of the current MVP passes on the updated expected results.
3. The documents of phase 1 say what was built; the reference schema is current.
4. The human review (P3) can be done on a real codebase.
