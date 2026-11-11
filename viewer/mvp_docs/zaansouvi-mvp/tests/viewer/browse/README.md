# Driving the Viewer's page in headless Firefox

Scripted checks of the page itself (`FND-69`, `FND-71` to `FND-73`). They complement the review by a person (`BE-95`): they print what the page holds and take screenshots; they don't judge them. `b7.sh` (with `b7-first.json` and `b7-second.json`) runs a broken input through the page (`B7`).

| File | What |
|---|---|
| `browse.sh` | Starts the Viewer on port 4399 and headless Firefox with a fresh profile, runs a steps file, stops both |
| `drive.py` | A tiny Marionette client (Firefox's remote protocol) that runs the steps |
| `frame-views.json` | Enters every scope view of `test-source`, prints each frame's contents and any overlap, takes screenshots (`UI-37`) |
| `selection.json` | Selects one node, adds a second and an edge, clears, then selects in a scope view; prints the selection, the highlighted edges and their colors, and the groups in Details (`UI-38`, `UI-56`) |
| `enter-marks.json` | At levels 1 to 3, lists the nodes marked as enterable and those not, with screenshots (`UI-45`) |
| `zoom-controls.json` | Prints the zoom and its readout after loading, Text, a zoom from code and Fit, and the controls' order from the bottom up (`UI-46`) |
| `problems.json` | Prints the Problems pane at levels 1 to 3 with This view and All, then on the source `runner` (a copy of the Runner's code, many repeats), and switches back to `test-source` (`UI-54`, `UI-57`). Needs both sources added in the Viewer |
| `contains.json` | Selects a file, a scope, then two scopes together, and prints Details' headings and Contains items (`UI-52`) |
| `problem-items.json` | Adds three invalid records to the page's copy of the model (two sharing a problem), then prints how each box in Problems is built: invalid, extra and unresolved (`UI-57`). Changes nothing on disk |
| `activity-count.json` | Logs a few verbose entries (selections, a level entered), then prints the activity line's "shown / logged" count with each level toggled, and where it sits (`UI-73`) |
| `tools-pane.json` | Clicks Run, then Dry run, on `test-source` (replacing the Runner's cache), then gives the Tools pane made-up answers through `window.zaansouvi.tools()`: a failed run, a run in progress, the same run ended failed, a no-go dry run; prints every box (`UI-58`) |
| `builtins.json` | Opens `test-source-mvp2`, lists Problems' built-ins for the whole run, grouped by library type, member by member (`UI-57`, `FND-100`) |
| `members.json` | Opens `test-source-mvp2`, enters `app.ts` and prints each node that lists its members, its label row by row and its size; then `shapes.ts` (`UI-30`, `FND-102`) |
| `folders.json` | Opens `test-source-mvp2` and prints each folder node's shape, polygon points, size and the "can be entered" mark's offset; then checks the Legend has a folder row (`FND-103`) |
| `subfolders.json` | Runs `test-source-mvp2` (waits for a new run), prints the top view's nodes and edges with their counts, then enters `src/report/charts/bars.ts` (`FND-104`) |
| `frame-title.json` | Enters `percent()`, `Base`, `shapes.ts` and `bars()` in `test-source-mvp2` and prints each frame's title, its place against the frame's top and every edge at it (`UI-36`, `FND-105`) |
| `range-text.json` | Selects `Anonymous.name`, `Anonymous` and `Base` in `test-source-mvp2` and prints each one's source box: its columns, its numbered lines, and whether it wraps (`UI-52`, `FND-106`, `FND-108`) |
| `inventory.json` | Opens `test-source-mvp2` and the Inventory: the first rows; [expand selected] on the root row and the Files rows compared with `expected-model3.json`'s, in order; the marks in the top view and in `Circle`'s, with the open rows and the scroll kept; [collapse all]; the search ("circle", a regex), [next] and [prev]; `Circle`'s content with its relations and "including members"; the Views and Model sections; the search's overview strip, none, one with the tree closed, in order once open, the current match marked, merged when crowded, the tree's width unchanged (`INV-43`); the keys in the tree, step by step, and Enter in the search field, the Graph unchanged (`INV-41`, `INV-42`); the tabs (`UI-87`) |
| `inventory-hiding.json` | The Inventory's second pass on `test-source-mvp2`: the "Show:" row; unticking `Circle` (the Graph, the marks, the checkboxes, its view, the breadcrumb); an edge's hover box with "(N hidden)"; [show all]; Parameters off in `total()`'s view; hiding the view shown; [Show in graph] on a node, a member, a relation and a view, the tab kept; a disabled button when hidden (`INV-33`, `INV-15`); then, on a fresh page, a hide keeping every position and the zoom, a show laying out again, a hide elsewhere moving nothing, and [Show in graph]'s glow fading (`FND-121`); then the kinds' bar and panel: at the bottom, opening upward, the fixed order, equal buttons, hiding from it, closing on a press outside and on Esc (`INV-33`); a restored selection keeping the tab (`FND-122`); [Recalc] in the last cell, laying the view out again with what is hidden and selected kept (`INV-33`) |
| `kind-frames.json` | Opens `test-source-mvp2`: the switch in the top view (disabled, top of the zoom column); in `shapes.ts`, each kind frame's label, members and kinds, the loose nodes, the blocks' order and any overlap, stubs outside the frame, labels in the top left corner; a tap selects nothing; a mouse drag of a frame moves its nodes, a drag of a node moves it alone; the switch off and on; `Circle`, a view of one kind (no frame), `app.ts`; the Legend's row (`UI-83`) |
| `crumbs.json` | Opens `test-source-mvp2` and prints the breadcrumb at the top view, `shapes.ts`, `Circle`, `bars.ts` and `bars()`: the buttons above, a file's folders as plain text, the dropdown of the views one level inside (its items, on top of the graph, closed by an outside click and by Escape), and moving through it and back (`UI-82`) |
| `drawer.json` | The drawer's handle: its width and the tabs at 380 px; a drag with pointer events, the drawer drawn over the Graph and the canvas unchanged until the release; the limits; a double-click; ‹ and ›; the width after a reload (`UI-88`) |
| `edges-switch.json` | Opens `test-source-mvp2`: in the top view, [Edges] off and on, printing the edges' width, opacity and count and whether any node, the pan or the zoom moved; in `shapes.ts` with `Base` selected, thin mode keeping its edges full, a write edge of the selection keeping its weight, a selected edge kept full; the switch held across entering `Circle` and a redraw by [Kinds] (`UI-85`) |
| `hover-tips.json` | Opens `test-source-mvp2`, enters `shapes.ts` and moves the pointer as a mouse would: onto `Circle`, the background, `Anonymous` (members in its label), a kind frame's border, an edge before and after it is selected, a stub, the rightmost node (the box flipped left), a file in the top view; prints each box's text and whether it stays inside the graph and takes no clicks; then that a middle-button pan, a zoom and a grab hide it, and the next move brings it back (`UI-86`) |
| `middle-pan.json` | Opens `test-source-mvp2`, enters `shapes.ts` and selects `Base`; then drags with the middle button from a node, a kind frame and the background, and with the left button from a node, printing the pan, the zoom, the nodes moved and the selection before and after (`UI-84`) |
| `frame-notes.json` | Enters seven views of `test-source-mvp2` and prints each frame's notes, their place against the frame's corner, whether they touch the title, and `text-events` (`UI-37`, `FND-109`) |
| `frame-notes-run.json` | Runs `test-source-mvp2` first (a new run, so the current tool's output), then prints the notes of `Circle`, `Anonymous`, `Base` and `summarize()` and whether they touch the title (`FND-110`) |
| `mvp2.json` | MVP 2: adds `test-source-mvp2` and a source with every status (its path inside, to edit), runs both through the API, then prints and shoots the top view, `shapes.ts`, the class `Circle`, a node's Details, Problems, and the status source's top view (`UI-47`, `UI-48`) |
| `layout-repeat.json` | Enters the scope `run` three times and after a reload, printing node positions, which must repeat (`UI-32`) |

From `zaansouvi-mvp/`:

```
tests/viewer/browse/browse.sh tests/viewer/browse/frame-views.json /tmp/shots
```

Needs Firefox, Python 3 and the Viewer built (`app/viewer`: `npm install`, `npm run build`). **It uses the real `data/`**: stop your own Viewer first. It adds entries to the activity log, and the steps that click Run replace the Runner's cache.

**Run them all with `tests/run-all.sh`** (from anywhere; `--no-browser` for the scripted checks only). It prepares what the steps need and runs them in an order that works on any `data/`, an empty one included:
- `/tmp/zaansouvi-sources/runner`, a copy of the Runner's code (`problems.json` selects it), and `/tmp/zaansouvi-status-source`, the source with every file status (`make-status-source.sh`; `mvp2.json` adds it), both recreated every time;
- a seed (`seed.py`): adds and runs `runner`, `test-source-mvp2` and MVP 1's frozen `test-source`, leaving `test-source` current;
- then the steps that name no source, which use `test-source`'s IDs and MVP 1's scope and level wording (`activity-count`, `contains`, `enter-marks`, `frame-views`, `layout-repeat`, `problem-items`, `selection`, `zoom-controls`), then `problems` and `tools-pane`, then the steps that open `test-source-mvp2` themselves, then `b7.sh`.

Run alone, a steps file that names no source uses the one selected, which must have a graph.

## Steps files

A JSON array of steps, starting with `["go", "<anything>"]`. `browse.sh` replaces the URL of every `go` step with the Viewer's URL and token, in a temporary copy, so the token is never written to the steps file; a later `go` reloads the page:

| Step | Does |
|---|---|
| `["go", url]` | Opens the URL |
| `["wait", "<js condition>", seconds]` | Waits until the condition is true |
| `["js", "<js code returning a value>"]` | Runs the code in the page and prints its result (up to 4000 characters) |
| `["shot", "<file.png>"]` | Takes a screenshot, into the output folder |
| `["sleep", seconds]` | Waits |

The page exposes `window.zaansouvi` (`enter`, `select`, `tab`, `state`, `ready`, `tools`); the Cytoscape instance is `document.querySelector('#cy')._cyreg.cy`.

## Pitfalls met

- **`/tmp` filling up:** headless Firefox writes a `tmp-*.xpi` of about 4 MB in its temporary folder on every start; 407 had built up in `/tmp`, 1.7 GB (2026-11-10). `browse.sh` now gives Firefox the run's work folder as its temporary folder (`TMPDIR`), and **cleans up on every exit**, a failed or interrupted run included: Firefox and the Viewer stopped, the work folder (the Viewer's output, its token included) removed, or kept only when it holds screenshots.
- **A command line naming the test Viewer is stopped with it:** `browse.sh` stops the Viewer and Firefox by a pattern of their command lines (`server.ts --port 4399`, `--profile <the run's profile>`); any other process whose command line holds that text, a shell running a check, for example, is stopped too. Don't write that text in a command that runs a check.

- **Objects made in a step are ignored by Cytoscape:** a step's script runs in Marionette's sandbox, and an object it creates (`{x: 5, y: 0}`) is not a plain object to the page, so `cy.panBy`, `cy.pan` and `eles.shift` given one silently do nothing (2026-11-10). Calls with numbers work (`cy.zoom(1.2)`); to pan or drag, dispatch mouse events instead, as `middle-pan.json` and `kind-frames.json` do.

- **A locked profile:** a Firefox killed mid-run leaves its profile locked, and the next start can't be reached ("can't reach Marionette"). Hence a fresh profile every time.
- **`pkill -f <pattern>`** also matches the shell running it when the pattern is in its own command line, and kills it. Hence stopping by process ID.
- **Positioned but invisible nodes:** Cytoscape draws a node sized by its label only once a layout has measured it (`FND-73`). A check that a node exists is not a check that it's drawn: test `visible()` too.
