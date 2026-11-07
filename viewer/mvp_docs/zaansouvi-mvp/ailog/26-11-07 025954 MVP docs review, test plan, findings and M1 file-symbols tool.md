# AI conversation log

Verbatim log of the Claude Code session `fb4dbeae-b7f9-4910-94ee-f53420a09bf5` (model claude-opus-5-5), working in `/home/zaida/viewer/mvp_docs`. Times are UTC. Messages, tool calls and tool results are reproduced as recorded; internal reasoning and system attachments are left out.

## 2026-11-07 02:59:54 — User

check if the documentation in this folder is enough to build a mvp, check with the information referenced on the parent folder when necessary

### 2026-11-07 02:59:56 — Tool call: Bash

```json
{
  "command": "cd /home/zaida/viewer && ls -la . mvp_docs && wc -l *.md mvp_docs/*.md",
  "description": "List docs and line counts"
}
```

### 2026-11-07 02:59:58 — Tool result

```
.:
total 244
drwxr-xr-x. 1 zaida zaida   214 Nov  6 20:48 .
drwx------. 1 zaida zaida   312 Nov  6 20:59 ..
-rw-r--r--. 1 zaida zaida  8307 Nov  6 20:48 CLAUDE.md
-rw-r--r--. 1 zaida zaida 27812 Nov  6 20:07 data_topology.md
drwxr-xr-x. 1 zaida zaida   222 Nov  6 20:50 mvp_docs
-rw-r--r--. 1 zaida zaida 25289 Nov  6 20:48 MVP_scope.md
-rw-r--r--. 1 zaida zaida 12308 Nov  6 20:07 project_organization.md
-rw-r--r--. 1 zaida zaida 34404 Nov  6 20:12 runner.md
-rw-r--r--. 1 zaida zaida 15064 Nov  6 20:41 security.md
-rw-r--r--. 1 zaida zaida 62222 Nov  6 20:41 toolset.md
-rw-r--r--. 1 zaida zaida 43491 Nov  6 20:41 viewer.md

mvp_docs:
total 52
drwxr-xr-x. 1 zaida zaida  222 Nov  6 20:50 .
drwxr-xr-x. 1 zaida zaida  214 Nov  6 20:48 ..
-rw-r--r--. 1 zaida zaida 5981 Nov  6 20:50 01_architecture.md
-rw-r--r--. 1 zaida zaida 8210 Nov  6 20:50 02_data_contracts.md
-rw-r--r--. 1 zaida zaida 3813 Nov  6 20:50 03_runner.md
-rw-r--r--. 1 zaida zaida 5115 Nov  6 20:50 04_tools.md
-rw-r--r--. 1 zaida zaida 4081 Nov  6 20:50 05_viewer.md
-rw-r--r--. 1 zaida zaida 6612 Nov  6 20:50 06_test_plan.md
-rw-r--r--. 1 zaida zaida 2135 Nov  6 20:50 07_delivery.md
-rw-r--r--. 1 zaida zaida 3101 Nov  6 20:50 README.md
    65 CLAUDE.md
   287 data_topology.md
   245 MVP_scope.md
   151 project_organization.md
   233 runner.md
   128 security.md
   479 toolset.md
   357 viewer.md
   118 mvp_docs/01_architecture.md
   165 mvp_docs/02_data_contracts.md
    63 mvp_docs/03_runner.md
    65 mvp_docs/04_tools.md
    54 mvp_docs/05_viewer.md
   154 mvp_docs/06_test_plan.md
    33 mvp_docs/07_delivery.md
    46 mvp_docs/README.md
  2643 total
Shell cwd was reset to /home/zaida/viewer/mvp_docs
```

### 2026-11-07 02:59:59 — Tool call: Bash

```json
{
  "command": "for f in README.md 0*.md; do echo \"=================== $f\"; cat \"$f\"; done",
  "description": "Read all mvp_docs files"
}
```

### 2026-11-07 03:00:00 — Tool result

```
<persisted-output>
Output too large (38.4KB). Full output saved to: /home/zaida/.claude/projects/-home-zaida-viewer-mvp-docs/fb4dbeae-b7f9-4910-94ee-f53420a09bf5/tool-results/bct57td53.txt

Preview (first 2KB):
=================== README.md
# ZaAnSouVi MVP: build requirements

This folder holds everything needed to build the ZaAnSouVi MVP: a proof of concept with a Runner, a Viewer and three tools, that shows whether a tool-based source code visualizer can work at all.

## Status of this folder

- Everything here is **accepted for building the MVP, and only within this folder.** It is a starting point inferred from the working files, written so a developer (working with AI) can start building.
- It **changes no decision** in the working files (`toolset.md`, `runner.md`, `viewer.md`, `data_topology.md`, `project_organization.md`, `security.md`, `MVP_scope.md`).
- Where it conflicts with a **[Decided]** item in a working file, **the working file wins**, and this folder is corrected.
- It gives starting answers to `MVP-9` to `MVP-15` (`MVP_scope.md`, section 8). The MVP-only answers in `MVP_scope.md` section 8.1, still [Proposed] there, are treated as accepted here.
- The guiding rule is the MVP's: **least effort, acceptable failures, use a library or built-in when one does the job, simplicity over precision** (`MVP_scope.md`, section 1).

## What the MVP must prove

From `MVP_scope.md`, section 1.1:
- **P1.** The Runner and the Viewer can work together to manage the app.
- **P2.** The Runner works from a single command and produces the data the Viewer needs.
- **P3.** The Viewer works, as judged by a person.
- **P4.** Independent tools are a valuable solution. Tested after the MVP (`MVP_scope.md`, section 10).

## Files

| File | Contents |
|---|---|
| `01_architecture.md` | Components, the flow of a run, layout on disk, the single database, technology choices for the MVP |
| `02_data_contracts.md` | Building blocks (IDs, locations), the stable ID rule, each tool's `--info`, parameters and outputs, results, logs, `last_run.json`, the database tables |
| `03_runner.md` | Runner requirements |
...
</persisted-output>
```

### 2026-11-07 03:00:02 — Tool call: Read

```json
{
  "file_path": "/home/zaida/.claude/projects/-home-zaida-viewer-mvp-docs/fb4dbeae-b7f9-4910-94ee-f53420a09bf5/tool-results/bct57td53.txt",
  "allow_large": true
}
```

### 2026-11-07 03:00:02 — Tool result

````
1	=================== README.md
2	# ZaAnSouVi MVP: build requirements
3	
4	This folder holds everything needed to build the ZaAnSouVi MVP: a proof of concept with a Runner, a Viewer and three tools, that shows whether a tool-based source code visualizer can work at all.
5	
6	## Status of this folder
7	
8	- Everything here is **accepted for building the MVP, and only within this folder.** It is a starting point inferred from the working files, written so a developer (working with AI) can start building.
9	- It **changes no decision** in the working files (`toolset.md`, `runner.md`, `viewer.md`, `data_topology.md`, `project_organization.md`, `security.md`, `MVP_scope.md`).
10	- Where it conflicts with a **[Decided]** item in a working file, **the working file wins**, and this folder is corrected.
11	- It gives starting answers to `MVP-9` to `MVP-15` (`MVP_scope.md`, section 8). The MVP-only answers in `MVP_scope.md` section 8.1, still [Proposed] there, are treated as accepted here.
12	- The guiding rule is the MVP's: **least effort, acceptable failures, use a library or built-in when one does the job, simplicity over precision** (`MVP_scope.md`, section 1).
13	
14	## What the MVP must prove
15	
16	From `MVP_scope.md`, section 1.1:
17	- **P1.** The Runner and the Viewer can work together to manage the app.
18	- **P2.** The Runner works from a single command and produces the data the Viewer needs.
19	- **P3.** The Viewer works, as judged by a person.
20	- **P4.** Independent tools are a valuable solution. Tested after the MVP (`MVP_scope.md`, section 10).
21	
22	## Files
23	
24	| File | Contents |
25	|---|---|
26	| `01_architecture.md` | Components, the flow of a run, layout on disk, the single database, technology choices for the MVP |
27	| `02_data_contracts.md` | Building blocks (IDs, locations), the stable ID rule, each tool's `--info`, parameters and outputs, results, logs, `last_run.json`, the database tables |
28	| `03_runner.md` | Runner requirements |
29	| `04_tools.md` | Requirements for M1 (file symbols), M2 (cross-file links) and M3 (symbol scope), supported constructs, error handling |
30	| `05_viewer.md` | Viewer backend and UI requirements, levels, edge aggregation |
31	| `06_test_plan.md` | The basic examined source, its expected result, broken inputs, the human review of the Viewer, the extra checks |
32	| `07_delivery.md` | Traceability level, deliverables, time box, the findings note |
33	
34	## Requirement IDs
35	
36	Requirements are numbered per file, for example `RUN-03` or `VIEW-07`, so tests and the findings note can refer to them. Prefixes: `ARCH`, `DATA`, `RUN`, `TOOL`, `VIEW`, `TEST`, `DEL`.
37	
38	## Build order
39	
40	A suggested order, each step usable on its own:
41	1. the test source and its expected result (`06_test_plan.md`), written first, by hand
42	2. the shared building blocks and the log format (`02_data_contracts.md`)
43	3. M1, runnable by hand with `--json` (`04_tools.md`)
44	4. the Runner with M1 only: file list, dry run, real run, database (`03_runner.md`)
45	5. M2 and M3
46	6. the Viewer: backend first, then the two-level graph (`05_viewer.md`)
47	7. the broken-input tests, the extra checks, the human review, the findings note (`06_test_plan.md`, `07_delivery.md`)
48	=================== 01_architecture.md
49	# 01. Architecture
50	
51	## Components
52	
53	| Component | Language | Role in the MVP |
54	|---|---|---|
55	| **Runner** | TypeScript (Node) | Builds the file list, keeps the record of tools and the ordering, builds each tool's JSON, dry-runs then runs each tool, reads outputs and logs, updates the database, answers the Viewer |
56	| **Viewer backend** | TypeScript (Node) | Local HTTP server. Calls the Runner, reads the database, reads source lines, serves the UI |
57	| **Viewer UI** | TypeScript in the browser | Shows the levels, the details of a selection, the tool list and go / no-go results. Only displays |
58	| **Shared library** | TypeScript | Used by the Runner and the Viewer backend: database access, log reader, `--info` types, Runner output types (`runner.md`, section 1.0) |
59	| **M1 file-symbols** | TypeScript (Node) | Reads one source file, outputs its symbols and references |
60	| **M2 cross-file-links** | TypeScript (Node) | Reads no files; links imports to the declarations they refer to |
61	| **M3 symbol-scope** | TypeScript (Node) | Reads no files; outputs scopes and which scope each symbol belongs to |
62	
63	- **ARCH-01** The Runner and the Viewer are one unit, in one repository, built together.
64	- **ARCH-02** Each tool is a separate program with its own entry point. It imports nothing from the Runner, the Viewer or another tool. It may import a small tool helper module (parameters, logs, `last_run.json`) that knows nothing about any specific tool.
65	- **ARCH-03** Tools are started as separate processes, with arguments passed as an array, never through a shell command string (`security.md`, section 7).
66	
67	## Flow of a run
68	
69	```mermaid
70	sequenceDiagram
71	  participant U as User or Viewer
72	  participant R as Runner
73	  participant DB as Database
74	  participant T as Tool (M1, M2, M3)
75	  U->>R: run <source root>
76	  R->>DB: read config_ tables (record of tools, ordering)
77	  R->>R: list files, hash them
78	  R->>DB: write project_files
79	  loop each tool in the ordering (M1 once per file)
80	    R->>R: build JSON from the database and earlier outputs
81	    R->>T: --dry-run --stdin (JSON)
82	    T-->>R: go / no-go on standard output
83	    alt no-go
84	      R->>R: log, stop the run
85	    else go
86	      R->>T: --stdin (same JSON)
87	      T->>T: write output, result, log, last_run.json
88	      T-->>R: exit code
89	      R->>R: read the tool's result, log and output
90	      R->>DB: write project_outputs (and project_ facts)
91	    end
92	  end
93	  R-->>U: Viewer-mode events on standard output
94	```
95	
96	- **ARCH-04** The order is M1 (once per file), then M2, then M3. It comes from the ordering in the database, derived from `--info` (`02_data_contracts.md`). M2 and M3 don't depend on each other; ties break by tool name.
97	- **ARCH-05** Every run starts from scratch: no incremental runs (`MVP_scope.md`, section 6).
98	
99	## Layout on disk
100	
101	Answers `MVP-13` for the MVP.
102	
103	```
104	zaansouvi-mvp/
105	  app/
106	    shared/                         Runner–Viewer library
107	    tool-helper/                    small helper any TypeScript tool may use
108	    runner/
109	    viewer/
110	      server/
111	      ui/
112	    tools/
113	      file-symbols/
114	        file-symbols                launcher (the "tool_name.bin")
115	        last_run.json
116	      cross-file-links/
117	        cross-file-links
118	        last_run.json
119	      symbol-scope/
120	        symbol-scope
121	        last_run.json
122	  data/
123	    zaansouvi.sqlite                the single database (config_ and project_ tables)
124	    tools/
125	      file-symbols/
126	        output/<file-key>.json      one per examined file
127	        result.json
128	        logs/<timestamp>.log
129	        state/                      unused in the MVP
130	      cross-file-links/
131	        output/links.json
132	        result.json
133	        logs/<timestamp>.log
134	      symbol-scope/
135	        output/scopes.json
136	        result.json
137	        logs/<timestamp>.log
138	    runner/
139	      logs/<timestamp>.log
140	  test-source/                      the basic examined source (06_test_plan.md)
141	  expected/                         the expected result, written by hand
142	```
143	
144	- **ARCH-06** `last_run.json` sits next to each tool's launcher, as decided (`toolset.md`, section 4.5). With one codebase, sharing it is harmless (`TS-25`).
145	- **ARCH-07** `<file-key>` is the file ID with `/` replaced by `__`, so `src/math.ts` becomes `src__math.ts.json`.
146	- **ARCH-08** The examined source is never written to. Nothing goes outside `zaansouvi-mvp/` except the system temp, which the MVP doesn't need.
147	- **ARCH-09** The data folder can be deleted at any time; the next run rebuilds it, except the database's `config_` tables, which the Runner recreates on start (`03_runner.md`).
148	
149	## The single database
150	
151	- **ARCH-10** One SQLite file holds both configuration and codebase data (`MVP_scope.md`, section 4). Tables start with `config_` or `project_`. The tables are listed in `02_data_contracts.md`.
152	- **ARCH-11** The Runner writes all tables. The Viewer backend reads them directly and writes nothing in the MVP (no config manager).
153	
154	## Technology choices for the MVP
155	
156	These satisfy "use a library or built-in when one does the job". Versions are pinned when the project is set up.
157	
158	| Need | Choice | Why |
159	|---|---|---|
160	| Runtime for the Runner, the Viewer backend and the tools | Node.js, with TypeScript | Decided stack; one runtime for everything |
161	| Parsing TypeScript in M1 | The TypeScript compiler's own parser (`typescript` package, `ts.createSourceFile`) | Exact syntax tree with positions, no type checking needed, one file at a time (`MVP-7`) |
162	| Database | SQLite through Node's built-in `node:sqlite` if stable in the Node version used, otherwise the `better-sqlite3` package | Single file, no server |
163	| Starting tools | Node's `child_process.spawn` with an argument array | No shell, so no injection from file names |
164	| HTTP server | Node's built-in `http` module | Least effort; a handful of endpoints |
165	| Graph in the browser | Cytoscape.js | Supports compound nodes (nodes inside nodes) and has built-in layouts |
166	| Hashing files | Node's built-in `crypto` (SHA-256) | Built in |
167	=================== 02_data_contracts.md
168	# 02. Data contracts
169	
170	Answers `MVP-9`, `MVP-10` and `MVP-12` for the MVP. All data is JSON. Field names are fixed here; anything not listed is an extra value, which readers ignore (`toolset.md`, section 4.5).
171	
172	## Building blocks
173	
174	| Block | Shape | Notes |
175	|---|---|---|
176	| **File ID** | string | Path relative to the source root, with `/` separators, for example `src/math.ts` |
177	| **Position** | `{ "line": number, "column": number }` | Both start at 1 |
178	| **Location** | `{ "file": FileID, "start": Position, "end": Position }` | `end` is exclusive |
179	| **Symbol ID** | string | See the stable ID rule |
180	| **Scope ID** | string | See the stable ID rule |
181	| **Diagnostic** | `{ "severity": "error" \| "warning" \| "info", "code": string, "message": string, "location"?: Location }` | `code` is one of the error codes in `04_tools.md` |
182	
183	- **DATA-01** Every symbol, reference, link and scope carries a Location, so the Viewer can always show file:line and the source line.
184	
185	## Stable ID rule (`MVP-12`)
186	
187	- **DATA-02** Symbol ID: `<file ID>#<name>@<line>:<column>`, where line and column are those of the declaring name. Example: `src/math.ts#round@3:17`.
188	- **DATA-03** Scope ID: `<file ID>#scope@<line>:<column>` for a function scope, at the start of the function; `<file ID>#scope@file` for the file scope.
189	- **DATA-04** IDs are the same on every run over an unchanged source. Renaming or moving a declaration changes its ID; all tools must then agree on the new one (`06_test_plan.md`, check C2). Stability across edits is a product concern, not an MVP one.
190	
191	## Records
192	
193	### Symbol (from M1)
194	
195	| Field | Shape | Meaning |
196	|---|---|---|
197	| `id` | Symbol ID | |
198	| `name` | string | |
199	| `kind` | `"function"` \| `"variable"` \| `"parameter"` \| `"import"` | |
200	| `exported` | boolean | Declared with `export` |
201	| `location` | Location | Of the declaring name |
202	| `range` | Location | Of the whole declaration; for a function, its full body. M3 needs it |
203	| `parent` | File ID | Containment: every symbol sits in its file |
204	| `import` | `{ "from": string, "name": string }` | Only for `kind: "import"`: the module specifier as written, and the imported name |
205	
206	### Reference (from M1)
207	
208	| Field | Shape | Meaning |
209	|---|---|---|
210	| `id` | string | `<file ID>#ref@<line>:<column>` |
211	| `name` | string | The identifier as written |
212	| `symbol` | Symbol ID \| `null` | The declaration in the same file it refers to; `null` if none (for example `console`) |
213	| `kind` | `"declaration"` \| `"call"` \| `"read"` \| `"write"` | |
214	| `location` | Location | Of the identifier |
215	
216	### Link (from M2)
217	
218	| Field | Shape | Meaning |
219	|---|---|---|
220	| `id` | string | `<from symbol>-><to symbol>` |
221	| `from` | Symbol ID | An import symbol in one file |
222	| `to` | Symbol ID | The exported declaration it refers to, in another file |
223	| `kind` | `"import"` | The only kind in the MVP |
224	| `location` | Location | Of the import's name |
225	
226	### Scope and membership (from M3)
227	
228	| Field | Shape | Meaning |
229	|---|---|---|
230	| scope `id` | Scope ID | |
231	| scope `kind` | `"file"` \| `"function"` | One level only: functions inside functions belong to the outer function's scope |
232	| scope `name` | string | The function's name, or the file ID for the file scope |
233	| scope `location` | Location | The scope's range |
234	| scope `parent` | File ID | |
235	| membership `symbol` | Symbol ID | |
236	| membership `scope` | Scope ID | The scope the symbol's declaration sits in |
237	
238	## Tool outputs
239	
240	- **DATA-05** M1 writes `output/<file-key>.json`: `{ "file": FileID, "symbols": Symbol[], "references": Reference[], "diagnostics": Diagnostic[] }`.
241	- **DATA-06** M2 writes `output/links.json`: `{ "links": Link[], "unresolved": [{ "from": SymbolID, "reason": string }], "diagnostics": Diagnostic[] }`. An import it can't resolve is listed, not an error.
242	- **DATA-07** M3 writes `output/scopes.json`: `{ "scopes": Scope[], "membership": Membership[], "diagnostics": Diagnostic[] }`.
243	
244	## `--info` of each tool (`MVP-10`)
245	
246	- **DATA-08** `--info` prints one JSON object to standard output and exits 0. It reads nothing.
247	
248	```json
249	{
250	  "tool": "file-symbols",
251	  "version": "0.1.0",
252	  "readsFiles": { "kinds": ["*.ts"] },
253	  "parameters": {
254	    "file_id":   { "dataName": "files.file.id",   "shape": "string", "required": true },
255	    "file_path": { "dataName": "files.file.path", "shape": "string", "required": false }
256	  },
257	  "outputs": [
258	    { "dataName": "code.symbol",    "version": 1, "represents": "nodes",     "containedIn": "files.file" },
259	    { "dataName": "code.reference", "version": 1, "represents": "relations" }
260	  ],
261	  "invocation": "per-file"
262	}
263	```
264	
265	```json
266	{
267	  "tool": "cross-file-links",
268	  "version": "0.1.0",
269	  "parameters": {
270	    "files": { "dataName": "code.symbol", "shape": "array of M1 outputs", "required": true }
271	  },
272	  "outputs": [
273	    { "dataName": "code.link", "version": 1, "represents": "relations" }
274	  ],
275	  "invocation": "once"
276	}
277	```
278	
279	```json
280	{
281	  "tool": "symbol-scope",
282	  "version": "0.1.0",
283	  "parameters": {
284	    "files": { "dataName": "code.symbol", "shape": "array of M1 outputs", "required": true }
285	  },
286	  "outputs": [
287	    { "dataName": "code.scope",      "version": 1, "represents": "nodes",       "containedIn": "files.file" },
288	    { "dataName": "code.membership", "version": 1, "represents": "containment", "contains": "code.symbol" }
289	  ],
290	  "invocation": "once"
291	}
292	```
293	
294	- **DATA-09** `file_path` is the optional parameter giving the actual path of the file to read (`toolset.md`, section 4.2). If absent, M1 joins `source_root` (an extra value the Runner always sends) and `file_id`.
295	- **DATA-10** `represents` is how the Runner and the Viewer know what an output is, with no tool-specific code: `nodes` become graph nodes inside `containedIn`; `relations` become edges; `containment` re-parents the nodes it names (`05_viewer.md`). This is the MVP's answer to `RN-12`.
296	- **DATA-11** The Runner derives the order from `dataName`: a tool whose parameters need `code.symbol` runs after the tool that outputs it. `files.file.*` comes from the Runner's file list.
297	
298	## Parameters sent by the Runner
299	
300	- **DATA-12** M1, once per file: `{ "source_root": "<absolute path>", "file_id": "src/math.ts", "file_path": "<absolute path>" }`.
301	- **DATA-13** M2 and M3, once: `{ "source_root": "<absolute path>", "files": [ <every M1 output> ] }`.
302	
303	## Result, `last_run.json` and logs
304	
305	- **DATA-14** `result.json` in the tool's data folder: `{ "tool", "version", "status": "succeeded" | "failed", "started", "finished", "error"?: Diagnostic, "outputs": [paths] }`. Times in ISO 8601, UTC.
306	- **DATA-15** `last_run.json` next to the launcher holds exactly the parameters of the last real run that got past the parameter check (`toolset.md`, section 4.5).
307	- **DATA-16** Log format, shared by the Runner and the tools: one entry per line, `<ISO time>\t<level>\t<event>\t<JSON details>`. Comment lines start with `#`, and `# [type] text` gives the comment a type, for example `# [step] reading src/math.ts`. A reader can drop every `#` line and lose no fact.
308	- **DATA-17** Dry-run output on standard output: JSON lines. The last line is `{ "dryRun": "go" }` or `{ "dryRun": "no-go", "error": Diagnostic }`.
309	
310	## Exit codes
311	
312	| Code | Meaning |
313	|---|---|
314	| 0 | Success, or dry run: go |
315	| 1 | Run error, or dry run: no-go for a run-type problem |
316	| 2 | Invocation error: nothing written (`toolset.md`, section 4.6) |
317	
318	## Database tables
319	
320	Starting point for the MVP's single database; the real schema is decided later (`MVP_scope.md`, section 4).
321	
322	| Table | Holds |
323	|---|---|
324	| `config_version` | The structure version, checked on start by the Runner and the Viewer |
325	| `config_tools` | The record of tools: name, launcher path, `--info` JSON, version |
326	| `config_ordering` | Position and tool name, derived from `--info` |
327	| `config_settings` | Key and value; in the MVP only the enabled state of each tool (all enabled) |
328	| `project_source` | The source root and when it was last listed |
329	| `project_files` | File ID, size, SHA-256 hash |
330	| `project_outputs` | Tool, data name, version, output path, when produced |
331	| `project_runs` | Run ID, start, end, outcome, Runner log path |
332	| `project_tool_runs` | Run ID, tool, file ID (for M1), dry-run result, real-run result |
333	=================== 03_runner.md
334	# 03. Runner
335	
336	The Runner as built for the MVP. The full design is in `runner.md`; this file keeps only what the MVP needs.
337	
338	## Command line
339	
340	```
341	zaansouvi-run <source-root>                 run everything
342	zaansouvi-run <source-root> --dry-run-only  dry-run every step, write nothing
343	zaansouvi-run --read-cache                  print the stored data, run nothing
344	```
345	
346	- **RUN-01** One command with only the source root runs the whole process (P2). There are no config files (`MVP_scope.md`, section 8.1).
347	- **RUN-02** Output is always the Viewer mode: JSON lines on standard output (`--human` is out of the MVP).
348	- **RUN-03** A missing or unreadable source root stops the Runner with exit code 2 and a clear message. It writes nothing.
349	
350	## On start
351	
352	- **RUN-04** Open or create the database. Check `config_version`; if it is unknown, stop with a clear message.
353	- **RUN-05** Find the three tools in `app/tools/`, call each one's `--info`, and fill `config_tools`. Derive the order from the `dataName`s and write `config_ordering` (`02_data_contracts.md`, DATA-11). Installation and removal are out of the MVP; the tools are simply there.
354	
355	## The run
356	
357	- **RUN-06** List every `*.ts` file under the source root (skipping `node_modules`), hash it, and write `project_files`. The Runner does this itself (`RN-13`).
358	- **RUN-07** For each tool in the ordering, build its JSON (`02_data_contracts.md`, DATA-12, DATA-13), in memory.
359	- **RUN-08** Dry-run the tool with `--dry-run --stdin`, passing the JSON. Parse the last line (DATA-17):
360	  - **go**: continue
361	  - **no-go** with exit code 2: an invocation error, so a Runner bug. Log it as such and stop
362	  - **no-go** with exit code 1: a problem in the data. Log it as the tool's error and stop
363	- **RUN-09** Run the tool for real with `--stdin` and the same JSON. Then read its `result.json`, its newest log and its output.
364	- **RUN-10** If the result is `failed`, stop. Otherwise write `project_outputs` and `project_tool_runs`, and go on.
365	- **RUN-11** M1 is invoked once per file, dry run then real run each time. For two or three files that is a handful of processes; record the time it takes as a finding (`TS-31`).
366	- **RUN-12** At the end, write `project_runs` and print `run_finished` with the outcome.
367	
368	## Output events (Viewer mode)
369	
370	Each line is one JSON object with an `event` field:
371	
372	| Event | Fields |
373	|---|---|
374	| `run_started` | run ID, source root, time |
375	| `files_listed` | count |
376	| `tool_dry_run` | tool, file ID (M1 only), `go` or `no-go`, error |
377	| `tool_run` | tool, file ID (M1 only), `succeeded` or `failed`, error, log path |
378	| `run_finished` | outcome, time, Runner log path |
379	| `cache` | (only with `--read-cache`) the content below |
380	
381	- **RUN-13** `--read-cache` prints one `cache` event with: the file list, the record of tools and the ordering, every tool's latest `result.json`, and the content of every output (M1's per-file outputs, `links.json`, `scopes.json`). It starts no tool and writes nothing.
382	
383	## Log
384	
385	- **RUN-14** Every run writes `data/runner/logs/<timestamp>.log` in the shared format (DATA-16), except a `--dry-run-only` pass, which writes nothing.
386	- **RUN-15** For every tool invocation, the log records the time, the exact command line, the JSON sent, the dry-run result and the real result. A user can repeat any step by hand from it.
387	
388	## Errors
389	
390	| Situation | Runner does |
391	|---|---|
392	| Unknown database version | Stops before anything, exit 2 |
393	| A tool's `--info` fails or isn't valid JSON | Stops before the run, names the tool |
394	| Dry run no-go | Stops, writes nothing more, reports the tool's error |
395	| Real run failed | Stops; earlier tools' outputs and database rows stay (no staging, `RN-16`) |
396	| A tool crashes (no result written) | Treated as a failed real run, with the exit code and standard error in the Runner log |
397	=================== 04_tools.md
398	# 04. Tools
399	
400	M1, M2 and M3 as built for the MVP. Data shapes are in `02_data_contracts.md`.
401	
402	## What every tool does
403	
404	- **TOOL-01** Options: `--info`, `--dry-run`, `--json <path>`, `--stdin`, `--log <path>`.
405	- **TOOL-02** Parameters are read in the decided order (`toolset.md`, section 4.5): command-line arguments, then `--json` or `--stdin` (both together is an invocation error), then `last_run.json`. With none of these, the tool fails with an invocation error and writes nothing.
406	- **TOOL-03** Parameter check: only **shape** problems are invocation errors (exit 2, nothing written): a required parameter missing, a value of the wrong type, JSON that doesn't parse. **Value** problems are run errors (exit 1, logged).
407	- **TOOL-04** Once the parameters pass the check, the tool writes `last_run.json`, then does its work, writing its log as it goes.
408	- **TOOL-05** On success it writes its output and `result.json` with `succeeded`. On a run error it writes `result.json` with `failed` and the error, writes no output, and leaves the earlier output as it was. Output is written to a temporary name and renamed at the end, so it is never half-written.
409	- **TOOL-06** A dry run does the same work, writes nothing, and prints its findings and a final `go` / `no-go` line to standard output (DATA-17).
410	- **TOOL-07** `--log <path>` also copies the log to that file. The log in the tool's data folder is always written.
411	- **TOOL-08** Extra values in the JSON are ignored.
412	
413	## Error codes
414	
415	| Code | Kind | Example |
416	|---|---|---|
417	| `E1` | invocation | both `--json` and `--stdin`; unknown option |
418	| `E2` | invocation | `--json` file missing; JSON doesn't parse |
419	| `E3` | invocation | no parameters and no usable `last_run.json` |
420	| `E13` | invocation | required parameter missing or of the wrong shape |
421	| `E6` | run | the file to read is missing or unreadable |
422	| `E12` | run | a value is incorrect, incongruent, or lacks what the tool needs; the file has syntax errors |
423	| `E8` | run | any unexpected failure |
424	
425	These follow `toolset.md`, section 4.6.
426	
427	## M1: file-symbols
428	
429	Reads one TypeScript file and lists its symbols and references.
430	
431	- **TOOL-10** Parse the file with the TypeScript compiler's parser (`ts.createSourceFile`), without type checking. If the parser reports syntax errors, fail with `E12`.
432	- **TOOL-11** Symbols, in the supported constructs below: function declarations, `const` / `let` / `var` declarations, function parameters, and named imports. Mark `exported` when declared with `export`.
433	- **TOOL-12** References: every identifier that is a declaration name, a call target, a read or an assignment target. **Property names after a dot are not references**: in `Math.round(...)`, `Math` is a reference and `round` is not.
434	- **TOOL-13** Resolve each reference to a symbol **in the same file** by name: the nearest declaration in the enclosing functions, then the file. If none, `symbol` is `null`. No cross-file work: that is M2's job.
435	- **TOOL-14** Kinds: `declaration` for the declaring name; `write` for the left side of `=`, `+=` and the like; `call` for the callee of a call; `read` otherwise.
436	
437	## M2: cross-file-links
438	
439	Links each import to the declaration it imports. Reads no files.
440	
441	- **TOOL-20** For every symbol of kind `import`, resolve `import.from` relative to the importing file: try `<from>.ts`, then `<from>/index.ts`. Find in that file's M1 output an exported symbol named `import.name`. If found, output a link; if not, list it as `unresolved` with the reason.
442	- **TOOL-21** Module specifiers that don't start with `.` (packages) are listed as `unresolved` with reason `external`.
443	- **TOOL-22** Incongruent parameters are a run error (`E12`): for example a reference whose `symbol` isn't among the file's symbols, or two M1 outputs for the same file.
444	
445	## M3: symbol-scope
446	
447	Groups each file's symbols into scopes. Reads no files.
448	
449	- **TOOL-30** For each file, create the file scope and one scope per **top-level** function (from symbols of kind `function` whose `range` is not inside another function's `range`). Functions inside functions don't get their own scope.
450	- **TOOL-31** Assign every symbol to the function scope whose `range` contains the symbol's `location`; otherwise to the file scope. A function's own name belongs to the scope it is declared in, not its own.
451	- **TOOL-32** A function symbol without a `range` is a run error (`E12`): the value lacks what M3 needs.
452	
453	## Supported constructs (`MVP-11`)
454	
455	Supported, on the happy path:
456	- `function` declarations, with parameters, including `export function`
457	- `const`, `let` and `var` with a simple name (no destructuring)
458	- named imports, `import { a, b } from "./x"`, from relative paths
459	- calls, reads, and assignments to a simple name
460	- nested blocks (`if`, loops) inside functions
461	
462	Everything else is an **acceptable failure**: it may be skipped, mislabeled or reported as unresolved, but must not crash a tool. That includes classes and methods, arrow functions, default and namespace imports, re-exports, destructuring, type-only symbols, overloads, decorators, dynamic property access, and JavaScript files.
463	=================== 05_viewer.md
464	# 05. Viewer
465	
466	The Viewer as built for the MVP: a local backend and one page in the browser.
467	
468	## Backend
469	
470	- **VIEW-01** A local HTTP server, reachable only from this machine (bound to `127.0.0.1`).
471	- **VIEW-02** Endpoints:
472	
473	| Endpoint | Does |
474	|---|---|
475	| `GET /` | Serves the page |
476	| `POST /api/run` | Starts `zaansouvi-run <source-root>` and streams its events to the page |
477	| `POST /api/dry-run` | Starts `zaansouvi-run <source-root> --dry-run-only` and streams its events |
478	| `GET /api/data` | Calls `zaansouvi-run --read-cache` and returns the graph model built from it |
479	| `GET /api/tools` | Returns the record of tools, the ordering and each tool's latest result, read from the database |
480	| `GET /api/source?file=&line=` | Returns that line of the examined file, and the two lines around it |
481	| `GET /api/log?path=` | Returns a log file as text, only from the data folder |
482	
483	- **VIEW-03** The backend gets tool data through the Runner (`--read-cache`), and reads the database directly only for the tool list (allowed in the MVP, `MVP_scope.md`, section 4). It writes nothing.
484	- **VIEW-04** The backend builds the graph model; the page only displays it (`viewer.md`, section 3.1).
485	- **VIEW-05** One run at a time: a second run request while one is running is refused.
486	
487	## Building the levels, with no tool-specific code
488	
489	- **VIEW-10** Nodes come from every output whose `represents` is `nodes`, plus the files from the file list. Each node's parent is its `parent` field.
490	- **VIEW-11** An output whose `represents` is `containment` re-parents the nodes it names: with M3, each symbol's parent becomes its scope instead of its file.
491	- **VIEW-12** Edges come from every output whose `represents` is `relations`. A reference becomes an edge from the scope or file it sits in to the symbol it refers to; a link becomes an edge from the import symbol to the declaration.
492	- **VIEW-13** **File-to-file edges are aggregated by the Viewer** (`MVP_scope.md`, section 5.1): if an edge joins nodes in two different files, the two files are joined, once, with a count. No tool produces file edges.
493	- **VIEW-14** The code that does this reads only `represents`, `containedIn`, `parent` and IDs. It has no branch on a tool's name. If it needs one, that is a finding against P4.
494	
495	## Levels on the page
496	
497	| Level | Shows | Edges |
498	|---|---|---|
499	| 1. Files | every examined file | aggregated file-to-file edges, labeled with the count |
500	| 2. Inside a file | the file's scopes (with M3) or its symbols (without M3) | links leaving the file shown as stubs to the other file |
501	| 3. Inside a scope | the scope's symbols | references and links |
502	
503	- **VIEW-20** Double-click a node to go one level down into it; a breadcrumb at the top goes back up. The mouse wheel only zooms the current level (`viewer.md`, section 4.9; Ctrl + wheel is out of the MVP).
504	- **VIEW-21** Without M3, the levels are files › symbols: two levels. With M3, three.
505	- **VIEW-22** Layout: an automatic layout per level; nodes can be dragged. Positions are not saved in the MVP.
506	- **VIEW-23** Visual language, kept minimal: one shape per node kind (file, scope, function, variable, parameter, import); declarations solid, references dashed; links in a separate color.
507	
508	## Details and tools
509	
510	- **VIEW-30** Selecting a node or edge shows, in a side panel: its kind, name, file:line, and the source line with the lines around it (from `/api/source`).
511	- **VIEW-31** A tool panel lists the three tools in the stored order, read-only, each marked as enabled (all are, in the MVP), with its latest result and a link to its log.
512	- **VIEW-32** Two buttons: **Run** and **Dry run**. While running, the panel shows each `tool_dry_run` and `tool_run` event as it arrives, with go / no-go and errors. A no-go or failure is shown in red, with the message and the location if there is one.
513	- **VIEW-33** After a run finishes, the page reloads the graph from `/api/data`. Nothing refreshes on its own otherwise.
514	
515	## Rendering safety
516	
517	- **VIEW-40** Every name, path and source line is shown as text, never as HTML (`security.md`, section 8).
518	=================== 06_test_plan.md
519	# 06. Test plan
520	
521	Answers `MVP-14` for the MVP. The expected result is written by hand **before** the tools exist.
522	
523	## The basic examined source
524	
525	Three files under `test-source/src/`. Line numbers matter: the expected result refers to them.
526	
527	`src/math.ts`
528	```ts
529	export const PRECISION = 2;
530	
531	export function round(value: number): number {
532	  const factor = 10 ** PRECISION;
533	  return Math.round(value * factor) / factor;
534	}
535	```
536	
537	`src/counter.ts`
538	```ts
539	import { round } from "./math";
540	
541	let total = 0;
542	
543	export function add(amount: number): number {
544	  total = total + amount;
545	  return round(total);
546	}
547	```
548	
549	`src/main.ts`
550	```ts
551	import { add } from "./counter";
552	import { PRECISION } from "./math";
553	
554	function run(): void {
555	  const first = add(1.234);
556	  if (first > 0) {
557	    const label = "precision " + PRECISION;
558	    console.log(label, first);
559	  }
560	}
561	
562	run();
563	```
564	
565	What it covers: calls across files (`add`, `round`), a variable read across files (`PRECISION`), a module variable that is written and read (`total`), parameters, local variables, a nested block, unresolved globals (`Math`, `console`), and a property name that matches a symbol (`Math.round` versus `round`).
566	
567	## Expected result
568	
569	Kept in `expected/` as a readable table; the comparison with the tools' output is done by a small script that checks names, kinds, lines and links (`TEST-01`).
570	
571	### Symbols (M1)
572	
573	| File | Name | Kind | Line | Exported | Scope (M3) |
574	|---|---|---|---|---|---|
575	| math.ts | PRECISION | variable | 1 | yes | file |
576	| math.ts | round | function | 3 | yes | file |
577	| math.ts | value | parameter | 3 | no | round |
578	| math.ts | factor | variable | 4 | no | round |
579	| counter.ts | round | import | 1 | no | file |
580	| counter.ts | total | variable | 3 | no | file |
581	| counter.ts | add | function | 5 | yes | file |
582	| counter.ts | amount | parameter | 5 | no | add |
583	| main.ts | add | import | 1 | no | file |
584	| main.ts | PRECISION | import | 2 | no | file |
585	| main.ts | run | function | 4 | no | file |
586	| main.ts | first | variable | 5 | no | run |
587	| main.ts | label | variable | 7 | no | run |
588	
589	### References other than declarations (M1)
590	
591	| File | Line | Name | Kind | Refers to |
592	|---|---|---|---|---|
593	| math.ts | 4 | PRECISION | read | math.ts PRECISION |
594	| math.ts | 5 | Math | read | none |
595	| math.ts | 5 | value | read | math.ts value |
596	| math.ts | 5 | factor | read | math.ts factor (twice) |
597	| counter.ts | 6 | total | write | counter.ts total |
598	| counter.ts | 6 | total | read | counter.ts total |
599	| counter.ts | 6 | amount | read | counter.ts amount |
600	| counter.ts | 7 | round | call | counter.ts round (the import) |
601	| counter.ts | 7 | total | read | counter.ts total |
602	| main.ts | 5 | add | call | main.ts add (the import) |
603	| main.ts | 6 | first | read | main.ts first |
604	| main.ts | 7 | PRECISION | read | main.ts PRECISION (the import) |
605	| main.ts | 8 | console | read | none |
606	| main.ts | 8 | label | read | main.ts label |
607	| main.ts | 8 | first | read | main.ts first |
608	| main.ts | 12 | run | call | main.ts run |
609	
610	`round` in `Math.round` (math.ts, line 5) and `log` in `console.log` (main.ts, line 8) must **not** appear.
611	
612	### Links (M2)
613	
614	| From | To |
615	|---|---|
616	| counter.ts `round` (import, line 1) | math.ts `round` (line 3) |
617	| main.ts `add` (import, line 1) | counter.ts `add` (line 5) |
618	| main.ts `PRECISION` (import, line 2) | math.ts `PRECISION` (line 1) |
619	
620	No unresolved imports.
621	
622	### Scopes (M3)
623	
624	| File | Scopes |
625	|---|---|
626	| math.ts | file; `round` (lines 3–6) |
627	| counter.ts | file; `add` (lines 5–8) |
628	| main.ts | file; `run` (lines 4–10); the `if` block belongs to `run` |
629	
630	### File edges (Viewer)
631	
632	counter.ts → math.ts; main.ts → counter.ts; main.ts → math.ts.
633	
634	## Automatic checks
635	
636	- **TEST-01** A script runs `zaansouvi-run test-source`, then compares the outputs with `expected/`: symbols by file, name, kind and line; references by file, line, name, kind and target; links; scopes and membership. It prints every difference.
637	- **TEST-02** `zaansouvi-run test-source --dry-run-only` reports `go` for every step and leaves the data folder and the database unchanged (compare file hashes before and after).
638	
639	## Broken inputs
640	
641	Each one is run and must give the stated result. "By hand" means invoking the tool directly.
642	
643	| # | Input | How | Expected |
644	|---|---|---|---|
645	| B1 | M1 with both `--json` and `--stdin` | by hand | invocation error `E1`, exit 2, nothing written, `last_run.json` unchanged |
646	| B2 | M1 with `--json` pointing to a missing file | by hand | `E2`, exit 2, nothing written |
647	| B3 | M1 with JSON missing `file_id` | by hand | `E13`, exit 2, nothing written |
648	| B4 | M1 with no parameters, after deleting `last_run.json` | by hand | `E3`, exit 2, nothing written |
649	| B5 | M1 with no parameters, `last_run.json` present | by hand | repeats the last run exactly, same output |
650	| B6 | M1 on a file path that doesn't exist | by hand, valid JSON | run error `E6`, exit 1, `result.json` failed, `last_run.json` updated, earlier output kept |
651	| B7 | a file with a syntax error added to the source | Runner | M1's dry run is no-go (`E12`) for that file, the Runner stops, the Viewer shows it in red |
652	| B8 | M2 with an M1 output whose reference points to a missing symbol | by hand | run error `E12`, exit 1, logged |
653	| B9 | an import from `"./missing"` added to the source | Runner | not an error: M2 lists it as unresolved, the run succeeds |
654	| B10 | source root that doesn't exist | Runner | Runner exit 2, nothing written |
655	
656	## Extra checks
657	
658	- **C1. Without M3.** Move M3 out of `app/tools/`, restart, run. The Viewer shows files › symbols, two levels, with no change to M1, M2, the Runner or the Viewer (`MVP_scope.md`, section 5.1).
659	- **C2. Rename.** Rename `round` to `roundTo` in math.ts and counter.ts, run again. All three tools use the new IDs, the link is still there, and nothing refers to the old ID.
660	
661	## Human review of the Viewer (P3)
662	
663	The person deciding whether the Viewer passes goes through these and answers yes, no or partly, with a note:
664	1. Can you start a run and a dry run from the page, and see each tool's go / no-go and result?
665	2. Does level 1 show the three files and the three file edges, with sensible counts?
666	3. Can you go into `main.ts`, see the `run` scope, and go into it to see `first` and `label`?
667	4. Do the links leaving a file lead you to the right symbol in the other file?
668	5. Does selecting any node or edge show the right file:line and source line?
669	6. When B7 is run, is the error clear enough to know what to fix?
670	7. Overall: would this be worth building further? Why or why not?
671	
672	The answers go into the findings note (`07_delivery.md`).
673	=================== 07_delivery.md
674	# 07. Delivery
675	
676	Answers `MVP-15` for the MVP.
677	
678	## Traceability level
679	
680	- **DEL-01** Every node and edge shows its file:line and the source line with the lines around it.
681	- **DEL-02** Out of the MVP: clickable links to a repository host or an editor, longer code quotes, and commit-pinned links.
682	
683	## Deliverables
684	
685	- **DEL-03** The code: Runner, Viewer, shared library, tool helper, M1, M2, M3, in one repository, with a short readme on how to install and run it.
686	- **DEL-04** The test source and the expected result (`06_test_plan.md`).
687	- **DEL-05** The test script for TEST-01 and TEST-02, and a record of B1–B10 and C1–C2 with their actual results.
688	- **DEL-06** The human review answers (`06_test_plan.md`).
689	- **DEL-07** The findings note (below).
690	
691	## Time box
692	
693	- **DEL-08** About **two weeks** of one developer working with AI. If the end of the time box is reached, stop and write the findings note with what exists: what didn't get done is itself a finding.
694	- **DEL-09** Rough split: test source and expected result, half a day; contracts and tool helper, one day; M1, two days; Runner, two days; M2 and M3, one day; Viewer, three days; tests, review and findings, one and a half days.
695	
696	## Findings note
697	
698	A short document, written at the end, feeding `MVP_scope.md` section 10 (post-MVP) and the feasibility part of `feasibility_and_execution_plan.md`.
699	
700	1. **P1 to P3**: yes, no or partly, each with the evidence (tests passed, human review answers).
701	2. **Early P4 evidence**: did C1 work with no change elsewhere? Did any Viewer code need to know a tool's name (VIEW-14)?
702	3. **What was harder than expected**, and what was easier.
703	4. **The single database**: did it work, and what will matter when it is split into the configuration and codebase databases?
704	5. **Timings**: a full run, a dry run, one M1 invocation, the Viewer's load time. What they suggest for one process per file at scale (`TS-31`).
705	6. **Contracts**: did `--info`, the JSON parameters, the logs and `last_run.json` hold up? What had to change?
706	7. **Recommendations** for the post-MVP questions (`MVP_scope.md`, section 10.3): which to keep, drop or reorder.
707	
````

### 2026-11-07 03:00:05 — Tool call: Bash

```json
{
  "command": "cd /home/zaida/viewer && cat MVP_scope.md",
  "description": "Read MVP scope file"
}
```

### 2026-11-07 03:00:05 — Tool result

```
# ZaAnSouVi MVP Scope

What the minimum viable product (MVP) of ZaAnSouVi contains, and what it leaves out.

Each item is marked:
- **[Decided]**: agreed in discussion.
- **[Proposed]**: inferred, to be confirmed or changed.
- **To define**: a point the analysis must still work out.

Related files: `toolset.md` (all tools and their common rules), `runner.md`, `viewer.md`, `data_topology.md`, `project_organization.md`, `security.md`.

## 1. Purpose

- **[Decided]** The MVP is **only a proof of concept**. It shows that this kind of work is actually implementable.
- **[Decided]** **Failing on edge cases is acceptable.** The MVP follows the **happy path**.
- **[Decided]** It is measured against **the simplest test on a basic examined source**.
- **[Decided]** **The MVP only has to show whether this can work at all.** Repeatability, consistency and specificity of details are what matter for the product (`toolset.md`, section 2), not for the MVP.
- **[Decided]** **The MVP's rule is least effort, with acceptable failures.**
- **[Decided]** **If a library or a built-in feature solves a tool's requirement, use it.**
- **[Decided]** **Tools are meant to be easy to replace, so the concern is simplicity, not precision.** A tool that is simple and roughly right is better than one that is precise and costly.
- **[Proposed]** The same rule settles small open points for the MVP: when in doubt, pick the answer that needs the least work (section 8.1).
- **[Proposed]** The MVP is not the first version of the product. Its code may be thrown away; what must survive is the knowledge of what works, what doesn't and what it costs. That feeds `TS-15` (planning) and the feasibility part of `feasibility_and_execution_plan.md`.

### 1.1 What the MVP must prove

- **[Decided]** **The project as a whole must prove whether a tool-based source code visualizer can be implemented.** The MVP is the first evidence for that (`toolset.md`, section 1).
- **[Decided]** Among other things, the MVP must prove:
  - **P1. The Runner and the Viewer can work together to manage the app.**
  - **P2. The Runner works from a single command** and produces the data the Viewer needs.
  - **P3. The Viewer works**, as judged by a person: **the test for the Viewer is a human decision**.
  - **P4. Independent tools are a valuable solution.** Whether a tool can be modified while its input and output stay abstract. If it turns out that modifying a tool isn't possible without changing the abstract input and output, the idea of independent tools fails. **P4 is tested after the MVP** (section 10).
- **[Proposed]** "Among other things" leaves room for more; candidates are cross-file linking working on the test source, and the single database working (section 4).
- **[Proposed]** A "no" on any of P1 to P4 is a finding, not a failure of the MVP: it tells the feasibility document what doesn't work and why.

## 2. What is in the MVP

- **[Decided]** **The Runner.**
- **[Decided]** **The Viewer.**
- **[Decided]** **For the MVP, the tools are written in TypeScript**, like the Runner and the Viewer. In the product, tools may run on any stack (`runner.md`, section 1.0).
- **[Decided]** **Three tools:**

| # | Tool | What it does (decided) | Example |
|---|---|---|---|
| M1 | **File symbols** | Opens a file and attempts to tokenize it into symbols, then deduplicates them into references. (By the least-effort rule, an existing parser does the tokenizing; `MVP-7`.) | A function declaration and a call to that function become one symbol with two references. |
| M2 | **Cross-file links** | Lists the symbols and attempts to work out how they link across files, recording where each symbol is used. | A function declared in `a.ts` and called in `b.ts` is linked, with the call's location. |
| M3 | **Symbol scope** | Attempts to show the scope of related symbols. | A variable declared inside a function is shown as belonging to that function's scope, together with the symbols it is used with. |

- **[Proposed]** How the three tools fit together:
  - **M1** reads one file per invocation, as every file-reading tool does ([Decided], `toolset.md`, section 4.2); the Runner invokes it once per file. It knows nothing of other files. Its output is, per file, the symbols found and each one's references: declaration, call, read, write, with source locations.
  - **M2** reads no source files: its `--info` doesn't claim any. It gets M1's results for all files as parameters the Runner builds from M1's outputs, which the Runner reads (`runner.md`, section 5). It matches references to declarations across files.
  - **M3** also reads no source files. It gets M1's and M2's results the same way, and records which scope each symbol is declared in and which symbols share or use that scope.
- **[Proposed]** "Deduplicates into references" means: every occurrence of the same name in the same declaration's meaning becomes one symbol, and each occurrence is kept as a reference to it, with its kind (declaration, call, read, write) and location. Nothing is thrown away; only the grouping is new.
- **[Proposed]** M1 and M2 together cover a first slice of the symbols tool (`toolset.md`, section 6.5). M3 is the basis of the "variables in a module" view (`viewer.md`, section 4.2). None of the three replaces those definitions; they are a thin first cut.

## 3. The basic examined source

- **[Decided]** The MVP is tested on the simplest useful case: a basic examined source.
- **[Proposed]** A small, hand-written TypeScript project made for the test, for example:
  - two or three files
  - a function declared in one file and called from another, through a plain import
  - a module-level variable that is read in one place and written in another
  - a function with a local variable and a nested block, so scopes can be seen
  - no frameworks, no build configuration beyond what's needed, no generated code
- **[Proposed]** The expected result is written down by hand before the MVP runs on it: every symbol, every reference with its file and line, every cross-file link and every scope. The MVP passes when its output matches.
- **[Proposed]** Anything outside the basic source, such as re-exports, overloads, type-only symbols, dynamic access, decorators or mixed JavaScript, is an edge case. Failing on it is acceptable (section 1).

## 4. What the MVP keeps from the full design

The MVP is a proof of concept for the toolset's architecture as well as its analysis, so some contracts are worth keeping even in a thin form.

- **[Proposed]** **Kept, in a minimal form:**
  - each tool does one thing and is unaware of the other tools (`toolset.md`, section 4.2)
  - each tool states its parameters and outputs with `--info`, and the Runner works out the order of M1, M2 and M3 from that ([Decided] for the toolset, `DT-1`)
  - the Runner's run process: read the configuration, find the source, list the files, decide the order, call each tool with JSON parameters, read its log and output, update the database (`runner.md`, section 1.1)
  - parameters through `--json` or `--stdin`, and `last_run.json` (`toolset.md`, section 4.5)
  - each tool writes only to its own store; only the Runner writes the database (`toolset.md`, section 5.2)
  - every tool writes its own log, in the Runner's log format
  - **source locations** on every symbol and reference, so the Viewer can show file:line (`toolset.md`, section 3)
  - never running code from the examined source (`security.md`, section 1)
- **[Decided]** **Dry runs are part of the MVP's happy path.** A dry run validates the simple parts and shows **go / no-go** errors, which the rest of the system must read properly.
- **[Proposed]** What that means in the MVP:
  - before each real run, the Runner dry-runs the tool with the JSON it built (`runner.md`, section 1.1)
  - **go**: the tool read its parameters and found nothing wrong in the simple parts; the Runner goes on to the real run
  - **no-go**: an invocation error (missing or malformed parameters) or a run error found in the dry run (for example the file to read is missing); the Runner stops before the real run, writes nothing, and records the error in its log
  - the dry run's output is on standard output only ([Decided], `toolset.md`, section 4.3); the Runner parses it, so the dry-run output format has to be parsable from the start
  - the Viewer shows the go / no-go result for each tool, with the error message, and can ask the Runner for a dry-run-only pass ([Decided] as a Runner parameter, `runner.md`, section 10)
- **[Decided]** **One database, for the MVP only.** The MVP reads only one codebase, so a single database holds both the configuration and the processing data.
- **[Decided]** **Its purpose is to verify that the database approach is feasible.** The real product keeps two independent databases: the configuration database and the codebase database (`toolset.md`, section 5.2). Nothing in the MVP's single database is a design decision for the product.
- **[Decided]** **Inside the one database, the configuration and the codebase data are kept apart**, so splitting them later is a move, not a redesign.
- **[Decided]** **Table names say what each table is for**, by a prefix: for example `config_<name>` for configuration such as user display data, and `project_<name>` for codebase data. The actual schema is decided at a later stage.
- **[Decided]** At the split, the `config_` tables move to the configuration database and the `project_` tables to the codebase database. A table that fits neither prefix is a sign that something is undecided.
- **[Proposed]** The Runner and the Viewer's backend both use the one database, as they will share the configuration database in the product.
- **[Decided]** In the product, the Viewer reads the configuration database directly and gets codebase data through the Runner (`viewer.md`, section 3.1). **For the MVP this detail may be omitted**: with one database, the Viewer's backend may read it directly.
- **[Proposed]** What goes into it in the MVP (an MVP-only answer to `RN-12`): the configuration the Runner needs, the record of the three tools and their ordering (`config_` tables), the file list, and the record of which tool outputs exist and when they were made. M1–M3's work data stays in their own stores, and the Runner reads it from there to build the next tool's JSON (`runner.md`, section 5).
- **[Proposed]** **Kept only as far as the happy path needs:**
  - invocation errors and run errors (`toolset.md`, section 4.6): a clear message is enough, without every error kind
  - stable IDs: stable within one run on an unchanged source
  - the file list: the Runner reads the files and lists them (whether that stays the Runner's job is `RN-13`)

## 5. The Viewer in the MVP

- **[Decided]** **The graph has at least two levels.** Which levels they are is defined once the tools are decided on, that is, once M1–M3's outputs are settled (`--info`).
- **[Proposed]** Moving between levels follows the Viewer's rules (`viewer.md`, section 4.9).

### 5.1 How independent tools build the levels (MVP only)

This applies to the MVP only; the product's level hierarchy is `VW-19`.

- **[Proposed]** What the MVP shows: **different levels come from different tools**, no tool knows about levels, the Viewer or the other tools, and **the Viewer builds the levels only from `containedIn` in each tool's `--info` and the parent IDs in the data**, with no tool-specific knowledge. Shared stable IDs join the tools' outputs, through the Runner.

| Producer | Produces | Place in the levels | What it demonstrates |
|---|---|---|---|
| **Runner** (file list) | files, with IDs | top-level containers | the anchors every level hangs from; not a tool (`RN-13`, MVP-only) |
| **M1 File symbols** | per file: symbols (ID, name, kind, location, parent = file ID) and references (symbol ID, kind, location) | the bottom level; `containedIn: file` | nodes produced one file at a time, by a tool that knows nothing else |
| **M3 Symbol scope** | scopes (ID, kind, location, parent = file) and which scope each of M1's symbols belongs to | a middle level between file and symbol; `containedIn: file`, contains M1's symbols | another tool inserting a level, where containment runs opposite to data flow (`data_topology.md`, section 7) |
| **M2 Cross-file links** | links from a reference in one file to a declaration in another, by M1's IDs | edges that cross containers | relations across levels |

- **[Proposed]** The levels the Viewer shows:
  - **Level 1, files**: nodes from the file list; edges between files aggregated from M2's links
  - **Level 2, inside a file**: M3's scopes, with M2's links leaving the file shown as stubs to the other files
  - **Level 3, inside a scope** (optional): M1's symbols and their references
- **[Decided]** **The Viewer aggregates the file-to-file edges** from the symbol-level links: an edge between two children implies an edge between their parents. No tool produces file-level edges.
- **[Proposed]** The aggregation is generic: it uses only the containment and the links, never knowledge of M2, so it works for any tool's links.
- **[Proposed]** M3 keeps one level of scopes in the MVP (no scopes nested inside scopes). That is less effort and still shows a tool inserting a level.
- **[Proposed]** The stable ID rule (section 4) has to be fixed before the tools are built, since M2 and M3 both refer to M1's IDs.
- **[Proposed]** Two small checks make the demonstration convincing:
  - **leave M3 out of a run**: the Viewer falls back to two levels, file › symbol, with no change to M1, M2 or the Viewer. Levels come from whichever tools are present. This is also early evidence for P4.
  - **rename or move a symbol in the test source**: after a rerun, all three tools still agree on the IDs.
- **[Proposed]** In each level: nodes and edges, with declarations and uses drawn differently (`viewer.md`, section 4.3).
- **[Proposed]** A way to show a scope: the symbols of one scope grouped together, from M3's output.
- **[Proposed]** Selecting a node or an edge shows its file:line and the source line it comes from (`viewer.md`, section 4.4).
- **[Proposed]** A button that starts the Runner, a button for a dry-run-only pass, and a place that shows each tool's go / no-go result, its result and its log, so a failure can be seen (`viewer.md`, section 4.14).
- **[Proposed]** Zoom, pan and moving nodes by hand; automatic arranging only as simple as needed to make the basic source readable.

## 6. What is out of the MVP

- **[Proposed]** Left out entirely:
  - the git step, environment variables, modules, infrastructure, project overview facts and the Mermaid generator (`toolset.md`, section 6)
  - the product's full level hierarchy (`viewer.md`, section 4.9.1); the MVP has its own two or more levels (section 5)
  - the config manager, the status page and the run configurations view (`viewer.md`, sections 4.11, 4.12, 4.14), apart from the run button and result display in section 5
  - named Runner configurations, the configuration listing, adding or omitting tools (`runner.md`, sections 3 and 6)
  - incremental runs: every run starts from scratch (`toolset.md`, section 5.3)
  - several codebases, separate configuration and codebase databases (one database in the MVP, see section 4), staging, the pending version and the cache (`viewer.md`, section 5)
  - changing ZaAnSouVi's global settings from the command line (`TS-34`)
  - **[Decided]** installing and removing tools (`RN-19`)
  - **[Proposed]** the MVP's three tools are simply present, and their entries in the record of tools are set up by the Runner when it starts, by calling each tool's `--info`
  - GPU rendering and large graphs (`viewer.md`, section 4.6)
  - the single-root organization (`project_organization.md`), beyond a simple folder per tool
- **[Proposed]** Each of these is left out because the proof of concept doesn't need it to show that the analysis and the tool contracts work, not because it is less important.

## 7. Success criteria

- **[Proposed]** The MVP succeeds when, on the basic examined source (each criterion names the claim in section 1.1 it supports):
  1. **(P2)** one command runs the Runner, which calls M1 for every file, then M2, then M3, updates the MVP's single database, and leaves the data the Viewer needs ([Decided] that this is the Runner's test)
  2. **(P2)** the output matches the expected result written down by hand (section 3)
  3. **(P1, P3)** the Viewer starts the Runner, shows at least two levels of graph and lets the user move between them, shows the symbols, their references, the cross-file links and the scopes, and every element leads back to its file and line. Whether the Viewer passes is **a person's decision** ([Decided])
  4. **(P1)** a deliberately broken input, for example a missing file, makes the right tool's dry run report no-go with a clear message; the Runner reads it, stops before the real run, and the Viewer shows it
  5. **(P1)** a dry-run-only pass on the basic source reports go for every tool, and writes nothing
  6. **(P1, P3)** a run without M3 still shows a graph, with one level fewer, and nothing else was changed (section 5.1)
- P4 is not an MVP success criterion; it is tested after the MVP (section 10).
- **[Proposed]** It also produces notes for the feasibility document: what was harder than expected, which libraries or approaches worked, rough run times, and what the single database showed about the database approach, including anything that will matter when it is split into the configuration and codebase databases.

## 8. Open questions

- `MVP-1` **Basic examined source:** is the small hand-written project in section 3 the right test? Who writes it and its expected result?
- `MVP-2` ~~**How M1 is called**~~: resolved. Once per file: a tool reads only one file per invocation (`toolset.md`, section 4.2).
- `MVP-3` **Deduplication:** is the meaning in section 2 right: one symbol per declaration, every occurrence kept as a reference?
- `MVP-4` **What "scope of related symbols" shows:** the lexical scope a symbol is declared in (file, function, block), the set of symbols used together in one scope, or both?
- `MVP-5` **Contracts kept:** is the list in section 4 the right amount of the full design for a proof of concept, or should the MVP drop more (for example the database) to stay smaller?
- `MVP-6` ~~**Viewer in the MVP**~~: resolved. The graph has at least two levels, defined once the tools are decided on (section 5).
- `MVP-7` ~~**Tokenizing versus parsing**~~: resolved. Use an existing library or built-in feature when it solves the requirement (section 1), so M1 uses an existing TypeScript parser rather than a hand-made tokenizer. Which one is a technology choice.
- `MVP-8` **Success criteria:** are the criteria in section 7 the right ones, and is a run time target needed?
- `MVP-9` **What each tool hands on:** what a symbol, a reference, a cross-file link and a scope contain, and which of them M2 and M3 receive (section 5.1 sketches the fields). Starting answer: `mvp_docs/02_data_contracts.md`.
- `MVP-10` **Each tool's `--info`:** the parameters (data name, shape, required) and outputs of M1, M2 and M3. Starting answer: `mvp_docs/02_data_contracts.md`.
- `MVP-11` **Supported constructs:** which TypeScript constructs M1–M3 must handle; everything else is an acceptable failure. Starting answer: `mvp_docs/04_tools.md`.
- `MVP-12` **Stable ID rule:** the minimal rule that lets M2 and M3 refer to M1's symbols (section 5.1). Starting answer: `mvp_docs/02_data_contracts.md`.
- `MVP-13` **Layout on disk:** where the single database, each tool's store, logs and `last_run.json`, and the Runner's log go. Starting answer: `mvp_docs/01_architecture.md`.
- `MVP-14` **Test plan:** where the expected result lives, whether the comparison is automatic, which broken inputs are tried and the go / no-go each should give, and what the person judging the Viewer looks at. Starting answer: `mvp_docs/06_test_plan.md`.
- `MVP-15` **Traceability level, deliverables and time box:** how much traceability the MVP shows (for example file:line plus the source line), what it hands over, and how long it may take. Starting answer: `mvp_docs/07_delivery.md`.

### 8.1 MVP-only answers

These answer open product questions for the MVP only, by the least-effort rule (section 1). They decide nothing for the product.

| Question | MVP-only answer | Status |
|---|---|---|
| `TS-29` Config files | No config files. The Runner takes the source path on the command line; everything else is a default. | [Proposed] |
| `RN-13` File list | The Runner builds it. | [Proposed] |
| `RN-15` Repeated tool runs | One dry run, then one real run, per invocation. | [Proposed] |
| `RN-16` Database updated per tool | Accepted; no staging. | [Proposed] |
| `RN-17` Viewer-specific Runner parameters | Run, dry-run only, read cache. | [Proposed] |
| `RN-19` Record of tools | The three tools are present; the Runner fills their entries on start by calling each `--info`. | [Proposed] |
| `TS-25` `last_run.json` shared between codebases | Doesn't matter with one codebase. | [Proposed] |
| `TS-30` Arguments without JSON | The Runner always sends JSON. | [Proposed] |
| `TS-31` One file per invocation at scale | Doesn't matter for two or three files; record the timings as a finding. | [Proposed] |
| `VW-36` Viewer data access | The Viewer's backend reads the single database directly. | [Decided] (section 4) |
| Output modes | Only the Viewer output mode; `--human` is out. | [Proposed] |
| Tool list in the Viewer | Shown read-only: the three tools and whether each runs. No enabling or disabling. | [Proposed] |

## 9. Deferred to the final technology section

For building the MVP, `mvp_docs/` already makes concrete choices for these, accepted for that folder only.


- the language and libraries the MVP is written in
- the format of each MVP tool's output and parameters
- the schema of the MVP's database, beyond the `config_` and `project_` table prefixes

## 10. Post-MVP

- **[Decided]** This section describes what happens **after the MVP is completed**: how P4 is tested, which other claims count as answered, and which new questions are checked next.
- **[Decided]** **It doesn't block the MVP and doesn't influence any other decision.** It depends entirely on what is found once the MVP is done, and is rewritten then.

Everything below is a starting point, to be replaced by what the MVP actually shows.

### 10.1 How P4 is tested

- **[Proposed]** Take the working MVP and modify one tool without touching anything else. Candidate changes, from small to large:
  1. change how M1 finds symbols internally, for example a different parser or approach, with the same outputs
  2. add a new detail to M1's output, stated in its `--info`, that no other tool uses yet
  3. replace M3 with a different implementation of the same `--info`
  4. add a fourth, small tool that takes existing outputs as parameters and produces something new
- **[Proposed]** For each change, record:
  - whether M2, M3, the Runner and the Viewer kept working without being changed
  - what had to change anywhere else, and why
  - how much effort the change took, compared with changing the same thing in a single program
- **[Proposed]** P4 holds if the changes stay inside the tool and its `--info`. Every change needed elsewhere is evidence against it, and the record says whether the cause was the contract (fixable) or the idea of independent tools itself.

### 10.2 Which claims count as answered

- **[Proposed]** After the MVP, go through P1 to P4 and any added claims, and mark each as **yes**, **no** or **partly**, with the evidence: the success criteria met, the human decision on the Viewer (P3), and the P4 record.
- **[Proposed]** Each answer feeds the feasibility part of `feasibility_and_execution_plan.md`. A "no" or "partly" also says which part of the design it puts in question.
- **[Proposed]** Claims that may turn out to be answered along the way: cross-file linking on the test source, the single database approach, and the dry-run go / no-go flow.

### 10.3 New questions to check

- **[Decided]** Questions to check after the MVP, to be kept, dropped or reordered once its findings are in:
  - **scale**: one process per file and large JSON parameters on a real codebase (`TS-31`, `TS-13`)
  - **the two databases**: splitting the MVP's single database into the configuration and codebase databases (section 4)
  - **tools on another stack**: one tool written outside TypeScript, held to the same contract (`TS-35`)
  - **incremental runs**: running only what changed (`toolset.md`, section 5.3)
  - **view levels**: the product's full level hierarchy, beyond the MVP's two or more levels (`viewer.md`, section 4.9)
  - **repeatability**: the same input giving the same output across runs, as the product requires (`toolset.md`, section 2)
  - **installation of new tools**: the Runner installing a tool, including from a file uploaded through the Viewer, and the record of tools and the ordering updating with it (`RN-19`)
- **[Decided]** Each question that is kept gets a short definition of what would answer it, like P1 to P4, before any work starts on it.
Shell cwd was reset to /home/zaida/viewer/mvp_docs
```

### 2026-11-07 03:00:09 — Tool call: Bash

```json
{
  "command": "cd /home/zaida/viewer && grep -n '^#' toolset.md runner.md viewer.md data_topology.md security.md project_organization.md",
  "description": "List section headings of working files"
}
```

### 2026-11-07 03:00:09 — Tool result

```
runner.md:1:# ZaAnSouVi Runner
runner.md:12:## 1. Purpose and place
runner.md:25:### 1.0 Stack and the record of tools
runner.md:38:### 1.1 The run process
runner.md:73:## 2. Run order
runner.md:88:## 3. Configuration
runner.md:102:## 4. Invoking tools
runner.md:115:## 5. Loading the database
runner.md:128:## 6. Configuration listing
runner.md:137:## 7. Run log
runner.md:152:## 8. Failures and the one-snapshot rule
runner.md:161:## 9. Dry run
runner.md:169:## 10. The Runner and the Viewer
runner.md:183:### 10.1 Output modes
runner.md:201:## 11. Security
runner.md:205:## 12. Open questions
runner.md:229:## 13. Deferred to the final technology section
viewer.md:1:# ZaAnSouVi Viewer
viewer.md:9:## 1. Purpose
viewer.md:19:## 2. Parts
viewer.md:42:## 3. Viewer server
viewer.md:44:### 3.1 Responsibilities
viewer.md:62:### 3.2 Running tool steps
viewer.md:88:### 3.3 Interface
viewer.md:95:### 3.4 Lifecycle
viewer.md:100:## 4. Viewer UI
viewer.md:104:### 4.1 Common graph model
viewer.md:113:### 4.2 Views
viewer.md:120:### 4.3 Visual language
viewer.md:132:### 4.4 Interaction
viewer.md:141:### 4.5 Arranging nodes
viewer.md:149:### 4.6 Rendering and scale
viewer.md:155:### 4.7 Relation to Mermaid
viewer.md:158:### 4.8 Page layout
viewer.md:167:### 4.9 Moving between views
viewer.md:176:#### 4.9.1 The levels
viewer.md:200:### 4.10 Page header and the pages
viewer.md:210:### 4.11 Config manager
viewer.md:235:### 4.12 Status page
viewer.md:244:### 4.13 Saving changes
viewer.md:254:### 4.14 Run configurations view
viewer.md:265:## 5. Viewer data and cache
viewer.md:288:## 6. Malformed or missing data
viewer.md:308:## 7. Open questions
viewer.md:348:## 8. Later step: security
viewer.md:352:## 9. Deferred to the final technology section
security.md:1:# ZaAnSouVi Security Concerns
security.md:11:## 0. Scope
security.md:17:## 1. Never run code from the examined source
security.md:33:## 2. Secrets and visibility of the examined source
security.md:39:## 3. The git step
security.md:44:## 4. Project overview detectors
security.md:49:## 5. Internal data and isolation between codebases
security.md:66:## 6. Temporary files
security.md:72:## 7. Viewer server
security.md:101:## 8. Viewer UI
security.md:107:## 9. Generated diagrams and exports
security.md:112:## 10. Runtime data
security.md:122:## 11. Open questions
data_topology.md:1:# ZaAnSouVi Data Topology
data_topology.md:12:## Decisions this file depends on
data_topology.md:23:## The Viewer is outside the topology
data_topology.md:30:## Options at a glance
data_topology.md:39:### Chosen: option D, no manifest
data_topology.md:55:## 1. Shared building blocks
data_topology.md:78:## 2. Option A: one category dictionary
data_topology.md:94:## 3. Option B: category dictionary, datatype dictionary and a manifest per tool
data_topology.md:117:## 4. Internal state of tools (applies to every option)
data_topology.md:144:## 5. Option C: manifest with input, output, depends on and contains
data_topology.md:168:## 6. Option D: self-describing tools with `--info`
data_topology.md:239:## 7. How the Viewer finds its view levels (applies to every option)
data_topology.md:254:## 8. Run order and stages (applies to every option)
data_topology.md:278:## 9. Open questions
project_organization.md:1:# ZaAnSouVi Project Organization
project_organization.md:9:## 1. Scope
project_organization.md:13:## 2. Principles
project_organization.md:24:## 3. Layout
project_organization.md:75:## 4. Who reads and writes what
project_organization.md:99:## 5. Finding the root
project_organization.md:105:## 6. Paths and moving the root
project_organization.md:111:## 7. Settings, upgrades and users
project_organization.md:117:## 8. System temp and staging
project_organization.md:125:## 9. Viewer UI state
project_organization.md:129:## 10. Alternative considered: data inside the examined project
project_organization.md:137:## 11. Open questions
project_organization.md:146:## 12. Deferred to the final technology section
toolset.md:1:# ZaAnSouVi Toolset
toolset.md:12:## 1. Scope and audience
toolset.md:25:## 2. Design principles
toolset.md:41:## 3. Traceability
toolset.md:53:## 4. What every tool has in common
toolset.md:55:### 4.1 Inputs, outputs and config
toolset.md:73:### 4.2 Running
toolset.md:95:### 4.3 Dry run
toolset.md:109:### 4.4 Failures
toolset.md:147:### 4.5 Parameters and logs
toolset.md:189:### 4.6 Known errors and what they update
toolset.md:239:## 5. Shared data
toolset.md:241:### 5.1 Each tool owns its data
toolset.md:250:### 5.2 Databases
toolset.md:256:#### The configuration database
toolset.md:268:#### The codebase database
toolset.md:283:### 5.3 Incremental runs
toolset.md:290:### 5.4 Isolation between codebases
toolset.md:297:### 5.5 Shared library (not a tool)
toolset.md:304:## 6. Known tools and programs
toolset.md:308:### 6.1 Runner
toolset.md:313:### 6.2 File inventory
toolset.md:320:### 6.3 Git step (optional)
toolset.md:331:### 6.4 Environment variables
toolset.md:336:### 6.5 Symbols
toolset.md:341:### 6.6 Modules
toolset.md:345:### 6.7 Infrastructure
toolset.md:353:### 6.8 Project overview facts
toolset.md:363:### 6.9 Mermaid generator
toolset.md:367:### 6.10 Viewer
toolset.md:379:## 7. How the tools depend on each other
toolset.md:406:## 8. Who owns which data
toolset.md:422:## 9. Hard problems to address
toolset.md:431:## 10. Open questions
toolset.md:469:## 11. Deferred to the final technology section
Shell cwd was reset to /home/zaida/viewer/mvp_docs
```

## 2026-11-07 03:00:11 — Claude

Still reading: I've gone through `mvp_docs/` and `MVP_scope.md`, and now I'm checking the [Decided] tool contracts in `toolset.md`, `runner.md`, `viewer.md` and `data_topology.md` for conflicts.

### 2026-11-07 03:00:12 — Tool call: Bash

```json
{
  "command": "cd /home/zaida/viewer && sed -n 53,300p toolset.md",
  "description": "Read toolset common contracts and shared data"
}
```

### 2026-11-07 03:00:12 — Tool result

```
<persisted-output>
Output too large (34.4KB). Full output saved to: /home/zaida/.claude/projects/-home-zaida-viewer-mvp-docs/fb4dbeae-b7f9-4910-94ee-f53420a09bf5/tool-results/bwbssq4q9.txt

Preview (first 2KB):
## 4. What every tool has in common

### 4.1 Inputs, outputs and config
- **[Decided]** Each tool reads and writes **plain text or JSON**, whichever suits its inputs and outputs. **To define:** the format for each tool, with the reason.
- **[Decided]** Each tool writes its output to **its own files, in its own folder**, named after what it produces. Tools read earlier tools' outputs from those files, not through pipes, so each step can be inspected, cached and re-run on its own.
- **[Decided]** **Config is split by concern.** Each tool may have its own config file for settings only it uses. A project-wide config file holds only settings that cross tool boundaries, such as source root, output root, project ID, repository URL template and ref. **To define:** whether tool settings may also be written in the project-wide file, so a user can keep everything in one file.
- **[Decided]** **Command-line options are the same across all tools.** They are optional and override settings for that run:
  - one common set of options with the same names and meaning everywhere: source root, output root, project ID, config file path, ref, URL template, verbosity or diagnostics level, `--info` (4.1), `--log`, `--json` and `--stdin` (4.5)
  - tool-specific options follow the same naming pattern
  - the same help, version and exit-code behavior
- **[Decided]** Besides project-wide and tool config, there are **personal global settings** that apply to every codebase the user examines. They can be overridden per project. They are edited in the Viewer's config manager (`viewer.md`, section 4.11).
- **[Decided]** Precedence, from highest to lowest: command line, the tool's config file, the project-wide config file, built-in defaults.
- **[Proposed]** Global settings sit just above the built-in defaults: command line, tool config, project-wide config, global settings, built-in defaults. Any project setting then overrides a global one (`TS-16`).
...
</persisted-output>
Shell cwd was reset to /home/zaida/viewer/mvp_docs
```

### 2026-11-07 03:00:14 — Tool call: Read

```json
{
  "file_path": "/home/zaida/.claude/projects/-home-zaida-viewer-mvp-docs/fb4dbeae-b7f9-4910-94ee-f53420a09bf5/tool-results/bwbssq4q9.txt",
  "allow_large": true
}
```

### 2026-11-07 03:00:14 — Tool result

```
1	## 4. What every tool has in common
2	
3	### 4.1 Inputs, outputs and config
4	- **[Decided]** Each tool reads and writes **plain text or JSON**, whichever suits its inputs and outputs. **To define:** the format for each tool, with the reason.
5	- **[Decided]** Each tool writes its output to **its own files, in its own folder**, named after what it produces. Tools read earlier tools' outputs from those files, not through pipes, so each step can be inspected, cached and re-run on its own.
6	- **[Decided]** **Config is split by concern.** Each tool may have its own config file for settings only it uses. A project-wide config file holds only settings that cross tool boundaries, such as source root, output root, project ID, repository URL template and ref. **To define:** whether tool settings may also be written in the project-wide file, so a user can keep everything in one file.
7	- **[Decided]** **Command-line options are the same across all tools.** They are optional and override settings for that run:
8	  - one common set of options with the same names and meaning everywhere: source root, output root, project ID, config file path, ref, URL template, verbosity or diagnostics level, `--info` (4.1), `--log`, `--json` and `--stdin` (4.5)
9	  - tool-specific options follow the same naming pattern
10	  - the same help, version and exit-code behavior
11	- **[Decided]** Besides project-wide and tool config, there are **personal global settings** that apply to every codebase the user examines. They can be overridden per project. They are edited in the Viewer's config manager (`viewer.md`, section 4.11).
12	- **[Decided]** Precedence, from highest to lowest: command line, the tool's config file, the project-wide config file, built-in defaults.
13	- **[Proposed]** Global settings sit just above the built-in defaults: command line, tool config, project-wide config, global settings, built-in defaults. Any project setting then overrides a global one (`TS-16`).
14	- **[Decided]** **Every tool has an `--info` option** that describes the tool. Each tool is responsible for stating its own parameters and outputs. There is no manifest (`data_topology.md`, `DT-1`).
15	- **[Proposed]** The parameters `--info` states include the tool's settings (name, meaning, type, default), so the config manager can show and check the settings of the entire toolset without knowing each tool in advance.
16	- **[Decided]** Each tool declares the format of its own config. The Viewer's config manager writes each tool's config in that format (`viewer.md`, section 4.11).
17	- **[Decided]** Each tool works with **no configuration**, so one command can run everything.
18	- **[Proposed]** Since a tool invoked with no parameters repeats its last run or fails (4.5), "no configuration" now holds for the Runner: the one-command run works because the Runner builds every tool's parameters from its own sane defaults. Config files are read by the Runner, not by the tools (`TS-29`).
19	- **To define:** the common option set and its naming rules, how the runner passes common options to each tool, and how a run shows which source each setting came from, so the run can be explained and repeated.
20	
21	### 4.2 Running
22	- **[Decided]** Each tool is **incremental**: it updates its outputs only when its inputs changed (section 5.3).
23	- **[Decided]** Tools run **one at a time**. No locking or concurrent writes are needed.
24	- **[Decided]** Each codebase's data lives in its **own store**, so several codebases never overwrite each other (section 5.4).
25	- **[Decided]** **Each tool writes only to its own store.** Only the Runner writes to the database, based on the tools' outputs (5.2 and `runner.md`).
26	- **[Decided]** **Tools never read the database.** A tool reads only its JSON input, its `last_run.json`, and its internal state derived from the examined source. Reading the database is the Runner's responsibility. (This replaces the earlier "reads from the database in the general case".)
27	- **[Decided]** **Only tools whose `--info` states that they read files or source read them.** Every other tool works from its JSON alone.
28	- **[Decided]** A tool that reads files **can have an optional parameter giving the actual path of the file it reads**.
29	- **[Decided]** **A tool reads only one file per invocation.** To cover many files, the Runner invokes the tool once per file.
30	- **[Proposed]** So the Runner, which isn't a tool, is the only program that reads many files in one go, for example when it lists the files (`runner.md`, section 1.1). Whether one process per file is fast enough on large codebases is a feasibility question (`TS-31`).
31	- **[Decided]** **Temporary files are used only for staging and for tool runs that need internal intermediate data to produce their outputs.** A JSON parameters file passed with `--json` may also sit in temp (4.5).
32	- **[Proposed]** Intermediate data lives only for the run that needs it and is removed afterwards. Internal state kept between runs, such as caches, stays in the tool's own store (`data_topology.md`, section 4).
33	- **[Decided]** **When run by the Runner, a tool receives its parameters as a JSON structure** with well-defined parameters: database values, file locations and all other relevant information (`runner.md`, section 1.1). How a tool gets its parameters is in 4.5.
34	- **[Decided]** **Each tool is unaware of the other tools.** It doesn't know which other tools exist or the order they run in. Working out the order is the Runner's job alone (`runner.md`).
35	- **[Decided]** **All tools use their JSON as their source of truth.** They assume the data in it is current and correct, make only a low effort to verify it where necessary, and **fail if they find incongruences**. (This replaces the earlier "assumes the data in the stores is current and valid".)
36	- **[Decided]** **Every tool has an optional `--log` option**, to redirect the log to another program or file (4.5). Every tool always writes its own log and its result in its own store.
37	- **[Proposed]** A tool knows the data it reads only by name (`data_topology.md`), never by the tool that produces it. Where this file says a tool "reads the symbol tool's output", the tool itself only knows it reads symbols.
38	- **[Decided]** **Only malformed or missing parameters are invocation errors.** **Incongruences are run errors, even when they are found while the tool checks its parameters.** (This replaces the earlier proposal that incongruences found during the parameter check are invocation errors.)
39	- **[Proposed]** The low-effort check covers what the tool needs in order not to produce wrong output: the **shape** of its parameters first, then their **values** (see "Data shape and data value" in 4.4). Whether data is older than the source is not the tool's concern; the Runner decides what is current before it starts a tool.
40	- **[Proposed]** The result a tool writes in its own store records at least: success or failure, the failure message, when it ran, the tool version and what it read. The Runner's log, its configuration listing and the Viewer read these results; the tool never reports to them directly.
41	- **[Proposed]** A user running a tool by hand gets the same log and output the Runner reads (4.5).
42	
43	### 4.3 Dry run
44	- **[Decided]** Every tool has a **dry-run option**. A dry run does the tool's work but never changes the work data: no tool outputs, no codebase database, no Viewer cache. Results go to standard output.
45	- **[Decided]** **A dry run never writes a record to the file system or the database.** It can print all its data, including its result, to standard output, where the Runner reads it.
46	- **[Decided]** A dry run uses no temporary files: temporary files are only for staging and for tools' intermediate data in real runs (4.2). (This replaces the earlier "or to temporary files when that's needed".)
47	- **[Proposed]** When a dry run's log goes to standard output along with its data, the two are told apart the same way as in the Runner's log: data entries, and comment lines that start with a marker and carry a type or label (`runner.md`, section 7).
48	- **[Decided]** A dry run has three roles:
49	  - **Report:** what changed since the last saved run, such as changed files.
50	  - **Preview:** what a real run would produce: which outputs it would create, update or leave alone, and the results themselves.
51	  - **Status check:** it warns about **failures that can be prevented** before a real run, for example a missing output from an earlier tool, unreadable or missing files, an unknown schema version, or invalid config.
52	- **[Decided]** A dry run can be started from the Viewer.
53	- **[Proposed]** Temporary files from a dry run are kept outside the codebase's store and removed when no longer needed. A dry run prints where they are.
54	- **[Proposed]** The status check covers the same conditions a real run would fail on. A clean dry run means a real run on the same inputs should not fail for a reason that could have been prevented.
55	- **[Proposed]** How a dry run of the whole process works is in `runner.md`, section 9.
56	
57	### 4.4 Failures
58	- **[Decided]** A **real run assumes its inputs are valid and fails early**. At the first error it stops with a clear diagnostic, instead of carrying on and producing doubtful output.
59	- **[Decided]** **A failing tool never writes partial data to its store.** Its earlier output stays as it was.
60	- **[Decided]** **If the data a tool reads isn't adequate for it, the tool fails with a clear message, written into its own store.** This is a run error: it applies once the tool has read its parameters correctly (4.5). An error in reading the parameters is an invocation error, which writes nothing.
61	- **[Decided]** **"Inputs not adequate" covers:**
62	  - **missing values** that the tool's declared inputs require
63	  - **values present but incorrect**
64	  - **values present and correct, but missing the tool-specific details** that each tool determines internally
65	  - **inputs that don't have the expected shape**, for example a string where an array is expected
66	
67	  The full list of errors is in 4.6.
68	
69	**Data shape and data value**
70	
71	- **[Decided]** Two kinds of problem in a tool's inputs are kept apart:
72	  - **Data shape**: whether the data is there and has the expected form. A required value is present; it parses; it has the expected type and structure, for example an array and not a string.
73	  - **Data value**: whether the content is right, given a correct shape. A value is correct; values are consistent with each other and with the file read; the tool-specific details the tool determines internally can be found in them.
74	- **[Decided]** **In the parameters, only shape problems are invocation errors**: malformed or missing parameters. Nothing is written and nothing is logged (E1, E2, E3, E13).
75	- **[Decided]** **Value problems are always run errors**, including incongruences found while the tool checks its parameters. They are logged, and `last_run.json` is updated (E12).
76	- **[Proposed]** So the four cases of "inputs not adequate" sort as follows:
77	
78	| Case | Kind | In the parameters | In the file read after the parameters |
79	|---|---|---|---|
80	| A required value is missing | shape | invocation error (E13) | run error (E12) |
81	| An input doesn't have the expected shape | shape | invocation error (E13) | run error (E12) |
82	| A value is present but incorrect | value | run error (E12) | run error (E12) |
83	| Values are correct but lack the tool-specific details | value | run error (E12) | run error (E12) |
84	| Values are incongruent with each other or with the file | value | run error (E12) | run error (E12) |
85	
86	- **[Proposed]** Shape problems in the file the tool reads, for example a source file that doesn't parse, are run errors, because the parameters were already read correctly.
87	- **[Proposed]** The failure message is the tool's result record (4.2), not output. Writing it doesn't break the no-partial-data rule: the earlier output stays as it was, next to a result that says the latest run failed and why.
88	- **[Proposed]** A real run that fails leaves the work data as it was before the run: earlier outputs, the codebase database and the Viewer's last saved run are untouched. See `RN-3` for runs where an earlier tool already succeeded.
89	- **[Proposed]** The Runner's log is not work data. It is written even when a run fails (`runner.md`, section 7).
90	- **[Decided]** Failures to handle include disk read and write errors, missing files, files left incomplete by an earlier crash, files in the wrong format or with the wrong schema version, and outputs older than the source they describe. Each gives a clear diagnostic, never a crash or quietly wrong output.
91	- **[Proposed]** Since tools assume the stores are current (4.2), "outputs older than the source" is caught by the Runner and the dry run, not by the tools.
92	- **[Proposed]** Failures that can't be predicted, such as disk errors during a run, still make the real run fail early.
93	- The full list of known errors, their expected results and the files each one updates is in 4.6.
94	
95	### 4.5 Parameters and logs
96	- **[Decided]** **A tool reads its parameters in this order:**
97	  1. **command-line arguments**, read first
98	  2. a JSON parameters input, given in one of two ways, **both in the same format**:
99	     - `--json <path>`: a JSON file, either in temp or at a specific path, for example in a different tool's store
100	     - `--stdin`: JSON generated by the calling app and passed on standard input
101	  3. if neither is given, **`last_run.json`**, which lives **in the same folder as the tool's program**: `tool_name/tool_name.bin` and `tool_name/last_run.json` (the `.bin` name stands for the tool's program on whatever stack it runs; how to start it is in the record of tools, `runner.md`, section 1.0)
102	  4. **a tool invoked with no parameters repeats exactly its last run, or fails.** If `last_run.json` is missing or unusable, the tool fails with an invocation error, writing nothing. Tools have no fallback to defaults of their own. (This replaces the earlier "sane defaults" step.)
103	- **[Proposed]** Sane defaults now belong to the Runner, which builds the parameters (`runner.md`, section 1).
104	- **[Decided]** **The Runner builds the JSON in memory**, as the tool requires it, and **checks that it is correct with a dry run**. The tool then **saves it to `last_run.json` once it is correct** (`runner.md`, section 1.1).
105	- **[Decided]** **The Runner reads and writes the database to build each tool's JSON parameters**, formatted according to what the tool states with `--info` (`data_topology.md`, `DT-1`).
106	- **[Decided]** **Every invocation must make sure it can create the JSON the tool requires.** If it can't, the tool is not started (see the Runner-bug rule below).
107	- **[Decided]** **A JSON input may contain all the required values and any number of extra, unused values.** A tool uses what it needs and ignores the rest; extra values are never an error.
108	- **[Decided]** What a tool needs from the database reaches it only as parameters; tools never read the database (4.2).
109	- **[Decided]** **Everything read as JSON is the tool's invocation parameters, wherever it comes from.** The tool makes no distinction in how it receives its parameters (command line, `--json`, `--stdin` or `last_run.json`) and deals only with the actual parameters.
110	- **[Proposed]** So data another tool produced, handed over with `--json <path>` into that tool's store, is parameters too. "Data" in the error rules (4.4, 4.6) then means only what the tool reads after its parameters: the examined source files and its internal state.
111	- **[Decided]** **`last_run.json` is updated on every run that is not a dry run, including failed runs.** Running the tool again with no changed data then fails again in the same way.
112	- **[Decided]** **If both `--json` and `--stdin` are given, the tool throws an error** saying the caller made a malformed invocation.
113	- **[Decided]** **An invocation that itself throws an error updates nothing.** `last_run.json` is updated only after the tool has validated that the run can begin: that it can work with its inputs and process the data. A failure after that point updates it.
114	- **[Decided]** **A tool that is unable to begin work does not log.** This covers a malformed invocation, and being invoked with no parameters and no usable `last_run.json`.
115	- **[Decided]** **No tool has Viewer-specific parameters.** Only the Runner may have them (`runner.md`, section 1).
116	- **[Decided]** **Only the tool's internal check of the parameters it reads is an invocation error.** If the tool reads the JSON and all required invocation parameters correctly, **any error further on in the run is a run error and is logged**. (This replaces the earlier "run failures count only once the data can be read and processing can begin".)
117	- **[Decided]** **If the Runner calls a tool without the parameters it needs to begin work and read its inputs, that is a bug in the Runner** (`runner.md`, section 4).
118	- **[Decided]** So two kinds of error are told apart:
119	  - **invocation errors**: found by the tool's internal check of the parameters it reads, such as a malformed invocation, an unusable explicit JSON input, no usable parameters at all, or parameters that are missing or malformed (a **shape** problem). Nothing is written: no `last_run.json`, no log, no result.
120	  - **run errors**: every **value** problem, including incongruences found while checking the parameters, and everything after the parameters have been read correctly, such as a file that can't be read, data that turns out to be inadequate, or a disk error. `last_run.json` is updated, the error is written to the tool's log and result in its store, and no partial output is written (4.4).
121	- **[Proposed]** An invocation error goes to the caller on standard error, with a non-zero exit code.
122	- **[Proposed]** A tool run by hand that hits an invocation error tells the user on standard error and exits; there is nothing to look up afterwards.
123	- **[Decided]** **Repeating a run is as simple as invoking the tool again**, by hand or from a UI that shows the user what failed and offers options to fix it (`viewer.md`, section 4.14).
124	- **[Decided]** **`--log` is optional.** It redirects the log to another program or a file.
125	- **[Decided]** **Every tool writes its own log, in the same format as the Runner's log** (`runner.md`, section 7): entries a parser reads, and comment lines that start with a marker and carry a type or label.
126	- **[Decided]** **After each tool run, the Runner reads the tool's log and the output it produced.**
127	- **[Decided]** **A dry run only writes to standard output.** It reads parameters the same way, but doesn't update `last_run.json` and doesn't write a log file.
128	- **[Proposed]** "Read first" means command-line arguments take precedence: a value given on the command line overrides the same value in the JSON input, which overrides `last_run.json`, which overrides the defaults.
129	- **[Proposed]** `last_run.json` holds the full, effective parameters of the last real run, in the same format as the JSON input. A tool started with no input then repeats its last real run, and a user can copy the file and pass it back with `--json`.
130	- **[Decided]** A tool invoked with no parameters and no usable `last_run.json` fails with an invocation error (E3). A JSON input given explicitly with `--json` or `--stdin` that is missing or malformed is an invocation error too (E2).
131	- **[Proposed]** `--json <path>` pointing into another tool's store lets the Runner hand a tool another tool's data without the tool knowing where it came from. This keeps tools unaware of each other (4.2).
132	- **[Proposed]** Each tool's log is kept in its own store, one file per real run, with a timestamp, like the Runner's.
133	- **[Proposed]** `--log` sends a copy of the log to the given program or file; the log in the tool's store is still written, since the Runner reads it after each run. If "redirect" means the store log is not written, the Runner must never pass `--log`.
134	- **[Proposed]** `last_run.json` also records the outcome of that run (succeeded or failed, and why), so the UI can show what failed next to the parameters that caused it.
135	- **To define:** where JSON input and `last_run.json` sit in the precedence order of config files and global settings (`TS-22`), and how `last_run.json` next to the program fits isolation between codebases (`TS-25`).
136	
137	### 4.6 Known errors and what they update
138	
139	What a tool does for each known kind of error, and which files it updates. "Store" means the tool's store for the codebase being examined; `last_run.json` sits next to the tool's program (4.5). Tools never write to the database (5.2), so it appears in no row.
140	
141	Errors fall into three groups:
142	- **Invocation errors** (E1, E2, E3, E13): found by the tool's internal check of the parameters it reads. It writes nothing and doesn't log ([Decided], 4.5).
143	- **Run errors** (E5, E6, E8, E12): the parameters were read correctly; anything that goes wrong after that. The tool logs the error and updates `last_run.json`, but writes no partial output ([Decided], 4.4 and 4.5).
144	- **Not failures** (E7, E9): the run goes on, with a note in the log.
145	
146	E10 (interrupted) and E11 (dry run) are handled separately.
147	
148	**Kinds of error**
149	
150	| # | Group | Kind | Examples | Expected result | Status |
151	|---|---|---|---|---|---|
152	| E1 | Invocation error | **Malformed invocation** | both `--json` and `--stdin`; unknown option; option value of the wrong type | Stops with an error saying the caller made a malformed invocation. | [Decided] for both `--json` and `--stdin` and for not logging; [Proposed] for the other examples |
153	| E2 | Invocation error | **Explicit JSON input unusable** | `--json` path missing or unreadable; JSON that doesn't parse | Stops with a clear message naming the file. | [Decided]: lacking the parameters to begin is a cannot-begin case |
154	| E3 | Invocation error | **No parameters and no usable `last_run.json`** | invoked with no parameters, and `last_run.json` is missing, unreadable or malformed | Stops without logging; the tool can't repeat a last run and has no defaults of its own. | [Decided] |
155	| E4 | — | ~~**No sane default**~~ | merged into E3: tools no longer fall back to defaults | — | [Decided] |
156	| E5 | Run error | **Inputs can't be read** | data the tool reads after its parameters (examined source files, its internal state) is missing, unreadable, in an unknown format or schema version | The run fails with a clear message naming the input. | [Decided]: after the parameters are read, every error is a run error |
157	| E6 | Run error | **The file to read is gone or unreadable** | the one file named in the parameters (4.2) is missing or can't be read when the tool opens it | The run fails with a clear message naming the file. | [Proposed] |
158	| E7 | Not a failure | **Limits reached** | a file too large, nesting too deep, too many files (`SEC-3`) | The item is skipped, the skip is recorded in the output and the log, and the run goes on. | [Proposed] |
159	| E8 | Run error | **Unexpected failure during processing** | disk read or write error, out of memory, a defect in the tool | The run fails. No partial output is written. | [Decided] |
160	| E9 | Not a failure | **Damaged internal state** | a cache or checkpoint in `state/` can't be read | The tool discards it, works from its inputs, and notes it in its log. | [Proposed] (`data_topology.md`, section 4) |
161	| E10 | — | **Interrupted or cancelled run** | the user cancels from the Viewer; the process is killed | No partial output may become current. What is left behind is `RN-10`. | [Proposed] |
162	| E11 | — | **Any error in a dry run** | any of the above during a dry run | Reported on standard output only. Nothing is written anywhere. | [Decided] |
163	| E12 | Run error | **Inputs not adequate** | **value** problems anywhere: (b) a value is present but incorrect; (c) values are present and correct but lack the tool-specific details the tool determines internally; (e) values are incongruent with each other or with the file read. **Shape** problems in the file read after the parameters: (a) a required value is missing; (d) the data doesn't have the expected shape. Data left incomplete by an earlier crash shows up as (a) or (d). | The run fails with a clear message naming the input, the value and the case. Earlier output stays as it was. | [Decided] |
164	| E13 | Invocation error | **Parameters malformed or missing** | **shape** problems in the parameters only: a required parameter is missing, or doesn't have the expected shape (for example a string instead of an array), as found by the tool's check of the parameters it reads. Extra, unused values are never an error. Value problems in the parameters are E12. | Stops with a clear message naming the parameter. When the Runner is the caller, this is a Runner bug, caught by its dry run. | [Decided] |
165	
166	Not tool errors: **outputs older than the source** are caught by the Runner and the dry run, not by the tools (4.4).
167	
168	**Files updated**
169	
170	| Group | `last_run.json` | Log in store | Result in store | Output in store | `state/` | Standard output / error |
171	|---|---|---|---|---|---|---|
172	| Invocation errors (E1, E2, E3, E13) | no | no | no | no | no | the error, with a non-zero exit code |
173	| Run errors (E5, E6, E8, E12) | yes | yes | yes: failed, and why | no; earlier output kept | unchanged or discarded, never half-written | the error, with a non-zero exit code |
174	| Limits (E7) | yes | yes, listing skips | yes: succeeded, with skips | yes, marking the skipped items | as usual | log copy only if `--log` |
175	| Damaged state (E9) | yes | yes, with a note | yes | yes, if the run succeeds | rebuilt | log copy only if `--log` |
176	| Interrupted (E10) | yes, if processing had begun | as far as it got | `RN-10` | no partial output becomes current | `RN-10` | — |
177	| Dry run (E11) | no | no | no | no | no | everything, including the error |
178	
179	- **[Decided]** An invocation error writes nothing and isn't logged (4.5).
180	- **[Decided]** Run errors update `last_run.json`, so running again with nothing changed fails again in the same way (4.5).
181	- **[Decided]** A failing tool never writes partial output (4.4).
182	- **[Decided]** When the Runner calls a tool and gets an invocation error, that is a bug in the Runner (`runner.md`, section 4).
183	- **[Proposed]** Each group has its own exit code, so the Runner can tell an invocation error from a run error without parsing messages. The codes themselves are deferred to the technology section.
184	- **[Proposed]** For an invocation error, the only record is the caller's: the Runner writes the error it got back into its own log, marked as a Runner bug.
185	- **[Proposed]** The UI shows each failure with its kind, its message, the parameters from `last_run.json` and the tool's log, so the user can see what failed and how to fix it (`viewer.md`, section 4.14). For an invocation error, it shows the Runner's log entry instead.
186	
187	## 5. Shared data
188	
189	### 5.1 Each tool owns its data
190	- **[Decided]** Each tool writes only its own data, about the thing it handles. A tool never parses something outside its job. When it needs to point at something outside its job, it reads the output of the tool that owns it and links to it. Example: the module tool doesn't parse symbols; it reads the symbol tool's output to link modules to the symbols they export. That output reaches it as parameters built by the Runner (4.5).
191	- **[Decided]** Each kind of thing is parsed once. The code model as a whole is the set of files the tools own.
192	- **To define:**
193	  - **Cross-references:** how one tool's records point to another's, using stable IDs, and what happens when the target isn't there.
194	  - **Run order:** moved to `runner.md` (section 2 and `RN-6`).
195	  - **Schema versions:** how each tool's output is versioned, and what a reader does with a version it doesn't know.
196	  - **Size:** file size and memory on large monorepos, for example splitting a tool's output by package.
197	
198	### 5.2 Databases
199	- **[Decided]** **There are two databases:**
200	  - **the configuration database**: one for ZaAnSouVi as a whole, holding its global configuration, such as the date format and the preferred output
201	  - **the codebase database**: one per examined source, holding things like the file list and all analysis details. It is **never shared between analyses**.
202	- **[Proposed]** "Codebase database" is the new name for what these files called the "global database" until now: it was "global" only in the sense of facts that cross tools within one codebase. "Global" now refers only to ZaAnSouVi-wide configuration.
203	
204	#### The configuration database
205	- **[Decided]** Holds ZaAnSouVi's global configuration, for example the `--human` date format and the preferred output (`runner.md`, section 10.1).
206	- **[Decided]** May hold the **record of available tools**, and is **the source of the ordering** of tools, derived from each tool's `--info` (`runner.md`, sections 1.0 and 2).
207	- **[Proposed]** It is where the personal global settings (4.1) live, rather than in a settings file. Whether it holds all of them is `TS-33`.
208	- **[Decided]** **It is shared by the Runner and the Viewer's backend.** The backend may edit it directly.
209	- **[Decided]** **The Runner and the Viewer must stay in sync on it as part of development**: they agree on its structure and meaning, and are changed together.
210	- **Pending:** how to change ZaAnSouVi's global settings from the command line is not defined yet (`TS-34`). Not in the MVP's scope.
211	- **[Decided]** So the configuration database carries a structure version. The Runner and the Viewer each check it on start and fail early with a clear message if they don't recognize it, rather than misread a setting.
212	- **[Decided]** The Runner reads the configuration once, when a run starts. A change the Viewer makes during a run applies from the next run, so one run never mixes two configurations.
213	- **[Decided]** Tools never read the configuration database, like the codebase database; what they need reaches them as parameters (4.2).
214	- **[Proposed]** It holds no data about any examined codebase, so it can be shared across analyses without breaking isolation (5.4).
215	
216	#### The codebase database
217	- **[Decided]** One SQLite database per codebase holds **global facts that rarely change** and don't depend on what any single tool needs:
218	  - environment variables: names, where each is defined and where it is read
219	  - the file inventory: paths, kinds and content hashes, which drive change detection
220	  - git facts, only when the git step found a repository
221	  - which tool outputs exist, their schema versions and the file-inventory state they were built from
222	- **[Decided]** **Only the Runner reads the database.** Tools never read it; the facts they need reach them as parameters built by the Runner (4.2, 4.5). (This replaces the earlier "every tool may read it".)
223	- **[Decided]** **Only the Runner writes to the database**, based on the outputs of the tools. Tools never write to it. (This replaces the earlier rule that each step wrote its own part.)
224	- **[Proposed]** The facts still belong to the tool that produces them: the file inventory produces the file facts, the git step the git facts, and so on. The Runner loads each tool's output into that tool's part of the database after the tool succeeds (`runner.md`, section 5).
225	- **[Proposed]** The record of which tool outputs exist, their schema versions and what they were built from is written by the Runner too.
226	- **[Decided]** The `--human` format configuration is not here: it is global configuration, in the configuration database (above).
227	- **[Decided]** The codebase database holds **all analysis details** of its codebase, and none of them are shared with other analyses. How this fits the next rule is `TS-32`.
228	- **[Decided]** **Tool-specific work data never goes in the database.** (The Runner decides per value what goes in the database, and reads work data from the tools' stores when a later tool needs it; `runner.md`, section 5.) It stays in each tool's own plain-text or JSON files, which keeps those outputs readable, comparable as text, and owned by one tool.
229	- **To define:** where the line falls between global and tool data, what the database holds and how its structure is versioned, which step fills which part, how it stays stable between runs and in sync with the source, and whether a text export is needed so the global facts can be read and compared.
230	
231	### 5.3 Incremental runs
232	- **[Decided]** The first run on a codebase, with nothing saved yet, produces every output. Later runs change only the files and database rows affected by changes in the source. When nothing changed, a run writes nothing.
233	- **[Decided]** **Tools write only current data.** A run overwrites a tool's work data with the current result. Tools keep no earlier versions of their outputs.
234	- **[Decided]** Each run treats the source as **one consistent snapshot**: all outputs from a run describe the same state of the code, never a mix of old and new.
235	- **[Decided]** Change detection is based on file contents recorded in the file inventory, plus config changes. It works without git.
236	- **To define:** how a change spreads to the tools that read the affected outputs, how leftovers such as records for deleted files are cleaned up, and how a run stays one snapshot if it is interrupted part way.
237	
238	### 5.4 Isolation between codebases
239	- **[Proposed]** A layout on disk for stores, work spaces and the shared store is proposed in `project_organization.md` (undecided, `ORG-1`).
240	- **[Decided]** The toolset can examine many codebases without one overwriting another's data. Each codebase's internal files and codebase database live in their own folder, named from an **identity key**.
241	- **[Decided]** The key identifies the **codebase, not a commit**. Each codebase has one store, updated incrementally to its latest state, and the current ref is recorded inside it when known.
242	- **[Proposed]** The key comes from an explicit project ID in config, the project name, or a hash of identifying details such as root path and project name. A remote URL found by the git step can strengthen it.
243	- **To define:** the exact key; where the stores live (inside the examined project, under an output root, or in a user cache folder) and how they relate to the final outputs; how stores of codebases no longer examined are listed and cleaned up; how forks, clones in different paths and monorepo sub-projects are told apart.
244	
245	### 5.5 Shared library (not a tool)
246	- **[Decided]** Tools may run on any stack (`runner.md`, section 1.0), so a code library can't be shared by every tool. What all tools must share is the **contract**: the parameter, `--info`, log, `last_run.json` and output formats, defined independently of any language.
247	- **[Proposed]** A library for TypeScript tools can still implement that contract, as a convenience; tools on other stacks implement the same contract themselves (`TS-35`).
248	- **[Decided]** *(Earlier decision, now limited by the line above.)* A thin common library used by every tool. It reads, validates and writes tool outputs, and resolves references between outputs. Read access to the codebase database is for the Runner only, since tools never read it (4.2). It gives each tool only the parts of other tools' outputs that it asks for.
249	
```

### 2026-11-07 03:01:14 — Tool call: Bash

```json
{
  "command": "cd /home/zaida/viewer && sed -n 25,72p runner.md; echo ----; sed -n 102,200p runner.md",
  "description": "Read Runner process, invoking, log, dry run sections"
}
```

### 2026-11-07 03:01:16 — Tool call: Bash

```json
{
  "command": "cd /home/zaida/viewer && sed -n 42,112p viewer.md; echo ----; sed -n 167,200p viewer.md; echo ----; sed -n 265,307p viewer.md; echo ---- SEC; sed -n 17,32p security.md; sed -n 66,106p security.md",
  "description": "Read Viewer server, levels, data, malformed data, security sections"
}
```

### 2026-11-07 03:01:16 — Tool call: Bash

```json
{
  "command": "cd /home/zaida/viewer && sed -n 12,54p data_topology.md; echo ----; sed -n 168,277p data_topology.md",
  "description": "Read data topology decisions and option D"
}
```

### 2026-11-07 03:01:17 — Tool result

```
### 1.0 Stack and the record of tools

- **[Decided]** **The Runner is written in TypeScript, like the Viewer. The Runner and the Viewer are considered a unit.**
- **[Decided]** **Tools may run on any stack.** The Runner considers only **how to invoke each tool**, as stated in the **record of tools**. It gets that record either by running the tool directly or when the tool is installed.
- **[Proposed]** The record of tools holds, for each installed tool, how to start it (for example the program to run and any fixed arguments) and what its `--info` returned. It is generated from the tool itself, never written by hand, so it isn't a manifest and can't drift from the tool (`data_topology.md`, `DT-1`).
- **[Proposed]** When the record is filled at installation, the Runner doesn't call `--info` before every run. It refreshes the entry when the tool's version changes, or when the user reinstalls the tool.
- **[Proposed]** Since the Runner and the Viewer are a unit in one language, the contracts they share (configuration database access and version check, the Runner's Viewer output and go / no-go results, the log reader, `--info` types) can be one shared TypeScript library for the two of them. Codebase database access stays in the Runner only (`viewer.md`, section 3.1).
- **[Decided]** **The configuration database may hold the record of available tools.**
- **[Decided]** **Only the Runner can install a tool.**
- **[Decided]** The Viewer can **upload a file that the Runner reads for installation**. The Viewer itself installs nothing.
- **[Decided]** How installation works in detail is **deferred**, to be defined later (`RN-19`).
- **[Proposed]** Installing is when the Runner fills the tool's entry in the record of tools (how to start it, its `--info`) and works out the ordering again (section 2). Removal does the reverse.

### 1.1 The run process

- **[Decided]** A run goes through these steps:
  1. **Read the configuration.**
  2. **Find the examined source directory.**
  3. **Read all files and update the file list.**
  4. **Decide which tools to run, and in what order.**
  5. For each tool, in that order:
     1. For a tool whose `--info` says it reads files, **invoke it once per file**: a tool reads only one file per invocation (`toolset.md`, section 4.2). The file's path goes in the parameters.
     2. **Send the tool its parameters as a JSON structure** with well-defined parameters: database values, file locations and all other relevant information. Which parameters depend on the tool. The JSON goes on standard input with `--stdin`, or as a file with `--json <path>` (`toolset.md`, section 4.5).
     3. When the tool finishes, **read its log and its output from the tool's store**.
     4. **The same tool may be run several times**: to gather information it needs, to work out the required parameters, and as a **dry run to make sure the tool will process correctly**.
     5. Once the tool has run for the actual, updated result, **read the result, update the database, and continue with the next tool**.
- **[Proposed]** The file list comes before deciding the order because which tools apply, and which inputs changed, depend on the files (section 2).
- **[Decided]** **The Runner reads and writes the database to build each tool's JSON**, formatted according to what the tool states with `--info` (`toolset.md`, section 4.5).
- **[Decided]** **The Runner builds the JSON in memory**, in the form the tool requires.
- **[Decided]** **The Runner checks that the JSON is correct with a dry run** of the tool before the real run.
- **[Decided]** **The tool saves the JSON to its `last_run.json` once it is correct**, that is, once the tool has validated that the run can begin (`toolset.md`, section 4.5).
- **[Proposed]** Since the JSON lives only in memory, the Runner passes it with `--stdin`, to the dry run and then to the real run, unchanged. It doesn't need a parameters file in temp; `--json <path>` stays for manual runs and other callers.
- **[Proposed]** If the dry run reports an invocation error, the JSON is wrong. That is a Runner bug: the Runner stops, logs it as such, and doesn't start the real run.
- **[Decided]** **Each invocation must make sure it can create the JSON the tool requires.** If a required value can't be produced, the Runner doesn't start the tool; starting it anyway would be a Runner bug.
- **[Decided]** The JSON may contain any number of extra, unused values besides the required ones.
- **[Proposed]** So the Runner may build one JSON with everything it knows and hand the same one to several tools, or build a smaller one per tool. Both are valid.
- **[Proposed]** The JSON parameters are the tool's whole contract with the Runner. Tools never read the database (`toolset.md`, section 4.2).
- **[Decided]** Each tool states its own parameters and outputs with `--info` (`data_topology.md`, `DT-1`).
- **[Proposed]** The structure of the JSON parameters is the one the tool states with `--info`. The Runner checks the parameters against it before it starts the tool, and the tool checks them when it reads them. A missing or malformed parameter (a shape problem) is an invocation error; that is a Runner bug, caught by the dry run. A value problem, such as incongruent values, is a run error of the tool (`toolset.md`, section 4.4).
- **[Proposed]** When the dry run reports a value problem, the Runner doesn't start the real run either. It records the tool's run error in its log, not as a Runner bug, since the values came from the data.
- **[Proposed]** Every invocation in step 5, including the preparatory runs and the dry runs, is logged in the Runner's log with its timestamp, its exact command line and the JSON parameters it received (section 7), so any step can be repeated by hand.
- **[Decided]** A dry run only writes to standard output, so the Runner reads a tool's dry-run results from there, not from a log file (`toolset.md`, section 4.5).
- **[Decided]** An invocation that throws an error updates nothing in the tool's folder or store (`toolset.md`, section 4.5).
- **[Proposed]** For such an error, the Runner's own log is the only record, so it records the error it got back from the tool.
- **[Proposed]** The dry run before the real run is also the status check of `toolset.md`, section 4.3, done per tool: if it reports a failure that can be prevented, the Runner stops before the real run, and the work data stays untouched.
- **[Proposed]** Since the database is updated after each tool, a later tool sees the facts loaded from earlier tools in the same run. How this fits the one-snapshot rule when a later tool fails is `RN-16` (related to `RN-3`).
- **To define:** whether the file list is the file inventory tool's job or the Runner's (`RN-13`), and which repeated runs are allowed (`RN-15`).

----
## 4. Invoking tools

- **[Decided]** Sends each tool its parameters as a JSON structure with well-defined parameters (section 1.1).
- **[Decided]** Passes the JSON with `--stdin` or `--json <path>`, both in the same format. The path may be in temp or in another tool's store (`toolset.md`, section 4.5).
- **[Decided]** After each tool run, **reads the tool's log and the output it produced**.
- **[Decided]** **Calling a tool without the parameters it needs to begin work and read its inputs is a bug in the Runner.** An invocation error writes nothing and isn't logged by the tool (`toolset.md`, sections 4.5 and 4.6).
- **[Proposed]** So the Runner checks the parameters against the tool's declared structure, and the inputs it names, before the real run. The dry run and the preparatory runs (section 1.1) are where this is checked.
- **[Proposed]** When a tool still reports an invocation error, the Runner stops the run, writes the tool's error into its own log marked as a Runner bug, and reports it as such. It doesn't retry with other parameters. Every tool writes its own log in the same format as the Runner's.
- **[Proposed]** Passes the common command-line options on to every tool as command-line arguments, which take precedence over the JSON (`toolset.md`, section 4.5).
- **[Proposed]** The Runner's run log refers to each tool's log for that run and copies the entries it needs, such as results, failures and diagnostics. The tool's log stays the full record of the tool's run.
- **[Proposed]** After each tool, reads the tool's result record from the tool's own store: success or failure, the failure message, when it ran, its version and what it read. The tool never reports to the Runner directly.
- **[Proposed]** Runs tools one at a time, keeping the toolset's no-concurrency rule (`toolset.md`, section 4.2).

## 5. Loading the database

- **[Decided]** **Only the Runner writes to the codebase database**, based on the outputs of the tools. Tools write only to their own stores (`toolset.md`, sections 4.2 and 5.2).
- **[Decided]** Once a tool has run for the actual result, the Runner reads the result, updates the database, and only then continues with the next tool (section 1.1).
- **[Decided]** **The Runner reads the output of each tool and decides, for each value, whether it belongs in the database, based on what the value represents.**
- **[Decided]** **On each tool call, the Runner is responsible for working out and building the correct JSON and sending it to the tool.** It builds it from whatever it has: the database and the tool outputs it has read.
- **[Proposed]** "Based on what it represents": values that are global facts (files, git facts, env vars, which outputs exist) go into the database; detailed work data of one tool, such as M1's symbols and references, stays in that tool's store, and the Runner reads it from there when a later tool needs it. This keeps "tool-specific work data never goes in the database" (`toolset.md`, section 5.2).
- **[Proposed]** The Runner knows what a value represents from the outputs the tool states with `--info` (`DT-1`). How exactly `--info` says it is `RN-12`.
- **[Proposed]** After a tool succeeds, the Runner reads its output from the tool's store and loads the values that belong in the database into that tool's part of it. It also records which outputs exist, their schema versions and what they were built from.
- **[Proposed]** When a tool fails, the Runner loads nothing from it, and that tool's part of the database stays as it was.
- **[Proposed]** A dry run loads nothing; the Runner only reports what it would load.
- **To define:** how the Runner knows what to load from each output and where, without built-in knowledge of each tool (`RN-12`), and the rule for which values go in the database (`RN-12`).

## 6. Configuration listing

- **[Decided]** **The Runner can list its saved configurations**, through an option similar to `--list-config` (the exact invocation is undecided). For every named configuration it lists all known facts about its runs, including when it last ran, the list of failures and errors, and the files processed.
- **[Proposed]** To list them, the Runner records the facts of each run per named configuration, in its own data next to the configuration files. The run without a named configuration is recorded under a reserved default name, so it can be listed too.
- **[Proposed]** The listing only reads. It writes nothing and runs no tool.
- **[Proposed]** Its output is careful output: parsable, with stable field names, so the Viewer's run configurations view (`viewer.md`, section 4.14) reads it like any other fact.
- **[Proposed]** These recorded facts are run provenance (`data_topology.md`, section 4).
- **To define:** what else the listing includes, and how much history it keeps (`RN-1`).

## 7. Run log

- **[Decided]** **The Runner writes a text log of each run**: which files it read, which tool it invoked with which options, what result each tool had, and similar details.
- **[Decided]** Each log is saved **under the Runner's own folder, with a timestamp**.
- **[Decided]** For each tool invocation the log shows the **timestamp** of the invocation and the **exact command line** used to invoke the tool. It logs **failures**, and **diagnostics** when they are available.
- **[Decided]** **The log carries human-readable comments.** Each comment line starts with a marker at the beginning of the line. A parser can ignore comment lines, or search them for labels.
- **[Decided]** The format of a comment can indicate its type or similar metadata, so comments can be told apart and searched by kind.
- **[Proposed]** So the log has two layers: entries a parser reads (invocations, command lines, results, failures, diagnostics) and comment lines for people. Removing every comment line leaves a complete, parsable log; the comments explain, they never hold facts found nowhere else.
- **[Proposed]** Comment types could include, for example: section headings per tool, explanations of why a tool was skipped, where an option value came from (`toolset.md`, section 4.1), and hints on how to fix a failure. **To define:** the list of comment types and labels.
- **[Proposed]** The exact command line is enough to repeat a single tool's step by hand, which supports the rule that a run can be explained and repeated (`toolset.md`, section 4.1).
- **[Proposed]** Failures and diagnostics keep their source locations, as file:line references, like everywhere else (`toolset.md`, section 3).
- **[Proposed]** The log names the Runner configuration used, or the default, so it can be matched to the configuration listing (section 6). The listing's facts and the log describe the same run.
- **[Proposed]** The log is not work data. It is written even when a run fails early, and ends with the reason it stopped.
- **To define:** dry-run logs, how long logs are kept, and skip reasons (`RN-2`).

## 8. Failures and the one-snapshot rule

- **[Decided]** A real run fails early at the first error (`toolset.md`, section 4.4).
- **[Decided]** A failing tool never writes partial data to its store, and tools write only current data (`toolset.md`, sections 4.4 and 5.3).
- **[Decided]** Each run treats the source as one consistent snapshot (`toolset.md`, section 5.3).
- **[Decided]** Temporary files are used for **staging** (and for tools' internal intermediate data), never for dry runs (`toolset.md`, section 4.2).
- **[Proposed]** A failed run leaves the work data as it was before the run. When an earlier tool in the same run already succeeded, this conflicts with the one-snapshot rule (`RN-3`).
- **To define:** what a cancelled run leaves behind (`RN-10`).

## 9. Dry run

- **[Decided]** A dry run can be started from the Viewer, and never changes work data (`toolset.md`, section 4.3).
- **[Decided]** A tool's dry run writes no record to the file system or the database. It prints all its data to standard output, and **the Runner reads it from there** (`toolset.md`, section 4.3).
- **[Proposed]** A dry run of the Runner chains the steps through what each tool prints, so later steps work from the earlier steps' dry-run results instead of the saved work data. The whole process can be tried without touching anything. **To define:** how a later tool receives an earlier tool's dry-run data, since tools normally read only from the stores (`RN-11`).
- **[Proposed]** By the same rule, the Runner's own dry run writes no log and no listing facts. It prints its plan and results to standard output. This would answer the dry-run part of `RN-2`.
- **[Proposed]** It also runs the configuration checks in section 3, and reports which tools would run, which would be skipped, and why.

## 10. The Runner and the Viewer

- **[Decided]** Runs started from the Viewer go through the Runner and are logged and recorded exactly like command-line runs (section 1).
- **[Decided]** After each run, the Viewer re-reads what is relevant according to the Runner's output for that run (`viewer.md`, section 3.2).
- **[Decided]** The Viewer lists every Runner configuration with its last known state, in its run configurations view (`viewer.md`, section 4.14).
- **[Proposed]** The default one-command run ends by starting the Viewer.
- **[Decided]** **The Viewer calls the Runner with parameters useful for visualization**, for example:
  - **dry-run only**: run only the dry runs, to find out the status and whether everything would process correctly. Nothing is written (`toolset.md`, section 4.3).
  - **read cache**, or similar: get the data currently stored by the tools, without running them.
- **[Decided]** **The Runner and all the tools share data through the Runner.** What a tool gets, and what anyone else gets from a tool, depends on the Runner.
- **[Decided]** **Real runs stay unchanged.** Viewer-oriented parameters only choose what the Runner does and reports; they never change how a real run behaves or what it writes, so "all invocations are equal" still holds.
- **[Decided]** **The same data must be recreatable by the user calling the Runner by hand.** Everything the Viewer gets from the Runner, the user can get with the same Runner call on the command line, and gets the same result.
- **[Proposed]** So every Viewer-oriented parameter is an ordinary, documented command-line parameter of the Runner, and the Viewer shows the exact Runner command it used, like the logged command lines (section 7), so the user can repeat it.

### 10.1 Output modes

- **[Decided]** **The Runner has two output modes:**
  - **for the Viewer**: easily parsable data, for the Viewer's backend
  - **for people**: text only, formatted for a person to review. For example, dates are shown in the user's time zone and format, such as `dd/mm/yyyy`, instead of a numeric date.
- **[Decided]** The human mode is selected with **`--human`**, a parameter **exclusive to the Runner**. No tool has it.
- **[Proposed]** Without `--human`, the Runner uses the preferred output from the configuration database, and the Viewer mode if none is set. The Viewer asks for its mode explicitly, so a user running the same command by hand gets exactly what the Viewer got (section 10).
- **[Proposed]** Both modes carry the same data; `--human` changes only how it is presented. Nothing about what the Runner runs or writes depends on it.
- **[Proposed]** Output mode affects only what the Runner prints. Its log files keep their one format (section 7), with timestamps stored in an unambiguous form; human formatting is applied when they are shown.
- **[Decided]** **The `--human` format is configurable, and the configuration is kept in the configuration database**: ZaAnSouVi's global configuration, shared by every codebase, not the codebase database (`toolset.md`, section 5.2).
- **[Decided]** The configuration database also holds the **preferred output**.
- **[Proposed]** The preferred output is the mode used when a command gives neither `--human` nor an explicit Viewer mode. The Viewer always asks for its mode explicitly, so a user's preference never changes what the Viewer gets, and a user who copies the Viewer's command gets the same output (section 10).
- **[Decided]** The configuration database is shared by the Runner and the Viewer's backend, which may edit it directly; the two must stay in sync on it as part of development (`toolset.md`, section 5.2).
- **Pending:** how these settings are changed from the command line is not defined yet (`TS-34`); not in the MVP's scope. The earlier proposal follows, kept until that is settled. The Runner could change these settings itself: through a Runner parameter, for a user working from the command line. The Viewer's config manager edits the configuration database directly.
- **[Proposed]** What is configurable: at least the date format and the time zone. Possibly also durations, sizes and how paths are shown (`RN-18`).
- **[Decided]** These settings are global, not per codebase.
- **[Proposed]** A "read cache" call returns the stored tool outputs and database facts, in a form the Viewer server can parse, together with provenance (which tool, version, when). It reads only; it starts no tool.
Shell cwd was reset to /home/zaida/viewer/mvp_docs
```

### 2026-11-07 03:01:17 — Tool result

```
## 3. Viewer server

### 3.1 Responsibilities
- **[Decided]** **Reads the configuration database directly**, since it holds configuration that affects both the Viewer and the Runner (`toolset.md`, section 5.2). That includes the record of available tools and their ordering (`runner.md`, sections 1.0 and 2).
- **[Decided]** **Gets codebase data through the Runner**, never by reading the codebase database itself. (This replaces the earlier "reads the toolset's outputs, including the database".)
- **[Decided]** Reads the examined project, for example to show source around a location.
- **[Decided]** **Calls the Runner with parameters useful for visualization**, such as dry-run only (status and correctness) and read cache (the data currently stored by the tools) (`runner.md`, section 10).
- **[Decided]** The Runner has an output mode for the Viewer, with easily parsable data for the backend; `--human` gives text for people instead (`runner.md`, section 10.1). The `--human` format and the preferred output are configurable and kept in the configuration database (`toolset.md`, section 5.2).
- **[Decided]** **The Viewer's backend shares the configuration database with the Runner and may edit it directly.** The Runner and the Viewer must stay in sync on it as part of development (`toolset.md`, section 5.2).
- **[Decided]** The config manager shows and changes these settings by editing the configuration database directly, as a manual save with the confirmation dialog (4.13). The Viewer still never writes the codebase database.
- **[Decided]** Real runs stay unchanged whatever the Viewer passes, and **the same data can be recreated by the user calling the Runner by hand** (`runner.md`, section 10).
- **[Decided]** **The Viewer may keep its own cache or database, through the backend, if it is required at all.** It lives in the Viewer's internal storage (section 2).
- **[Proposed]** The same goes for tool outputs in the tool stores: the server gets them by calling the Runner (read cache), never by opening the stores, so the Runner stays the only reader of the codebase's data.
- **[Decided]** Runs the tool steps on request from the UI, through endpoints.
- **[Decided]** Generates and serves data in a format only the Viewer needs (see section 5). This data lives in the Viewer's internal storage (section 2).
- **[Decided]** Saves the Viewer's own settings and preferences in its internal storage.
- **[Decided]** **The server does all the parsing and interpreting; the UI only displays.** The server reads and interprets the toolset's configuration and outputs, and prepares what each page shows. The UI never parses config files or tool outputs itself.
- **[Decided]** Parses the configuration of the **entire toolset** for the config manager (4.11), and saves changes to it after the user confirms (4.13).
- **[Proposed]** Produces the human-readable text overview for the status page (4.12).

### 3.2 Running tool steps
- **[Decided]** The Runner treats every invocation the same, whether it comes from the Viewer or the command line (`runner.md`).
- **[Decided]** **The Viewer doesn't create tool parameters of its own.** It delegates that to the Runner, which may have Viewer-specific parameters; no tool has any (`runner.md`, section 1).
- **[Proposed]** So re-running a failed tool from the UI (4.14) goes through the Runner too, or invokes the tool with no parameters so it repeats its `last_run.json` exactly. A run started from the Viewer is logged and recorded exactly like a command-line run.
- **[Proposed]** The server adds no analysis logic. It runs the same tools the command line uses, with the same options and precedence. Options chosen in the UI act like command-line overrides for that run. Everything the UI can trigger can also be done from the command line.
- **[Proposed]** Runs are one at a time, keeping the toolset's no-concurrency rule. The server queues requests: one run per codebase at a time, and a second request waits or is rejected.
- **[Proposed]** Progress, logs and diagnostics are sent to the UI while the run happens.
- **[Proposed]** A run can be cancelled. A cancelled or failed run leaves the last good Viewer data untouched (see section 5).
- **[Decided]** **A tool run overwrites the tools' work data**, and the tools write only current data (`toolset.md`, section 5.3). After each run, the Viewer **re-reads what is relevant according to the Runner's output** for that run, for example which tools ran, which changed their outputs and which failed.
- **[Decided]** The Viewer can access all the data the tools have saved, through the Runner (3.1). A failing tool writes no partial data, so what the Viewer gets is always a tool's last complete output.
- **[Proposed]** Since the tools keep only current data, the Viewer's cached last saved run is the only copy of an earlier state. When the user rejects a pending version, the Viewer keeps showing its cache and marks it as older than the data on disk.
- **[Decided]** The Viewer never switches data on its own. The last saved run is treated as current until the user manually refreshes or re-runs tools. A run the user starts from the UI shows its result when it finishes. A run started elsewhere, for example from the command line, appears only after a manual refresh.
- **[Decided]** A real run started from the Viewer fails early at the first error. The Viewer shows the diagnostic and keeps showing the last saved run.

**Dry run from the Viewer**
- **[Decided]** The user can start a **dry run** from the Viewer. It works as a **report** (changed files and similar information), a **preview** (what a real run would produce) and a **status check** (warnings about failures that can be prevented, such as a missing output from an earlier tool). It changes no work data. The Viewer cache, the last saved run and the current visualization stay as they are.
- **[Proposed]** The dry-run result is shown in the drawer:
  - files added, changed and removed since the last saved run
  - which tool outputs a real run would create, update or leave alone
  - the status check: preventable failures, each with its cause and, where possible, what to do, for example "run the symbol step first"

  From there the user can start the real run.
- **[Proposed]** The preview can also be shown in the graph area, marked clearly as a preview. It is never saved and never replaces the last saved run.
- **[Proposed]** The result's items are traceable like everything else: each changed file links to its source.
- **[Proposed]** A dry-run result is temporary. It is not saved as Viewer data and disappears when the user closes it or starts a real run.

### 3.3 Interface
- **[Proposed]** The server's endpoints are a contract, defined as carefully as the file formats between tools. They cover:
  - starting, following and cancelling runs
  - listing codebases and the views available for each
  - fetching Viewer data and diagnostics
  - reading and saving the Viewer config

### 3.4 Lifecycle
- **[Proposed]** The default one-command run ends by starting the server and opening the UI in the browser.
- **[Proposed]** The server can also be started on its own over existing outputs, without running any analysis.
- **[Proposed]** Everything the UI needs is bundled with ZaAnSouVi, so it works fully offline.

## 4. Viewer UI

Sections 4.1 to 4.9 describe the **Viewer page**, the graph page. Sections 4.10 to 4.13 describe the page header, the other two pages, and how changes are saved.

### 4.1 Common graph model
- **[Decided]** Each view converts tool output into one common graph model, so all views share the same concepts and behavior.
- **[Proposed]** The model contains:
  - **Nodes:** stable ID, kind (variable, function, module, package, env var, resource…), label, source location, and the tool that produced it.
  - **Edges:** kind (reads, writes, calls, imports, extends, uses-env, deploys-to…), direction, and **their own source location**. For a read or write edge, that is where the read or write happens.
  - **Containment:** packages contain modules, and modules contain symbols. Grouping, collapsing and zoom levels depend on it.
  - **Provenance:** for each element, which tool output and which input state it came from.
- **[Proposed]** Because IDs are stable across tools, the same element has the same ID in every view. The user can follow it from one view to another.

----
### 4.9 Moving between views
- **[Decided]** The user can switch between views. Each view loads the data it needs when it is entered. Data that several views share is kept inside the Viewer and reused, not loaded again.
- **[Decided]** The views are arranged in a **hierarchy of levels defined by the app**. Users cannot configure it.
- **[Decided]** Zooming and moving between levels are kept apart:
  - **Mouse wheel:** ordinary zoom inside the current view. It never changes the view.
  - **Ctrl + mouse wheel:** moves between levels. Ctrl + wheel forward toward a node opens that node's lower-level view. Ctrl + wheel back goes to the higher-level view.
  - **Double-click:** also moves between levels (see below).
- **[Decided]** Example of moving between levels: a view showing the codebase's infrastructure, App → { database, server, renderer }. Zooming in toward *database* opens the database overview: table names, row counts and similar details. Row counts come from a dedicated tool for that type of data, for example one that reads row counts from a SQLite file in the project ([Decided], `toolset.md`, section 6.7); reading from a running database is still open (`VW-18`). Where this infrastructure view sits in the hierarchy is not yet known (4.9.1).

#### 4.9.1 The levels

- **[Decided]** **Level 1, the overview** (the highest level): an overview of the entire examined codebase. It shows:
  - the project configuration
  - versions
  - file count
  - run configurations
  - which optional details are available, for example whether the project is AI-enabled, whether it has a known editor configuration, and whether it has a git configuration
- **[Decided]** The overview must be **extensible**: adding a new tool or a new kind of configuration adds to the overview without redesigning it.
- **[Decided]** **Level 2**: for each node of the project configuration shown in level 1, what is known about it. It also shows:
  - the **project structure** as directories
  - the project's **known outputs**: what the project produces, for example a command-line tool, a website or a library
- **[Decided]** **More levels exist below level 2, but they are not known yet.**
- **[Proposed]** To make the overview extensible, it doesn't know each tool in advance. Each tool contributes **facts** to it in one common shape: category, name, value, and where the fact was found (file and line, for traceability). The overview shows the facts by category, and a new tool's facts appear without changing the Viewer. This matches the rule that views are listed from the record of which outputs exist (4.2).
- **[Proposed]** Each fact in level 1 that has more to show is a node the user can zoom into, which leads to level 2 for that node.
- **[Proposed]** Optional details that are absent are still shown as absent, for example "no git configuration found". The user can then tell "not present" apart from "not checked".

- **[Proposed]** A lower-level view opens **for a specific object**: the database overview for *this* database. The object the user zoomed into is the view's focus, and saved positions (4.5) are kept per view and per focus object.
- **[Proposed]** Not every node has a lower level. The style catalog marks nodes the user can zoom into, so the user knows before trying.
- **[Proposed]** Ctrl + wheel forward goes into the node under the mouse pointer. Over empty space, or over a node with no lower level, nothing happens, and a short hint says so. The change of level is animated, so the user sees the node they entered become the new view.
- **[Proposed]** Double-click on a node goes down into it. A double-click on empty space, or the breadcrumb, goes back up.
- **[Proposed]** Returning to a level the user already visited restores where they were: the zoom, the pan position and the selection.
- **[Proposed]** Data for each view is loaded only on entry, and the shared data (for example the file inventory, the style catalog and identity colors) is loaded once. The data reflects the last saved run (section 5), so moving between views never mixes runs.

### 4.10 Page header and the pages
----
## 5. Viewer data and cache

- **[Decided]** The Viewer caches its own data, so a running tool never makes the UI show incomplete data or fail to load.
- **[Proposed]** The cache, including a pending version, is part of the Viewer's internal storage (section 2). Accepting a pending version changes only that storage, never tool outputs.
- **[Proposed]** The cache is kept per codebase and per view, and always holds the last complete, valid Viewer data.
- **[Proposed]** Viewer data is rebuilt only after a tool run has finished, from the outputs of that run, re-reading only what the Runner's output says changed (3.2). The new data is built next to the current cache and replaces it in one step, only when the build succeeds and is complete.
- **[Decided]** **Partly malformed output needs the user's approval.** When the rebuild finds partly malformed tool output, the new data does not replace the cache automatically. It becomes a **pending version**:
  - the Viewer shows the pending version with the malformed or skipped parts **marked visually in the graph area**, not only in a diagnostics list
  - the Viewer **asks the user** whether to save the pending version as the new complete version
  - **Accept:** a manual save with the confirmation dialog (4.13). The pending version replaces the cache and becomes the new last-known-good. It keeps its markings and diagnostics, so it stays visibly partial later.
  - **Reject:** the pending version is discarded. The Viewer keeps showing the previous complete version, marked as stale, with the reason.
- **[Decided]** **At most two versions are kept, and no history:**
  - the **last saved run**: the last complete run, or the last partial run the user accepted
  - the **current visualization**: what is on screen, which differs from the last saved run only while a pending version awaits the user's decision

  When a pending version is accepted it becomes the last saved run, and the previous saved run is dropped. When it is rejected it is dropped. A newer run replaces any pending version that is still waiting.
- **[Proposed]** Until the user decides, the last saved run stays cached. The user can switch between the pending version and the last saved run to compare them before deciding.
- **[Proposed]** If no one is there to decide, for example after a command-line run with no Viewer open, the pending version is kept and nothing is replaced. The Viewer asks the next time the user refreshes or opens it.
- **[Decided]** The decision is one per run, not one per view, because there is only one saved run and all its views describe the same snapshot.
- **[Proposed]** Each cache entry records what it was built from: input state, tool outputs and their schema versions, Viewer version, and the Viewer config settings that affect the data. A change to any of these marks that entry for rebuilding, and nothing else.
- **[Proposed]** The UI says plainly when what it shows is not the latest, and why. For example: "Showing results from the previous run; the latest symbol run failed." It also says plainly when what it shows is a pending version awaiting the user's decision.
- **[Proposed]** If the Viewer's own cache is damaged, the server rebuilds it from the tool outputs.

## 6. Malformed or missing data

- **[Decided]** When tool outputs are malformed, the Viewer makes a fair effort and shows only what it can.
- **[Proposed]** Since real runs fail early instead of writing doubtful output (`toolset.md`, section 4.4), a normal run should not produce malformed output. Malformed data reaching the Viewer is expected to come from outputs edited by hand or damaged on disk, from a schema version the Viewer doesn't know, or from a defect in a tool. The rules below, and the pending version in section 5, cover those cases.
- **[Proposed]** The tolerance is applied on the server, while Viewer data is built. The UI receives only data that has been checked.
- **[Proposed]** How each problem is handled:

| Problem | Behavior |
|---|---|
| A whole output file is missing or unreadable | That view, or that layer of a combined view, is unavailable with a clear reason. Other views still work. |
| Unknown schema version | Read the fields it understands, ignore the rest, and mark the view "partially understood". |
| A malformed record | Skip that record and keep the rest of the file. |
| An edge whose source or target is missing | Show a marked "unresolved" endpoint or hide the edge (`VW-4`), and count it either way. |
| An unknown node or edge kind | Draw it with a generic style. |
| A missing source location | Show the element, but mark its link and quote as unavailable. |

- **[Proposed]** Showing part of the data is acceptable. Showing it without saying so is not. Each view shows how much was skipped and why, and every skipped item can be traced to its output file and record.
- **[Proposed]** The Viewer never fills gaps with guesses. It shows less rather than something wrong.
- **[Proposed]** A view never mixes data from two different runs.

---- SEC
## 1. Never run code from the examined source

- **[Decided]** **Nothing in ZaAnSouVi ever runs code from the examined source.** This applies to every tool, every detector, the dry run, the Viewer server and the Viewer UI.
- **[Decided]** All analysis is static: tools only read files.
- **[Proposed]** This rules out, among others:
  - code that looks like configuration or infrastructure definitions, which may be tempting to run in order to discover infrastructure or settings
  - the project's scripts, build steps, tests and run configurations; they are read and reported, never started
  - installing the project's dependencies
  - plugins or extensions the project declares for its own tooling, such as compiler or editor plugins
  - commands or servers described in AI assistant, editor or other configuration files
  - hooks or helper programs the project configures for git (section 3)
  - anything from the examined source shown in the browser: it is displayed as text, never run as markup or script (section 8)
- **[Proposed]** Where reading a file would normally mean running it, for example a configuration file written as code, the tools read it as text only and report what they can find that way. What can't be found without running it is reported as unknown, never guessed.
- **[Proposed]** Hostile or unusual input must not crash a tool or exhaust the machine: very large files, deeply nested code, or huge numbers of files. Tools need limits and must report what they skipped.
- **[Proposed]** File access stays inside the examined project. Links or paths that point outside it, including symbolic links, are not followed without an explicit setting.

## 6. Temporary files

- **[Decided]** A dry run never writes a record to the file system or the database; it prints its data to standard output (`toolset.md`, section 4.3). That removes most of this concern.
- **[Decided]** Temporary files are used only for staging and for tools' intermediate data during a run (`toolset.md`, section 4.2).
- **[Proposed]** They can hold the same details from the examined source as real outputs. They are created so only the user can read them, kept outside shared locations where possible, and removed when the run ends, whether it succeeded or failed.

## 7. Viewer server

A local server that runs tools and reads files is a real attack surface.

- **[Proposed]** It is reachable only from the local machine, never from the network.
- **[Proposed]** It rejects requests from other web pages open in the same browser, by checking where each request comes from and requiring a token issued at startup.
- **[Proposed]** It runs only the fixed set of tool steps, with validated options. There is no general way to run arbitrary commands.
- **[Proposed]** It reads files only inside the examined project and the toolset's own folders.
- **[Proposed]** It never executes the examined code (see section 1).
- **[Proposed]** The config manager can change the configuration of the entire toolset, globally and per project (`viewer.md`, section 4.11). The server writes only configuration files, only after the user confirms the change preview, and only to the known config locations.
- **[Decided]** The server writes tool configuration in the format each tool declares, and nothing else of the tools': no tool outputs, nothing in the codebase database.
- **[Proposed]** The Runner's "read cache" and "dry-run only" calls from the Viewer only read; they start no real run and write nothing.
- **[Proposed]** The Viewer's internal storage (cache, views, preferences, and its own database if it has one) holds content from the examined source, so it gets the same care as tool outputs: isolated per codebase, readable only by the user.
- **[Proposed]** The Runner (`runner.md`): the named Runner configuration given in the invocation is looked up only in the Runner's data, by name. A name can't point to a file elsewhere.
- **[Proposed]** The Runner's configuration listing only reads. Its failure and error lists may quote the examined source, so it gets the same care as other outputs (section 2).
- **[Proposed]** The Runner's run logs list files read, exact command lines, tool options, failures and diagnostics, which may quote the examined source. Since command lines are logged exactly, no credentials may ever be passed to a tool on its command line (see section 10). They stay in the codebase's own store, readable only by the user (sections 2 and 5).
- **[Proposed]** The JSON parameters the Runner sends a tool are logged in full, so they must never carry credentials. File locations in them must point inside the examined project or the ZaAnSouVi root, and the tool checks this rather than trusting them (section 1).
- **[Proposed]** A tool given `--json <path>` only reads that file. The path must point inside the ZaAnSouVi root or system temp. An explicit JSON input that is missing or malformed fails the tool early.
- **[Proposed]** Since `last_run.json` sits next to the tool's program, the program folders must be writable during a run. A tool writes only its own `last_run.json` there, never its own or another program.
- **[Proposed]** `last_run.json` and the tools' logs hold parameters and diagnostics that may quote the examined source; they get the same care as other outputs. A damaged `last_run.json` makes the tool fall back to defaults and say so in its log, never guess.
- **[Decided]** Only the Runner installs tools. The Viewer may upload a file for the Runner to read for installation (`runner.md`, section 1.0).
- **[Proposed]** Installing a tool means ZaAnSouVi will later run that tool's program, so an uploaded installation file is trusted code, not data. Installing needs the user's explicit confirmation, shows what will be installed and how it will be started, and never takes anything from the examined project. To be worked out with the installation details (`RN-19`).
- **[Proposed]** The record of tools sits in the configuration database, which the Viewer's backend may edit directly. The parts that say how to start a tool must still be written only from installed tools (by the Runner or installation), never typed in through the Viewer, or the Viewer could be used to make the Runner start an arbitrary program. Whether a tool runs (the named configuration) is the part the user changes.
- **[Proposed]** Tools may run on any stack, and the Runner starts them as the record of tools says. The record must come only from installed tools, never from the examined project, so the Runner can never be made to start an arbitrary program.
- **[Decided]** A tool may use programs internal to it, including built-in shell commands such as `stat` or `file`, with proper wrapping and error checking (`toolset.md`, section 2).
- **[Proposed]** Wrapping such a program means: file names and other values from the examined project are passed as separate arguments, never built into a shell command string, so a crafted file name can't run a command; the program is one that only reads; and its failures become the tool's errors (`toolset.md`, section 4.6).
- **[Proposed]** Omitting a tool from the Runner's order is a configuration change too. Adding a tool means the Runner will run it, so only known, installed tools can be added, never an arbitrary program.
- **[Proposed]** Configuration changes the behavior of every tool. A setting that points tools outside the examined project, or turns off a safety limit, should be clearly flagged in the change preview.

## 8. Viewer UI

- **[Proposed]** Everything shown in the UI comes from the examined code: names, paths, quotes and labels. It must always be displayed as text and never interpreted as markup or script. Otherwise a crafted symbol name or comment could run code in the developer's browser.
- **[Proposed]** Links come from config templates and tool outputs. Only expected link types are opened (repository host, editor, local file). Anything else is shown but not followed.
- **[Proposed]** The UI loads nothing from the internet. Everything it needs is bundled.
Shell cwd was reset to /home/zaida/viewer/mvp_docs
```

### 2026-11-07 03:01:17 — Tool result

````
## Decisions this file depends on

These were made in other files and shape every section below:
- **[Decided]** Tools describe themselves with `--info`, stating their own parameters and outputs. There is no manifest (`DT-1`).
- **[Decided]** Tools never read the database. A tool reads only its JSON parameters, its `last_run.json` and its internal state derived from the examined source (`toolset.md`, section 4.2).
- **[Decided]** Only tools whose `--info` says they read files read them, one file per invocation (`toolset.md`, section 4.2).
- **[Decided]** The Runner reads and writes the database, reads every tool's output, decides per value whether it belongs in the database based on what it represents, and builds each tool's JSON (`runner.md`, sections 1.1 and 5).
- **[Decided]** The Runner reads all files and updates the file list itself (`runner.md`, section 1.1).

So "a tool reads data X" now always means "the Runner hands the tool data X as parameters". Tools never take data from each other or from the database directly.

## The Viewer is outside the topology

- **[Decided]** The Viewer is independent of the tools' format. It has no `--info` or manifest, no category or datatype of its own and no place in the run order. Like the Runner, it reads the stored facts as it needs them.
- **[Decided]** It writes tool configuration in the format each tool declares, and keeps its own data (preferences, views, positions, cache) in internal storage of any kind. Since tools no longer read config files, what "the format each tool declares" becomes is `TS-29`.
- **[Decided]** The Viewer doesn't create tool parameters; it delegates that to the Runner (`runner.md`, section 1).
- **[Makes sense]** So the tools' descriptions serve the Runner first. The Viewer is one more reader of them, mainly to learn which tool produced which data and which settings each tool has.

## Options at a glance

| Option | Idea | Pros | Cons | Status |
|---|---|---|---|---|
| **A. One category dictionary** (section 2) | One catalog of categories. Each entry lists the entities, relations and facts it provides. | One place to look. Ties tools, styles and overview together. | Mixes coarse grouping with specific data shapes. Hard to version finely. | Not ruled out: a dictionary could still give `--info` its names (`DT-2`) |
| **B. Category and datatype dictionaries, plus a manifest file per tool** (section 3) | Categories group data. Datatypes are the specific data. A manifest per tool lists the categories it uses and the datatypes it reads and writes. | Clear contracts per datatype. Precise incremental runs. Lets "one thing well" be checked. | Two dictionaries to maintain. Manifest files can drift from what the tool really does. | Manifest rejected; the dictionaries are still open (`DT-2`) |
| **C. Manifest with input, output, depends on and contains** (section 5) | The manifest also says what lies one level below the tool's output. | Gives the Viewer its level hierarchy. Extensible one level at a time. | "Input" and "depends on" overlap. Declaring children only on the parent's side hurts extensibility. | Manifest rejected; containment can move into `--info` (`DT-3`) |
| **D. Self-describing tools: `--info`** (section 6) | Each tool prints what it takes and produces, as parsable text, when called with `--info`. | One source of truth, can't drift. No registration step. Fits the common command-line options. | Names must match exactly. Says nothing about containment by itself. | **Chosen** (`DT-1`) |

### Chosen: option D, no manifest

- **[Decided]** **Tools describe themselves with `--info`.** Each tool is responsible for stating its own **parameters** and **outputs**.
- **[Decided]** **No manifest.** Options B and C, which rely on a manifest file per tool, are not used.
- **[Decided]** The Runner builds each tool's JSON parameters according to what the tool states with `--info`, from the database and from the tool outputs it has read (`toolset.md`, section 4.5; `runner.md`, section 5).
- **[Makes sense]** What `--info` states must be enough for:
  - the Runner: whether the tool reads files, and which kinds (for example `*.ts`), since only such tools read files, one per invocation; the parameters it needs, so the Runner can work out the order (section 8), build the JSON and check it with a dry run; and its outputs, with what each represents, so the Runner can decide what goes in the database (`RN-12`)
  - the Viewer: which tool produced which data, and the tool's settings for the config manager
- **[Makes sense]** For each parameter, `--info` says what it is in terms the Runner can look up: a data name, its **shape**, and whether it is required. The shape is what the tool's parameter check tests; a shape problem is an invocation error (`toolset.md`, section 4.4).
- **[Makes sense]** Ideas from the other options can still be carried inside `--info` where they help, such as a containment hint (`containedIn`, section 7) or names from a shared list (`DT-2`). The dictionaries of options A and B are not ruled out by this decision, only the manifests.
- **[Makes sense]** `--info` is answered by the tool's own code, without reading the examined source, the stores or any parameters, so it always works and never fails for lack of data.

Two topics apply whichever option is chosen:
- **Internal state of tools** (section 4): data a tool keeps for itself, outside any dictionary.
- **How the Viewer finds its levels** (section 7): declared, read from the data, or both.

----
## 6. Option D: self-describing tools with `--info`

- **[Decided]** This is the chosen option. Each tool states its own parameters and outputs; there is no manifest (see "Chosen: option D, no manifest").
- **[Makes sense]** Fits the decision that each tool is unaware of the other tools and of the run order (`toolset.md`, section 4.2): a tool names the data it takes and produces, and only the Runner connects them.
- **[Makes sense]** `--info` describes the tool; `--log` ([Decided]) redirects a run's log. They are separate options.

Each tool prints a description of itself when called with `--info`. First example from discussion, kept for history:

```json
{"read": {"fileType": "*.ts"},
 "write": {"categories": ["storage.file_list", "storage.file_types", "files.locations", "file.extensions"],
           "stores": ["sql.filetypes.typescript"]},
 "input": "folder_path"}
```

For the Runner:
- **[Makes sense]** One source of truth: the description lives in the tool, so it can't drift from what the tool does.
- **[Makes sense]** No registration step: the Runner calls `--info` on every installed tool and connects each output to the tools whose parameters need it. That gives the run order and the incremental rebuilds.
- **[Makes sense]** `--info` is one more common option, like help and dry run, with parsable output.
- **[Makes sense]** The Runner's dry run can find, before anything runs, parameters no tool produces, data produced by two tools, and cycles.
- **[Makes sense]** Calling `--info` runs a ZaAnSouVi tool, never code from the examined source. The result is kept in the record of tools, filled by running the tool or at installation ([Decided], `runner.md`, section 1.0), and refreshed per tool version.
- **[Makes sense]** Two kinds of input, now settled by decisions: **source files**, which a tool reads itself only if `--info` says so, one per invocation, with the kinds it reads (for example `*.ts`); and **other tools' data**, by name, which reaches the tool only as parameters built by the Runner (`toolset.md`, section 4.2).
- **[Needs refinement]** Names must match exactly. The example has both `files.locations` and `file.extensions`. Without a shared list of names to check against, a one-letter difference silently disconnects two tools (`DT-2`).
- **[Needs refinement]** Parameters are marked required or optional, with a shape (section "Chosen"). Outputs still need a version, and a way to say what each represents (`RN-12`).
- **[Needs refinement]** The first example's `input` with a "default": tools have no defaults of their own any more, since a tool invoked with no parameters repeats its last run or fails ([Decided], `toolset.md`, section 4.5). Defaults belong to the Runner. Whether `--info` may still suggest a default for the Runner to use is part of `TS-29`.
- **[Superseded]** ~~The example tool reads `*.ts` from a folder itself, overlapping with the file inventory.~~ A tool reads one file per invocation, and the Runner builds the file list ([Decided]). A tool that "lists TypeScript files" would read no files at all: it would get the file list as parameters.
- **[Superseded]** ~~The `stores` entry.~~ Tools never write to the database, and the Runner decides per value what goes there (`runner.md`, section 5). A declaration of what each output represents replaces it (`RN-12`).

Second example, refined during discussion, kept for history. Parts of it are superseded: `read.data` (tools take data only as parameters), `stores` (only the Runner writes the database), the folder scan (one file per invocation) and the `default` (tools have no defaults):
```json
{
  "tool": "list-typescript-files",
  "version": "1.0.0",
  "input": { "folder_path": { "description": "Root folder to scan", "default": "source root" } },
  "read": {
    "sources": ["*.ts", "*.tsx"],
    "data": [ { "name": "files.list", "required": true } ]
  },
  "write": {
    "data": [
      { "name": "files.typescript", "version": 1 },
      { "name": "files.extensions", "version": 1 }
    ],
    "stores": ["sql.filetypes.typescript"]
  },
  "containedIn": "files.folder"
}
```

- **[Needs refinement]** Example under the current decisions, using the MVP's file-symbols tool (`MVP_scope.md`, M1). Illustrative only; the exact fields are deferred to the technology section, and `represents` is one possible answer to `RN-12`:
```json
{
  "tool": "file-symbols",
  "version": "0.1.0",
  "readsFiles": { "kinds": ["*.ts", "*.tsx"] },
  "parameters": {
    "file_path": { "dataName": "files.file.path", "shape": "string", "required": true },
    "file_id":   { "dataName": "files.file.id",   "shape": "string", "required": true }
  },
  "outputs": [
    { "dataName": "code.symbol",    "version": 1, "represents": "work data" },
    { "dataName": "code.reference", "version": 1, "represents": "work data" }
  ],
  "containedIn": "files.file"
}
```

For the Viewer:
- **[Makes sense]** The Viewer learns which tool produced which data (for provenance and the status page), which views are possible, and, if `--info` lists settings, what the config manager can show (how settings reach tools is `TS-29`).
- **[Needs refinement]** Parameters and outputs describe how data **flows**, not what **contains** what, so they don't give the view levels by themselves. See section 7.

## 7. How the Viewer finds its view levels (applies to every option)

Data flow and containment often point the same way, but not always:
- The symbol tool reads TS files, and symbols sit inside files. Flow and containment match.
- The module tool takes symbols as parameters, but modules contain symbols. Containment points the opposite way.

| Approach | Pros | Cons |
|---|---|---|
| **Declared:** the tool's `--info` says where its output sits, for example `containedIn` | Levels known before anything runs; "not checked yet" slots can be shown | Can disagree with the real data |
| **Read from the data:** every record carries its parent's ID | Always matches the real data | Levels exist only after a run |
| **Both** | Expected shape plus the real tree; the dry run can compare them | Two things to keep consistent |

- **[Makes sense]** Using both: the declaration in `--info` gives the expected shape and the "not checked yet" slots, and the parent IDs in the data give the real tree.
- **[Needs refinement]** Depends on the choices in section 5 about several parents, and about one or several views per level.

## 8. Run order and stages (applies to every option)

- **[Makes sense]** Stages give a coarse order that is easy to understand:
  0. discovery: the file list, built by the Runner itself ([Decided], `runner.md`, section 1.1; whether a file inventory tool remains is `RN-13`)
  1. project facts: git, project configuration, known outputs, detectors, env vars
  2. code analysis: symbols
  3. relations: modules, infrastructure, database schema
  4. presentation: Mermaid

  The Viewer is not a stage. It builds its data and the status text itself from what the stages wrote.
- **[Makes sense]** A tool's parameters may only come from data produced in its own stage or an earlier one, so a backwards dependency is easy to spot.
- **[Decided]** The ordering is kept in the configuration database, derived from each tool's `--info` (`runner.md`, section 2).
- **[Makes sense]** The exact order is derived, never hand-written. Steps 1, 3, 4 and 5 build the stored ordering when the record of tools changes; steps 2, 6 and 7 select from it for each run:
  1. collect every tool's `--info` from the record of tools
  2. drop tools that don't apply and record them as not applicable, and drop tools omitted by the named Runner configuration, if one is given ([Decided]; `runner.md`), recording them as omitted
  3. connect each tool's parameters to the outputs that produce them
  4. check the graph
  5. order by dependencies, breaking ties by stage then name so every run has the same order
  6. skip tools whose parameters haven't changed
  7. for a tool that reads files, plan one invocation per file ([Decided], `toolset.md`, section 4.2)
- **[Makes sense]** "Applies when" is a description such as "files match a pattern" or "a path exists", not code, stated in `--info`. The Runner and the dry run can evaluate it without running the tool.
- **[Makes sense]** When the Runner is asked for a target, its plan includes missing or outdated upstream tools. A tool run on its own with missing parameters fails with an invocation error instead, and the dry run says which tool to run first. Open as `RN-6`.
- **[Needs refinement]** Is "applies when" enough for every check? Some may need more than file patterns and flags, for example "the examined project's package manifest declares a command-line entry point".
````

## 2026-11-07 03:02:32 — Claude

**Verdict: not yet.** About 85% of what's needed is there. A developer could start today on build-order steps 1–4 (test source, contracts, M1, Runner with M1 only). Past that point they'd have to make up answers to several contract questions, and a few of those answers would quietly settle the P4 evidence (`VIEW-14`) by accident.

## Gaps to close before coding

1. **Nothing says which part of an output file is which data name.** M1's file holds `symbols`, `references` and `diagnostics`, but its `--info` describes `code.symbol` and `code.reference`. No rule links a data name to a JSON key, and `project_outputs` assumes one data name per file. Without that rule, the Runner and the Viewer can only find records with tool-specific code, which is exactly what `VIEW-14` forbids.
2. **Relations don't share one shape.** Links have `from`/`to`. References only have `symbol`, with no source. `VIEW-12` makes the Viewer work out "the scope a reference sits in" by comparing ranges, which is tool knowledge leaking into the Viewer. It also leaves level 3 with almost no real edges: there's no "run calls add". Suggested fix: M1 adds an `enclosing` field (the function symbol, or the file) to every reference, and every relation uses `from`/`to`. Records with `symbol: null` need a rule too (drop or show).
3. **M2 conflicts with a [Decided] row.** `MVP_scope.md` §2 says a cross-file link carries the call's location. `04_tools.md` only links import → declaration, at the import's location. M2 already receives the references, so it could easily also emit links from each use of an imported name.
4. **The dry-run-only pass can't feed M2 and M3.** Nothing is written, so on a fresh database M1's outputs don't exist. `DATA-17` doesn't require the dry run to print the would-be output in a form the Runner can parse, and `RN-11` is still open. TEST-02 and success criterion 5 can't pass as written.
5. **TEST-02 contradicts the Runner's start-up steps.** `RUN-04`/`RUN-05` create the database and rewrite `config_tools` on every start, and `RUN-06` writes `project_files`. TEST-02 requires the database to be byte-identical after a dry-run-only pass.
6. **Stale outputs.** After C1 (M3 moved out), the old `scopes.json` stays on disk, and `--read-cache` returns "every output", so the Viewer still shows three levels. Deleted source files leave ghost M1 outputs the same way. "Every run starts from scratch" (`ARCH-05`) never says what gets cleared.
7. **Tools don't know where to write.** `data/tools/<tool>/` is neither a parameter nor a stated convention relative to the launcher. This also affects the by-hand tests B1–B6 and replays from `last_run.json`.
8. **No way to start the Viewer.** There's no command, port or source-root input, so `/api/run` and `/api/source` have no source root on a fresh start.

## Smaller gaps

- **`range` is ambiguous.** It reads "whole declaration; for a function, its full body". If it means only the body, the parameter `value` falls outside it and lands in the file scope, contradicting the expected table.
- **Call vs read isn't spelled out.** `TOOL-14` should say that only a bare-name callee is a `call`. The expected table already treats `Math` and `console` as reads.
- **The file scope has no `location`.** M3 reads no files, so it can't know where the file ends.
- **Dry-run no-go on an invocation error is unclear.** Does the tool print a no-go JSON line, or only write to standard error and exit 2? The Runner needs to know.
- **Tool options are incomplete.** `TOOL-02` mentions command-line parameter arguments but never defines any. `--help`, `--version` and the common options, all [Decided] in `toolset.md` §4.1, are missing without being marked as an MVP cut.
- **Detecting syntax errors (`TOOL-10`):** I believe `ts.createSourceFile` alone doesn't expose them through the public API; the public route is `program.getSyntacticDiagnostics()`. Worth checking early, because B7 depends on it.
- **Viewer server security.** The startup token and origin check (`security.md` §7) aren't in the requirements. `/api/source` should be limited to files listed in `project_files`, and Cytoscape should be bundled locally rather than loaded from the internet (`security.md` §8).
- **Ctrl + wheel** (between levels) is [Decided] in `viewer.md` §4.9 but cut in `VIEW-20`. Mark it explicitly as an MVP scope cut.
- **M3 departs from `MVP_scope.md`.** It takes only M1's outputs (the scope file proposes M1 and M2). It also drops "together with the symbols it is used with" from the [Decided] example, which relates to `MVP-4`.
- **Live progress:** the mechanism for streaming run events to the page isn't named.

## What holds up

- **The test source and expected result are correct.** I checked every line and column, for example `round@3:17`, and confirmed that `Math.round` and `console.log` are excluded properly.
- **The error model matches `toolset.md` §4.4–4.6:** shape problems are invocation errors (E13, exit 2, nothing written), value problems are run errors (E12), and `last_run.json` follows the [Decided] rules.
- **The order derived from `--info`, the log format, the layout on disk, the time box and the technology choices are sound.**

**Outside `mvp_docs/`:**
- `security.md` §7 says a damaged `last_run.json` makes the tool "fall back to defaults". That contradicts the [Decided] E3 rule in `toolset.md`.
- `MVP-1`, `MVP-3` and `MVP-4` are still open in `MVP_scope.md`, although `mvp_docs/` effectively answers them.

I can write the fixes into `mvp_docs/` as new requirement IDs, and flag the `security.md` line, if you'd like.

## 2026-11-07 03:36:59 — User

create a folder for test_plan and write the initial test app, make sure it runs correctly

### 2026-11-07 03:37:10 — Tool call: Bash

```json
{
  "command": "node --version; npm --version; which tsc npx; npm ls -g --depth=0 2>/dev/null | head",
  "description": "Check Node, npm and TypeScript availability"
}
```

### 2026-11-07 03:37:11 — Tool result

```
v22.23.1
10.9.8
which: no tsc in (/home/zaida/.local/bin:/home/zaida/bin:/usr/local/bin:/usr/bin)
/usr/bin/npx
/usr/local/lib
└── (empty)
```

### 2026-11-07 03:37:21 — Tool call: Bash

```json
{
  "command": "mkdir -p /home/zaida/viewer/mvp_docs/test_plan/test-source/src && cd /home/zaida/viewer/mvp_docs/test_plan/test-source && \ncat > src/math.ts <<'EOF'\nexport const PRECISION = 2;\n\nexport function round(value: number): number {\n  const factor = 10 ** PRECISION;\n  return Math.round(value * factor) / factor;\n}\nEOF\ncat > src/counter.ts <<'EOF'\nimport { round } from \"./math\";\n\nlet total = 0;\n\nexport function add(amount: number): number {\n  total = total + amount;\n  return round(total);\n}\nEOF\ncat > src/main.ts <<'EOF'\nimport { add } from \"./counter\";\nimport { PRECISION } from \"./math\";\n\nfunction run(): void {\n  const first = add(1.234);\n  if (first > 0) {\n    const label = \"precision \" + PRECISION;\n    console.log(label, first);\n  }\n}\n\nrun();\nEOF\ncat > tsconfig.json <<'EOF'\n{\n  \"compilerOptions\": {\n    \"target\": \"ES2020\",\n    \"module\": \"commonjs\",\n    \"strict\": true,\n    \"rootDir\": \"src\",\n    \"outDir\": \"dist\"\n  },\n  \"include\": [\"src\"]\n}\nEOF\ncat > package.json <<'EOF'\n{\n  \"name\": \"zaansouvi-test-source\",\n  \"version\": \"0.1.0\",\n  \"private\": true,\n  \"description\": \"The basic examined source for the ZaAnSouVi MVP (mvp_docs/06_test_plan.md).\",\n  \"scripts\": {\n    \"check\": \"tsc --noEmit\",\n    \"build\": \"tsc\",\n    \"start\": \"tsc && node dist/main.js\"\n  },\n  \"devDependencies\": {\n    \"typescript\": \"5.6.3\"\n  }\n}\nEOF\nnpm install --no-audit --no-fund 2>&1 | tail -3",
  "description": "Write test source files and install TypeScript"
}
```

### 2026-11-07 03:37:22 — Tool result

```
added 1 package in 1s
```

### 2026-11-07 03:37:25 — Tool call: Bash

````json
{
  "command": "npm run check && npm start && echo \"exit=$?\" && diff <(sed -n '/^`src\\/math.ts`/,/^`src\\/counter.ts`/p' ../../06_test_plan.md | sed -n '/^```ts/,/^```$/p' | sed '1d;$d') src/math.ts && echo math-identical",
  "description": "Type-check, build and run the test app"
}
````

### 2026-11-07 03:37:30 — Tool result

```
> zaansouvi-test-source@0.1.0 check
> tsc --noEmit


> zaansouvi-test-source@0.1.0 start
> tsc && node dist/main.js

precision 2 1.23
exit=0
math-identical
```

## 2026-11-07 03:37:32 — Claude

Type-checks in strict mode and runs. Now I'll confirm all three files match the plan character for character, since the expected result depends on the line numbers.

### 2026-11-07 03:37:34 — Tool call: Bash

````json
{
  "command": "for f in math counter main; do awk -v f=\"\\`src/$f.ts\\`\" '$0==f{s=1;next} s&&/^```ts/{c=1;next} c&&/^```$/{exit} c' ../../06_test_plan.md | diff - src/$f.ts >/dev/null && echo \"$f.ts identical\" || echo \"$f.ts DIFFERS\"; done; grep -n . src/*.ts | grep -E 'round|PRECISION|run\\(\\)' | head; echo; ls -la; cat > .gitignore <<'EOF'\nnode_modules/\ndist/\nEOF",
  "description": "Compare each file to the plan and check line numbers"
}
````

### 2026-11-07 03:37:34 — Tool result

```
math.ts identical
counter.ts identical
main.ts identical
src/counter.ts:1:import { round } from "./math";
src/counter.ts:7:  return round(total);
src/math.ts:1:export const PRECISION = 2;
src/math.ts:3:export function round(value: number): number {
src/math.ts:4:  const factor = 10 ** PRECISION;
src/math.ts:5:  return Math.round(value * factor) / factor;
src/main.ts:2:import { PRECISION } from "./math";
src/main.ts:4:function run(): void {
src/main.ts:7:    const label = "precision " + PRECISION;
src/main.ts:12:run();

total 12
drwxr-xr-x. 1 zaida zaida 122 Nov  6 21:37 .
drwxr-xr-x. 1 zaida zaida  22 Nov  6 21:37 ..
drwxr-xr-x. 1 zaida zaida  48 Nov  6 21:37 dist
drwxr-xr-x. 1 zaida zaida  64 Nov  6 21:37 node_modules
-rw-r--r--. 1 zaida zaida 338 Nov  6 21:37 package.json
-rw-r--r--. 1 zaida zaida 725 Nov  6 21:37 package-lock.json
drwxr-xr-x. 1 zaida zaida  48 Nov  6 21:37 src
-rw-r--r--. 1 zaida zaida 166 Nov  6 21:37 tsconfig.json
```

## 2026-11-07 03:37:37 — Claude

Everything matches. Last, a short README for the folder:

### 2026-11-07 03:37:43 — Tool call: Write

````json
{
  "file_path": "/home/zaida/viewer/mvp_docs/test_plan/README.md",
  "content": "# Test plan material\n\nFiles that `06_test_plan.md` describes. That file stays the reference: if anything here differs from it, this folder is corrected.\n\n## `test-source/`: the basic examined source\n\nThe three files under `test-source/src/` are copied character for character from `06_test_plan.md`. **Line and column numbers matter**, because the expected result refers to them, so don't reformat these files or add lines to them.\n\nEverything else in `test-source/` exists only so the app can be type-checked and run:\n\n| File | Purpose |\n|---|---|\n| `package.json` | Scripts, and TypeScript pinned as the only dev dependency |\n| `tsconfig.json` | Strict mode, CommonJS output (so `\"./math\"` works without a file extension), `src/` compiled to `dist/` |\n\nRun it:\n\n```\ncd test-source\nnpm install\nnpm run check   # type-check only\nnpm start       # compile and run\n```\n\nExpected output:\n\n```\nprecision 2 1.23\n```\n\n`add(1.234)` sets `total` to 1.234, and `round` keeps two decimals (`PRECISION`).\n\n## Notes for the Runner\n\n- Use `test-source` as the source root. The file IDs are then `src/math.ts`, `src/counter.ts` and `src/main.ts`, as in the expected result.\n- `node_modules/` holds TypeScript's own `.d.ts` files. The Runner skips it (`RUN-06`).\n- `dist/` holds only `.js` files, since declarations are not emitted, so a `*.ts` file list never picks it up.\n\n## Still to add\n\n- `expected/`: the expected result as tables a script can compare (`TEST-01`)\n- the broken inputs B1 to B10, and the extra checks C1 and C2\n"
}
````

### 2026-11-07 03:37:43 — Tool result

```
File created successfully at: /home/zaida/viewer/mvp_docs/test_plan/README.md (file state is current in your context — no need to Read it back)
```

## 2026-11-07 03:37:49 — Claude

I created the test app in `mvp_docs/test_plan/test-source/`. It type-checks in strict mode and prints the expected result when run:

```
$ npm start
precision 2 1.23
```

That value is right: `add(1.234)` sets `total` to 1.234, and `round` keeps two decimals.

**What's in the folder**
- **`test-source/src/`**: `math.ts`, `counter.ts` and `main.ts`. I compared each file against the code blocks in `06_test_plan.md` with a script, and all three match character for character, so the line numbers in the expected result still hold (for example `round` on math.ts line 3, `run();` on main.ts line 12).
- **`package.json`**: TypeScript 5.6.3 is the only dependency, with three scripts: `check` (type-check only), `build` and `start` (compile, then run).
- **`tsconfig.json`**: compiles to CommonJS. I chose that because `import ... from "./math"` with no file extension only works that way without changing the test files.
- **`.gitignore`**: excludes `node_modules/` and `dist/`.
- **`test_plan/README.md`**: how to run the app and the expected output. It also notes that the Runner should use `test-source` as the source root, so the file IDs come out as `src/math.ts` and so on.

**Where to run it from:** the run setup files sit beside `src/`, not inside it, so the files the tools examine stay exactly as the plan defines them. If the Runner's source root is `test-source`, its `*.ts` file list won't pick up anything extra. It skips `node_modules/` (`RUN-06`), and `dist/` only ever holds `.js` files.

**Not done yet:** the `expected/` tables for the comparison script (`TEST-01`) and the broken inputs B1–B10 and extra checks C1–C2. I can do those next.

## 2026-11-07 03:38:50 — User

read test_plan and infer what you can from teh open questions, show what is missing

### 2026-11-07 03:38:56 — Tool call: Bash

```json
{
  "command": "cd /home/zaida/viewer && sed -n '/^## 12. Open questions/,/^## 13/p' runner.md; sed -n '/^## 10. Open questions/,/^## 11/p' toolset.md; sed -n '/^## 7. Open questions/,/^## 8/p' viewer.md; sed -n '/^## 9. Open questions/,$p' data_topology.md; sed -n '/^## 11. Open questions/,$p' security.md; sed -n '/^## 11. Open questions/,/^## 12/p' project_organization.md",
  "description": "Read open questions from all working files"
}
```

### 2026-11-07 03:38:56 — Tool result

```
## 12. Open questions

Questions moved here from other files keep a note of their old ID, which is struck through where it was.

- `RN-1` **Listing contents** *(was `TS-17`)*: besides last run, failures and errors, and files processed, what else does the configuration listing include? For example duration, tool versions, which tools were skipped as unchanged, and whether the last run was a dry run. Is only the last run kept per configuration, or a short history?
- `RN-2` **Run logs** *(was `TS-18`; dry-run part possibly answered: a dry run writes nothing, section 9)*: does a dry run write a log too, and if so where, given that a dry run never changes work data? How long are logs kept: all of them, the last few per configuration, or until the user clears them? Does the log record why each tool was skipped (unchanged inputs, not applicable, omitted)?
- `RN-3` **Snapshot when a later tool fails** *(was `TS-19`; partly answered: staging exists and uses temporary files, section 8)*: a tool that fails writes nothing partial, but tools earlier in the same run may already have written their new current data. The outputs on disk would then mix new and old states, which goes against the one-snapshot rule. Options: tools write to a staging area and the Runner makes the whole run current in one step only when every tool succeeds (where the staging area would sit: `project_organization.md`, section 8); or the mix is allowed and recorded, so the Viewer and the status page can mark the outputs that are older than the rest.
- `RN-4` ~~**Omitting a tool others depend on**~~: resolved. Disabling a tool also disables the tools that depend on its output, and enabling one enables the tools it needs; the Viewer keeps the configuration valid (`viewer.md`, section 4.11). A named configuration written by hand is still checked by the Runner before a run (section 3).
- `RN-5` **Naming saved configurations** *(was `VW-34`)*: how are the named Runner configuration files named when saved from the Viewer? Can there be several, for example a quick one and a full one, and can the Viewer overwrite one that was written by hand?
- `RN-6` **Missing or outdated inputs** *(was a "To define" in `toolset.md`, section 5.1)*: when a tool's input is missing or older than the source, does the Runner run the tool that produces it first, or fail early? Proposed in `data_topology.md`, section 8: a run aimed at a target includes the missing upstream tools, while a tool run on its own fails early.
- `RN-7` **Data from omitted tools:** if an omitted tool's earlier output is still in the store, may included tools read it, or does omitting a tool also mean its data counts as missing?
- `RN-8` **Configuration in the Runner's data:** other tools keep their config in config files with a precedence order (`toolset.md`, section 4.1), but the Runner's configuration is a named file in its data. Is the Runner the exception, does it also have an ordinary config file, and where does a named configuration sit in the precedence order? Related: `TS-16`, `ORG-3`.
- `RN-9` **The Runner and the tool conventions** *(note: the Runner has at least one option of its own, `--human`, section 10.1)*: does the Runner follow the common tool conventions, such as the common options, a dry-run option, `--info` and `--log`, even though it is not an analysis tool?
- `RN-10` **Cancelled runs:** the Viewer can cancel a run (`viewer.md`, section 3.3). What does a cancelled run leave in the stores, and how is it recorded in the log and the listing?
- `RN-11` **Passing dry-run data between tools** *(partly answered: the Runner can hand data to a tool in its JSON parameters, on standard input with `--stdin`, `toolset.md`, section 4.5)*: in a dry run of the whole process, a later tool needs the data an earlier tool only printed. Does the Runner hand it over on the later tool's standard input, does each tool's dry run read only the saved stores (so the chain previews each step against the last real run), or something else?
- `RN-12` **What to load into the database** *(partly answered: the Runner decides per value, based on what it represents, `TS-28`; section 5)*: how does `--info` state what each output value represents, so the Runner can decide whether it goes in the database and into which part, without built-in knowledge of each tool? What happens to a tool's part of the database when the tool is omitted or no longer applies?
- `RN-13` **File list: Runner or tool** *(leaning: a tool reads one file per invocation, so listing all files fits the Runner, which isn't a tool; `toolset.md`, section 4.2)*: the run process has the Runner read all files and update the file list itself. Does the file inventory tool (`toolset.md`, section 6.2) become part of the Runner, or is it a tool the Runner always runs first? If it becomes part of the Runner, the Runner writes facts about the examined code, and the run order no longer has a "discovery" stage of tools (`data_topology.md`, section 8).
- `RN-14` ~~**How the JSON parameters reach the tool**~~: resolved. With `--stdin` (JSON from the calling app) or `--json <path>` (a JSON file in temp or at a specific path), both in the same format. Command-line arguments are read first. Someone running a tool by hand uses the same options, or relies on `last_run.json` (`toolset.md`, section 4.5). Precedence against config files remains open as `TS-22`.
- `RN-15` **Repeated runs of a tool** *(partly answered: the dry run before the real run checks that the JSON is correct, section 1.1)*: which kinds are allowed (describing the tool, preparatory runs to gather information or work out parameters, dry run, real run), in what order, and is there a limit? Doing a dry run before every real run roughly doubles the work on large codebases (`TS-13`): may the Runner skip it when nothing relevant changed? Do preparatory runs need a mode of their own, since they are neither dry nor real runs?
- `RN-16` **Database updated per tool:** the database is updated after each tool, so if a later tool fails, the database already holds the new facts of earlier tools. Does staging (`RN-3`) also cover the database, so the whole run's database changes become current together, or are per-tool updates accepted and recorded?
- `RN-17` **Viewer-specific parameters of the Runner** *(partly answered: dry-run only and read cache, or similar; section 10)*: what is the full list, and how are they kept from changing what a real run does, so all invocations stay equal?
- `RN-18` **Human format settings** *(mostly answered: global configuration, in the configuration database, section 10.1)*: which defaults apply before anything is configured (for example `dd/mm/yyyy` and the system time zone)? Besides dates, does the format cover durations, sizes or paths? Does the Viewer UI use the same settings?
- `RN-19` **Tool installation** *(deferred: the specifics are to be defined later; decided so far: the record of tools may be kept in the configuration database, only the Runner installs, and the Viewer may upload a file the Runner reads for installation; installation and removal are out of the MVP's scope; section 1.0)*: what does installing a tool involve, what is the uploaded file, where does it sit until the Runner reads it, and how does the Runner learn that a tool was added, removed or updated?

## 13. Deferred to the final technology section
## 10. Open questions

- `TS-1` **Missing tools** *(partly answered: the project overview steps in section 6.8; one tool per type of runtime data, such as SQLite details or file type checks, section 6.7)*: are there more tools not yet listed? Candidates: a database schema step, or one per kind of infrastructure source.
- `TS-2` **Code quotes:** which step extracts the code quotes? Each tool for its own records, the shared library, or a separate step?
- `TS-3` **Links:** where are source links built? In the Viewer and the Mermaid generator when they display them, or by one step that writes them out for both?
- `TS-4` **Infrastructure as one step or several:** one step for all infrastructure sources, or one per kind of source (deployment files, cloud definitions, container definitions)?
- `TS-5` **Runtime data** *(partly answered: each type of runtime data falls to its own tool, for example SQLite row counts read from a SQLite file in the project, section 6.7)*: is reading from a running database or service, rather than from files in the project, in scope? Same question as `VW-18`.
- `TS-6` **Which levels need which tools** *(partly answered: levels 1 and 2 need the project overview steps, section 6.8)*: the rest of the Viewer's level hierarchy (`VW-19`) decides which further tools must exist.
- `TS-7` ~~**Dry run in the Viewer**~~: resolved. The Viewer can start a dry run and shows its result (see `viewer.md`, section 3.2).
- `TS-8` ~~**Standard output or temporary files**~~: resolved. A dry run prints everything to standard output and uses no temporary files (section 4.3).
- `TS-9` ~~**Implementation stack**~~: resolved. The Runner and the Viewer are TypeScript and form a unit. Tools may run on any stack; the Runner only needs how to invoke each tool, from the record of tools (`runner.md`, section 1.0). For the MVP, tools are TypeScript (`MVP_scope.md`).
- `TS-10` **Infrastructure sources:** which kinds of infrastructure definitions are in scope, for example deployment files, container definitions, cloud definitions written in TypeScript, or other configuration-language files?
- `TS-11` **TypeScript scope:** is mixed JavaScript in scope? Which frameworks need special handling, for example decorators, dependency injection or UI components? Which monorepo setups must be supported?
- `TS-12` **Paths across platforms:** how are paths handled on Windows and POSIX systems, including case sensitivity and symbolic links? This affects stable IDs and links.
- `TS-13` **Performance targets:** what size of codebase must ZaAnSouVi handle (files, lines of code), and what run times are acceptable for a first run and an incremental run?
- `TS-14` **Existing tools:** which existing tools already cover parts of this, and what is built new versus reused?
- `TS-15` **Planning** *(partly answered: the MVP scope is in `MVP_scope.md`)*: what is the first version (MVP), how is the work phased, and what are the risks and success criteria?
- `TS-16` **Where global settings sit:** confirm the proposed precedence order with global settings (section 4.1). Same question as `VW-26`.
- `TS-17` ~~**Runner listing contents**~~: moved to `RN-1` (`runner.md`).
- `TS-18` ~~**Run logs**~~: moved to `RN-2` (`runner.md`).
- `TS-19` ~~**Snapshot when a later tool fails**~~: moved to `RN-3` (`runner.md`).
- `TS-20` ~~**`--log` with a dry run and other output**~~: resolved. A dry run never writes a record to the file system or the database, and prints all its data to standard output for the Runner (section 4.3).
- `TS-21` ~~**What tools read from the database**~~: resolved. The Runner reads and writes the database to build each tool's JSON parameters, according to what the tool states with `--info`. Each invocation must make sure it can create the required JSON, and a JSON may carry extra, unused values (section 4.5). Follow-up: `TS-28`.
- `TS-22` **Precedence of JSON input and `last_run.json`** *(partly answered: both `--json` and `--stdin` together is an error; tools have no defaults of their own; section 4.5)*: where do the JSON input and `last_run.json` sit relative to the tool's config file, the project-wide config, global settings and built-in defaults (4.1, `TS-16`)? Does the Runner build the JSON from the config files, so config reaches a tool only through the JSON?
- `TS-23` ~~**`last_run.json` after a failed run**~~: resolved. A failed run updates `last_run.json` too, so running again with no changed data fails again (section 4.5).
- `TS-24` ~~**The role of `--log`**~~: resolved. `--log` is optional and redirects the log to another program or file; every tool always writes its own log (section 4.5).
- `TS-25` **`last_run.json` and isolation between codebases** *(more pressing: analysis details must never be shared between analyses, 5.2)*: `last_run.json` lives next to the tool's program, so there is one per tool, not one per codebase. Running a tool with no input for codebase B would then repeat its last run on codebase A, which goes against isolation between codebases (5.4). Options: one `last_run.json` per codebase inside the tool's folder (for example named by the codebase identity key); or the file records which codebase it belongs to, and a tool started for another codebase ignores it and uses defaults; or a separate copy of the tools per codebase.
- `TS-26` ~~**Missing defaults: invocation error or run failure?**~~: resolved. A tool that can't begin work, including one with no usable `last_run.json` and no sane defaults, doesn't log and writes nothing (sections 4.5 and 4.6).
- `TS-27` ~~**Inadequate parameters versus inadequate data**~~: resolved. Only the tool's internal check of the parameters it reads is an invocation error (E13, nothing logged). Once the parameters are read correctly, any error is a run error and is logged (sections 4.5 and 4.6).
- `TS-28` ~~**Work data for later tools**~~: resolved. The Runner reads each tool's output and decides, per value, whether it belongs in the database based on what it represents. On each tool call it works out and builds the correct JSON from the database and the outputs it has read (`runner.md`, section 5). How large the JSON may become on big codebases is part of `TS-31`.
- `TS-29` **Who reads config files:** tools read only their JSON input, `last_run.json` and their internal state (4.2), so they no longer read their own config file, the project-wide config or global settings. Does the Runner read all of them and put the effective values into each tool's JSON? If so, the precedence order in 4.1 is applied by the Runner, and "the format each tool declares for its config" (in which the Viewer writes tool config) becomes the parameters the tool states with `--info`.
- `TS-30` **Command-line arguments with no JSON:** a tool invoked with no parameters repeats exactly its last run. If it is invoked with some command-line arguments but no JSON input, does it take `last_run.json` and override those values, or does it need a JSON input?
- `TS-31` **One file per invocation at scale, and JSON size:** a tool reads one file per invocation, so a codebase with thousands of files means thousands of tool processes per file-reading tool, each with its own JSON, dry run and log. And a tool like M2 that needs every file's results gets one very large JSON. Are both acceptable (`TS-13`), or may the Runner keep a tool process running and feed it one file after another, as long as each invocation still reads one file?
- `TS-32` **"All analysis details" in the codebase database:** the codebase database holds "the file list and all analysis details" (5.2), but it was also decided that tool-specific work data never goes in the database, and that the Runner decides per value what goes there. Does "all analysis details" replace the work-data rule, so the Runner may put everything into the codebase database, or does it mean every detail the Runner judges to belong there?
- `TS-33` **The configuration database** *(partly answered: shared by the Runner and the Viewer's backend, which may edit it directly; 5.2)*: which settings does it hold: only the Runner's output preferences, or all personal global settings (4.1), replacing a settings file? Where does it sit in the precedence order (`TS-16`)?
- `TS-34` **Changing global settings from the command line** *(pending; not in the MVP's scope)*: how is the process defined for changing ZaAnSouVi's global settings, in the configuration database, from the command line? For example a Runner parameter, a separate small program, or none (Viewer only). It must keep the Runner and the Viewer in sync, respect the structure version, and show what will change, like the Viewer's confirmation dialog.
- `TS-35` **Shared library for tools on any stack:** tools may run on any stack, but 5.5 decided a common library used by every tool. Is the shared part only the language-neutral contract (formats for parameters, `--info`, logs, `last_run.json`, outputs), with an optional TypeScript library implementing it? How is a tool on another stack checked against the contract?

## 11. Deferred to the final technology section
## 7. Open questions

- `VW-1` ~~**Stale or partial**~~: resolved. Partly malformed output becomes a pending version, marked visually, and the user decides whether to save it (section 5).
- `VW-2` **How much to skip:** is skipping single malformed records acceptable, or does one malformed record make the whole file untrusted?
- `VW-3` ~~**Other tools' config**~~: resolved. The config manager edits the configuration of the entire toolset, globally or per project, with manual save and confirmation (4.11, 4.13).
- `VW-4` **Unresolved edges:** shown as marked placeholder nodes by default, or hidden with only a count?
- `VW-5` ~~**Fixing from the Viewer**~~: resolved. Yes: the UI shows what failed and offers options to fix it, and running a tool again is as simple as invoking it from the UI (4.14).
- `VW-6` **Codebases per server:** one server for all stored codebases with a switcher in the UI, or one server per codebase?
- `VW-7` ~~**Watching for changes**~~: resolved. No watching. The user always starts runs or refreshes manually (section 3.2).
- `VW-8` **Source access:** may the server serve source text beyond the recorded quotes, for example the whole file around a reference?
- `VW-9` **Static export:** is a read-only export of a view that works without the server needed, for sharing with someone who didn't run the tools?
- `VW-10` **Combined views:** are views that combine several tool outputs in scope from the start, or only one view per output at first?
- `VW-11` **Comparing two states:** is it in scope to compare two states of the same codebase, for example before and after a change?
- `VW-12` ~~**Decide per run or per view**~~: resolved. One decision per run (section 5).
- `VW-13` ~~**Several pending versions**~~: resolved. A newer run replaces a pending version that is still waiting (section 5).
- `VW-14` **Showing the difference:** when asking, should the Viewer highlight what differs between the pending version and the previous complete one, not only what is malformed?
- `VW-15` **Color assignment:** which grouping level gets identity colors by default (file, module, package), and can the user pin a color to a specific object?
- `VW-16` **Style catalog customization:** can users change the shared icons, colors and line styles, for example in the Viewer config, as long as the same concept stays consistent across views?
- `VW-17` **Arranging and saved positions:** when the user runs automatic arranging, does it override manual positions, or only place nodes that were never moved by hand?
- `VW-18` **Row counts and other runtime data** *(partly answered: each type of runtime data falls to its own tool, for example SQLite row counts read from a SQLite file in the project; `toolset.md`, section 6.7)*: is reading from a running database or service, rather than from files in the project, in scope? If it is, it is a separate optional tool with its own concerns (`security.md`, section 10). Same question as `TS-5`.
- `VW-19` **The full level hierarchy** *(partly answered: levels 1 and 2 are defined in 4.9.1)*: which levels exist below level 2, and in what order? Where do the infrastructure, module and symbol views fit? Which lower views does each kind of node open into?
- `VW-20` **Several lower views:** a node may have more than one useful lower view. For example, a server could open into its modules, its routes or its env vars. Which one does zooming in open, and can the user pick another from the drawer?
- `VW-21` **Switching views at the same level:** besides moving up and down, can the user switch sideways between views of the same object, for example from a module's variables view to its calls view?
- `VW-22` **Ctrl + wheel conflicts:** in browsers, Ctrl + wheel normally zooms the whole page, and pinch-to-zoom on a trackpad usually reaches the page the same way as Ctrl + wheel. Should the Viewer take over Ctrl + wheel inside the graph area? How should trackpad users zoom inside a view without changing level by accident? Is there a keyboard alternative for moving between levels?
- `VW-23` **Status bar contents:** is the proposed content of the status bar right (4.8), and where are runs and dry runs started from: the status bar, the header, or the drawer?
- `VW-24` **Status page structure:** how is the text overview organized? For example, by level (infrastructure, modules, symbols), by tool, or by file. Is it one long page or split into sections?
- `VW-25` ~~**Manual save everywhere**~~: resolved. Only changes to how the tools operate and to saved run data are saved manually; UI state such as the current view and node positions is saved automatically (4.13).
- `VW-26` **Order of global and per-project settings:** when a setting is set both globally and per project, the per-project value presumably wins. Where do global settings sit in the full precedence order (`toolset.md`, section 4.1)? Same question as `TS-16`.
- `VW-27` **Naming:** "Viewer" names both the whole UI and the graph page. Should the graph page get its own name, for example "Graph"?
- `VW-28` **Run configurations** *(related: the Runner configurations of ZaAnSouVi now have their own view, 4.14)*: in level 1, does "run configurations" mean how the examined project is run (for example its scripts and launch settings), how ZaAnSouVi was run on it, or both?
- `VW-29` **AI-enabled:** what makes a project count as "AI-enabled"? For example, configuration or instruction files for AI coding assistants, or the use of AI libraries in the code. Should the overview list which assistants or libraries it found?
- `VW-30` **Versions:** which versions does level 1 show? For example, the project's own version, the TypeScript and runtime versions it targets, and the versions of its main dependencies.
- `VW-31` **Several packages:** in a monorepo, does level 1 show one overview for the whole repository, with each package as a node, or one overview per package? Does each package have its own known outputs in level 2?
- `VW-32` **Level 2 as one view or several:** are the configuration details, the directory structure and the known outputs one combined view, or separate views of the same level?
- `VW-33` ~~**Omitting a tool others depend on**~~: moved to `RN-4` (`runner.md`).
- `VW-34` ~~**Naming saved Runner orders**~~: moved to `RN-5` (`runner.md`).
- `VW-35` **Where the run configurations view lives:** is it part of the config manager page, or a fourth page in the header (4.10)?
- `VW-36` ~~**Direct reads or through the Runner**~~: resolved. The configuration database is read directly; the codebase database goes through the Runner (3.1). Tool stores are proposed to go through the Runner too. For the MVP this detail may be omitted (`MVP_scope.md`).
- `VW-37` ~~**Enabling a tool with disabled inputs**~~: resolved. Enabling a tool also enables the tools that produce its inputs; the Viewer keeps the configuration always valid, and won't save one with no tool enabled (4.11).

## 8. Later step: security
## 9. Open questions

- `DT-1` ~~**Which option, or which combination**~~: resolved. Option D: each tool describes itself with `--info`, stating its own parameters and outputs. No manifest (see "Chosen: option D, no manifest").
- `DT-2` **Shared names:** is there a shared list of data names, and is it a full dictionary (A or B) or a plain list of names?
- `DT-3` **Containment** *(leaning: declared by the child with `containedIn` in `--info`, plus parent IDs in the data; sections 5 and 7)*: declared, read from the data, or both? May a parent also list the children it expects?
- `DT-4` **Granularity:** how fine-grained is a data name (section 3)?
- `DT-5` **Subsets:** how does a category say it's a subset of another, such as TypeScript files out of all files (section 5)?
- `DT-6` **Several parents:** can a category sit under several parents (section 5)?
- `DT-7` **Kind inheritance:** worth having from the start (section 2)?
- `DT-8` **Internal state:** the three questions in section 4.
## 11. Open questions

- `SEC-1` ~~**Redaction**~~: resolved. No redaction; the user may see every part of the examined source (section 2).
- `SEC-2` **Paths outside the project:** should following symbolic links outside the examined project be allowed at all, even with a setting?
- `SEC-3` **Limits:** which limits (file size, file count, nesting) are on by default, and can the user change them?
- `SEC-4` **Sharing:** if a static export for sharing is added (`VW-9`), what does it leave out by default?
- `SEC-5` **Runtime connections:** if runtime data becomes in scope, which environments may it connect to, and how does the user confirm it?
## 11. Open questions

- `ORG-1` **Single root:** adopt the single-root organization in this file?
- `ORG-2` **Where tool results live:** in each tool's work space (`tools/<tool>/result.*`), as the user's wording "on its own store" suggests, or in `shared/results/<tool>.*`, so tool work spaces stay fully private?
- `ORG-3` **Runner configurations:** in `runner/configs/`, as decided ("in the Runner's data"), or in `config/runner/`, with every config in one place? Related to `RN-8`.
- `ORG-4` **Config committed in the examined project:** may tools read a project-wide config committed in the examined repository, with lower precedence than `config/project.*`, as long as they never write it?
- `ORG-5` **Finding the root:** program location by default with `--root` to override, or another way, such as an environment variable?
- `ORG-6` **Several users:** is one root per user enough, or must several users share one install?

## 12. Deferred to the final technology section
Shell cwd was reset to /home/zaida/viewer/mvp_docs
```

## 2026-11-07 03:39:33 — Claude

I'll pull exact positions and hashes from the test source with the TypeScript parser, so the inferences below rest on real values rather than guesses.

### 2026-11-07 03:39:39 — Tool call: Bash

```json
{
  "command": "cd /home/zaida/viewer/mvp_docs/test_plan/test-source && cat > /tmp/claude-1000/-home-zaida-viewer-mvp-docs/fb4dbeae-b7f9-4910-94ee-f53420a09bf5/scratchpad/ids.js <<'EOF'\nconst ts = require(process.cwd() + \"/node_modules/typescript\");\nconst fs = require(\"fs\");\nfor (const f of [\"src/counter.ts\", \"src/main.ts\", \"src/math.ts\"]) {\n  const sf = ts.createSourceFile(f, fs.readFileSync(f, \"utf8\"), ts.ScriptTarget.ES2020, true);\n  const out = [];\n  const pos = (n) => { const p = sf.getLineAndCharacterOfPosition(n); return `${p.line + 1}:${p.character + 1}`; };\n  const visit = (n) => {\n    if (ts.isIdentifier(n)) out.push(`${n.text}@${pos(n.getStart())}`);\n    if (ts.isFunctionDeclaration(n)) out.push(`  [fn ${n.name.text} range ${pos(n.getStart())}-${pos(n.end)}, body ${pos(n.body.getStart())}]`);\n    ts.forEachChild(n, visit);\n  };\n  visit(sf);\n  console.log(f, \"| end\", pos(sf.end), \"| parseDiagnostics in public d.ts:\", /parseDiagnostics/.test(fs.readFileSync(process.cwd()+\"/node_modules/typescript/lib/typescript.d.ts\",\"utf8\")));\n  console.log(\"  \" + out.join(\"  \"));\n}\nEOF\nnode /tmp/claude-1000/-home-zaida-viewer-mvp-docs/fb4dbeae-b7f9-4910-94ee-f53420a09bf5/scratchpad/ids.js; sha256sum src/*.ts",
  "description": "List identifier positions and file hashes"
}
```

### 2026-11-07 03:39:40 — Tool result

```
src/counter.ts | end 9:1 | parseDiagnostics in public d.ts: false
  round@1:10  total@3:5    [fn add range 5:1-8:2, body 5:45]  add@5:17  amount@5:21  total@6:3  total@6:11  amount@6:19  round@7:10  total@7:16
src/main.ts | end 13:1 | parseDiagnostics in public d.ts: false
  add@1:10  PRECISION@2:10    [fn run range 4:1-10:2, body 4:22]  run@4:10  first@5:9  add@5:17  first@6:7  label@7:11  PRECISION@7:34  console@8:5  log@8:13  label@8:17  first@8:24  run@12:1
src/math.ts | end 7:1 | parseDiagnostics in public d.ts: false
  PRECISION@1:14    [fn round range 3:1-6:2, body 3:46]  round@3:17  value@3:23  factor@4:9  PRECISION@4:24  Math@5:10  round@5:15  value@5:21  factor@5:29  factor@5:39
9e4bb3799e5b0aa0d5acee58945d5f1ae64f88bdd85cccdc936a735fc5d2ed93  src/counter.ts
3772c01070989943ac3658813da8f84734e5508e6add37a1558c2ffd87c212f8  src/main.ts
655e180f13e3261229972b563332fcccef73d0fd24fecc0012db3d465c5b8e28  src/math.ts
```

## 2026-11-07 03:40:09 — Claude

I read `06_test_plan.md`, the `test_plan/` folder and every open question in the working files, then filled in what the test plan can now state, using real values from the TypeScript parser.

## 1. Values inferred from the test source

**Symbol IDs (`DATA-02`)**, which the expected tables don't give yet:

| File | IDs |
|---|---|
| `src/math.ts` | `PRECISION@1:14`, `round@3:17`, `value@3:23`, `factor@4:9` |
| `src/counter.ts` | `round@1:10` (import), `total@3:5`, `add@5:17`, `amount@5:21` |
| `src/main.ts` | `add@1:10`, `PRECISION@2:10` (imports), `run@4:10`, `first@5:9`, `label@7:11` |

Each one is written in full as `<file>#<name>@<line>:<column>`, for example `src/math.ts#round@3:17`.

**Function ranges.** `round` spans 3:1–6:2, `add` 5:1–8:2 and `run` 4:1–10:2. Each starts at `export` or `function`; the bodies start later (3:46, 5:45, 4:22). This settles the ambiguity in `range`:
- It has to mean the **whole declaration**. If it meant only the body, parameters like `value` (3:23) would fall outside it and land in the file scope, contradicting the expected table.
- Because the whole declaration contains the function's own name (3:17), the self-exclusion rule in `TOOL-31` is required.

**Scope IDs (`DATA-03`):** `src/math.ts#scope@3:1`, `src/counter.ts#scope@5:1`, `src/main.ts#scope@4:1`, plus `#scope@file` for each file. The file ends are at 7:1, 9:1 and 13:1 (the trailing newline). M3 can't know these because it reads no files, so the file scope's `location` stays undefined (an earlier gap).

**Property names to exclude:** `round@5:15` in math.ts and `log@8:13` in main.ts. The parser does see them as identifiers, so M1 has to skip them on purpose.

**Declaration references.** `TEST-01` compares all references, but the plan's reference table leaves declarations out. There are 13, one at each symbol ID above.

**`project_files` hashes** (SHA-256, LF line endings):

| File | SHA-256 |
|---|---|
| `src/counter.ts` | `9e4bb379…` |
| `src/main.ts` | `3772c010…` |
| `src/math.ts` | `655e180f…` |

CRLF checkouts would change these.

**Order of invocations.** By `ARCH-04` plus tie-breaking by name, the order is file-symbols, then cross-file-links, then symbol-scope. The plan never says which order M1 takes the files in; sorted by file ID would be counter, main, math. A full run is then 5 dry runs and 5 real runs, so 10 events.

**Confirmed risk:** `parseDiagnostics` is not in TypeScript's public `.d.ts`. Detecting syntax errors for B7 needs `program.getSyntacticDiagnostics()`.

## 2. Open questions that bear on testing

| Question | What the test plan can infer | Still missing |
|---|---|---|
| `MVP-1` (test source) | Settled in practice: the source exists and runs. The developer writes it (`DEL-04`) | Who signs off the expected result |
| `MVP-3` (deduplication) | The test encodes it: one symbol per declaration, every occurrence a reference, joined across files only by M2 | Nothing |
| `MVP-4` (scope) | The test encodes lexical scope at one level only | No expected result for "the symbols it is used with", which is in the [Decided] M3 example |
| `MVP-8` (criteria, time target) | No run-time target; timings are recorded only (`DEL-07` §5) | A table mapping criteria to tests (below) and a way to measure the timings |
| `RN-11` (dry-run chaining) | `toolset.md` §4.3 [Decided] lists "a missing output from an earlier tool" as a status-check warning. On a fresh data folder, M1's 3 dry runs say go and **M2's says no-go**, which is the correct result. TEST-02 must run **after** TEST-01 | A test for the fresh-state dry run |
| `RN-3` / `RN-16` (no staging) | Accepted for the MVP: earlier outputs stay when a later step fails | B7's expected state afterwards, which depends on file order. A file named `broken.ts` sorts first, so M1 fails before writing anything |
| `RN-7` (data from omitted tools) | Least effort: an omitted tool's data counts as missing. This decides C1 | A rule that `--read-cache` returns only outputs of tools in the current record |
| `RN-10` (cancel) | The MVP has no cancel button, so it's out of scope | Say so in the plan |
| `TS-30` (arguments without JSON) | The MVP tools have no per-parameter arguments, so the case can't arise | A test for an unknown option giving E1 (B11) |
| `TS-25` (shared `last_run.json`) | Harmless: the Runner always sends JSON, so B1–B6 don't affect later runs | Nothing |
| `TS-31` (scale) | Record the time of one M1 invocation, a full run and a dry run | The method: how many repeats, warm or cold |
| `TS-12` (paths across platforms) | Tested on Linux only, with `/` in file IDs | Note Windows as untested |
| `VW-4` (unresolved edges) | Least effort: hide them and show a count | A human-review question for B9 (how the unresolved import appears) |
| `VW-2`, `SEC-3` (malformed output, limits) | Out of the MVP | Say so in the plan |

## 3. What the test plan is missing

1. **`expected/` in a form a script can compare**, with full IDs, scope ranges and the membership table. Section 1 has everything needed.
2. **Inputs for the broken-input tests.** There's no B1–B6 JSON, no B8 fixture, no exact B7 or B9 edit, and no rule that tests work on a **copy** of `test-source` (B7, B9 and C2 modify it).
3. **Expected end state for B7, B9, C1 and C2**: data folder, database rows and Runner events. For C2, the IDs would be `src/math.ts#roundTo@3:17` and `src/counter.ts#roundTo@1:10`. The columns don't change because `round` is the last word before the parentheses.
4. **Untested error paths** from `03_runner.md` and `04_tools.md`:
   - unknown database version
   - a tool's `--info` failing
   - a tool crashing without writing a result
   - M3 `E12` (`TOOL-32`)
   - M2 `E12` for duplicate M1 outputs
5. **A repeatability check (`DATA-04`):** run twice and diff the outputs, ignoring times.
6. **Checks on the Runner and the Viewer:**
   - the content of `--read-cache` (`RUN-13`)
   - `/api/source` returning the right lines and refusing paths outside the source
   - `/api/log` refusing paths outside the data folder
   - a second run request being refused (`VIEW-05`)
   - text rendering (`VIEW-40`): main.ts line 6, `if (first > 0)`, already contains `>`, so it's a free check
7. **A table mapping success criteria to tests:** criterion 1 is TEST-01, 2 is TEST-01, 3 is the human review, 4 is B7, 5 is TEST-02 (after a real run), 6 is C1. Criterion 4 says "a missing file", but B6 is by hand only; B7 is the Runner-level case.
8. **File-edge counts.** The plan says "sensible counts". As specified, each is 1. If M2 gains use-site links (the earlier conflict with the [Decided] M2 example), counter → math becomes 2 and the Links table changes, so the expected result depends on that decision.
9. **The human review:** who reviews, what counts as a pass (is "partly" enough for P3?), and where the answers are recorded.
10. **How to run the tests:** Node version (22.23.1 here), a clean state before tests (delete `data/`), and how B1–B6 find the tool's store, which is still undefined.

I can write items 1, 2 and 7 into `test_plan/` now. The rest depends on choices only you can make: M2 use-site links, `RN-7`, the file order, and the human-review pass rule.

## 2026-11-07 03:41:36 — User

create file 99_findings and write all useful details of above

### 2026-11-07 03:42:30 — Tool call: Write

```json
{
  "file_path": "/home/zaida/viewer/mvp_docs/99_findings.md",
  "content": "# 99. Findings\n\nA review of whether this folder is enough to build the MVP, checked against the working files in the parent folder. Written on 2026-11-06, before any MVP code exists. Each finding has an ID (`FND-nn`) so it can be referred to when it is fixed. When one is fixed, strike it through and say where the fix is recorded.\n\n**Verdict:** not yet. About 85% is there. Build-order steps 1 to 4 (`README.md`) can start as written: test source, contracts, M1, the Runner with M1 only. Past that point, the developer would have to make up answers to several contract questions, and some of those answers would settle the P4 evidence (`VIEW-14`) by accident.\n\n## 1. Gaps to close before coding\n\n- **FND-01 No rule links a data name to a part of an output file.** M1's file holds `symbols`, `references` and `diagnostics`, but its `--info` describes `code.symbol` and `code.reference`. M3's `scopes.json` holds `scopes` and `membership`. `project_outputs` assumes one data name per file. Without a rule (for example, each `--info` output names its JSON key), the Runner and the Viewer can only find records with tool-specific code, which `VIEW-14` forbids. Related: the parameter shape `\"array of M1 outputs\"` names a tool, against \"a tool knows data only by name\" (`toolset.md`, section 4.2), and isn't a shape the Runner can check or build from generically.\n- **FND-02 Relations don't share one shape.** Links have `from` and `to`; references have only `symbol`, with no source. Membership uses `symbol` and `scope`. `VIEW-12` makes the Viewer work out \"the scope a reference sits in\" by comparing ranges, which is tool knowledge in the Viewer. Level 3 then has almost no real edges: there is no \"run calls add\". Suggested fix: M1 adds an `enclosing` field (the enclosing function's symbol ID, or the file ID) to every reference; every relation uses `from` and `to`; every node uses `id` and `parent`; every containment record uses `child` and `parent`. Also missing: what happens to references with `symbol: null` (drop or show), and to references of kind `declaration` (no edge, presumably).\n- **FND-03 M2 conflicts with a [Decided] row.** `MVP_scope.md`, section 2, says a cross-file link carries the call's location (\"A function declared in `a.ts` and called in `b.ts` is linked, with the call's location\"). `04_tools.md` only links import to declaration, at the import's location. M2 already receives every reference, so it can also emit a link from each use of an imported name (kind `call` or `read`) to the declaration. This changes the expected Links table and the file-edge counts (FND-27).\n- **FND-04 The dry-run-only pass can't feed M2 and M3.** It writes nothing, so on a fresh data folder M1's outputs don't exist. `DATA-17` doesn't require the dry run to print the would-be output in a form the Runner can parse, and `RN-11` is open. Inferred answer: in the MVP, each tool's dry run works from the saved stores. On a fresh data folder M2's dry run is then no-go for a missing input, which `toolset.md`, section 4.3 [Decided], lists as a status-check warning (\"a missing output from an earlier tool\"). TEST-02 must run after a real run (FND-24).\n- **FND-05 TEST-02 contradicts the Runner's start-up steps.** `RUN-04` and `RUN-05` create the database and rewrite `config_tools` on every start, and `RUN-06` writes `project_files`. TEST-02 requires the database to be unchanged after a dry-run-only pass, and SQLite changes the file even when rewriting the same rows. Needed: a dry-run-only pass doesn't create the database, doesn't rewrite the record of tools, and doesn't write `project_files`; or TEST-02 compares rows, not file hashes.\n- **FND-06 Stale outputs.** After C1 (M3 moved out), the old `scopes.json` stays on disk, and `--read-cache` returns \"every output\", so the Viewer still shows three levels. Deleted source files leave ghost M1 outputs the same way. `ARCH-05` (\"every run starts from scratch\") never says what is cleared. Inferred answer to `RN-7` for the MVP: an omitted tool's data counts as missing, so `--read-cache` returns only outputs of tools in the current record, and of files in the current file list.\n- **FND-07 Tools don't know where to write.** `data/tools/<tool>/` is neither a parameter nor a stated convention relative to the launcher. This also blocks the by-hand tests B1 to B6, and replays from `last_run.json`.\n- **FND-08 No way to start the Viewer.** No command, port or source-root input is defined, so `/api/run` and `/api/source` have no source root on a fresh start (`project_source` is empty). `runner.md`, section 10, and `viewer.md`, section 3.4, propose that the one-command run ends by starting the Viewer, and that the server can start on its own; neither is taken up here.\n\n## 2. Smaller gaps\n\n- **FND-09 `range` is ambiguous.** \"Of the whole declaration; for a function, its full body.\" The parser shows the bodies start at 3:46, 5:45 and 4:22, after the parameters. If `range` meant only the body, `value` (3:23) would land in the file scope, against the expected table. It must mean the whole declaration, from `export` or `function` to the closing brace. That range also contains the function's own name, so the self-exclusion rule in `TOOL-31` is required.\n- **FND-10 Call versus read.** `TOOL-14` should say only a bare-name callee is a `call`. In `Math.round(...)` and `console.log(...)` the callee is a property access, so `Math` and `console` are reads, as the expected table already has them.\n- **FND-11 The file scope has no location.** M3 reads no files, so it can't know where a file ends (7:1, 9:1 and 13:1 for the test files). Either the file scope has no location, or the Runner passes file lengths.\n- **FND-12 Scope IDs start where?** `DATA-03` says \"at the start of the function\". The parser gives the declaration start (3:1, including `export`), not the `function` keyword (3:8). Pick one; the inferred IDs below use the declaration start.\n- **FND-13 Dry-run no-go on an invocation error.** Does the tool print a no-go JSON line, or only write to standard error and exit 2 (`toolset.md`, section 4.5: invocation errors go to the caller on standard error)? The Runner must handle a missing last line with exit 2.\n- **FND-14 Tool options incomplete.** `TOOL-02` mentions command-line parameter arguments but defines none. `--help`, `--version` and the common options (source root, output root and so on), [Decided] in `toolset.md`, section 4.1, are missing without being marked as an MVP cut. If there are no per-parameter arguments, `TS-30` can't arise in the MVP; say so.\n- **FND-15 Syntax errors (`TOOL-10`).** Checked: `parseDiagnostics` is not in TypeScript 5.6.3's public `typescript.d.ts`. `ts.createSourceFile` alone doesn't expose syntax errors through the public API; use `program.getSyntacticDiagnostics(sourceFile)`. B7 depends on this.\n- **FND-16 Viewer server security.** Missing from `05_viewer.md`, all [Proposed] in `security.md`: the startup token and origin check (section 7); `/api/source` limited to files in `project_files` (section 7: reads only inside the examined project); Cytoscape bundled locally rather than loaded from the internet (section 8).\n- **FND-17 Ctrl + wheel** is [Decided] in `viewer.md`, section 4.9, but cut in `VIEW-20`. Mark it explicitly as an MVP scope cut (`MVP_scope.md`, section 5, proposes following section 4.9).\n- **FND-18 M3 departs from `MVP_scope.md`.** It takes only M1's outputs, where section 2 proposes M1 and M2. It also drops \"together with the symbols it is used with\" from the [Decided] M3 example. Related to `MVP-4`.\n- **FND-19 Live progress.** The mechanism for streaming run events from `/api/run` to the page is not named.\n\n## 3. Findings outside this folder\n\n- **FND-20** `security.md`, section 7, says \"a damaged `last_run.json` makes the tool fall back to defaults and say so in its log\". That contradicts the [Decided] E3 rule in `toolset.md`, sections 4.5 and 4.6: no fallback, invocation error, nothing logged.\n- **FND-21** `MVP-1`, `MVP-3` and `MVP-4` are still open in `MVP_scope.md`, although this folder effectively answers them (section 6 below).\n\n## 4. What holds up\n\n- The test source and its expected result are correct. Every line and column was checked with the TypeScript parser, including the example `src/math.ts#round@3:17`, and the property names `round` (math.ts 5:15) and `log` (main.ts 8:13) are correctly left out.\n- The error model matches `toolset.md`, sections 4.4 to 4.6: shape problems are invocation errors (E13, exit 2, nothing written), value problems are run errors (E12), and `last_run.json` follows the [Decided] rules.\n- The order derived from `--info`, the log format, the layout on disk, the time box and the technology choices are sound.\n- The test app in `test_plan/test-source/` type-checks in strict mode and prints `precision 2 1.23` (Node 22.23.1, TypeScript 5.6.3). Its three files match `06_test_plan.md` character for character.\n\n## 5. Values inferred from the test source\n\nTaken from the TypeScript parser on `test_plan/test-source/`. Usable for `expected/` once FND-09 and FND-12 are confirmed.\n\n**Symbol IDs** (`DATA-02`; each is `<file>#<name>@<line>:<column>`):\n\n| File | Symbols |\n|---|---|\n| `src/math.ts` | `PRECISION@1:14`, `round@3:17`, `value@3:23`, `factor@4:9` |\n| `src/counter.ts` | `round@1:10` (import), `total@3:5`, `add@5:17`, `amount@5:21` |\n| `src/main.ts` | `add@1:10` (import), `PRECISION@2:10` (import), `run@4:10`, `first@5:9`, `label@7:11` |\n\n**Function ranges:** `round` 3:1–6:2, `add` 5:1–8:2, `run` 4:1–10:2.\n\n**Scope IDs** (`DATA-03`): `src/math.ts#scope@3:1`, `src/counter.ts#scope@5:1`, `src/main.ts#scope@4:1`, and `#scope@file` for each file.\n\n**Reference positions** (all identifiers the parser sees, declarations included):\n- `src/math.ts`: `PRECISION@1:14`, `round@3:17`, `value@3:23`, `factor@4:9`, `PRECISION@4:24`, `Math@5:10`, `value@5:21`, `factor@5:29`, `factor@5:39`; and `round@5:15`, a property name, to leave out\n- `src/counter.ts`: `round@1:10`, `total@3:5`, `add@5:17`, `amount@5:21`, `total@6:3`, `total@6:11`, `amount@6:19`, `round@7:10`, `total@7:16`\n- `src/main.ts`: `add@1:10`, `PRECISION@2:10`, `run@4:10`, `first@5:9`, `add@5:17`, `first@6:7`, `label@7:11`, `PRECISION@7:34`, `console@8:5`, `label@8:17`, `first@8:24`, `run@12:1`; and `log@8:13`, a property name, to leave out\n\n**Declaration references.** `TEST-01` compares all references, but the reference table in `06_test_plan.md` leaves declarations out. There are 13, one at each symbol ID.\n\n**File hashes** for `project_files` (SHA-256, LF line endings; a CRLF checkout changes them):\n\n| File | SHA-256 |\n|---|---|\n| `src/counter.ts` | `9e4bb3799e5b0aa0d5acee58945d5f1ae64f88bdd85cccdc936a735fc5d2ed93` |\n| `src/main.ts` | `3772c01070989943ac3658813da8f84734e5508e6add37a1558c2ffd87c212f8` |\n| `src/math.ts` | `655e180f13e3261229972b563332fcccef73d0fd24fecc0012db3d465c5b8e28` |\n\n**Order of invocations.** By `ARCH-04` with ties broken by name: file-symbols, cross-file-links, symbol-scope. The order of M1's files is not stated; sorted by file ID it is counter, main, math. A full run is then 5 dry runs and 5 real runs: 10 tool events between `run_started` and `run_finished`.\n\n**C2 after the rename:** `src/math.ts#roundTo@3:17` and `src/counter.ts#roundTo@1:10`. The columns don't change, since the name is the last word before the parentheses or brace.\n\n## 6. Open questions that bear on testing\n\n| Question | What can be inferred for the MVP | Still missing |\n|---|---|---|\n| `MVP-1` Test source | Settled in practice: the source exists and runs. The developer writes it (`DEL-04`) | Who signs off the expected result |\n| `MVP-3` Deduplication | Encoded by the test: one symbol per declaration, every occurrence a reference, joined across files only by M2 | Nothing |\n| `MVP-4` Scope | Encoded by the test: lexical scope, one level | No expected result for \"the symbols it is used with\" (FND-18) |\n| `MVP-8` Criteria, time target | No run-time target; timings are recorded only (`07_delivery.md`, findings note item 5) | The criteria-to-tests table (FND-28), and a way to measure (FND-30) |\n| `RN-11` Dry-run chaining | Dry runs work from the saved stores; fresh state gives M2 no-go (FND-04) | A test for the fresh-state dry run |\n| `RN-3`, `RN-16` No staging | Accepted for the MVP: earlier outputs stay when a later step fails | B7's expected end state, which depends on the file order (FND-25) |\n| `RN-7` Data from omitted tools | Counts as missing (FND-06) | The `--read-cache` rule |\n| `RN-10` Cancel | The MVP has no cancel button: out of scope | Say so in the test plan |\n| `TS-30` Arguments without JSON | Can't arise without per-parameter arguments (FND-14) | A test: an unknown option gives E1 |\n| `TS-25` Shared `last_run.json` | Harmless: the Runner always sends JSON, so B1 to B6 don't affect later runs | Nothing |\n| `TS-31` Scale | Record one M1 invocation, a full run and a dry run | The method (FND-30) |\n| `TS-12` Paths across platforms | Tested on Linux only, with `/` in file IDs | Note Windows as untested |\n| `VW-4` Unresolved edges | Least effort: hide them and show a count | A human-review question for B9 |\n| `VW-2`, `SEC-3` Malformed output, limits | Out of the MVP | Say so in the test plan |\n\n## 7. What the test plan is missing\n\n- **FND-22 `expected/` in a form a script can compare**, with full IDs, scope ranges, the membership table and the declaration references. Section 5 has the values.\n- **FND-23 Inputs for the broken-input tests.** No JSON for B1 to B6, no fixture for B8, no exact edit for B7 or B9, and no rule that tests work on a copy of `test-source` (B7, B9 and C2 change it).\n- **FND-24 TEST-02 order.** It must run after TEST-01 (FND-04), and a separate test covers a dry-run-only pass on a fresh data folder: M1 go three times, M2 no-go for a missing input, the Runner stops.\n- **FND-25 Expected end states for B7, B9, C1 and C2:** the data folder, the database rows and the Runner events. For B7, the file order matters: a file named `src/broken.ts` sorts first, so M1 fails before writing anything; a name sorting last leaves three M1 outputs behind.\n- **FND-26 Untested error paths** from `03_runner.md` and `04_tools.md`: unknown database version; a tool's `--info` failing; a tool crashing without writing a result; M3 E12 (`TOOL-32`); M2 E12 for two M1 outputs of the same file; an unknown option (E1, see `TS-30`).\n- **FND-27 File-edge counts.** \"Sensible counts\" should be exact. As specified, each of the three file edges counts 1. If M2 gains use-site links (FND-03), counter → math becomes 2 (import and call), and the others change too.\n- **FND-28 Criteria-to-tests table:**\n\n| Success criterion (`MVP_scope.md`, section 7) | Test |\n|---|---|\n| 1. One command runs everything | TEST-01 |\n| 2. Output matches the expected result | TEST-01 |\n| 3. The Viewer works | Human review |\n| 4. A broken input gives no-go, shown in the Viewer | B7 (the criterion says \"a missing file\", but B6 is by hand only) |\n| 5. A dry-run-only pass says go and writes nothing | TEST-02, after a real run |\n| 6. A run without M3 shows one level fewer | C1 |\n\n- **FND-29 Repeatability (`DATA-04`).** Run twice on the unchanged source and diff the outputs, ignoring times.\n- **FND-30 Timings.** How many repeats, warm or cold start, and which numbers: one M1 invocation, a full run, a dry run, the Viewer's load time.\n- **FND-31 Checks on the Runner and the Viewer:** the content of `--read-cache` (`RUN-13`); `/api/source` returning the right lines and refusing paths outside the source; `/api/log` refusing paths outside the data folder; a second run request refused (`VIEW-05`); text rendering (`VIEW-40`), checkable for free on main.ts line 6, `if (first > 0)`.\n- **FND-32 The human review:** who reviews, what counts as a pass for P3 (is \"partly\" enough?), where the answers are kept, and a question for how B9's unresolved import appears.\n- **FND-33 How to run the tests:** the Node version (22.23.1 used so far), a clean state before tests (delete `data/`), and how B1 to B6 find the tool's store (FND-07).\n- **FND-34 Out of scope, not stated:** cancel (`RN-10`), malformed output in the Viewer (`VW-2`), limits (`SEC-3`), Windows paths (`TS-12`). The test plan should say these aren't tested.\n\n## 8. Decisions needed from the user\n\nThese block parts of the expected result and can't be inferred:\n1. M2 use-site links (FND-03), which changes the Links table and the edge counts.\n2. The `--read-cache` rule for omitted tools and deleted files (FND-06, `RN-7`).\n3. The order of M1's files (FND-25).\n4. The pass rule for the human review (FND-32).\n"
}
```

### 2026-11-07 03:42:33 — Tool call: Bash

```json
{
  "command": "cd /home/zaida/viewer/mvp_docs && python3 - <<'EOF'\np='README.md'; s=open(p).read()\ns=s.replace(\"| `07_delivery.md` | Traceability level, deliverables, time box, the findings note |\\n\",\n\"| `07_delivery.md` | Traceability level, deliverables, time box, the findings note |\\n| `99_findings.md` | Review of this folder before building: gaps, conflicts with the working files, values inferred from the test source, what the test plan is missing |\\n| `test_plan/` | The basic examined source as a runnable app (`test_plan/README.md`) |\\n\")\ns=s.replace(\"Prefixes: `ARCH`, `DATA`, `RUN`, `TOOL`, `VIEW`, `TEST`, `DEL`.\",\"Prefixes: `ARCH`, `DATA`, `RUN`, `TOOL`, `VIEW`, `TEST`, `DEL`. Findings use `FND`.\")\nopen(p,'w').write(s)\nEOF\ngrep -n \"99_findings\\|FND\\|test_plan/\" README.md",
  "description": "Add findings file and test folder to README"
}
```

### 2026-11-07 03:42:33 — Tool result

```
File created successfully at: /home/zaida/viewer/mvp_docs/99_findings.md (file state is current in your context — no need to Read it back)
```

### 2026-11-07 03:42:33 — Tool result

```
32:| `99_findings.md` | Review of this folder before building: gaps, conflicts with the working files, values inferred from the test source, what the test plan is missing |
33:| `test_plan/` | The basic examined source as a runnable app (`test_plan/README.md`) |
37:Requirements are numbered per file, for example `RUN-03` or `VIEW-07`, so tests and the findings note can refer to them. Prefixes: `ARCH`, `DATA`, `RUN`, `TOOL`, `VIEW`, `TEST`, `DEL`. Findings use `FND`.
```

## 2026-11-07 03:42:44 — Claude

I wrote `mvp_docs/99_findings.md` with everything from both reviews. Each finding has an ID, `FND-01` to `FND-34`, so you can refer to it and strike it through when it's fixed, the same way the working files handle their questions.

The file has eight sections:

1. **Gaps to close before coding** (`FND-01`–`08`). These include the missing rule linking a data name to a part of an output file, relations not sharing one shape, M2 conflicting with a [Decided] row in `MVP_scope.md`, the dry-run-only pass, the conflict with TEST-02, stale outputs, where tools write, and how the Viewer starts.
2. **Smaller gaps** (`FND-09`–`19`), such as the ambiguity in `range` and where scope IDs start. It also covers syntax errors: `parseDiagnostics` isn't in TypeScript's public API, so B7 needs another route. The missing Viewer server security items and the unmarked Ctrl + wheel cut are here too.
3. **Findings outside this folder** (`FND-20`–`21`):
   - The line in `security.md` about falling back to defaults contradicts the [Decided] E3 rule.
   - `MVP-1`, `MVP-3` and `MVP-4` are still open in `MVP_scope.md`, although this folder effectively answers them.
4. **What holds up.**
5. **Values inferred from the test source**, taken from the TypeScript parser: every symbol ID and scope ID, the function ranges, all reference positions, the SHA-256 hashes, the order of invocations, and the IDs after the C2 rename.
6. **Open questions that bear on testing**, as a table: what can be inferred for the MVP, and what is still missing.
7. **What the test plan is missing** (`FND-22`–`34`), including a table mapping each success criterion to its test.
8. **Four decisions needed from you:**
   - whether M2 also links each use of an imported name
   - what `--read-cache` returns for omitted tools and deleted files
   - the order M1 takes the files in
   - what counts as a pass in the human review

I also added `99_findings.md`, the `test_plan/` folder and the `FND` prefix to the table in `mvp_docs/README.md`. I didn't change `security.md` or `MVP_scope.md`; `FND-20` and `FND-21` only point at them.

## 2026-11-07 03:44:54 — User

which of the tools seems to be the first one that needs to be tested ?

## 2026-11-07 03:45:05 — Claude

**M1, file-symbols, should be tested first.** Five things point the same way:

1. **Everything else depends on it.** M2 and M3 read no files; they only take M1's outputs (`code.symbol`). The Runner's order (`DATA-11`) can't be checked until M1 exists, and the Viewer's lowest level is M1's symbols.
2. **Its IDs join everything else.** M2's links and M3's membership both point at M1's symbol IDs. If an ID is wrong, every later tool and the file edges are wrong with it. That's why C2 (the rename check) is really a test of M1 first.
3. **It can be tested alone.** Build step 3 says M1 runs by hand with `--json`. It needs no Runner, no other tool and no database: one JSON file in, one output file out.
4. **Most broken-input tests target it.** B1 to B7 are all M1. B1–B6 test the shared contract (parameters, `last_run.json`, error codes), and those rules apply to every tool, so getting them right in M1 sets the pattern for M2 and M3.
5. **It carries the biggest technical risk.** It's the only tool that parses source. Syntax-error detection (`FND-15`), leaving out property names, and the call-versus-read rule (`FND-10`) all sit in M1.

Four things from `99_findings.md` need settling before M1 is tested. Otherwise the tests would check an output format that later changes:

- **`FND-01` and `FND-02`**: the output shape. If M1 gains an `enclosing` field on references, or outputs get a rule naming their JSON key, M1's output changes.
- **`FND-07`**: where M1 writes. B1–B6 can't check "nothing written" without knowing its store.
- **`FND-09` and `FND-12`**: what `range` means and where scope IDs start. These affect the `range` values M1 produces.
- **`FND-22`**: the expected result in a form a script can compare. The values are already in section 5 of the findings file.

M3 is the easiest tool to test, since it only uses its input JSON with no parsing. M2 sits in the middle. Both can be tested by hand with JSON written in advance, but only once M1's output format is fixed.

## 2026-11-07 03:45:49 — User

create the zaansouvi-mvp folder structure and write m1 as a stand alone, self contained program. infer all inputs and outputs as you see fit, this is a test and will be overwriten so ve generous with the format

## 2026-11-07 03:50:14 — Claude

I'll build it inside `mvp_docs/`, next to `test_plan/`, so all MVP work stays in the folder that's accepted for it. First, the folder layout from `01_architecture.md`, plus a copy of the test source:

### 2026-11-07 03:50:16 — Tool call: Bash

```json
{
  "command": "B=/home/zaida/viewer/mvp_docs/zaansouvi-mvp\nmkdir -p $B/app/{shared,tool-helper,runner,viewer/server,viewer/ui} \\\n  $B/app/tools/{file-symbols/src,cross-file-links,symbol-scope} \\\n  $B/data/tools/file-symbols/{output,logs,state} \\\n  $B/data/tools/{cross-file-links,symbol-scope}/{output,logs} \\\n  $B/data/runner/logs $B/test-source/src $B/expected $B/tests/m1\ncp /home/zaida/viewer/mvp_docs/test_plan/test-source/src/*.ts $B/test-source/src/\nfind $B | sort",
  "description": "Create the MVP folder layout and copy test source"
}
```

### 2026-11-07 03:50:16 — Tool result

```
/home/zaida/viewer/mvp_docs/zaansouvi-mvp
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/app
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/app/runner
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/app/shared
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/app/tool-helper
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/app/tools
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/app/tools/cross-file-links
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/app/tools/file-symbols
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/app/tools/file-symbols/src
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/app/tools/symbol-scope
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/app/viewer
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/app/viewer/server
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/app/viewer/ui
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/data
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/data/runner
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/data/runner/logs
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/data/tools
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/data/tools/cross-file-links
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/data/tools/cross-file-links/logs
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/data/tools/cross-file-links/output
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/data/tools/file-symbols
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/data/tools/file-symbols/logs
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/data/tools/file-symbols/output
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/data/tools/file-symbols/state
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/data/tools/symbol-scope
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/data/tools/symbol-scope/logs
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/data/tools/symbol-scope/output
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/expected
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/tests
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/tests/m1
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/test-source
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/test-source/src
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/test-source/src/counter.ts
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/test-source/src/main.ts
/home/zaida/viewer/mvp_docs/zaansouvi-mvp/test-source/src/math.ts
```

## 2026-11-07 03:50:19 — Claude

Now M1 itself: one TypeScript file that depends only on Node built-ins and the `typescript` parser.

### 2026-11-07 03:52:20 — Tool call: Write

```json
{
  "file_path": "/home/zaida/viewer/mvp_docs/zaansouvi-mvp/app/tools/file-symbols/src/file-symbols.ts",
  "content": "// file-symbols (M1), ZaAnSouVi MVP.\n//\n// Reads ONE TypeScript file and lists its symbols and every reference to them.\n// Self-contained: depends only on Node built-ins and the `typescript` package\n// (used only as a parser, no type checking). It imports nothing from the Runner,\n// the Viewer or another tool (ARCH-02).\n//\n// Contract: see ../README.md. Run `./file-symbols --help` or `./file-symbols --info`.\n\nimport ts from \"typescript\";\nimport fs from \"node:fs\";\nimport path from \"node:path\";\nimport crypto from \"node:crypto\";\n\n// ---------------------------------------------------------------------------\n// Constants\n// ---------------------------------------------------------------------------\n\nconst TOOL = \"file-symbols\";\nconst VERSION = \"0.1.0\";\nconst OUTPUT_FORMAT_VERSION = 1;\n\n/** The tool's program folder: app/tools/file-symbols. last_run.json sits here (toolset.md 4.5). */\nconst PROGRAM_DIR = path.resolve(import.meta.dirname, \"..\");\n/** zaansouvi-mvp/, three levels above the program folder. */\nconst MVP_ROOT = path.resolve(PROGRAM_DIR, \"..\", \"..\", \"..\");\n/** Used when the parameters give no output_root (FND-07). */\nconst DEFAULT_OUTPUT_ROOT = path.join(MVP_ROOT, \"data\", \"tools\");\nconst LAST_RUN_PATH = path.join(PROGRAM_DIR, \"last_run.json\");\n\nconst EXIT_OK = 0;\nconst EXIT_RUN_ERROR = 1;\nconst EXIT_INVOCATION_ERROR = 2;\n\nconst ERROR_CODES: Record<string, string> = {\n  E1: \"invocation: malformed invocation (both --json and --stdin, unknown option, option without its value)\",\n  E2: \"invocation: explicit JSON input unusable (file missing or unreadable, not valid JSON, not an object)\",\n  E3: \"invocation: no parameters and no usable last_run.json\",\n  E13: \"invocation: a parameter is missing or has the wrong shape\",\n  E6: \"run: the file to read is missing or unreadable\",\n  E12: \"run: a value is incorrect or incongruent, or the file has syntax errors\",\n  E8: \"run: unexpected failure\",\n  I1: \"note: construct skipped (outside the supported constructs)\",\n  I2: \"note: construct outside the supported constructs, handled on a best-effort basis\",\n};\n\n// ---------------------------------------------------------------------------\n// Data shapes (02_data_contracts.md, with the extras from 99_findings.md)\n// ---------------------------------------------------------------------------\n\ntype Position = { line: number; column: number };\ntype Location = { file: string; start: Position; end: Position };\ntype Diagnostic = {\n  severity: \"error\" | \"warning\" | \"info\";\n  code: string;\n  message: string;\n  location?: Location;\n  details?: unknown;\n};\n\ntype SymbolKind = \"function\" | \"variable\" | \"parameter\" | \"import\";\ntype SymbolRecord = {\n  id: string;\n  name: string;\n  kind: SymbolKind;\n  exported: boolean;\n  location: Location;\n  range: Location;\n  parent: string;\n  import?: { from: string; name: string; typeOnly?: boolean };\n};\n\ntype ReferenceKind = \"declaration\" | \"call\" | \"read\" | \"write\";\ntype ReferenceRecord = {\n  id: string;\n  name: string;\n  symbol: string | null;\n  kind: ReferenceKind;\n  location: Location;\n  /** The enclosing function's symbol ID, or the file ID (FND-02). */\n  enclosing: string;\n  /** Uniform relation fields (FND-02): from = enclosing, to = symbol. */\n  from: string;\n  to: string | null;\n};\n\ntype Params = {\n  file_id: string;\n  file_path?: string;\n  source_root?: string;\n  output_root?: string;\n  [extra: string]: unknown;\n};\n\ntype ParamSource = \"json\" | \"stdin\" | \"last_run\" | \"command line\" | \"command line + last_run\";\n\nclass ToolError extends Error {\n  kind: \"invocation\" | \"run\";\n  diagnostic: Diagnostic;\n  constructor(kind: \"invocation\" | \"run\", code: string, message: string, location?: Location, details?: unknown) {\n    super(message);\n    this.kind = kind;\n    this.diagnostic = { severity: \"error\", code, message };\n    if (location) this.diagnostic.location = location;\n    if (details !== undefined) this.diagnostic.details = details;\n  }\n}\n\nconst invocationError = (code: string, message: string, details?: unknown) =>\n  new ToolError(\"invocation\", code, message, undefined, details);\nconst runError = (code: string, message: string, location?: Location, details?: unknown) =>\n  new ToolError(\"run\", code, message, location, details);\n\n// ---------------------------------------------------------------------------\n// --info (DATA-08, plus jsonKey and field names: FND-01, FND-02)\n// ---------------------------------------------------------------------------\n\nconst INFO = {\n  tool: TOOL,\n  version: VERSION,\n  description: \"Reads one TypeScript file and lists its symbols and the references to them.\",\n  readsFiles: { kinds: [\"*.ts\"], parameter: \"file_path\", fallback: \"source_root + file_id\" },\n  invocation: \"per-file\",\n  parameters: {\n    file_id: {\n      dataName: \"files.file.id\",\n      shape: \"string\",\n      required: true,\n      description: \"Path of the file relative to the source root, with / separators, for example src/math.ts\",\n    },\n    file_path: {\n      dataName: \"files.file.path\",\n      shape: \"string\",\n      required: false,\n      description: \"Actual path of the file to read. If absent, source_root + file_id is read\",\n    },\n    source_root: {\n      dataName: \"project.source_root\",\n      shape: \"string\",\n      required: false,\n      description: \"Root of the examined source. Needed when file_path is absent; checked against file_path when both are given\",\n    },\n    output_root: {\n      dataName: \"zaansouvi.output_root\",\n      shape: \"string\",\n      required: false,\n      description: \"Folder holding every tool's store. The tool writes to <output_root>/file-symbols\",\n      whenAbsent: \"<zaansouvi-mvp>/data/tools\",\n    },\n  },\n  requires: [[\"file_path\", \"source_root\"]],\n  requiresMeaning: \"at least one parameter from each inner list must be present\",\n  outputs: [\n    {\n      dataName: \"code.symbol\",\n      version: OUTPUT_FORMAT_VERSION,\n      represents: \"nodes\",\n      containedIn: \"files.file\",\n      file: \"output/<file-key>.json\",\n      jsonKey: \"symbols\",\n      fields: { id: \"id\", parent: \"parent\", label: \"name\", kind: \"kind\", location: \"location\" },\n    },\n    {\n      dataName: \"code.reference\",\n      version: OUTPUT_FORMAT_VERSION,\n      represents: \"relations\",\n      file: \"output/<file-key>.json\",\n      jsonKey: \"references\",\n      fields: { id: \"id\", from: \"from\", to: \"to\", kind: \"kind\", location: \"location\" },\n    },\n  ],\n  fileKey: \"file_id with every / replaced by __, plus .json\",\n  store: {\n    output: \"<output_root>/file-symbols/output/<file-key>.json\",\n    result: \"<output_root>/file-symbols/result.json\",\n    logs: \"<output_root>/file-symbols/logs/<timestamp>_<file-key>.log\",\n    lastRun: \"<program folder>/last_run.json\",\n  },\n  options: {\n    \"--info\": \"print this description and exit\",\n    \"--help\": \"print usage and exit\",\n    \"--version\": \"print the version and exit\",\n    \"--dry-run\": \"do the work, write nothing, print JSON lines and a final go / no-go line\",\n    \"--json <path>\": \"read the parameters from a JSON file\",\n    \"--stdin\": \"read the parameters as JSON from standard input\",\n    \"--log <path>\": \"also copy the log to this file (the store log is always written)\",\n    \"--file-id <v>, --file-path <v>, --source-root <v>, --output-root <v>\":\n      \"set one parameter; overrides the JSON input and last_run.json\",\n  },\n  exitCodes: { \"0\": \"success, or dry run: go\", \"1\": \"run error, or dry run: no-go\", \"2\": \"invocation error: nothing written\" },\n  errorCodes: ERROR_CODES,\n  supportedConstructs: [\n    \"function declarations with parameters, including export function\",\n    \"const, let and var (simple names; destructured names are listed too)\",\n    \"named imports from relative paths (default and namespace imports are listed best-effort)\",\n    \"calls, reads and assignments to a simple name\",\n    \"nested blocks inside functions\",\n  ],\n};\n\nconst HELP = `${TOOL} ${VERSION}: ZaAnSouVi MVP tool M1\n\nReads one TypeScript file and lists its symbols and references.\n\nUsage:\n  ${TOOL} --stdin < params.json        parameters as JSON on standard input\n  ${TOOL} --json params.json           parameters from a JSON file\n  ${TOOL}                              repeat the last real run (last_run.json)\n  ${TOOL} --file-id src/a.ts --source-root ./project\n  ${TOOL} --dry-run --stdin < params.json\n  ${TOOL} --info | --help | --version\n\nParameters (JSON keys): file_id (required), file_path, source_root, output_root.\nAt least one of file_path and source_root is required.\n\nPrecedence: command-line parameter options, then --json or --stdin, then last_run.json.\nExit codes: 0 success / go, 1 run error / no-go, 2 invocation error.\n`;\n\n// ---------------------------------------------------------------------------\n// Small helpers\n// ---------------------------------------------------------------------------\n\nconst out = (value: unknown) => process.stdout.write(JSON.stringify(value) + \"\\n\");\n\nfunction errText(e: unknown): string {\n  if (e && typeof e === \"object\" && \"code\" in e && typeof (e as { code: unknown }).code === \"string\") {\n    return `${(e as { code: string }).code} (${(e as Error).message})`;\n  }\n  return e instanceof Error ? e.message : String(e);\n}\n\nfunction describe(v: unknown): string {\n  if (v === null) return \"null\";\n  if (Array.isArray(v)) return \"an array\";\n  return typeof v === \"string\" ? `\"${v}\"` : `a ${typeof v}`;\n}\n\nconst fileKey = (fileId: string) => fileId.split(\"/\").join(\"__\") + \".json\";\nconst stamp = (d: Date) => d.toISOString().replace(/:/g, \"-\");\nconst sha256 = (data: Buffer) => crypto.createHash(\"sha256\").update(data).digest(\"hex\");\nconst storeDir = (p: Params) => path.join(path.resolve(p.output_root ?? DEFAULT_OUTPUT_ROOT), TOOL);\n\n/** Write to a temporary name, then rename, so a file is never half-written (TOOL-05). */\nfunction writeAtomic(file: string, content: string) {\n  fs.mkdirSync(path.dirname(file), { recursive: true });\n  const tmp = `${file}.tmp-${process.pid}`;\n  fs.writeFileSync(tmp, content);\n  fs.renameSync(tmp, file);\n}\n\n// ---------------------------------------------------------------------------\n// Command line\n// ---------------------------------------------------------------------------\n\ntype Cli = {\n  info: boolean;\n  help: boolean;\n  version: boolean;\n  dryRun: boolean;\n  stdin: boolean;\n  json?: string;\n  log?: string;\n  params: Record<string, string>;\n};\n\nconst PARAM_OPTIONS: Record<string, string> = {\n  \"--file-id\": \"file_id\",\n  \"--file-path\": \"file_path\",\n  \"--source-root\": \"source_root\",\n  \"--output-root\": \"output_root\",\n};\nconst FLAG_OPTIONS = [\"--info\", \"--help\", \"--version\", \"--dry-run\", \"--stdin\"];\n\nfunction parseArgs(argv: string[]): Cli {\n  const cli: Cli = { info: false, help: false, version: false, dryRun: false, stdin: false, params: {} };\n  for (let i = 0; i < argv.length; i++) {\n    let arg = argv[i];\n    let inline: string | undefined;\n    const eq = arg.indexOf(\"=\");\n    if (arg.startsWith(\"--\") && eq > 0) {\n      inline = arg.slice(eq + 1);\n      arg = arg.slice(0, eq);\n    }\n    if (arg === \"-h\") arg = \"--help\";\n    if (inline !== undefined && FLAG_OPTIONS.includes(arg)) {\n      throw invocationError(\"E1\", `Option ${arg} takes no value.`);\n    }\n    const takeValue = (): string => {\n      if (inline !== undefined) return inline;\n      const next = argv[i + 1];\n      if (next === undefined || next.startsWith(\"--\")) throw invocationError(\"E1\", `Option ${arg} needs a value.`);\n      i++;\n      return next;\n    };\n    switch (arg) {\n      case \"--info\": cli.info = true; break;\n      case \"--help\": cli.help = true; break;\n      case \"--version\": cli.version = true; break;\n      case \"--dry-run\": cli.dryRun = true; break;\n      case \"--stdin\": cli.stdin = true; break;\n      case \"--json\": cli.json = takeValue(); break;\n      case \"--log\": cli.log = takeValue(); break;\n      default:\n        if (arg in PARAM_OPTIONS) {\n          cli.params[PARAM_OPTIONS[arg]] = takeValue();\n          break;\n        }\n        throw invocationError(\n          \"E1\",\n          arg.startsWith(\"-\")\n            ? `Unknown option ${arg}. Run with --help to see the options.`\n            : `Unexpected argument \"${arg}\". This tool takes no positional arguments.`,\n        );\n    }\n  }\n  if (cli.json !== undefined && cli.stdin) {\n    throw invocationError(\"E1\", \"Both --json and --stdin were given. Pass the parameters one way only.\");\n  }\n  return cli;\n}\n\n// ---------------------------------------------------------------------------\n// Parameters: reading (E1, E2, E3) and shape check (E13)\n// ---------------------------------------------------------------------------\n\nfunction parseJsonObject(text: string, what: string, code: string): Record<string, unknown> {\n  let value: unknown;\n  try {\n    value = JSON.parse(text);\n  } catch (e) {\n    throw invocationError(code, `${what} is not valid JSON: ${errText(e)}`);\n  }\n  if (value === null || typeof value !== \"object\" || Array.isArray(value)) {\n    throw invocationError(code, `${what} must be a JSON object, not ${describe(value)}.`);\n  }\n  return value as Record<string, unknown>;\n}\n\n/** The parameters of the last real run, or the reason they can't be used. */\nfunction readLastRun(): Record<string, unknown> | string {\n  let text: string;\n  try {\n    text = fs.readFileSync(LAST_RUN_PATH, \"utf8\");\n  } catch {\n    return `there is no last_run.json at ${LAST_RUN_PATH}`;\n  }\n  try {\n    const v = JSON.parse(text);\n    if (v && typeof v === \"object\" && !Array.isArray(v)) return v as Record<string, unknown>;\n  } catch {\n    // fall through\n  }\n  return `last_run.json at ${LAST_RUN_PATH} is not a usable JSON object`;\n}\n\nfunction loadParams(cli: Cli): { params: Record<string, unknown>; source: ParamSource } {\n  let base: Record<string, unknown> = {};\n  let source: ParamSource;\n  if (cli.json !== undefined) {\n    let text: string;\n    try {\n      text = fs.readFileSync(cli.json, \"utf8\");\n    } catch (e) {\n      throw invocationError(\"E2\", `Cannot read the JSON parameters file ${cli.json}: ${errText(e)}`);\n    }\n    base = parseJsonObject(text, `The JSON parameters file ${cli.json}`, \"E2\");\n    source = \"json\";\n  } else if (cli.stdin) {\n    let text: string;\n    try {\n      text = fs.readFileSync(0, \"utf8\");\n    } catch (e) {\n      throw invocationError(\"E2\", `Cannot read the parameters from standard input: ${errText(e)}`);\n    }\n    if (text.trim() === \"\") throw invocationError(\"E2\", \"--stdin was given, but standard input was empty.\");\n    base = parseJsonObject(text, \"The JSON on standard input\", \"E2\");\n    source = \"stdin\";\n  } else {\n    // No JSON input: repeat last_run.json, with command-line parameters on top (TS-30, MVP answer).\n    const hasCli = Object.keys(cli.params).length > 0;\n    const last = readLastRun();\n    if (typeof last === \"string\") {\n      if (!hasCli) throw invocationError(\"E3\", `No parameters were given, and ${last}. Nothing to repeat.`);\n      source = \"command line\";\n    } else {\n      base = last;\n      source = hasCli ? \"command line + last_run\" : \"last_run\";\n    }\n  }\n  const params: Record<string, unknown> = { ...base, ...cli.params };\n  delete params._last_run; // metadata written next to the parameters, not a parameter\n  return { params, source };\n}\n\n/** Shape problems only: these are invocation errors (TOOL-03, toolset.md 4.4). */\nfunction checkShape(p: Record<string, unknown>): Params {\n  if (p.file_id === undefined || p.file_id === null) {\n    throw invocationError(\"E13\", 'Required parameter \"file_id\" is missing.', { parameter: \"file_id\" });\n  }\n  if (typeof p.file_id !== \"string\" || p.file_id === \"\") {\n    throw invocationError(\"E13\", `Parameter \"file_id\" must be a non-empty string; got ${describe(p.file_id)}.`, {\n      parameter: \"file_id\",\n    });\n  }\n  for (const name of [\"file_path\", \"source_root\", \"output_root\"]) {\n    const v = p[name];\n    if (v !== undefined && (typeof v !== \"string\" || v === \"\")) {\n      throw invocationError(\"E13\", `Parameter \"${name}\" must be a non-empty string; got ${describe(v)}.`, {\n        parameter: name,\n      });\n    }\n  }\n  if (p.file_path === undefined && p.source_root === undefined) {\n    throw invocationError(\"E13\", 'Either \"file_path\" or \"source_root\" is required, to find the file to read.', {\n      parameter: [\"file_path\", \"source_root\"],\n    });\n  }\n  return p as Params;\n}\n\n// ---------------------------------------------------------------------------\n// Value checks and reading the file (E12, E6)\n// ---------------------------------------------------------------------------\n\nfunction resolveInput(p: Params): string {\n  const id = p.file_id;\n  if (id.includes(\"\\\\\")) throw runError(\"E12\", `file_id must use \"/\" separators; got \"${id}\".`);\n  if (path.posix.isAbsolute(id) || /^[A-Za-z]:/.test(id)) {\n    throw runError(\"E12\", `file_id must be relative to the source root; got \"${id}\".`);\n  }\n  if (id.split(\"/\").some((s) => s === \"..\" || s === \".\" || s === \"\")) {\n    throw runError(\"E12\", `file_id must be a plain relative path, with no empty, \".\" or \"..\" segments; got \"${id}\".`);\n  }\n  if (!id.endsWith(\".ts\")) throw runError(\"E12\", `This tool reads only *.ts files; file_id is \"${id}\".`);\n\n  if (p.file_path === undefined) return path.resolve(p.source_root!, ...id.split(\"/\"));\n\n  const abs = path.resolve(p.file_path);\n  if (p.source_root !== undefined) {\n    const rel = path.relative(path.resolve(p.source_root), abs).split(path.sep).join(\"/\");\n    if (rel !== id) {\n      throw runError(\n        \"E12\",\n        `file_path and file_id disagree: file_path is \"${rel}\" relative to source_root, but file_id is \"${id}\".`,\n        undefined,\n        { file_id: id, file_path: abs, source_root: path.resolve(p.source_root), relative: rel },\n      );\n    }\n  }\n  return abs;\n}\n\nfunction readSource(abs: string): Buffer {\n  try {\n    const st = fs.statSync(abs);\n    if (!st.isFile()) throw runError(\"E6\", `${abs} is not a regular file.`);\n    return fs.readFileSync(abs);\n  } catch (e) {\n    if (e instanceof ToolError) throw e;\n    throw runError(\"E6\", `Cannot read the file ${abs}: ${errText(e)}`, undefined, { path: abs });\n  }\n}\n\n/** Syntax errors through the public API (FND-15): transpileModule reports syntactic diagnostics only. */\nfunction syntaxErrors(fileId: string, text: string): Diagnostic[] {\n  const r = ts.transpileModule(text, {\n    fileName: fileId,\n    reportDiagnostics: true,\n    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },\n  });\n  const result: Diagnostic[] = [];\n  for (const d of r.diagnostics ?? []) {\n    if (d.category !== ts.DiagnosticCategory.Error || !d.file || d.start === undefined) continue;\n    const s = d.file.getLineAndCharacterOfPosition(d.start);\n    const e = d.file.getLineAndCharacterOfPosition(d.start + (d.length ?? 0));\n    result.push({\n      severity: \"error\",\n      code: \"E12\",\n      message: `Syntax error TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, \" \")}`,\n      location: {\n        file: fileId,\n        start: { line: s.line + 1, column: s.character + 1 },\n        end: { line: e.line + 1, column: e.character + 1 },\n      },\n    });\n  }\n  return result;\n}\n\n// ---------------------------------------------------------------------------\n// Analysis\n// ---------------------------------------------------------------------------\n\nfunction isFunctionLike(n: ts.Node): n is ts.FunctionLikeDeclaration {\n  return (\n    ts.isFunctionDeclaration(n) ||\n    ts.isFunctionExpression(n) ||\n    ts.isArrowFunction(n) ||\n    ts.isMethodDeclaration(n) ||\n    ts.isConstructorDeclaration(n) ||\n    ts.isGetAccessorDeclaration(n) ||\n    ts.isSetAccessorDeclaration(n)\n  );\n}\n\n/** Subtrees with no runtime names: type annotations and type-only declarations. */\nfunction isTypeOnly(n: ts.Node): boolean {\n  return ts.isTypeNode(n) || ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n);\n}\n\nfunction hasExportModifier(n: ts.Node): boolean {\n  return !!(ts.canHaveModifiers(n) && ts.getModifiers(n)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword));\n}\n\nfunction analyze(fileId: string, text: string) {\n  const sf = ts.createSourceFile(fileId, text, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TS);\n\n  const toLoc = (start: number, end: number): Location => {\n    const s = sf.getLineAndCharacterOfPosition(start);\n    const e = sf.getLineAndCharacterOfPosition(end);\n    return {\n      file: fileId,\n      start: { line: s.line + 1, column: s.character + 1 },\n      end: { line: e.line + 1, column: e.character + 1 },\n    };\n  };\n  const nodeLoc = (n: ts.Node) => toLoc(n.getStart(sf), n.getEnd());\n  const posTag = (n: ts.Node) => {\n    const p = sf.getLineAndCharacterOfPosition(n.getStart(sf));\n    return `${p.line + 1}:${p.character + 1}`;\n  };\n\n  const symbols: SymbolRecord[] = [];\n  const diagnostics: Diagnostic[] = [];\n  /** Declaring name node -> its symbol. */\n  const byNameNode = new Map<ts.Node, SymbolRecord>();\n  /** Scope node (the source file or a function-like node) -> name -> declarations in source order. */\n  const scopeDecls = new Map<ts.Node, Map<string, { sym: SymbolRecord; pos: number }[]>>();\n  const exportListNames = new Set<string>();\n\n  const note = (n: ts.Node, code: \"I1\" | \"I2\", construct: string) =>\n    diagnostics.push({\n      severity: \"info\",\n      code,\n      message: code === \"I1\" ? `Skipped: ${construct}.` : `Best effort: ${construct}.`,\n      location: nodeLoc(n),\n    });\n\n  function addSymbol(\n    nameNode: ts.Identifier,\n    kind: SymbolKind,\n    scope: ts.Node,\n    rangeNode: ts.Node,\n    exported: boolean,\n    imp?: SymbolRecord[\"import\"],\n  ) {\n    const sym: SymbolRecord = {\n      id: `${fileId}#${nameNode.text}@${posTag(nameNode)}`,\n      name: nameNode.text,\n      kind,\n      exported,\n      location: nodeLoc(nameNode),\n      range: nodeLoc(rangeNode),\n      parent: fileId,\n    };\n    if (imp) sym.import = imp;\n    symbols.push(sym);\n    byNameNode.set(nameNode, sym);\n    let names = scopeDecls.get(scope);\n    if (!names) scopeDecls.set(scope, (names = new Map()));\n    const list = names.get(sym.name) ?? [];\n    list.push({ sym, pos: nameNode.getStart(sf) });\n    names.set(sym.name, list);\n  }\n\n  function addBindingNames(name: ts.BindingName, kind: SymbolKind, scope: ts.Node, rangeNode: ts.Node, exported: boolean) {\n    if (ts.isIdentifier(name)) {\n      addSymbol(name, kind, scope, rangeNode, exported);\n      return;\n    }\n    note(name, \"I2\", \"destructuring: each bound name is listed as its own symbol\");\n    for (const el of name.elements) {\n      if (!ts.isOmittedExpression(el)) addBindingNames(el.name, kind, scope, rangeNode, exported);\n    }\n  }\n\n  // Pass 1: declarations. `scope` is the nearest function-like node, or the file.\n  function collect(node: ts.Node, scope: ts.Node): void {\n    if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {\n      note(node, \"I1\", \"type-only declaration\");\n      return;\n    }\n    if (isTypeOnly(node)) return;\n\n    if (ts.isFunctionDeclaration(node)) {\n      // A function's own name belongs to the scope it is declared in (TOOL-31).\n      if (node.name) addSymbol(node.name, \"function\", scope, node, hasExportModifier(node));\n      else note(node, \"I1\", \"function declaration without a name (export default function)\");\n      if (!node.body) note(node, \"I2\", \"function without a body (overload signature): listed as a function\");\n      for (const prm of node.parameters) addBindingNames(prm.name, \"parameter\", node, prm, false);\n      ts.forEachChild(node, (c) => collect(c, node));\n      return;\n    }\n    if (isFunctionLike(node)) {\n      if (!ts.isFunctionExpression(node) || node.name) {\n        if (ts.isArrowFunction(node)) note(node, \"I2\", \"arrow function: its parameters are listed, it gets no symbol of its own\");\n        else if (!ts.isFunctionExpression(node)) note(node, \"I2\", \"method, constructor or accessor: parameters are listed\");\n      }\n      for (const prm of node.parameters) addBindingNames(prm.name, \"parameter\", node, prm, false);\n      ts.forEachChild(node, (c) => collect(c, node));\n      return;\n    }\n    if (ts.isVariableDeclaration(node)) {\n      const stmt = node.parent?.parent;\n      const exported = !!stmt && ts.isVariableStatement(stmt) && hasExportModifier(stmt);\n      addBindingNames(node.name, \"variable\", scope, node, exported);\n      ts.forEachChild(node, (c) => collect(c, scope));\n      return;\n    }\n    if (ts.isImportDeclaration(node)) {\n      const spec = node.moduleSpecifier;\n      const from = ts.isStringLiteral(spec) ? spec.text : spec.getText(sf);\n      const clause = node.importClause;\n      if (!clause) {\n        note(node, \"I1\", `side-effect import of \"${from}\"`);\n        return;\n      }\n      const typeOnly = clause.isTypeOnly;\n      const imp = (name: string, elementTypeOnly = false) =>\n        typeOnly || elementTypeOnly ? { from, name, typeOnly: true } : { from, name };\n      if (!from.startsWith(\".\")) note(node, \"I2\", `import from a package (\"${from}\"): listed, cannot be linked to a file`);\n      if (clause.name) {\n        note(clause, \"I2\", \"default import: listed with import.name \\\"default\\\"\");\n        addSymbol(clause.name, \"import\", scope, clause, false, imp(\"default\"));\n      }\n      const nb = clause.namedBindings;\n      if (nb && ts.isNamespaceImport(nb)) {\n        note(nb, \"I2\", \"namespace import: listed with import.name \\\"*\\\"\");\n        addSymbol(nb.name, \"import\", scope, nb, false, imp(\"*\"));\n      }\n      if (nb && ts.isNamedImports(nb)) {\n        for (const el of nb.elements) {\n          addSymbol(el.name, \"import\", scope, el, false, imp((el.propertyName ?? el.name).text, el.isTypeOnly));\n        }\n      }\n      return;\n    }\n    if (ts.isExportDeclaration(node)) {\n      if (node.moduleSpecifier) {\n        note(node, \"I1\", \"re-export\");\n        return;\n      }\n      if (node.exportClause && ts.isNamedExports(node.exportClause)) {\n        for (const el of node.exportClause.elements) exportListNames.add((el.propertyName ?? el.name).text);\n      }\n      return;\n    }\n    if (ts.isExportAssignment(node)) note(node, \"I2\", \"export default / export =: the expression is analyzed, nothing is marked exported\");\n    if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {\n      note(node, \"I2\", \"class: its name and members are not symbols; method bodies are analyzed\");\n    }\n    if (ts.isEnumDeclaration(node)) {\n      note(node, \"I1\", \"enum\");\n      return;\n    }\n    if (ts.isModuleDeclaration(node)) {\n      note(node, \"I1\", \"namespace or module declaration\");\n      return;\n    }\n    ts.forEachChild(node, (c) => collect(c, scope));\n  }\n\n  collect(sf, sf);\n\n  // `export { a, b }` marks file-level declarations as exported.\n  for (const name of exportListNames) {\n    for (const d of scopeDecls.get(sf)?.get(name) ?? []) d.sym.exported = true;\n  }\n\n  // Pass 2: references.\n  const references: ReferenceRecord[] = [];\n\n  /** Identifiers that are names but not references: property names, member names, labels... (TOOL-12) */\n  function isNonReference(id: ts.Identifier): boolean {\n    const p = id.parent;\n    if (!p) return true;\n    if (ts.isPropertyAccessExpression(p) && p.name === id) return true;\n    if (ts.isQualifiedName(p)) return true;\n    if (\n      (ts.isPropertyAssignment(p) ||\n        ts.isPropertyDeclaration(p) ||\n        ts.isMethodDeclaration(p) ||\n        ts.isGetAccessorDeclaration(p) ||\n        ts.isSetAccessorDeclaration(p) ||\n        ts.isPropertySignature(p) ||\n        ts.isMethodSignature(p) ||\n        ts.isEnumMember(p) ||\n        ts.isClassDeclaration(p) ||\n        ts.isClassExpression(p) ||\n        ts.isFunctionExpression(p) ||\n        ts.isFunctionDeclaration(p) ||\n        ts.isTypeParameterDeclaration(p)) &&\n      (p as { name?: ts.Node }).name === id\n    ) {\n      return true;\n    }\n    if (ts.isBindingElement(p) && p.propertyName === id) return true;\n    if (ts.isImportSpecifier(p) || ts.isExportSpecifier(p) || ts.isImportClause(p) || ts.isNamespaceImport(p)) return true;\n    if (ts.isNamespaceExport(p) || ts.isLabeledStatement(p) || ts.isBreakOrContinueStatement(p)) return true;\n    if (ts.isMetaProperty(p)) return true;\n    return false;\n  }\n\n  /** TOOL-14, with FND-10: only a bare-name callee is a call. */\n  function referenceKind(id: ts.Identifier): ReferenceKind {\n    const p = id.parent;\n    if (\n      ts.isBinaryExpression(p) &&\n      p.left === id &&\n      p.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&\n      p.operatorToken.kind <= ts.SyntaxKind.LastAssignment\n    ) {\n      return \"write\";\n    }\n    if (\n      (ts.isPrefixUnaryExpression(p) || ts.isPostfixUnaryExpression(p)) &&\n      (p.operator === ts.SyntaxKind.PlusPlusToken || p.operator === ts.SyntaxKind.MinusMinusToken)\n    ) {\n      return \"write\";\n    }\n    if ((ts.isCallExpression(p) || ts.isNewExpression(p)) && p.expression === id) return \"call\";\n    return \"read\";\n  }\n\n  /** TOOL-13: nearest declaration by name in the enclosing functions, then the file. */\n  function resolve(id: ts.Identifier): string | null {\n    const pos = id.getStart(sf);\n    for (let n: ts.Node | undefined = id.parent; n; n = n.parent) {\n      if (!(n === sf || isFunctionLike(n))) continue;\n      const list = scopeDecls.get(n)?.get(id.text);\n      if (list && list.length > 0) {\n        // The last declaration before the reference, or the first one (hoisting).\n        let best = list[0];\n        for (const c of list) if (c.pos <= pos) best = c;\n        return best.sym.id;\n      }\n    }\n    return null;\n  }\n\n  /** FND-02: the enclosing function's symbol ID, or the file ID. */\n  function enclosingOf(id: ts.Identifier): string {\n    let n: ts.Node | undefined = id.parent;\n    // A function's own name sits in the outer scope.\n    if (n && ts.isFunctionDeclaration(n) && n.name === id) n = n.parent;\n    for (; n; n = n.parent) {\n      if (ts.isFunctionDeclaration(n) && n.name) {\n        const s = byNameNode.get(n.name);\n        if (s) return s.id;\n      }\n      if (\n        (ts.isFunctionExpression(n) || ts.isArrowFunction(n)) &&\n        ts.isVariableDeclaration(n.parent) &&\n        ts.isIdentifier(n.parent.name)\n      ) {\n        const s = byNameNode.get(n.parent.name);\n        if (s) return s.id;\n      }\n    }\n    return fileId;\n  }\n\n  function visitIdentifier(id: ts.Identifier) {\n    const decl = byNameNode.get(id);\n    let kind: ReferenceKind;\n    let target: string | null;\n    if (decl) {\n      kind = \"declaration\";\n      target = decl.id;\n    } else {\n      if (isNonReference(id)) return;\n      kind = referenceKind(id);\n      target = resolve(id);\n    }\n    const enclosing = enclosingOf(id);\n    references.push({\n      id: `${fileId}#ref@${posTag(id)}`,\n      name: id.text,\n      symbol: target,\n      kind,\n      location: nodeLoc(id),\n      enclosing,\n      from: enclosing,\n      to: target,\n    });\n  }\n\n  function walk(node: ts.Node): void {\n    if (isTypeOnly(node)) return;\n    if (ts.isIdentifier(node)) {\n      visitIdentifier(node);\n      return;\n    }\n    ts.forEachChild(node, walk);\n  }\n  walk(sf);\n\n  const byPosition = (a: { location: Location }, b: { location: Location }) =>\n    a.location.start.line - b.location.start.line || a.location.start.column - b.location.start.column;\n  symbols.sort(byPosition);\n  references.sort(byPosition);\n  diagnostics.sort((a, b) => (a.location && b.location ? byPosition(a as { location: Location }, b as { location: Location }) : 0));\n\n  return { symbols, references, diagnostics, lineCount: sf.getLineAndCharacterOfPosition(sf.getEnd()).line + 1 };\n}\n\n// ---------------------------------------------------------------------------\n// Logging (DATA-16): `<ISO time>\\t<level>\\t<event>\\t<JSON details>`, comments `# [type] text`.\n// In a dry run, the same entries go to standard output as JSON lines.\n// ---------------------------------------------------------------------------\n\ntype Logger = {\n  entry: (level: \"info\" | \"warn\" | \"error\", event: string, details?: Record<string, unknown>) => void;\n  comment: (type: string, text: string) => void;\n};\n\nfunction fileLogger(file: string, copy?: string): Logger {\n  let copyPath = copy;\n  const write = (line: string) => {\n    fs.appendFileSync(file, line + \"\\n\");\n    if (!copyPath) return;\n    try {\n      fs.appendFileSync(copyPath, line + \"\\n\");\n    } catch (e) {\n      const failed = copyPath;\n      copyPath = undefined;\n      fs.appendFileSync(\n        file,\n        `${new Date().toISOString()}\\twarn\\tlog_copy_failed\\t${JSON.stringify({ path: failed, error: errText(e) })}\\n`,\n      );\n    }\n  };\n  return {\n    entry: (level, event, details = {}) => write(`${new Date().toISOString()}\\t${level}\\t${event}\\t${JSON.stringify(details)}`),\n    comment: (type, text) => write(`# [${type}] ${text.replace(/\\n/g, \" \")}`),\n  };\n}\n\nconst stdoutLogger: Logger = {\n  entry: (level, event, details = {}) => out({ type: \"log\", time: new Date().toISOString(), level, event, details }),\n  comment: (type, text) => out({ type: \"comment\", commentType: type, text }),\n};\n\nconst HINTS: Record<string, string> = {\n  E6: \"Check that the file exists and is readable, or fix file_path / source_root, then run again.\",\n  E12: \"Fix the value or the source file named above. Running the tool with no parameters repeats this exact run.\",\n  E8: \"This is unexpected. The details hold the stack trace; run again with no parameters to reproduce it.\",\n};\n\n// ---------------------------------------------------------------------------\n// The work, shared by real runs and dry runs\n// ---------------------------------------------------------------------------\n\nfunction work(p: Params, source: ParamSource, log: Logger) {\n  const store = storeDir(p);\n  log.comment(\"step\", \"checking parameter values\");\n  const abs = resolveInput(p);\n  log.entry(\"info\", \"input_resolved\", { file_id: p.file_id, path: abs, store });\n\n  log.comment(\"step\", `reading ${p.file_id}`);\n  const buf = readSource(abs);\n  const text = buf.toString(\"utf8\");\n  const read = { file_id: p.file_id, path: abs, bytes: buf.length, sha256: sha256(buf) };\n  log.entry(\"info\", \"file_read\", read);\n\n  log.comment(\"step\", \"checking syntax\");\n  const syntax = syntaxErrors(p.file_id, text);\n  if (syntax.length > 0) {\n    throw runError(\n      \"E12\",\n      `${p.file_id} has ${syntax.length} syntax error(s). First: ${syntax[0].message}`,\n      syntax[0].location,\n      { syntaxErrors: syntax },\n    );\n  }\n\n  log.comment(\"step\", \"listing symbols and references\");\n  const { symbols, references, diagnostics, lineCount } = analyze(p.file_id, text);\n  for (const d of diagnostics) log.entry(\"info\", \"diagnostic\", d as unknown as Record<string, unknown>);\n\n  const count = <T, K extends string>(items: T[], key: (t: T) => K) =>\n    items.reduce<Record<string, number>>((acc, t) => ((acc[key(t)] = (acc[key(t)] ?? 0) + 1), acc), {});\n  const counts = {\n    symbols: symbols.length,\n    symbolsByKind: count(symbols, (s) => s.kind),\n    references: references.length,\n    referencesByKind: count(references, (r) => r.kind),\n    unresolvedReferences: references.filter((r) => r.symbol === null).length,\n    diagnostics: diagnostics.length,\n    lines: lineCount,\n  };\n  log.entry(\"info\", \"analysis_done\", counts);\n\n  // No times in the output, so two runs over the same file give identical output (FND-29).\n  const output = {\n    tool: TOOL,\n    version: VERSION,\n    formatVersion: OUTPUT_FORMAT_VERSION,\n    file: p.file_id,\n    sha256: read.sha256,\n    dataNames: { \"code.symbol\": \"symbols\", \"code.reference\": \"references\" },\n    counts,\n    symbols,\n    references,\n    diagnostics,\n  };\n  const outputPath = path.join(store, \"output\", fileKey(p.file_id));\n  return { output, outputPath, read, counts, store, source };\n}\n\nfunction existingChange(file: string, content: string): \"create\" | \"update\" | \"unchanged\" {\n  try {\n    return fs.readFileSync(file, \"utf8\") === content ? \"unchanged\" : \"update\";\n  } catch {\n    return \"create\";\n  }\n}\n\nfunction toDiagnostic(e: unknown): Diagnostic {\n  if (e instanceof ToolError) return e.diagnostic;\n  return {\n    severity: \"error\",\n    code: \"E8\",\n    message: `Unexpected failure: ${errText(e)}`,\n    details: { stack: e instanceof Error ? e.stack : undefined },\n  };\n}\n\n// ---------------------------------------------------------------------------\n// Real run\n// ---------------------------------------------------------------------------\n\nfunction writeLastRun(p: Params, meta: Record<string, unknown>) {\n  // Flat parameters, so the file can be passed back with --json. `_last_run` is an extra value, ignored on input.\n  writeAtomic(LAST_RUN_PATH, JSON.stringify({ ...p, _last_run: { tool: TOOL, version: VERSION, ...meta } }, null, 2) + \"\\n\");\n}\n\nfunction realRun(p: Params, source: ParamSource, logCopy: string | undefined): number {\n  const started = new Date();\n  const store = storeDir(p);\n  const resultPath = path.join(store, \"result.json\");\n  const logFile = path.join(store, \"logs\", `${stamp(started)}_${fileKey(p.file_id).replace(/\\.json$/, \"\")}.log`);\n\n  let log: Logger;\n  try {\n    fs.mkdirSync(path.dirname(logFile), { recursive: true });\n    log = fileLogger(logFile, logCopy);\n  } catch (e) {\n    process.stderr.write(`${TOOL}: run error E8: cannot create the store at ${store}: ${errText(e)}\\n`);\n    return EXIT_RUN_ERROR;\n  }\n\n  log.comment(\"run\", `${TOOL} ${VERSION}: real run on ${p.file_id}`);\n  log.entry(\"info\", \"run_started\", {\n    tool: TOOL,\n    version: VERSION,\n    mode: \"real\",\n    parameterSource: source,\n    parameters: p,\n    argv: process.argv.slice(2),\n    programDir: PROGRAM_DIR,\n    store,\n    logCopy: logCopy ?? null,\n  });\n\n  try {\n    // The parameters passed the shape check, so the run has begun: save them (TOOL-04).\n    writeLastRun(p, { outcome: \"started\", started: started.toISOString() });\n    log.entry(\"info\", \"last_run_saved\", { path: LAST_RUN_PATH });\n\n    const r = work(p, source, log);\n    const content = JSON.stringify(r.output, null, 2) + \"\\n\";\n    const change = existingChange(r.outputPath, content);\n    writeAtomic(r.outputPath, content);\n    log.entry(\"info\", \"output_written\", { path: r.outputPath, change, dataNames: r.output.dataNames });\n\n    const finished = new Date();\n    const result = {\n      tool: TOOL,\n      version: VERSION,\n      status: \"succeeded\",\n      mode: \"real\",\n      started: started.toISOString(),\n      finished: finished.toISOString(),\n      durationMs: finished.getTime() - started.getTime(),\n      parameterSource: source,\n      parameters: p,\n      read: r.read,\n      outputs: [r.outputPath],\n      outputChange: change,\n      counts: r.counts,\n      log: logFile,\n    };\n    writeAtomic(resultPath, JSON.stringify(result, null, 2) + \"\\n\");\n    writeLastRun(p, { outcome: \"succeeded\", started: result.started, finished: result.finished, result: resultPath });\n    log.entry(\"info\", \"run_finished\", { status: \"succeeded\", durationMs: result.durationMs, result: resultPath });\n    out({ result: \"succeeded\", file_id: p.file_id, output: r.outputPath, change, counts: r.counts, log: logFile });\n    return EXIT_OK;\n  } catch (e) {\n    const error = toDiagnostic(e);\n    const finished = new Date();\n    log.entry(\"error\", \"run_failed\", { error });\n    if (HINTS[error.code]) log.comment(\"hint\", HINTS[error.code]);\n    try {\n      const result = {\n        tool: TOOL,\n        version: VERSION,\n        status: \"failed\",\n        mode: \"real\",\n        started: started.toISOString(),\n        finished: finished.toISOString(),\n        durationMs: finished.getTime() - started.getTime(),\n        parameterSource: source,\n        parameters: p,\n        error,\n        outputs: [],\n        log: logFile,\n      };\n      writeAtomic(resultPath, JSON.stringify(result, null, 2) + \"\\n\");\n      writeLastRun(p, { outcome: \"failed\", started: result.started, finished: result.finished, error, result: resultPath });\n    } catch (inner) {\n      log.entry(\"error\", \"result_not_written\", { error: errText(inner) });\n    }\n    log.entry(\"info\", \"run_finished\", { status: \"failed\" });\n    process.stderr.write(`${TOOL}: run error ${error.code}: ${error.message}\\n`);\n    out({ result: \"failed\", file_id: p.file_id, error, log: logFile });\n    return EXIT_RUN_ERROR;\n  }\n}\n\n// ---------------------------------------------------------------------------\n// Dry run (TOOL-06, DATA-17): same work, nothing written, everything on standard output.\n// The preview line carries the would-be output, so a Runner can chain dry runs (FND-04, RN-11).\n// ---------------------------------------------------------------------------\n\nfunction dryRun(p: Params, source: ParamSource, logCopy: string | undefined): number {\n  const log = stdoutLogger;\n  log.entry(\"info\", \"run_started\", { tool: TOOL, version: VERSION, mode: \"dry-run\", parameterSource: source, parameters: p });\n  if (logCopy) log.entry(\"warn\", \"log_option_ignored\", { reason: \"a dry run writes nothing to the file system\", path: logCopy });\n  try {\n    const r = work(p, source, log);\n    const content = JSON.stringify(r.output, null, 2) + \"\\n\";\n    out({\n      type: \"preview\",\n      output: r.outputPath,\n      change: existingChange(r.outputPath, content),\n      wouldWrite: [r.outputPath, path.join(r.store, \"result.json\"), path.join(r.store, \"logs\", \"<timestamp>.log\"), LAST_RUN_PATH],\n      content: r.output,\n    });\n    out({ dryRun: \"go\", tool: TOOL, version: VERSION, file_id: p.file_id, counts: r.counts });\n    return EXIT_OK;\n  } catch (e) {\n    const error = toDiagnostic(e);\n    if (HINTS[error.code]) log.comment(\"hint\", HINTS[error.code]);\n    out({ dryRun: \"no-go\", kind: \"run\", tool: TOOL, version: VERSION, file_id: p.file_id, error });\n    return EXIT_RUN_ERROR;\n  }\n}\n\n// ---------------------------------------------------------------------------\n// Main\n// ---------------------------------------------------------------------------\n\n/** Invocation errors write nothing and log nothing (toolset.md 4.5). A dry run also gets a no-go line (FND-13). */\nfunction invocationFailure(e: unknown, dry: boolean): number {\n  const error = e instanceof ToolError ? e.diagnostic : { severity: \"error\" as const, code: \"E1\", message: errText(e) };\n  process.stderr.write(`${TOOL}: invocation error ${error.code}: ${error.message}\\n`);\n  process.stderr.write(JSON.stringify({ invocationError: error }) + \"\\n\");\n  if (dry) out({ dryRun: \"no-go\", kind: \"invocation\", tool: TOOL, version: VERSION, error });\n  return EXIT_INVOCATION_ERROR;\n}\n\nfunction main(argv: string[]): number {\n  let cli: Cli;\n  try {\n    cli = parseArgs(argv);\n  } catch (e) {\n    return invocationFailure(e, argv.includes(\"--dry-run\"));\n  }\n  if (cli.help) {\n    process.stdout.write(HELP);\n    return EXIT_OK;\n  }\n  if (cli.version) {\n    process.stdout.write(`${TOOL} ${VERSION}\\n`);\n    return EXIT_OK;\n  }\n  if (cli.info) {\n    process.stdout.write(JSON.stringify(INFO, null, 2) + \"\\n\");\n    return EXIT_OK;\n  }\n\n  let params: Params;\n  let source: ParamSource;\n  try {\n    const loaded = loadParams(cli);\n    params = checkShape(loaded.params);\n    source = loaded.source;\n  } catch (e) {\n    return invocationFailure(e, cli.dryRun);\n  }\n  return cli.dryRun ? dryRun(params, source, cli.log) : realRun(params, source, cli.log);\n}\n\nprocess.exitCode = main(process.argv.slice(2));\n"
}
```

### 2026-11-07 03:52:25 — Tool call: Bash

```json
{
  "command": "cd /home/zaida/viewer/mvp_docs/zaansouvi-mvp/app/tools/file-symbols && cat > file-symbols <<'EOF'\n#!/bin/sh\n# Launcher for file-symbols (M1): the \"tool_name.bin\" of toolset.md 4.5.\n# Arguments are passed through unchanged, never rebuilt into a command string.\ndir=$(CDPATH= cd -- \"$(dirname -- \"$0\")\" && pwd)\nexec node --disable-warning=ExperimentalWarning \"$dir/src/file-symbols.ts\" \"$@\"\nEOF\nchmod +x file-symbols\ncat > package.json <<'EOF'\n{\n  \"name\": \"zaansouvi-file-symbols\",\n  \"version\": \"0.1.0\",\n  \"private\": true,\n  \"description\": \"ZaAnSouVi MVP tool M1: lists the symbols and references of one TypeScript file.\",\n  \"type\": \"module\",\n  \"scripts\": {\n    \"typecheck\": \"tsc -p .\",\n    \"info\": \"./file-symbols --info\"\n  },\n  \"engines\": { \"node\": \">=22.18\" },\n  \"dependencies\": {\n    \"typescript\": \"5.6.3\"\n  },\n  \"devDependencies\": {\n    \"@types/node\": \"22.10.2\"\n  }\n}\nEOF\ncat > tsconfig.json <<'EOF'\n{\n  \"compilerOptions\": {\n    \"target\": \"ES2022\",\n    \"module\": \"NodeNext\",\n    \"moduleResolution\": \"NodeNext\",\n    \"strict\": true,\n    \"noEmit\": true,\n    \"skipLibCheck\": true,\n    \"types\": [\"node\"]\n  },\n  \"include\": [\"src\"]\n}\nEOF\nnpm install --no-audit --no-fund 2>&1 | tail -2 && npm run -s typecheck && echo TYPECHECK-OK && ./file-symbols --version",
  "description": "Write launcher and package files, install, type-check"
}
```

### 2026-11-07 03:52:25 — Tool result

```
File created successfully at: /home/zaida/viewer/mvp_docs/zaansouvi-mvp/app/tools/file-symbols/src/file-symbols.ts (file state is current in your context — no need to Read it back)
```

### 2026-11-07 03:52:28 — Tool result (error)

```
Exit code 2

added 3 packages in 1s
src/file-symbols.ts(228,49): error TS2352: Conversion of type 'object & Record<"code", unknown>' to type 'Error' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type 'object & Record<"code", unknown>' is missing the following properties from type 'Error': name, message
```

### 2026-11-07 03:52:31 — Tool call: Edit

```json
{
  "replace_all": false,
  "file_path": "/home/zaida/viewer/mvp_docs/zaansouvi-mvp/app/tools/file-symbols/src/file-symbols.ts",
  "old_string": "    return `${(e as { code: string }).code} (${(e as Error).message})`;",
  "new_string": "    return `${(e as { code: string }).code} (${(e as unknown as Error).message})`;"
}
```

### 2026-11-07 03:52:33 — Tool call: Bash

```json
{
  "command": "cd /home/zaida/viewer/mvp_docs/zaansouvi-mvp/app/tools/file-symbols && npm run -s typecheck && echo TYPECHECK-OK && ./file-symbols --version && ./file-symbols --info | head -5 && S=../../../test-source && for f in src/math.ts src/counter.ts src/main.ts; do printf '{\"source_root\":\"%s\",\"file_id\":\"%s\"}' \"$(realpath $S)\" $f | ./file-symbols --stdin; echo \"exit=$?\"; done",
  "description": "Type-check and run M1 on the three test files"
}
```

### 2026-11-07 03:52:34 — Tool result

```
The file /home/zaida/viewer/mvp_docs/zaansouvi-mvp/app/tools/file-symbols/src/file-symbols.ts has been updated successfully. (file state is current in your context — no need to Read it back)
```

### 2026-11-07 03:52:37 — Tool result

```
TYPECHECK-OK
file-symbols 0.1.0
{
  "tool": "file-symbols",
  "version": "0.1.0",
  "description": "Reads one TypeScript file and lists its symbols and the references to them.",
  "readsFiles": {
{"result":"succeeded","file_id":"src/math.ts","output":"/home/zaida/viewer/mvp_docs/zaansouvi-mvp/data/tools/file-symbols/output/src__math.ts.json","change":"create","counts":{"symbols":4,"symbolsByKind":{"variable":2,"function":1,"parameter":1},"references":9,"referencesByKind":{"declaration":4,"read":5},"unresolvedReferences":1,"diagnostics":0,"lines":7},"log":"/home/zaida/viewer/mvp_docs/zaansouvi-mvp/data/tools/file-symbols/logs/2026-11-07T03-52-36.648Z_src__math.ts.log"}
exit=0
{"result":"succeeded","file_id":"src/counter.ts","output":"/home/zaida/viewer/mvp_docs/zaansouvi-mvp/data/tools/file-symbols/output/src__counter.ts.json","change":"create","counts":{"symbols":4,"symbolsByKind":{"import":1,"variable":1,"function":1,"parameter":1},"references":9,"referencesByKind":{"declaration":4,"write":1,"read":3,"call":1},"unresolvedReferences":0,"diagnostics":0,"lines":9},"log":"/home/zaida/viewer/mvp_docs/zaansouvi-mvp/data/tools/file-symbols/logs/2026-11-07T03-52-37.147Z_src__counter.ts.log"}
exit=0
{"result":"succeeded","file_id":"src/main.ts","output":"/home/zaida/viewer/mvp_docs/zaansouvi-mvp/data/tools/file-symbols/output/src__main.ts.json","change":"create","counts":{"symbols":5,"symbolsByKind":{"import":2,"function":1,"variable":2},"references":12,"referencesByKind":{"declaration":5,"call":2,"read":5},"unresolvedReferences":1,"diagnostics":0,"lines":13},"log":"/home/zaida/viewer/mvp_docs/zaansouvi-mvp/data/tools/file-symbols/logs/2026-11-07T03-52-37.619Z_src__main.ts.log"}
exit=0
```

### 2026-11-07 03:52:56 — Tool call: Write

```json
{
  "file_path": "/home/zaida/viewer/mvp_docs/zaansouvi-mvp/expected/file-symbols.json",
  "content": "{\n  \"about\": \"Expected M1 result for test-source/, written by hand from mvp_docs/06_test_plan.md, with the IDs and enclosing functions inferred in mvp_docs/99_findings.md section 5. Declaration references are checked generically: one per symbol, at the symbol's location.\",\n  \"files\": [\"src/counter.ts\", \"src/main.ts\", \"src/math.ts\"],\n  \"symbols\": [\n    { \"file\": \"src/math.ts\", \"name\": \"PRECISION\", \"kind\": \"variable\", \"line\": 1, \"exported\": true, \"id\": \"src/math.ts#PRECISION@1:14\" },\n    { \"file\": \"src/math.ts\", \"name\": \"round\", \"kind\": \"function\", \"line\": 3, \"exported\": true, \"id\": \"src/math.ts#round@3:17\" },\n    { \"file\": \"src/math.ts\", \"name\": \"value\", \"kind\": \"parameter\", \"line\": 3, \"exported\": false, \"id\": \"src/math.ts#value@3:23\" },\n    { \"file\": \"src/math.ts\", \"name\": \"factor\", \"kind\": \"variable\", \"line\": 4, \"exported\": false, \"id\": \"src/math.ts#factor@4:9\" },\n    { \"file\": \"src/counter.ts\", \"name\": \"round\", \"kind\": \"import\", \"line\": 1, \"exported\": false, \"id\": \"src/counter.ts#round@1:10\", \"import\": { \"from\": \"./math\", \"name\": \"round\" } },\n    { \"file\": \"src/counter.ts\", \"name\": \"total\", \"kind\": \"variable\", \"line\": 3, \"exported\": false, \"id\": \"src/counter.ts#total@3:5\" },\n    { \"file\": \"src/counter.ts\", \"name\": \"add\", \"kind\": \"function\", \"line\": 5, \"exported\": true, \"id\": \"src/counter.ts#add@5:17\" },\n    { \"file\": \"src/counter.ts\", \"name\": \"amount\", \"kind\": \"parameter\", \"line\": 5, \"exported\": false, \"id\": \"src/counter.ts#amount@5:21\" },\n    { \"file\": \"src/main.ts\", \"name\": \"add\", \"kind\": \"import\", \"line\": 1, \"exported\": false, \"id\": \"src/main.ts#add@1:10\", \"import\": { \"from\": \"./counter\", \"name\": \"add\" } },\n    { \"file\": \"src/main.ts\", \"name\": \"PRECISION\", \"kind\": \"import\", \"line\": 2, \"exported\": false, \"id\": \"src/main.ts#PRECISION@2:10\", \"import\": { \"from\": \"./math\", \"name\": \"PRECISION\" } },\n    { \"file\": \"src/main.ts\", \"name\": \"run\", \"kind\": \"function\", \"line\": 4, \"exported\": false, \"id\": \"src/main.ts#run@4:10\" },\n    { \"file\": \"src/main.ts\", \"name\": \"first\", \"kind\": \"variable\", \"line\": 5, \"exported\": false, \"id\": \"src/main.ts#first@5:9\" },\n    { \"file\": \"src/main.ts\", \"name\": \"label\", \"kind\": \"variable\", \"line\": 7, \"exported\": false, \"id\": \"src/main.ts#label@7:11\" }\n  ],\n  \"functionRanges\": [\n    { \"id\": \"src/math.ts#round@3:17\", \"start\": \"3:1\", \"end\": \"6:2\" },\n    { \"id\": \"src/counter.ts#add@5:17\", \"start\": \"5:1\", \"end\": \"8:2\" },\n    { \"id\": \"src/main.ts#run@4:10\", \"start\": \"4:1\", \"end\": \"10:2\" }\n  ],\n  \"references\": [\n    { \"file\": \"src/math.ts\", \"line\": 4, \"name\": \"PRECISION\", \"kind\": \"read\", \"target\": \"src/math.ts#PRECISION@1:14\", \"enclosing\": \"src/math.ts#round@3:17\" },\n    { \"file\": \"src/math.ts\", \"line\": 5, \"name\": \"Math\", \"kind\": \"read\", \"target\": null, \"enclosing\": \"src/math.ts#round@3:17\" },\n    { \"file\": \"src/math.ts\", \"line\": 5, \"name\": \"value\", \"kind\": \"read\", \"target\": \"src/math.ts#value@3:23\", \"enclosing\": \"src/math.ts#round@3:17\" },\n    { \"file\": \"src/math.ts\", \"line\": 5, \"name\": \"factor\", \"kind\": \"read\", \"target\": \"src/math.ts#factor@4:9\", \"enclosing\": \"src/math.ts#round@3:17\" },\n    { \"file\": \"src/math.ts\", \"line\": 5, \"name\": \"factor\", \"kind\": \"read\", \"target\": \"src/math.ts#factor@4:9\", \"enclosing\": \"src/math.ts#round@3:17\" },\n    { \"file\": \"src/counter.ts\", \"line\": 6, \"name\": \"total\", \"kind\": \"write\", \"target\": \"src/counter.ts#total@3:5\", \"enclosing\": \"src/counter.ts#add@5:17\" },\n    { \"file\": \"src/counter.ts\", \"line\": 6, \"name\": \"total\", \"kind\": \"read\", \"target\": \"src/counter.ts#total@3:5\", \"enclosing\": \"src/counter.ts#add@5:17\" },\n    { \"file\": \"src/counter.ts\", \"line\": 6, \"name\": \"amount\", \"kind\": \"read\", \"target\": \"src/counter.ts#amount@5:21\", \"enclosing\": \"src/counter.ts#add@5:17\" },\n    { \"file\": \"src/counter.ts\", \"line\": 7, \"name\": \"round\", \"kind\": \"call\", \"target\": \"src/counter.ts#round@1:10\", \"enclosing\": \"src/counter.ts#add@5:17\" },\n    { \"file\": \"src/counter.ts\", \"line\": 7, \"name\": \"total\", \"kind\": \"read\", \"target\": \"src/counter.ts#total@3:5\", \"enclosing\": \"src/counter.ts#add@5:17\" },\n    { \"file\": \"src/main.ts\", \"line\": 5, \"name\": \"add\", \"kind\": \"call\", \"target\": \"src/main.ts#add@1:10\", \"enclosing\": \"src/main.ts#run@4:10\" },\n    { \"file\": \"src/main.ts\", \"line\": 6, \"name\": \"first\", \"kind\": \"read\", \"target\": \"src/main.ts#first@5:9\", \"enclosing\": \"src/main.ts#run@4:10\" },\n    { \"file\": \"src/main.ts\", \"line\": 7, \"name\": \"PRECISION\", \"kind\": \"read\", \"target\": \"src/main.ts#PRECISION@2:10\", \"enclosing\": \"src/main.ts#run@4:10\" },\n    { \"file\": \"src/main.ts\", \"line\": 8, \"name\": \"console\", \"kind\": \"read\", \"target\": null, \"enclosing\": \"src/main.ts#run@4:10\" },\n    { \"file\": \"src/main.ts\", \"line\": 8, \"name\": \"label\", \"kind\": \"read\", \"target\": \"src/main.ts#label@7:11\", \"enclosing\": \"src/main.ts#run@4:10\" },\n    { \"file\": \"src/main.ts\", \"line\": 8, \"name\": \"first\", \"kind\": \"read\", \"target\": \"src/main.ts#first@5:9\", \"enclosing\": \"src/main.ts#run@4:10\" },\n    { \"file\": \"src/main.ts\", \"line\": 12, \"name\": \"run\", \"kind\": \"call\", \"target\": \"src/main.ts#run@4:10\", \"enclosing\": \"src/main.ts\" }\n  ],\n  \"mustNotAppear\": [\n    { \"file\": \"src/math.ts\", \"line\": 5, \"name\": \"round\", \"why\": \"property name in Math.round\" },\n    { \"file\": \"src/main.ts\", \"line\": 8, \"name\": \"log\", \"why\": \"property name in console.log\" }\n  ]\n}\n"
}
```

### 2026-11-07 03:53:14 — Tool call: Write

```json
{
  "file_path": "/home/zaida/viewer/mvp_docs/zaansouvi-mvp/tests/m1/check.mjs",
  "content": "// TEST-01 for M1 alone: runs file-symbols on every test-source file (dry run, then real run, as the\n// Runner will), then compares the outputs with expected/file-symbols.json. Prints every difference.\n// Usage: node tests/m1/check.mjs        Exit code 0 when everything matches.\n\nimport { spawnSync } from \"node:child_process\";\nimport fs from \"node:fs\";\nimport path from \"node:path\";\n\nconst root = path.resolve(import.meta.dirname, \"..\", \"..\");\nconst launcher = path.join(root, \"app/tools/file-symbols/file-symbols\");\nconst sourceRoot = path.join(root, \"test-source\");\nconst expected = JSON.parse(fs.readFileSync(path.join(root, \"expected/file-symbols.json\"), \"utf8\"));\n\nconst problems = [];\nconst fail = (msg) => problems.push(msg);\nconst outputs = {};\nconst timings = [];\n\nfor (const file of expected.files) {\n  const input = JSON.stringify({ source_root: sourceRoot, file_id: file, file_path: path.join(sourceRoot, file) });\n\n  const dry = spawnSync(launcher, [\"--dry-run\", \"--stdin\"], { input, encoding: \"utf8\" });\n  const lines = dry.stdout.trim().split(\"\\n\");\n  const last = JSON.parse(lines.at(-1));\n  if (dry.status !== 0 || last.dryRun !== \"go\") fail(`${file}: dry run should be go, got exit ${dry.status}: ${lines.at(-1)}`);\n  const preview = lines.map((l) => JSON.parse(l)).find((l) => l.type === \"preview\");\n  if (!preview) fail(`${file}: dry run printed no preview line`);\n\n  const t0 = performance.now();\n  const real = spawnSync(launcher, [\"--stdin\"], { input, encoding: \"utf8\" });\n  timings.push({ file, ms: Math.round(performance.now() - t0) });\n  if (real.status !== 0) {\n    fail(`${file}: real run failed, exit ${real.status}: ${real.stderr.trim()}`);\n    continue;\n  }\n  const summary = JSON.parse(real.stdout.trim().split(\"\\n\").at(-1));\n  outputs[file] = JSON.parse(fs.readFileSync(summary.output, \"utf8\"));\n  if (preview && JSON.stringify(preview.content) !== JSON.stringify(outputs[file])) {\n    fail(`${file}: the dry-run preview differs from the real output`);\n  }\n}\n\nconst all = (key) => Object.values(outputs).flatMap((o) => o[key]);\nconst symbols = all(\"symbols\");\nconst references = all(\"references\");\n\n// Symbols: exact set.\nconst symKey = (s) => [s.id, s.name, s.kind, s.exported, s.import ? `${s.import.from}:${s.import.name}` : \"\"].join(\" | \");\nconst gotSymbols = new Set(symbols.map(symKey));\nconst wantSymbols = new Set(\n  expected.symbols.map((e) => {\n    const s = symbols.find((x) => x.id === e.id);\n    if (s && (s.parent !== e.file || s.location.start.line !== e.line)) fail(`symbol ${e.id}: wrong parent or line`);\n    return symKey(e);\n  }),\n);\nfor (const k of wantSymbols) if (!gotSymbols.has(k)) fail(`missing symbol: ${k}`);\nfor (const k of gotSymbols) if (!wantSymbols.has(k)) fail(`unexpected symbol: ${k}`);\n\n// Function ranges (FND-09: the whole declaration).\nfor (const r of expected.functionRanges) {\n  const s = symbols.find((x) => x.id === r.id);\n  const got = s && `${s.range.start.line}:${s.range.start.column}-${s.range.end.line}:${s.range.end.column}`;\n  if (got !== `${r.start}-${r.end}`) fail(`range of ${r.id}: expected ${r.start}-${r.end}, got ${got}`);\n}\n\n// Declaration references: one per symbol, at its location.\nfor (const s of symbols) {\n  const decl = references.filter((r) => r.kind === \"declaration\" && r.to === s.id);\n  if (decl.length !== 1) fail(`symbol ${s.id}: expected 1 declaration reference, got ${decl.length}`);\n  else if (JSON.stringify(decl[0].location) !== JSON.stringify(s.location)) fail(`symbol ${s.id}: declaration reference at a different location`);\n}\n\n// Other references: multiset comparison.\nconst refKey = (r) => [r.file, r.line, r.name, r.kind, r.target ?? \"none\", r.enclosing].join(\" | \");\nconst count = (keys) => keys.reduce((m, k) => m.set(k, (m.get(k) ?? 0) + 1), new Map());\nconst got = count(\n  references\n    .filter((r) => r.kind !== \"declaration\")\n    .map((r) => refKey({ file: r.location.file, line: r.location.start.line, name: r.name, kind: r.kind, target: r.to, enclosing: r.enclosing })),\n);\nconst want = count(expected.references.map(refKey));\nfor (const [k, n] of want) if ((got.get(k) ?? 0) !== n) fail(`reference expected ${n}x, got ${got.get(k) ?? 0}x: ${k}`);\nfor (const [k, n] of got) if (!want.has(k)) fail(`unexpected reference (${n}x): ${k}`);\n\n// Uniform relation fields (FND-02).\nfor (const r of references) {\n  if (r.from !== r.enclosing || r.to !== r.symbol) fail(`reference ${r.id}: from/to don't mirror enclosing/symbol`);\n}\n\n// Property names must not appear.\nfor (const m of expected.mustNotAppear) {\n  if (references.some((r) => r.location.file === m.file && r.location.start.line === m.line && r.name === m.name)) {\n    fail(`must not appear: ${m.name} at ${m.file}:${m.line} (${m.why})`);\n  }\n}\n\n// Repeatability (FND-29): a second run gives byte-identical output.\nfor (const file of expected.files) {\n  const input = JSON.stringify({ source_root: sourceRoot, file_id: file });\n  const again = spawnSync(launcher, [\"--stdin\"], { input, encoding: \"utf8\" });\n  const summary = JSON.parse(again.stdout.trim().split(\"\\n\").at(-1));\n  if (summary.change !== \"unchanged\") fail(`${file}: second run changed the output (${summary.change})`);\n}\n\nconsole.log(`files: ${Object.keys(outputs).length}, symbols: ${symbols.length}, references: ${references.length}`);\nconsole.log(`real-run timings (ms): ${timings.map((t) => `${t.file} ${t.ms}`).join(\", \")}`);\nif (problems.length === 0) {\n  console.log(\"PASS: M1 output matches expected/file-symbols.json\");\n} else {\n  console.log(`FAIL: ${problems.length} difference(s)`);\n  for (const p of problems) console.log(\"  - \" + p);\n  process.exitCode = 1;\n}\n"
}
```

### 2026-11-07 03:53:15 — Tool call: Bash

```json
{
  "command": "cd /home/zaida/viewer/mvp_docs/zaansouvi-mvp && node tests/m1/check.mjs",
  "description": "Compare M1 output with the expected result"
}
```

### 2026-11-07 03:53:15 — Tool result

```
File created successfully at: /home/zaida/viewer/mvp_docs/zaansouvi-mvp/expected/file-symbols.json (file state is current in your context — no need to Read it back)
```

### 2026-11-07 03:53:15 — Tool result

```
File created successfully at: /home/zaida/viewer/mvp_docs/zaansouvi-mvp/tests/m1/check.mjs (file state is current in your context — no need to Read it back)
```

### 2026-11-07 03:53:20 — Tool result

```
files: 3, symbols: 13, references: 30
real-run timings (ms): src/counter.ts 440, src/main.ts 451, src/math.ts 495
PASS: M1 output matches expected/file-symbols.json
```

## 2026-11-07 03:53:22 — Claude

It matches exactly, including the dry-run preview and a byte-identical second run. Now the broken-input tests B1–B7, plus a few extras:

### 2026-11-07 03:53:49 — Tool call: Write

```json
{
  "file_path": "/home/zaida/viewer/mvp_docs/zaansouvi-mvp/tests/m1/broken.sh",
  "content": "#!/usr/bin/env bash\n# Broken-input tests for M1 run by hand (06_test_plan.md, B1 to B7), plus a few extras.\n# Uses a temporary output_root, so the real store in data/ is not touched. last_run.json next to\n# the launcher is backed up first and restored at the end.\n# Usage: bash tests/m1/broken.sh        Exit code 0 when every check passes.\n\nset -u\nROOT=$(cd -- \"$(dirname -- \"$0\")/../..\" && pwd)\nM1=\"$ROOT/app/tools/file-symbols/file-symbols\"\nLAST_RUN=\"$ROOT/app/tools/file-symbols/last_run.json\"\nSRC=\"$ROOT/test-source\"\nTMP=$(mktemp -d)\nOUT=\"$TMP/out\"\nSTORE=\"$OUT/file-symbols\"\nPASS=0\nFAIL=0\n\n[ -f \"$LAST_RUN\" ] && cp \"$LAST_RUN\" \"$TMP/last_run.backup\"\nrestore() {\n  if [ -f \"$TMP/last_run.backup\" ]; then cp \"$TMP/last_run.backup\" \"$LAST_RUN\"; else rm -f \"$LAST_RUN\"; fi\n  rm -rf \"$TMP\"\n}\ntrap restore EXIT\n\n# Run M1, keep stdout, stderr and the exit code.\nrun() { \"$M1\" \"$@\" >\"$TMP/stdout\" 2>\"$TMP/stderr\"; CODE=$?; }\nrun_in() { local input=$1; shift; \"$M1\" \"$@\" <\"$input\" >\"$TMP/stdout\" 2>\"$TMP/stderr\"; CODE=$?; }\n\n# Hash of everything a run could write: the temporary store and last_run.json.\nsnapshot() {\n  { find \"$OUT\" -type f -exec sha256sum {} + 2>/dev/null | sort; sha256sum \"$LAST_RUN\" 2>/dev/null || echo \"no last_run\"; } | sha256sum\n}\n\ncheck() { # check <name> <condition text> <0|1>\n  if [ \"$3\" -eq 0 ]; then PASS=$((PASS + 1)); echo \"  ok    $1: $2\"; else FAIL=$((FAIL + 1)); echo \"  FAIL  $1: $2\"; fi\n}\nexpect_code() { [ \"$CODE\" -eq \"$2\" ]; check \"$1\" \"exit code $2 (got $CODE)\" $?; }\nexpect_stderr() { grep -q \"$2\" \"$TMP/stderr\"; check \"$1\" \"standard error mentions $2\" $?; }\nexpect_unchanged() { [ \"$(snapshot)\" = \"$BEFORE\" ]; check \"$1\" \"nothing written\" $?; }\njson_field() { node -e 'const fs=require(\"fs\");const v=JSON.parse(fs.readFileSync(process.argv[1],\"utf8\"));console.log(process.argv[2].split(\".\").reduce((o,k)=>o?.[k],v))' \"$1\" \"$2\"; }\nlast_stdout_field() { tail -n 1 \"$TMP/stdout\" > \"$TMP/last_line\"; json_field \"$TMP/last_line\" \"$1\"; }\n\ncat >\"$TMP/good.json\" <<EOF\n{ \"source_root\": \"$SRC\", \"file_id\": \"src/math.ts\", \"file_path\": \"$SRC/src/math.ts\", \"output_root\": \"$OUT\" }\nEOF\n\necho \"Setup: one good run\"\nrun --json \"$TMP/good.json\"\nexpect_code \"setup\" 0\nGOOD_OUTPUT=$(sha256sum \"$STORE/output/src__math.ts.json\" | cut -d' ' -f1)\n\necho \"B1: both --json and --stdin\"\nBEFORE=$(snapshot)\nrun_in \"$TMP/good.json\" --json \"$TMP/good.json\" --stdin\nexpect_code B1 2; expect_stderr B1 E1; expect_unchanged B1\n\necho \"B2: --json pointing to a missing file\"\nBEFORE=$(snapshot)\nrun --json \"$TMP/missing.json\"\nexpect_code B2 2; expect_stderr B2 E2; expect_unchanged B2\n\necho \"B2b: --json pointing to a file that isn't JSON\"\necho \"{ not json\" >\"$TMP/bad.json\"\nBEFORE=$(snapshot)\nrun --json \"$TMP/bad.json\"\nexpect_code B2b 2; expect_stderr B2b E2; expect_unchanged B2b\n\necho \"B3: JSON missing file_id\"\necho \"{ \\\"source_root\\\": \\\"$SRC\\\", \\\"output_root\\\": \\\"$OUT\\\" }\" >\"$TMP/no_file_id.json\"\nBEFORE=$(snapshot)\nrun --json \"$TMP/no_file_id.json\"\nexpect_code B3 2; expect_stderr B3 E13; expect_unchanged B3\n\necho \"B3b: file_id of the wrong shape (a number)\"\necho \"{ \\\"source_root\\\": \\\"$SRC\\\", \\\"file_id\\\": 42, \\\"output_root\\\": \\\"$OUT\\\" }\" >\"$TMP/bad_shape.json\"\nBEFORE=$(snapshot)\nrun --json \"$TMP/bad_shape.json\"\nexpect_code B3b 2; expect_stderr B3b E13; expect_unchanged B3b\n\necho \"B4: no parameters, last_run.json deleted\"\nrm -f \"$LAST_RUN\"\nBEFORE=$(snapshot)\nrun\nexpect_code B4 2; expect_stderr B4 E3; expect_unchanged B4\n[ ! -f \"$LAST_RUN\" ]; check B4 \"last_run.json not created\" $?\n\necho \"B5: no parameters, last_run.json present: repeats the last run\"\nrun --json \"$TMP/good.json\"\nLOGS_BEFORE=$(ls \"$STORE/logs\" | wc -l)\nrun\nexpect_code B5 0\n[ \"$(sha256sum \"$STORE/output/src__math.ts.json\" | cut -d' ' -f1)\" = \"$GOOD_OUTPUT\" ]; check B5 \"same output as before\" $?\n[ \"$(ls \"$STORE/logs\" | wc -l)\" -eq $((LOGS_BEFORE + 1)) ]; check B5 \"one new log\" $?\n[ \"$(json_field \"$STORE/result.json\" parameterSource)\" = \"last_run\" ]; check B5 \"result says the parameters came from last_run\" $?\n\necho \"B6: a file that doesn't exist (valid JSON)\"\ncat >\"$TMP/nofile.json\" <<EOF\n{ \"source_root\": \"$SRC\", \"file_id\": \"src/nope.ts\", \"output_root\": \"$OUT\" }\nEOF\nrun --json \"$TMP/nofile.json\"\nexpect_code B6 1; expect_stderr B6 E6\n[ \"$(json_field \"$STORE/result.json\" status)\" = \"failed\" ]; check B6 \"result.json failed\" $?\n[ \"$(json_field \"$STORE/result.json\" error.code)\" = \"E6\" ]; check B6 \"result.json error E6\" $?\n[ \"$(json_field \"$LAST_RUN\" file_id)\" = \"src/nope.ts\" ]; check B6 \"last_run.json updated\" $?\n[ \"$(json_field \"$LAST_RUN\" _last_run.outcome)\" = \"failed\" ]; check B6 \"last_run.json records the failure\" $?\n[ \"$(sha256sum \"$STORE/output/src__math.ts.json\" | cut -d' ' -f1)\" = \"$GOOD_OUTPUT\" ]; check B6 \"earlier output kept\" $?\n[ ! -f \"$STORE/output/src__nope.ts.json\" ]; check B6 \"no output for the failed file\" $?\n\necho \"B7: syntax error, dry run (as the Runner does it)\"\nmkdir -p \"$TMP/src7/src\"\nprintf 'export function broken(a: number {\\n  return a;\\n}\\n' >\"$TMP/src7/src/broken.ts\"\ncat >\"$TMP/broken.json\" <<EOF\n{ \"source_root\": \"$TMP/src7\", \"file_id\": \"src/broken.ts\", \"output_root\": \"$OUT\" }\nEOF\nBEFORE=$(snapshot)\nrun --dry-run --json \"$TMP/broken.json\"\nexpect_code B7 1\n[ \"$(last_stdout_field dryRun)\" = \"no-go\" ]; check B7 \"last line is no-go\" $?\n[ \"$(last_stdout_field error.code)\" = \"E12\" ]; check B7 \"error E12\" $?\n[ \"$(last_stdout_field error.location.start.line)\" = \"1\" ]; check B7 \"error points at line 1\" $?\nexpect_unchanged B7\n\necho \"B7b: syntax error, real run\"\nrun --json \"$TMP/broken.json\"\nexpect_code B7b 1; expect_stderr B7b E12\n[ \"$(json_field \"$STORE/result.json\" error.code)\" = \"E12\" ]; check B7b \"result.json error E12\" $?\n\necho \"X1: dry run on a good file: go, preview, nothing written\"\nBEFORE=$(snapshot)\nrun --dry-run --json \"$TMP/good.json\"\nexpect_code X1 0\n[ \"$(last_stdout_field dryRun)\" = \"go\" ]; check X1 \"last line is go\" $?\ngrep -q '\"type\":\"preview\"' \"$TMP/stdout\"; check X1 \"preview line printed\" $?\nexpect_unchanged X1\n\necho \"X2: unknown option (TS-30 / FND-14)\"\nBEFORE=$(snapshot)\nrun --json \"$TMP/good.json\" --nope\nexpect_code X2 2; expect_stderr X2 E1; expect_unchanged X2\n\necho \"X3: dry run with an invocation error also prints no-go (FND-13)\"\nBEFORE=$(snapshot)\nrun --dry-run --json \"$TMP/missing.json\"\nexpect_code X3 2\n[ \"$(last_stdout_field kind)\" = \"invocation\" ]; check X3 \"no-go line marked as an invocation error\" $?\nexpect_unchanged X3\n\necho \"X4: file_path and file_id disagree (value problem: run error)\"\ncat >\"$TMP/incongruent.json\" <<EOF\n{ \"source_root\": \"$SRC\", \"file_id\": \"src/main.ts\", \"file_path\": \"$SRC/src/math.ts\", \"output_root\": \"$OUT\" }\nEOF\nrun --json \"$TMP/incongruent.json\"\nexpect_code X4 1; expect_stderr X4 E12\n\necho \"X5: command-line parameter overrides the JSON\"\nrun --json \"$TMP/good.json\" --file-id src/main.ts --file-path \"$SRC/src/main.ts\"\nexpect_code X5 0\n[ -f \"$STORE/output/src__main.ts.json\" ]; check X5 \"main.ts output written\" $?\n\necho \"X6: --log copies the log\"\nrun --json \"$TMP/good.json\" --log \"$TMP/copy.log\"\nexpect_code X6 0\ngrep -q \"run_finished\" \"$TMP/copy.log\"; check X6 \"copy has the full log\" $?\n\necho\necho \"passed: $PASS, failed: $FAIL\"\n[ \"$FAIL\" -eq 0 ]\n"
}
```

### 2026-11-07 03:53:50 — Tool call: Bash

```json
{
  "command": "bash tests/m1/broken.sh",
  "description": "Run the M1 broken-input tests"
}
```

### 2026-11-07 03:53:50 — Tool result

```
File created successfully at: /home/zaida/viewer/mvp_docs/zaansouvi-mvp/tests/m1/broken.sh (file state is current in your context — no need to Read it back)
```

### 2026-11-07 03:54:00 — Tool result

```
Setup: one good run
  ok    setup: exit code 0 (got 0)
B1: both --json and --stdin
  ok    B1: exit code 2 (got 2)
  ok    B1: standard error mentions E1
  ok    B1: nothing written
B2: --json pointing to a missing file
  ok    B2: exit code 2 (got 2)
  ok    B2: standard error mentions E2
  ok    B2: nothing written
B2b: --json pointing to a file that isn't JSON
  ok    B2b: exit code 2 (got 2)
  ok    B2b: standard error mentions E2
  ok    B2b: nothing written
B3: JSON missing file_id
  ok    B3: exit code 2 (got 2)
  ok    B3: standard error mentions E13
  ok    B3: nothing written
B3b: file_id of the wrong shape (a number)
  ok    B3b: exit code 2 (got 2)
  ok    B3b: standard error mentions E13
  ok    B3b: nothing written
B4: no parameters, last_run.json deleted
  ok    B4: exit code 2 (got 2)
  ok    B4: standard error mentions E3
  ok    B4: nothing written
  ok    B4: last_run.json not created
B5: no parameters, last_run.json present: repeats the last run
  ok    B5: exit code 0 (got 0)
  ok    B5: same output as before
  ok    B5: one new log
  ok    B5: result says the parameters came from last_run
B6: a file that doesn't exist (valid JSON)
  ok    B6: exit code 1 (got 1)
  ok    B6: standard error mentions E6
  ok    B6: result.json failed
  ok    B6: result.json error E6
  ok    B6: last_run.json updated
  ok    B6: last_run.json records the failure
  ok    B6: earlier output kept
  ok    B6: no output for the failed file
B7: syntax error, dry run (as the Runner does it)
  ok    B7: exit code 1 (got 1)
  ok    B7: last line is no-go
  ok    B7: error E12
  ok    B7: error points at line 1
  ok    B7: nothing written
B7b: syntax error, real run
  ok    B7b: exit code 1 (got 1)
  ok    B7b: standard error mentions E12
  ok    B7b: result.json error E12
X1: dry run on a good file: go, preview, nothing written
  ok    X1: exit code 0 (got 0)
  ok    X1: last line is go
  ok    X1: preview line printed
  ok    X1: nothing written
X2: unknown option (TS-30 / FND-14)
  ok    X2: exit code 2 (got 2)
  ok    X2: standard error mentions E1
  ok    X2: nothing written
X3: dry run with an invocation error also prints no-go (FND-13)
  ok    X3: exit code 2 (got 2)
  ok    X3: no-go line marked as an invocation error
  ok    X3: nothing written
X4: file_path and file_id disagree (value problem: run error)
  ok    X4: exit code 1 (got 1)
  ok    X4: standard error mentions E12
X5: command-line parameter overrides the JSON
  ok    X5: exit code 0 (got 0)
  ok    X5: main.ts output written
X6: --log copies the log
  ok    X6: exit code 0 (got 0)
  ok    X6: copy has the full log

passed: 56, failed: 0
```

## 2026-11-07 03:54:02 — Claude

All 56 checks pass. One more check: the "acceptable failures" rule says unsupported constructs must never crash the tool, so I'll feed it a file full of them.

### 2026-11-07 03:54:09 — Tool call: Bash

```json
{
  "command": "D=/tmp/claude-1000/-home-zaida-viewer-mvp-docs/fb4dbeae-b7f9-4910-94ee-f53420a09bf5/scratchpad/edge && mkdir -p $D/src && cat > $D/src/edge.ts <<'EOF'\nimport def, { a as b, type T } from \"./x\";\nimport * as ns from \"lodash\";\nimport \"./side\";\nexport { b };\nexport * from \"./y\";\ninterface I { x: number }\ntype U = string | number;\nenum Color { Red, Green }\nnamespace N { export const z = 1; }\nclass Box<T> { private v: T; constructor(v: T) { this.v = v; } get(): T { return this.v; } }\nconst { p, q: [r, , s] } = { p: 1, q: [2, 3, 4] };\nconst arrow = (x: number, ...rest: number[]) => x + rest.length + b + def + ns.size;\nfunction over(a: string): void;\nfunction over(a: any) { label: for (const i of [1]) { if (i) break label; } return new Box(a); }\nlet n = 0; n++; n += 2;\nexport default arrow;\nconst o = { n, arrow, [\"k\" + n]: 1 } satisfies object;\nasync function* gen() { yield await Promise.resolve(import.meta); }\nEOF\necho \"{\\\"source_root\\\":\\\"$D\\\",\\\"file_id\\\":\\\"src/edge.ts\\\",\\\"output_root\\\":\\\"$D/out\\\"}\" | app/tools/file-symbols/file-symbols --stdin | cut -c1-400; echo \"exit=${PIPESTATUS[1]}\"\nnode -e 'const o=require(process.argv[1]);console.log(o.symbols.map(s=>s.kind+\":\"+s.name).join(\" \"));console.log(o.diagnostics.map(d=>d.code+\" \"+d.location.start.line+\" \"+d.message).join(\"\\n\"))' $D/out/file-symbols/output/src__edge.ts.json",
  "description": "Run M1 on a file of unsupported constructs"
}
```

### 2026-11-07 03:54:10 — Tool result

```
{"result":"succeeded","file_id":"src/edge.ts","output":"/tmp/claude-1000/-home-zaida-viewer-mvp-docs/fb4dbeae-b7f9-4910-94ee-f53420a09bf5/scratchpad/edge/out/file-symbols/output/src__edge.ts.json","change":"create","counts":{"symbols":19,"symbolsByKind":{"import":4,"parameter":5,"variable":7,"function":3},"references":38,"referencesByKind":{"declaration":19,"read":16,"call":1,"write":2},"unresolve
exit=0
import:def import:b import:T import:ns parameter:v variable:p variable:r variable:s variable:arrow parameter:x parameter:rest function:over parameter:a function:over parameter:a variable:i variable:n variable:o function:gen
I2 1 Best effort: default import: listed with import.name "default".
I2 2 Best effort: import from a package ("lodash"): listed, cannot be linked to a file.
I2 2 Best effort: namespace import: listed with import.name "*".
I1 3 Skipped: side-effect import of "./side".
I1 5 Skipped: re-export.
I1 6 Skipped: type-only declaration.
I1 7 Skipped: type-only declaration.
I1 8 Skipped: enum.
I1 9 Skipped: namespace or module declaration.
I2 10 Best effort: class: its name and members are not symbols; method bodies are analyzed.
I2 10 Best effort: method, constructor or accessor: parameters are listed.
I2 10 Best effort: method, constructor or accessor: parameters are listed.
I2 11 Best effort: destructuring: each bound name is listed as its own symbol.
I2 11 Best effort: destructuring: each bound name is listed as its own symbol.
I2 12 Best effort: arrow function: its parameters are listed, it gets no symbol of its own.
I2 13 Best effort: function without a body (overload signature): listed as a function.
I2 16 Best effort: export default / export =: the expression is analyzed, nothing is marked exported.
```

## 2026-11-07 03:54:12 — Claude

No crash: everything it skipped or handled on a best-effort basis is recorded as a note. Last, the READMEs:

### 2026-11-07 03:54:33 — Tool call: Write

````json
{
  "file_path": "/home/zaida/viewer/mvp_docs/zaansouvi-mvp/app/tools/file-symbols/README.md",
  "content": "# file-symbols (M1)\n\nReads **one** TypeScript file and lists its symbols and every reference to them (`04_tools.md`, M1). A standalone program: it depends only on Node built-ins and the `typescript` package, used only as a parser. It imports nothing from the Runner, the Viewer or another tool.\n\nThis is a first, generous version of the contract. It is meant to be overwritten once the open findings in `mvp_docs/99_findings.md` are settled.\n\n## Install and run\n\nNeeds Node 22.18 or later, which runs TypeScript directly (type stripping), so there is no build step.\n\n```\nnpm install                      # in this folder: typescript, @types/node\n./file-symbols --help\n./file-symbols --info            # the tool's self-description (DATA-08)\necho '{\"source_root\":\"../../../test-source\",\"file_id\":\"src/math.ts\"}' | ./file-symbols --stdin\nnpm run typecheck                # tsc, no output files\n```\n\n`file-symbols` is the launcher (the `tool_name.bin` of `toolset.md`, section 4.5). It passes its arguments through to `node src/file-symbols.ts`.\n\n## Parameters\n\nRead in this order (`TOOL-02`): command-line parameter options, then `--json <path>` or `--stdin` (both together is E1), then `last_run.json`. If there is no JSON input, the command-line options are applied on top of `last_run.json` (the MVP answer to `TS-30`). With nothing at all, the tool fails with E3.\n\n| Key | Option | Required | Meaning |\n|---|---|---|---|\n| `file_id` | `--file-id` | yes | Path relative to the source root, `/` separators, for example `src/math.ts` |\n| `file_path` | `--file-path` | one of these two | Actual path of the file to read |\n| `source_root` | `--source-root` | one of these two | Root of the examined source. If both are given, `file_path` relative to `source_root` must equal `file_id` (E12 otherwise) |\n| `output_root` | `--output-root` | no | Folder holding every tool's store. Default `<zaansouvi-mvp>/data/tools` (FND-07) |\n\nAny other key is an extra value and is ignored (`TOOL-08`).\n\n## What it writes\n\nThe store is `<output_root>/file-symbols/`.\n\n| File | When | Content |\n|---|---|---|\n| `output/<file-key>.json` | real run succeeded | `tool`, `version`, `formatVersion`, `file`, `sha256`, `dataNames`, `counts`, `symbols`, `references`, `diagnostics`. No times, so two runs over the same file give identical output |\n| `result.json` | every real run past the shape check | `status` (`succeeded` or `failed`), times, `parameterSource`, `parameters`, `read` (path, bytes, SHA-256), `outputs`, `counts`, `error`, `log` |\n| `logs/<timestamp>_<file-key>.log` | every real run past the shape check | `<ISO time>\\t<level>\\t<event>\\t<JSON>` lines and `# [type] text` comments (DATA-16) |\n| `last_run.json`, next to the launcher | every real run past the shape check | The flat parameters, plus `_last_run` (outcome, times, error). It can be passed back as is with `--json` |\n\n`<file-key>` is the file ID with `/` replaced by `__`, so `src/math.ts` gives `src__math.ts.json` (`ARCH-07`). Files are written to a temporary name and renamed, so they are never half-written. A failed run writes no output and keeps the earlier one.\n\nOn a real run, standard output gets one JSON summary line. The Runner should still read `result.json`.\n\n## Records\n\nFollowing `02_data_contracts.md`, with these additions:\n- **References** carry `enclosing`: the symbol ID of the enclosing function, or the file ID. They also carry `from` (= `enclosing`) and `to` (= `symbol`), so every relation has the same shape (FND-02).\n- **`range`** of a function is the whole declaration, from `export` or `function` to the closing brace (FND-09).\n- **`import`** may carry `typeOnly: true`.\n- **`dataNames`** in the output, and `jsonKey` and `fields` in `--info`, say which JSON key holds which data name, and which fields hold the ID, parent, from and to (FND-01).\n\n## Dry run\n\n`--dry-run` does the same work, writes nothing, and prints JSON lines:\n- `{\"type\":\"log\",...}` and `{\"type\":\"comment\",...}`: the log\n- `{\"type\":\"preview\",\"output\":...,\"change\":\"create|update|unchanged\",\"content\":{...}}`: the would-be output, so a Runner can chain dry runs (FND-04)\n- last line: `{\"dryRun\":\"go\",...}`, or `{\"dryRun\":\"no-go\",\"kind\":\"run|invocation\",\"error\":{...}}`\n\nOn an invocation error, a dry run prints the no-go line too, with exit code 2 (FND-13).\n\n## Errors and exit codes\n\n| Exit | Codes | Written |\n|---|---|---|\n| 0 | none | output, result, log, `last_run.json` |\n| 1 (run error) | E6 file missing or unreadable; E12 bad or incongruent value, or syntax errors (with the location of the first); E8 unexpected | result (`failed`), log, `last_run.json`; earlier output kept |\n| 2 (invocation error) | E1 malformed invocation; E2 unusable JSON input; E3 nothing to repeat; E13 missing or malformed parameter | nothing; message and a JSON line on standard error |\n\nSyntax errors come from `ts.transpileModule` with `reportDiagnostics`, a public API (FND-15).\n\n## Rules it follows\n\n- **Symbols:** function declarations, `const`/`let`/`var` names (destructured names too), parameters of any function, named, default and namespace imports. Function names belong to the scope they're declared in.\n- **References:** every identifier that is a declaration name, a call target, a read or an assignment target. Property names after a dot, member names, labels, and anything inside a type are not references (`TOOL-12`).\n- **Kinds:** `declaration`; `write` for the left side of an assignment, and for `++`/`--`; `call` only for a bare-name callee (FND-10); `read` otherwise.\n- **Resolution:** by name, nearest enclosing function first, then the file. Inside one scope it picks the last declaration before the reference, or the first one (for hoisting). Block scoping is ignored (`TOOL-13`). Names with no declaration in the file get `symbol: null`.\n- **Unsupported constructs** never crash the tool. Each one is recorded in `diagnostics` with severity `info`: `I1` when skipped, `I2` when handled on a best-effort basis.\n\n## Tests\n\nFrom `zaansouvi-mvp/`:\n- `node tests/m1/check.mjs`: TEST-01 for M1 alone. Runs each test file (dry run, then real run) and compares with `expected/file-symbols.json`. It also checks the preview, the declaration references, the function ranges and repeatability.\n- `bash tests/m1/broken.sh`: B1 to B7 from `06_test_plan.md`, plus extras (unknown option, invocation error in a dry run, incongruent paths, command-line override, `--log`). It uses a temporary store and restores `last_run.json`.\n"
}
````

### 2026-11-07 03:54:41 — Tool call: Write

````json
{
  "file_path": "/home/zaida/viewer/mvp_docs/zaansouvi-mvp/README.md",
  "content": "# zaansouvi-mvp\n\nThe ZaAnSouVi MVP, laid out as in `mvp_docs/01_architecture.md`. This is test code, meant to be overwritten.\n\n## Status\n\n| Part | Folder | Status |\n|---|---|---|\n| M1 file-symbols | `app/tools/file-symbols/` | **Done, standalone.** Passes `tests/m1/check.mjs` and `tests/m1/broken.sh`. See its README |\n| M2 cross-file-links | `app/tools/cross-file-links/` | Not started |\n| M3 symbol-scope | `app/tools/symbol-scope/` | Not started |\n| Runner | `app/runner/` | Not started |\n| Viewer | `app/viewer/server/`, `app/viewer/ui/` | Not started |\n| Shared library, tool helper | `app/shared/`, `app/tool-helper/` | Not started. M1 doesn't use the tool helper; it is self-contained on purpose |\n\n## Layout\n\n```\napp/          programs (Runner, Viewer, tools)\ndata/         each tool's store and the Runner's logs; can be deleted at any time (ARCH-09)\ntest-source/  the basic examined source, a copy of mvp_docs/test_plan/test-source/src\nexpected/     the expected results, written by hand\ntests/        test scripts\n```\n\n## Running M1 by hand\n\n```\ncd app/tools/file-symbols && npm install && cd ../../..\nnode tests/m1/check.mjs\nbash tests/m1/broken.sh\n```\n\nNeeds Node 22.18 or later (tested on 22.23.1).\n\n## Choices made here that the documents leave open\n\nM1 takes these answers to the findings in `mvp_docs/99_findings.md`. They are starting points, not decisions:\n\n| Finding | Choice in M1 |\n|---|---|\n| FND-01 data name to JSON key | `dataNames` in the output; `jsonKey` and `fields` in `--info` |\n| FND-02 uniform relations | References carry `enclosing`, plus `from`/`to` |\n| FND-04 dry-run chaining | The dry run prints the would-be output on a `preview` line |\n| FND-07 where tools write | `output_root` parameter, default `data/tools` |\n| FND-09 `range` | The whole declaration, from `export` or `function` |\n| FND-10 call or read | Only a bare-name callee is a call |\n| FND-13 no-go on invocation errors | Printed on standard output too, with exit code 2 |\n| FND-14 options | `--help`, `--version`, and one option per parameter |\n| FND-15 syntax errors | `ts.transpileModule` with `reportDiagnostics` |\n| FND-29 repeatability | No times in the output file; checked by `check.mjs` |\n"
}
````

### 2026-11-07 03:54:43 — Tool call: Bash

```json
{
  "command": "cat > .gitignore <<'EOF'\nnode_modules/\ndata/tools/*/output/*\ndata/tools/*/logs/*\ndata/tools/*/result.json\ndata/runner/logs/*\napp/tools/*/last_run.json\nEOF\nhead -4 data/tools/file-symbols/logs/$(ls data/tools/file-symbols/logs | head -1); echo; find . -path ./app/tools/file-symbols/node_modules -prune -o -type f -print | grep -v '/logs/' | sort",
  "description": "Add gitignore, show a log sample and the file list"
}
```

### 2026-11-07 03:54:43 — Tool result

```
File created successfully at: /home/zaida/viewer/mvp_docs/zaansouvi-mvp/app/tools/file-symbols/README.md (file state is current in your context — no need to Read it back)
```

### 2026-11-07 03:54:43 — Tool result

```
File created successfully at: /home/zaida/viewer/mvp_docs/zaansouvi-mvp/README.md (file state is current in your context — no need to Read it back)
```

### 2026-11-07 03:54:44 — Tool result

```
# [run] file-symbols 0.1.0: real run on src/math.ts
2026-11-07T03:52:36.649Z	info	run_started	{"tool":"file-symbols","version":"0.1.0","mode":"real","parameterSource":"stdin","parameters":{"source_root":"/home/zaida/viewer/mvp_docs/zaansouvi-mvp/test-source","file_id":"src/math.ts"},"argv":["--stdin"],"programDir":"/home/zaida/viewer/mvp_docs/zaansouvi-mvp/app/tools/file-symbols","store":"/home/zaida/viewer/mvp_docs/zaansouvi-mvp/data/tools/file-symbols","logCopy":null}
2026-11-07T03:52:36.650Z	info	last_run_saved	{"path":"/home/zaida/viewer/mvp_docs/zaansouvi-mvp/app/tools/file-symbols/last_run.json"}
# [step] checking parameter values

./app/tools/file-symbols/file-symbols
./app/tools/file-symbols/last_run.json
./app/tools/file-symbols/package.json
./app/tools/file-symbols/package-lock.json
./app/tools/file-symbols/README.md
./app/tools/file-symbols/src/file-symbols.ts
./app/tools/file-symbols/tsconfig.json
./data/tools/file-symbols/output/src__counter.ts.json
./data/tools/file-symbols/output/src__main.ts.json
./data/tools/file-symbols/output/src__math.ts.json
./data/tools/file-symbols/result.json
./expected/file-symbols.json
./.gitignore
./README.md
./tests/m1/broken.sh
./tests/m1/check.mjs
./test-source/src/counter.ts
./test-source/src/main.ts
./test-source/src/math.ts
```

## 2026-11-07 03:54:55 — Claude

M1 is written and works. It's a standalone program at `mvp_docs/zaansouvi-mvp/app/tools/file-symbols/`, and both test scripts pass: the expected-result check and all 56 broken-input checks.

**What I built**
- **Folder layout** from `01_architecture.md`: `app/` (runner, viewer, shared, tool-helper, three tool folders), `data/` (the tool stores and Runner logs), `test-source/` (a copy of the three test files), `expected/` and `tests/`. I put it inside `mvp_docs/`, next to `test_plan/`, so all MVP work stays in that folder; it can be moved later.
- **M1** is one TypeScript file, `src/file-symbols.ts`, plus a small launcher script. It imports only Node built-ins and the `typescript` parser. Node 22.18+ runs TypeScript directly, so there's no build step. It has every option from `TOOL-01` plus `--help` and `--version`, the three ways of reading parameters in the decided order, `last_run.json`, the store log, `result.json`, an atomic write of its output, and the full set of error codes and exit codes.
- **`expected/file-symbols.json`**: the expected result, written by hand from the test plan.
- **`tests/m1/check.mjs`**: runs each file with a dry run and then a real run, as the Runner will, and compares the output with the expected result.
- **`tests/m1/broken.sh`**: B1 to B7 plus six extra cases. It uses a temporary store and restores `last_run.json` afterwards.
- **READMEs**: the tool's README describes its full contract; the root README gives the status of each part.

**Test results**
- **Expected result:** all 13 symbols and 30 references match exactly, including the function ranges, the 13 declaration references, and the two property names (`Math.round`, `console.log`) that must not appear.
- **Dry run:** its preview is identical to the real output.
- **Repeatability:** a second run gives byte-identical output.
- **Broken inputs:** all pass. Invocation errors exit with 2 and write nothing; run errors exit with 1, record the failure and keep the earlier output; a syntax error makes the dry run say no-go, pointing at line 1.
- **Unsupported constructs:** a file full of classes, enums, destructuring, overloads, re-exports and the like runs without crashing. Each construct it skipped or handled on a best-effort basis is recorded as a note in the output.

**Format choices I made** (all listed in the root README):
- Every reference records the function it sits in (`enclosing`), and every relation has `from` and `to`.
- `--info` and the output say which JSON key holds which data name.
- The dry run prints the would-be output on a `preview` line, so a Runner can chain dry runs.
- An `output_root` parameter says where to write (default `data/tools`).
- A function's `range` is the whole declaration, from `export` or `function`.
- Only a bare-name callee counts as a call.
- Syntax errors come from `ts.transpileModule`, a public API.

These are starting answers to the findings in `99_findings.md`, not decisions. I haven't marked those findings as resolved.

**One timing worth noting:** each M1 run takes about 450 ms, mostly starting Node and loading the parser. At one process per file, a 1,000-file codebase would spend around 7–8 minutes in M1 alone. That's early evidence for `TS-31` and belongs in the findings note.

## 2026-11-07 04:49:47 — Context summary (conversation compacted)

This session is being continued from a previous conversation that ran out of context. The summary below covers the earlier portion of the conversation.

<system-reminder>
<tools-used-before-summary>Bash, Edit, Read, Write</tools-used-before-summary>
</system-reminder>
Summary:
1. Primary Request and Intent:
   - Check whether `mvp_docs/` is enough to build the MVP, consulting the parent working files when needed. Done: verdict about 85%, with a list of gaps.
   - "create a folder for test_plan and write the initial test app, make sure it runs correctly". Done: `mvp_docs/test_plan/test-source/`.
   - "read test_plan and infer what you can from teh open questions, show what is missing". Done, presented in chat.
   - "create file 99_findings and write all useful details of above". Done: `mvp_docs/99_findings.md`.
   - "which of the tools seems to be the first one that needs to be tested ?" Answered: M1, file-symbols.
   - Latest request: "create the zaansouvi-mvp folder structure and write m1 as a stand alone, self contained program. infer all inputs and outputs as you see fit, this is a test and will be overwriten so ve generous with the format". Implemented and tested; the final report to the user is still pending.
   - Project rules from CLAUDE.md:
     - The repo produces a document.
     - `mvp_docs/` is accepted only within that folder; [Decided] items in the working files win.
     - Use the [Decided]/[Proposed] markers and stable IDs.
     - Don't write `feasibility_and_execution_plan.md` yet.

2. Key Technical Concepts:
   - The design:
     - ZaAnSouVi has a Runner, a Viewer and tools M1 (file-symbols), M2 (cross-file-links) and M3 (symbol-scope).
     - Tools describe themselves with `--info` (no manifest).
     - JSON parameters arrive via `--json` or `--stdin`, with `last_run.json` next to the launcher.
     - Each tool reads one file per invocation.
     - The MVP uses a single SQLite database with `config_`/`project_` table prefixes.
   - Errors: invocation errors E1/E2/E3/E13 (exit 2, nothing written); run errors E6/E12/E8 (exit 1; result, log and last_run written; no partial output).
   - Dry run writes only to stdout, ending with a go/no-go line (DATA-17).
   - Log format: `<ISO>\t<level>\t<event>\t<JSON>`, comments `# [type] text`.
   - IDs: Symbol `<file>#<name>@<line>:<col>`; Scope `<file>#scope@<line>:<col>` or `#scope@file`; Reference `<file>#ref@l:c`.
   - Runtime: Node 22.23.1 with built-in type stripping (no build step); TypeScript 5.6.3 used only as a parser; `ts.transpileModule` with `reportDiagnostics` for syntax errors (`parseDiagnostics` is internal).
   - Choices made for the findings:

| Finding | Choice |
|---|---|
| FND-01 | `dataNames`, `jsonKey`, `fields` |
| FND-02 | `enclosing`, `from`, `to` |
| FND-04 | `preview` line |
| FND-07 | `output_root` parameter |
| FND-09 | whole-declaration range |
| FND-10 | bare-name callee only is a call |
| FND-13 | no-go on stdout for invocation errors in a dry run |
| FND-14 | `--help`, `--version`, per-parameter options |
| FND-15 | `transpileModule` |
| FND-29 | no times in output |

3. Files and Code Sections:
   - **Read:** /home/zaida/viewer/CLAUDE.md, MVP_scope.md, toolset.md §4–5, runner.md, viewer.md, data_topology.md, security.md, and the open-question sections. Also all of mvp_docs: README.md and 01_architecture through 07_delivery.
   - **mvp_docs/test_plan/test-source/** (created):
     - `src/math.ts`, `src/counter.ts`, `src/main.ts`, exactly as in 06_test_plan.md
     - `package.json`: name zaansouvi-test-source; scripts check (`tsc --noEmit`), build, start (`tsc && node dist/main.js`); devDependency typescript 5.6.3
     - `tsconfig.json`: ES2020, commonjs, strict, rootDir src, outDir dist
     - `.gitignore`: node_modules/, dist/
     - Output: `precision 2 1.23`
   - **mvp_docs/test_plan/README.md** (created): how to run, expected output, notes for the Runner, still to add (expected/, B1–B10, C1–C2).
   - **mvp_docs/99_findings.md** (created), sections:
     1. Gaps to close before coding: FND-01..08
     2. Smaller gaps: FND-09..19
     3. Findings outside the folder: FND-20 (security.md "fallback to defaults" contradicts E3), FND-21 (MVP-1/3/4 still open)
     4. What holds up
     5. Inferred values: IDs, ranges, scope IDs, reference positions, SHA-256 hashes, invocation order, C2 IDs
     6. Open questions bearing on testing
     7. What the test plan is missing: FND-22..34, including a criteria-to-tests table
     8. Decisions needed from the user: M2 use-site links, the `--read-cache` rule, M1 file order, the human-review pass rule
   - **mvp_docs/README.md** (edited): added rows for `99_findings.md` and `test_plan/`; added "Findings use `FND`."
   - **mvp_docs/zaansouvi-mvp/** (created):
     - Folders: app/{shared, tool-helper, runner, viewer/server, viewer/ui, tools/{file-symbols/src, cross-file-links, symbol-scope}}; data/tools/file-symbols/{output, logs, state}; data/tools/{cross-file-links, symbol-scope}/{output, logs}; data/runner/logs; test-source/src (copy of the 3 files); expected; tests/m1
   - **app/tools/file-symbols/src/file-symbols.ts** (about 900 lines), the main M1 program:
     - Constants: TOOL "file-symbols", VERSION "0.1.0", OUTPUT_FORMAT_VERSION 1. `PROGRAM_DIR = path.resolve(import.meta.dirname, "..")`, MVP_ROOT three levels up, `DEFAULT_OUTPUT_ROOT = MVP_ROOT/data/tools`, `LAST_RUN_PATH = PROGRAM_DIR/last_run.json`. Exit codes 0/1/2.
     - `ToolError` class with `kind` ("invocation" | "run") and `diagnostic`. Helpers `invocationError` and `runError`.
     - `INFO` object: readsFiles `*.ts`; invocation per-file; parameters file_id (required), file_path, source_root, output_root; `requires [["file_path","source_root"]]`; outputs code.symbol (nodes, containedIn files.file, jsonKey symbols, fields) and code.reference (relations, jsonKey references, fields from/to); plus store, options, exitCodes, errorCodes (E1, E2, E3, E13, E6, E12, E8, I1, I2) and supportedConstructs.
     - `parseArgs`: flags `--info`, `--help`/`-h`, `--version`, `--dry-run`, `--stdin`; `--json <p>`, `--log <p>`; `--file-id`, `--file-path`, `--source-root`, `--output-root`; `--x=v` form accepted. Unknown option or positional argument gives E1, as do `--json` with `--stdin` and an option missing its value.
     - `loadParams`: `--json` file (E2), else stdin (E2 if empty or invalid; must be a JSON object), else last_run.json (E3 if unusable and there are no CLI params). CLI params are merged on top; `_last_run` is deleted.
     - `checkShape` (E13): file_id must be a non-empty string; optional keys must be non-empty strings; at least one of file_path and source_root.
     - `resolveInput` (E12): no backslash, not absolute, no `.`, `..` or empty segments, must end in `.ts`. If both file_path and source_root are given, `relative(source_root, file_path)` must equal file_id.
     - `readSource` (E6). `syntaxErrors` via `ts.transpileModule(..., {reportDiagnostics:true})`, giving E12 with the first location.
     - `analyze(fileId, text)`:
       - `createSourceFile(..., setParentNodes true, ScriptKind.TS)`
       - Pass 1 `collect(node, scope)`:
         - Function declarations: the name goes in the outer scope; params go in the function's scope.
         - Other function-likes (expression, arrow, method, ctor, accessors): params listed.
         - Variable declarations, including binding patterns (I2 note); exported via a VariableStatement export modifier.
         - Imports: named, default (`name:"default"`, I2), namespace (`"*"`, I2), package specifiers (I2), side-effect (I1), with typeOnly.
         - Export lists mark file-level symbols as exported; re-export is I1.
         - Notes: interface/type alias I1; enum I1; namespace I1; class I2; export default I2; type nodes skipped.
       - Pass 2 `walk`:
         - A declaration name gives kind "declaration".
         - `isNonReference` skips property access names, qualified names, member/class/function-expression names, binding propertyName, import/export specifiers, labels, meta properties.
         - `referenceKind`: write for assignment operators and ++/--; call for a bare callee of call/new; read otherwise.
         - `resolve`: walk function-like ancestors, then the file; the last declaration at or before the position, else the first.
         - `enclosingOf`: the nearest function declaration symbol, or a function/arrow expression assigned to a variable, else the file ID.
       - Records are sorted by position.
     - Loggers: `fileLogger(file, copy)`, where a failed copy becomes a warning; `stdoutLogger` emits `{type:"log"|"comment"}` JSON lines. HINTS for E6, E12, E8.
     - `work()` returns output `{tool, version, formatVersion, file, sha256, dataNames, counts, symbols, references, diagnostics}` (no times). outputPath is `store/output/<file-key>.json`, where file-key is file_id with `/` replaced by `__`, plus `.json`.
     - `realRun`:
       1. Create the log at `store/logs/<ISO with : as ->_<filekey>.log`.
       2. `writeLastRun` (flat params plus `_last_run {outcome, ...}`), atomic.
       3. Write output atomically, then result.json (status, times, durationMs, parameterSource, parameters, read, outputs, outputChange, counts, log), then last_run.json with outcome succeeded.
       4. Print a stdout summary line.
       - On failure: result failed with the error, last_run with outcome failed, stderr message, exit 1.
     - `dryRun`: prints the preview line `{type:"preview", output, change, wouldWrite, content}`, then `{dryRun:"go",...}` or `{dryRun:"no-go", kind:"run", error}`. `--log` is ignored with a warning.
     - `invocationFailure`: a stderr line plus a `{"invocationError":...}` JSON line; in a dry run, also a no-go line with kind "invocation". Exit 2.
     - Entry point: `process.exitCode = main(process.argv.slice(2))`.
   - **app/tools/file-symbols/file-symbols** (launcher, chmod +x):
     ```sh
     #!/bin/sh
     dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
     exec node --disable-warning=ExperimentalWarning "$dir/src/file-symbols.ts" "$@"
     ```
   - **app/tools/file-symbols/package.json**: type module; scripts typecheck (`tsc -p .`) and info; engines node >=22.18; dependency typescript 5.6.3; devDependency @types/node 22.10.2. **tsconfig.json**: ES2022, NodeNext, strict, noEmit, skipLibCheck, types ["node"]. npm install is done.
   - **app/tools/file-symbols/README.md**: the full contract (install, parameters table, what it writes, records, dry run, errors, rules, tests).
   - **expected/file-symbols.json**: 13 symbols with IDs and imports, functionRanges (round 3:1-6:2, add 5:1-8:2, run 4:1-10:2), 17 non-declaration references with target and enclosing, mustNotAppear (round at math 5, log at main 8).
   - **tests/m1/check.mjs**: for each file, a dry run (expect go plus a preview), then a real run with timing. It compares:
     - symbols (exact set) and function ranges
     - one declaration reference per symbol at its location
     - non-declaration references as a multiset including enclosing
     - from/to mirroring enclosing/symbol
     - mustNotAppear entries
     - repeatability (second run gives change "unchanged"), and that the preview equals the real output
   - **tests/m1/broken.sh**: uses a temporary output_root; backs up and restores last_run.json; uses a snapshot hash for "nothing written". Tests:
     - Setup, B1, B2, B2b, B3, B3b, B4, B5, B6, B7 (dry run on a syntax error: no-go E12 at line 1), B7b
     - X1 (good dry run), X2 (unknown option), X3 (dry-run invocation no-go), X4 (incongruent paths E12), X5 (CLI override), X6 (`--log` copy)
   - **zaansouvi-mvp/README.md**: status table (M1 done; others not started), layout, how to run, table of findings choices.
   - **zaansouvi-mvp/.gitignore**: node_modules/, data outputs, logs and result.json, data/runner/logs/*, app/tools/*/last_run.json.

4. Errors and fixes:
   - TS2352 in `errText` (`(e as Error).message` on `object & Record<"code", unknown>`). Fixed by changing it to `(e as unknown as Error).message`. The typecheck then passed.
   - There was no user feedback correcting my approach.

5. Problem Solving:
   - Verified the test source matches the plan exactly, and computed parser-based IDs, ranges and hashes.
   - Confirmed `parseDiagnostics` is not public, so M1 uses `transpileModule`.
   - Settled the `range` ambiguity: it must be the whole declaration, so `TOOL-31` self-exclusion is needed.
   - M1 results:
     - All three test files succeeded; counts match: math.ts 4 symbols and 9 references, counter.ts 4 and 9, main.ts 5 and 12.
     - check.mjs: "PASS: M1 output matches expected/file-symbols.json" (13 symbols, 30 references; about 440–495 ms per real run).
     - broken.sh: "passed: 56, failed: 0".
     - An edge-case file of unsupported constructs ran with exit 0, producing I1/I2 notes and no crash.

6. All user messages:
   - "check if the documentation in this folder is enough to build a mvp, check with the information referenced on the parent folder when necessary"
   - "create a folder for test_plan and write the initial test app, make sure it runs correctly"
   - "read test_plan and infer what you can from teh open questions, show what is missing"
   - "create file 99_findings and write all useful details of above"
   - "which of the tools seems to be the first one that needs to be tested ?"
   - "create the zaansouvi-mvp folder structure and write m1 as a stand alone, self contained program. infer all inputs and outputs as you see fit, this is a test and will be overwriten so ve generous with the format"

7. Pending Tasks:
   - Give the user the final summary of the M1 work: location, how to run it, test results, inferred choices, and the files created.
   - Not requested yet, but offered earlier: write the 99_findings fixes into mvp_docs as requirement IDs; the user decisions in 99_findings §8 remain open. Don't start these without being asked.

8. Current Work:
   - Just finished M1 in /home/zaida/viewer/mvp_docs/zaansouvi-mvp.
   - The last tool call wrote `.gitignore`, printed a log sample (lines like `2026-11-07T03:52:36.649Z	info	run_started	{...}` and `# [step] checking parameter values`), and listed the files.
   - Everything passes: typecheck, check.mjs PASS, broken.sh 56/56, edge case with no crash.
   - Remaining: write the concise final reply to the user. It should cover:
     - where things are (zaansouvi-mvp placed inside mvp_docs)
     - the inputs/outputs inferred and the findings choices
     - how to run (`cd app/tools/file-symbols && npm install`, `node tests/m1/check.mjs`, `bash tests/m1/broken.sh`)
     - the results
     - notes: test-source is a copy; runtime artifacts (data outputs, logs, last_run.json) exist from the test runs; Node ≥22.18 is required

9. Optional Next Step:
   - Report the completed M1 work to the user, answering the latest request: "create the zaansouvi-mvp folder structure and write m1 as a stand alone, self contained program. infer all inputs and outputs as you see fit, this is a test and will be overwriten so ve generous with the format".
   - Summarize the results: check.mjs PASS, broken.sh 56/56, no crash on the edge cases.
   - Do not start M2, M3 or the Runner without the user asking.

If you need specific details from before compaction (like exact code snippets, error messages, or content you generated), read the full transcript at: /home/zaida/.claude/projects/-home-zaida-viewer-mvp-docs/fb4dbeae-b7f9-4910-94ee-f53420a09bf5.jsonl
Continue the conversation from where it left off without asking the user any further questions. Resume directly — do not acknowledge the summary, do not recap what was happening, do not preface with "I'll continue" or similar. Pick up the last task as if the break never happened.

The messages after this summary are the most recent messages from before compaction, kept verbatim. The summary was written without seeing them, so something it says has not happened yet may already have happened in them.

## 2026-11-07 18:03:21 — User

write the verbatim log of this conversation in mvp_docs/zaansouvi-mvp/ailog/ with format yy/mm/dd timestamp ${<120 character topic}

### 2026-11-07 18:03:27 — Tool call: Bash

```json
{
  "command": "cd /home/zaida/.claude/projects/-home-zaida-viewer-mvp-docs/; ls -la *.jsonl; F=fb4dbeae-b7f9-4910-94ee-f53420a09bf5.jsonl; wc -l $F; head -c 1500 $F; echo; python3 -c \"\nimport json,collections\nc=collections.Counter()\nfor l in open('$F'):\n  d=json.loads(l); c[(d.get('type'), d.get('isCompactSummary',False))]+=1\nprint(c)\"",
  "description": "Inspect the conversation transcript file"
}
```

### 2026-11-07 18:03:28 — Tool result

```
-rw-------. 1 zaida zaida 2293862 Nov  7 12:03 fb4dbeae-b7f9-4910-94ee-f53420a09bf5.jsonl
396 fb4dbeae-b7f9-4910-94ee-f53420a09bf5.jsonl
{"type":"mode","mode":"normal","sessionId":"fb4dbeae-b7f9-4910-94ee-f53420a09bf5"}
{"type":"permission-mode","permissionMode":"auto","sessionId":"fb4dbeae-b7f9-4910-94ee-f53420a09bf5"}
{"type":"session-owner","accountUuid":"8c7a4c87-ffca-48fc-aa62-b8dd9b4d8e89","organizationUuid":"64453950-0b00-4a60-8347-93ccb53e21c6","sessionId":"fb4dbeae-b7f9-4910-94ee-f53420a09bf5"}
{"type":"atis-latch","atis":"","sessionId":"fb4dbeae-b7f9-4910-94ee-f53420a09bf5"}
{"type":"file-history-snapshot","messageId":"023886db-21d8-44e3-947c-dd4261e12eee","snapshot":{"messageId":"023886db-21d8-44e3-947c-dd4261e12eee","trackedFileBackups":{},"timestamp":"2026-11-07T02:59:54.272Z"},"isSnapshotUpdate":false}
{"parentUuid":null,"isSidechain":false,"promptId":"6ae5ae2c-0d32-45c3-8cc7-60ab898a642c","type":"user","message":{"role":"user","content":"check if the documentation in this folder is enough to build a mvp, check with the information referenced on the parent folder when necessary"},"uuid":"023886db-21d8-44e3-947c-dd4261e12eee","timestamp":"2026-11-07T02:59:54.270Z","permissionMode":"auto","origin":{"kind":"human"},"promptSource":"typed","turnOrigin":"human","turnPosition":{"promptIndex":1,"turnIndex":1},"userType":"external","entrypoint":"cli","cwd":"/home/zaida/viewer/mvp_docs","sessionId":"fb4dbeae-b7f9-4910-94ee-f53420a09bf5","version":"2.1.319","gitBranch":"HEAD"}
{"parentUuid":"023886db-21d8-44e3-947c-dd4261e12eee","isSidechain":false,"attachment":{"type":"environment","snapshot":{"workingDire
Counter({('assistant', False): 69, ('attachment', False): 46, ('api-request-blob', False): 45, ('user', False): 40, ('api-request', False): 30, ('mode', False): 23, ('permission-mode', False): 23, ('session-owner', False): 23, ('atis-latch', False): 23, ('last-prompt', False): 22, ('ai-title', False): 22, ('system', False): 8, ('file-history-delta', False): 8, ('file-history-snapshot', False): 7, ('tools-used', False): 4, ('api-request-shape', False): 2, ('user', True): 1})
Shell cwd was reset to /home/zaida/viewer/mvp_docs
```
