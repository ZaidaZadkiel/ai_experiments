// The ZaAnSouVi Viewer page (mvp_docs/50_viewer_ui.md). It only displays what the backend sends (VIEW-04): the graph
// model's precomputed views, the tools, the activity log. Every name, path and source line is set as text, never as
// HTML (VIEW-40). Cytoscape is loaded by its own script tag; only its types are imported here.

import type cytoscapeType from "cytoscape";
import type { Core, ElementDefinition, NodeCollection, NodeSingular, EdgeSingular, StylesheetJson } from "cytoscape";

const cytoscape = (globalThis as unknown as { cytoscape: typeof cytoscapeType }).cytoscape;

// ---------------------------------------------------------------------------
// Types of what the backend sends (55_viewer_backend.md, section 6)
// ---------------------------------------------------------------------------

type Pos = { line: number; column: number };
type Loc = { file: string; start: Pos; end: Pos };
type MNode = { id: string; kind: string; dataName: string; label: string; container: string | null; tool?: string; owner?: string; location?: Loc };
type MRel = { id: string; from: string; to: string | null; kind: string; dataName: string; tool: string; location?: Loc; reason?: string; label?: string };
type MEdge = { id: string; from: string; to: string; kind: string; count: number; members: string[] };
type MView = { nodes: string[]; stubs: string[]; thisNode: string | null; edges: MEdge[]; unresolved: string[] };
type Model = {
  formatVersion: number; sourceKey: string; sourceRoot: string; run: { runId: string; finished: string; outcome: string };
  files: string[]; nodes: MNode[]; relations: MRel[]; levels: Record<string, MView>;
  checks: { invalid: { dataName: string; tool: string; recordId: string; problem: string }[]; extra: { dataName: string; tool: string; what: string; detail: string }[] };
};
type Answer = { status: string; reason?: string; model?: Model; lastGood?: { runId: string; finished: string } };
type Source = { sourceKey: string; sourceRoot: string; name: string; runId?: string; finished?: string };
type Entry = { time: string; level: string; event: string; verbosity: string; actor: string; text: string };

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: { cls?: string; text?: string; title?: string } = {}, ...kids: (Node | string)[]) {
  const e = document.createElement(tag);
  if (props.cls) e.className = props.cls;
  if (props.text !== undefined) e.textContent = props.text;
  if (props.title) e.title = props.title;
  for (const k of kids) e.append(k);
  return e;
}
const when = (iso: string) => iso.replace("T", " ").slice(0, 16);
const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

async function api<T>(method: "GET" | "POST", url: string, body?: unknown): Promise<{ status: number; data: T }> {
  const res = await fetch(url, {
    method, credentials: "same-origin",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: unknown = undefined;
  try { data = text ? JSON.parse(text) : undefined; } catch { data = text; }
  return { status: res.status, data: data as T };
}
const report = (event: string, extra: Record<string, unknown> = {}) =>
  void api("POST", "/api/activity", { event, source: state.source?.sourceKey, ...extra });

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const state = {
  sources: [] as Source[],
  source: undefined as Source | undefined,
  answer: undefined as Answer | undefined,
  which: "auto" as "auto" | "last-good",
  view: "", // the entered node; "" is the top view
  selected: [] as { type: "node" | "edge"; id: string }[], // in the order selected; shift- or ctrl-click adds (FND-71)
  running: false,
  runKind: "" as "" | "run" | "dry-run", // the kind of the run in progress or last started, from run_state
  probScope: "view" as "view" | "all", // the unresolved relations Problems lists (UI-57); kept across views
  liveEvents: [] as Record<string, unknown>[],
};
let cy: Core | undefined;
const model = () => state.answer?.model;
const node = (id: string) => model()?.nodes.find((n) => n.id === id);
const rel = (id: string) => model()?.relations.find((r) => r.id === id);
const fileOf = (id: string): string => { let n = node(id); while (n && n.container) n = node(n.container); return n?.id ?? id; };
// A relation's name for lists (UI-35, UI-57): its own, else its source node's (an unresolved import is named by the
// import symbol it starts from), else its ID. Generic: no data name or tool is named (VIEW-14).
const relName = (r: MRel) => r.label ?? node(r.from)?.label ?? r.id;
const childrenOf = (id: string) => model()?.nodes.filter((n) => n.container === id) ?? [];

function displayName(id: string): string {
  const n = node(id);
  if (!n) return id;
  // Generic (VIEW-14): a node with an owner is a scope (TOOL-33), a node with no container is a file.
  if (n.owner !== undefined) return n.owner === n.container ? `${(n.container ?? "").split("/").pop()} · file scope` : `ƒ ${n.label}`;
  if (n.container === null) return n.label;
  return n.kind === "function" ? `${n.label}()` : n.label;
}

// ---------------------------------------------------------------------------
// Identity colors (UI-42): one per file, from its ID
// ---------------------------------------------------------------------------

// Eight colors, cycled through by a hash of the file ID: two files can share one, and the color key shows it (UI-44).
function idSlot(fileId: string): number {
  let h = 0;
  for (const ch of fileId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (h % 8) + 1;
}
const idColor = (fileId: string): string => css(`--id${idSlot(fileId)}`);

// ---------------------------------------------------------------------------
// The graph (UI-30 to UI-41; BE-53 does the lifting, the page only draws)
// ---------------------------------------------------------------------------

function elementsFor(view: MView): ElementDefinition[] {
  const m = model()!;
  const els: ElementDefinition[] = [];
  const add = (id: string, cls: string, parent?: string) => {
    const n = node(id);
    if (!n) return;
    let label = cls.includes("this") ? "this scope" : displayName(id);
    // A shown node's members are listed in its label when they are leaves (UI-30: a scope with its symbols). Drawn as
    // nested nodes they made the automatic layout overlap the scopes, so the MVP lists them instead (FND-69).
    const kids = cls.includes("shown") && state.view !== "" ? childrenOf(id) : [];
    if (kids.length > 0 && kids.every((k) => childrenOf(k.id).length === 0)) {
      label += "\n" + kids.map((k) => (k.kind === "import" ? `↘ ${k.label}` : displayName(k.id))).join("  ·  ");
    }
    const color = idColor(fileOf(id));
    let border = color;
    if (n.kind === "import") {
      const imp = m.relations.find((r) => r.from === id && r.kind === "import" && r.to);
      if (imp?.to) border = idColor(fileOf(imp.to));
    }
    // A node that a double-click enters (it has a view of its own, and isn't the one being viewed) gets a small
    // triangle in its bottom right corner (UI-45).
    const enterable = m.levels[id] !== undefined && id !== state.view ? " enterable" : "";
    els.push({ group: "nodes", data: { id, real: id, label, color, border, parent }, classes: `${cls} ds-${n.dataName.replace(/\./g, "-")} k-${n.kind}${enterable}` });
  };
  // The scope frame (UI-37): when the entered node is a scope, a box labeled with it holds everything declared in it,
  // and its "this scope" node (UI-36) sits inside too, so edges from the scope's own code start from a node, not from
  // the frame's border. Stubs stay outside: the frame's edge shows where "here" ends. A file (level 2) has no frame.
  const frame = node(state.view)?.owner !== undefined ? `frame:${state.view}` : undefined; // a scope: it has an owner (BE-109)
  if (frame) els.push({ group: "nodes", data: { id: frame, real: state.view, label: displayName(state.view) }, classes: "frame" });
  for (const id of view.nodes) add(id, "shown", frame);
  for (const id of view.stubs) add(id, "stub");
  if (view.thisNode) add(view.thisNode, "this", frame);
  for (const e of view.edges) {
    els.push({ group: "edges", data: { id: `e:${e.id}`, real: e.id, source: e.from, target: e.to, label: e.count > 1 ? String(e.count) : "", width: Math.min(1.6 + (e.count - 1) * 1.1, 6) }, classes: `kind-${e.kind}` });
  }
  return els;
}

// The color key (UI-44): every file whose identity color is drawn in this view, a swatch and its name, in the cache's
// file order. Not clickable (pointer-events: none in the CSS), so it never gets in the way of the graph. Its rows fill
// columns top to bottom and wrap into a new column when they reach the height allowed.
function keyFiles(view: MView): string[] {
  const m = model()!;
  const used = new Set<string>();
  for (const id of [...view.nodes, ...view.stubs, ...(view.thisNode ? [view.thisNode] : [])]) {
    const n = node(id);
    if (!n || n.owner !== undefined) continue; // scopes are drawn in ink, not in their file's color (BE-109's role rule)
    used.add(fileOf(id));
    if (n.kind === "import") {
      const imp = m.relations.find((r) => r.from === id && r.kind === "import" && r.to);
      if (imp?.to) used.add(fileOf(imp.to));
    }
  }
  return m.files.filter((f) => used.has(f));
}
function drawKey(view: MView) {
  const box = $("key");
  const files = keyFiles(view);
  box.replaceChildren(...files.map((f) => el("div", { cls: "key-row" }, el("span", { cls: `sw id${idSlot(f)}` }), el("span", { text: f.split("/").pop() ?? f }))));
  box.hidden = files.length === 0;
  fitKey();
}
function fitKey() {
  const box = $("key");
  if (box.hidden || !box.firstElementChild) return;
  const room = $("graphbox").clientHeight * 0.45 - 8; // less the key's own padding
  const row = (box.firstElementChild as HTMLElement).offsetHeight || 15;
  box.style.setProperty("--rows", String(Math.max(1, Math.floor(room / (row + 1)))));
}
new ResizeObserver(fitKey).observe($("graphbox"));

const enterMark = (color: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="10" height="7" viewBox="0 0 10 7"><path d="M0 0H10L5 7Z" fill="${color}"/></svg>`);

function graphStyle(): StylesheetJson {
  const ink = css("--ink"), muted = css("--muted"), soft = css("--soft"), panel = css("--panel"), link = css("--link"), grey = css("--grey"), sel = css("--sel"), selSoft = css("--sel-soft");
  return [
    { selector: "node", style: { label: "data(label)", "font-size": 13, color: ink, "text-valign": "center", "text-halign": "center", "background-color": soft, "border-width": 1.5, "border-color": "data(border)", shape: "round-rectangle", width: "label", height: 28, padding: "8px", "text-wrap": "wrap" } },
    { selector: "node.ds-files-file", style: { shape: "cut-rectangle", "border-width": 2.5, "background-color": soft, "font-weight": "bold", height: 54, padding: "16px" } },
    { selector: "node.ds-code-scope", style: { shape: "round-rectangle", "background-color": panel, "border-color": ink, "border-width": 1.5, "font-weight": "bold", padding: "14px", height: "label", "text-max-width": "260px", "line-height": 1.5 } },
    { selector: "node.ds-code-scope.k-file", style: { "border-style": "dashed", "border-color": muted, "font-weight": "normal", color: muted } },
    { selector: "node.ds-code-symbol.k-function", style: { shape: "ellipse" } },
    { selector: "node.ds-code-symbol.k-variable", style: { shape: "rectangle" } },
    { selector: "node.ds-code-symbol.k-parameter", style: { shape: "rectangle", "font-style": "italic" } },
    { selector: "node.ds-code-symbol.k-import", style: { shape: "rectangle", "border-style": "dashed", "border-width": 2 } },
    { selector: "node.k-unknown", style: { shape: "ellipse", "background-color": grey } },
    { selector: "node.stub", style: { opacity: 0.6, "font-size": 12, height: 26 } },
    { selector: "node.frame", style: { shape: "round-rectangle", "background-color": soft, "background-opacity": 0.45, "border-width": 1.5, "border-style": "solid", "border-color": muted, label: "data(label)", "text-valign": "top", "text-halign": "center", "text-margin-y": -6, "font-size": 13, "font-weight": "bold", color: muted, padding: "28px" } },
    { selector: "node.this", style: { "border-style": "dotted", "border-color": ink, "border-width": 2 } },
    { selector: "node.member", style: { "font-size": 12, height: 24 } },
    // The "can be entered" mark (UI-45): a small triangle pointing down, in the ink color, in the bottom right corner.
    // An SVG image (the page's security policy allows data: images); not clipped, so it shows on round shapes too.
    { selector: "node.enterable", style: { "background-image": enterMark(ink), "background-width": "10px", "background-height": "7px",
      "background-position-x": "100%", "background-position-y": "100%", "background-offset-x": "-7px", "background-offset-y": "-6px",
      "background-clip": "none", "background-image-containment": "over", "background-image-opacity": 0.85 } },
    { selector: "node:selected", style: { "overlay-color": sel, "overlay-opacity": 0.25, "overlay-padding": 4 } },
    { selector: "edge", style: { width: "data(width)", "line-color": ink, "target-arrow-color": ink, "target-arrow-shape": "triangle", "curve-style": "bezier", label: "data(label)", "font-size": 12, "font-weight": "bold", color: ink, "text-background-color": panel, "text-background-opacity": 1, "text-background-padding": "3px", "text-background-shape": "round-rectangle" } },
    { selector: "edge.kind-read", style: { "line-style": "dotted" } },
    { selector: "edge.kind-write", style: { width: 3.5 } },
    { selector: "edge.kind-import", style: { "line-style": "dashed", "line-color": link, "target-arrow-color": link } },
    { selector: "edge.kind-mixed", style: { "line-color": grey, "target-arrow-color": grey } },
    // The edges of a selected node take a pale selection color, and go back to their own when it is unselected; an
    // edge selected itself keeps the full selection color, so the two are told apart (FND-71, UI-38).
    { selector: "edge.touch", style: { "line-color": selSoft, "target-arrow-color": selSoft, "z-index": 9 } },
    { selector: "edge:selected", style: { "line-color": sel, "target-arrow-color": sel, "z-index": 10 } },
  ] as unknown as StylesheetJson;
}

// Predictable layout (UI-32): every node starts at its own place, so the force layout never meets two nodes on the same
// spot. Cytoscape's cose pushes such a pair apart in a random direction, which made each entry come out differently.
// The view's own nodes go on an inner circle, stubs on an outer one, each in the model's order (sorted by ID).
function seedPositions(view: MView) {
  const ring = (ids: string[], r: number, turn: number) => ids.forEach((id, i) => {
    const a = turn + (2 * Math.PI * i) / ids.length;
    cy!.getElementById(id).position({ x: r * Math.cos(a), y: r * Math.sin(a) });
  });
  const inner = [...(view.thisNode ? [view.thisNode] : []), ...view.nodes];
  ring(inner, inner.length > 1 ? 160 : 0, -Math.PI / 2);
  ring(view.stubs, 400, -Math.PI / 2 + Math.PI / Math.max(view.stubs.length, 1));
}

// Stubs around a scope frame (UI-37): on an ellipse just outside it, each on the side of the nodes inside it is connected
// to (the mean of their positions), else spread evenly; kept apart by a minimum angle. The same data gives the same
// places, as with seedPositions.
function placeStubs(inside: NodeCollection) {
  const stubs = cy!.nodes(".stub");
  if (stubs.length === 0) return;
  // Measure the stubs as a layout would: a node whose size is its label is measured by the layout that places it, and
  // Cytoscape caches "takes up no space" for a node never measured, so without this the stubs were never drawn.
  stubs.forEach((s) => void s.layoutDimensions({ nodeDimensionsIncludeLabels: true }));
  const bb = inside.boundingBox({}); // the frame's own box can lag behind its children's new places
  const cx = (bb.x1 + bb.x2) / 2, cyy = (bb.y1 + bb.y2) / 2;
  const rx = bb.w / 2 + 190, ry = bb.h / 2 + 130; // the frame's padding and label, then room for the stub
  const wanted = stubs.map((s, i) => {
    const near = s.connectedEdges().connectedNodes().filter((n) => n.id() !== s.id() && n.parent().length > 0) as NodeCollection;
    let a = -Math.PI / 2 + (2 * Math.PI * i) / stubs.length;
    if (near.length > 0) {
      const mx = near.reduce((t, n) => t + n.position("x"), 0) / near.length;
      const my = near.reduce((t, n) => t + n.position("y"), 0) / near.length;
      if (mx !== cx || my !== cyy) a = Math.atan2((my - cyy) / ry, (mx - cx) / rx);
    }
    return { s, a };
  }).sort((p, q) => p.a - q.a || (p.s.id() < q.s.id() ? -1 : 1));
  const gap = Math.min((2 * Math.PI) / wanted.length, 0.7);
  for (let i = 1; i < wanted.length; i++) wanted[i].a = Math.max(wanted[i].a, wanted[i - 1].a + gap);
  for (const { s, a } of wanted) s.position({ x: cx + rx * Math.cos(a), y: cyy + ry * Math.sin(a) });
}

// The current zoom as a percentage (UI-46): 100% draws text at its own font size.
function zoomReadout() {
  if (cy) $("zoomread").textContent = `${Math.round(cy.zoom() * 100)}%`;
}

// The line under the graph (UI-35): the view's unresolved relations grouped by name, the most mentioned first, with
// a count where a name repeats; cut short after a few names, the rest being in Problems (FND-77).
function unresolvedLine(view: MView): string {
  if (view.unresolved.length === 0) return "";
  const counts = new Map<string, number>();
  for (const id of view.unresolved) { const r = rel(id); const n = r ? relName(r) : id; counts.set(n, (counts.get(n) ?? 0) + 1); }
  const names = [...counts].sort(([a, x], [b, y]) => y - x || a.localeCompare(b, "en", { sensitivity: "base" }));
  const SHOWN = 8;
  const list = names.slice(0, SHOWN).map(([n, c]) => (c > 1 ? `${n} (${c})` : n)).join(", ");
  const more = names.length > SHOWN ? `, and ${plural(names.length - SHOWN, "more name")}` : "";
  const head = names.length < view.unresolved.length ? `${plural(view.unresolved.length, "unresolved relation")}, ${plural(names.length, "name")}` : plural(view.unresolved.length, "unresolved relation");
  return `${head}: ${list}${more}. See Problems.`;
}

function drawGraph() {
  const m = model();
  const view = m?.levels[state.view];
  if (!m || !view) return;
  const els = elementsFor(view);
  if (!cy) {
    cy = cytoscape({ container: $("cy"), elements: [], style: graphStyle(), wheelSensitivity: 0.7, minZoom: 0.2, maxZoom: 3, boxSelectionEnabled: false });
    // Cytoscape keeps the selection: a click selects one item, shift- or ctrl-click adds one, a click on the background
    // clears it. The page follows it (syncSelection), so several selected items all show in Details (FND-71).
    cy.on("select", "node, edge", (ev) => {
      const t = ev.target as NodeSingular | EdgeSingular;
      if (!restoring) report("node_selected", { nodeId: t.data("real") }); // one entry per item, no new key (FND-71)
      queueSync(true);
    });
    cy.on("unselect", "node, edge", () => queueSync(false));
    cy.on("zoom", zoomReadout);
    cy.on("dbltap", "node", (ev) => enter((ev.target as NodeSingular).data("real")));
  }
  cy.elements().remove();
  cy.add(els);
  // Redrawing the same view (a new run, a change of color scheme) keeps what is still there selected, without
  // logging it again.
  restoring = true;
  for (const x of state.selected) cy.getElementById(x.type === "edge" ? `e:${x.id}` : x.id).select();
  restoring = false;
  seedPositions(view);
  cy.style(graphStyle());
  const cose = { name: "cose", animate: false, randomize: false, nodeRepulsion: () => 90000, idealEdgeLength: () => 140, componentSpacing: 120, padding: 40, nestingFactor: 0.9 };
  const frame = cy.nodes(".frame");
  if (frame.length > 0) {
    // With a scope frame (UI-37), the force layout let stubs drift into the frame and scattered its contents, which
    // have few edges between them. So the contents go on a compact grid, "this scope" first, then the model's order
    // (sorted by ID), and the stubs are placed around the frame (placeStubs).
    const inside = frame.children();
    const order = new Map([view.thisNode ?? "", ...view.nodes].map((id, i) => [id, i]));
    inside.layout({ name: "grid", cols: Math.ceil(Math.sqrt(inside.length)), avoidOverlap: true, avoidOverlapPadding: 40, condense: true,
      boundingBox: { x1: 0, y1: 0, w: 1, h: 1 }, sort: (p: NodeSingular, q: NodeSingular) => (order.get(p.id()) ?? 0) - (order.get(q.id()) ?? 0) } as never).run();
    placeStubs(inside);
  } else {
    const n = view.nodes.length + view.stubs.length;
    cy.layout(n <= 1 ? { name: "grid" } : cose as never).run();
  }
  cy.fit(undefined, 40);
  zoomReadout();
  drawKey(view);
  $("unres").textContent = unresolvedLine(view);
}

// ---------------------------------------------------------------------------
// Moving between levels (UI-31): double-click goes in, the breadcrumb goes back
// ---------------------------------------------------------------------------

function enter(id: string) {
  const m = model();
  if (!m?.levels[id] || id === state.view) return;
  state.view = id;
  state.selected = [];
  report("level_entered", { nodeId: id });
  render();
}
function crumbs() {
  const box = $("crumbs");
  box.replaceChildren();
  const s = state.source;
  if (!s || !model()) return;
  const chain: string[] = [];
  for (let c: string | null = state.view || null; c; c = node(c)?.container ?? null) chain.unshift(c);
  const top = el("button", { text: s.name });
  top.onclick = () => { if (state.view !== "") { state.view = ""; state.selected = []; report("level_left", { nodeId: "" }); render(); } };
  box.append(chain.length === 0 ? el("span", { cls: "here", text: s.name }) : top);
  chain.forEach((id, i) => {
    box.append(" › ");
    if (i === chain.length - 1) box.append(el("span", { cls: "here", text: displayName(id) }));
    else {
      const b = el("button", { text: displayName(id) });
      b.onclick = () => { state.view = id; state.selected = []; report("level_left", { nodeId: id }); render(); };
      box.append(b);
    }
  });
}

// ---------------------------------------------------------------------------
// The drawer (UI-50 to UI-55)
// ---------------------------------------------------------------------------

function tab(name: string) {
  document.querySelectorAll<HTMLElement>(".tab").forEach((t) => t.classList.toggle("on", t.dataset.tab === name));
  document.querySelectorAll<HTMLElement>(".pane").forEach((p) => p.classList.toggle("on", p.id === `pane-${name}`));
}

function kv(pairs: [string, string | Node][]) {
  const dl = el("dl", { cls: "kv" });
  for (const [k, v] of pairs) dl.append(el("dt", { text: k }), el("dd", {}, v));
  return dl;
}
const locText = (l?: Loc) => (l ? `${l.file} ${l.start.line}:${l.start.column}` : "no location");

async function sourceLines(loc: Loc | undefined, target: HTMLElement) {
  if (!loc || !state.source) return;
  const r = await api<{ firstLine: number; lines: string[] }>("GET", `/api/source?source=${encodeURIComponent(state.source.sourceKey)}&file=${encodeURIComponent(loc.file)}&line=${loc.start.line}`);
  if (r.status !== 200) return;
  const pre = el("pre", { cls: "src" });
  r.data.lines.forEach((line, i) => {
    const n = r.data.firstLine + i;
    pre.append(el("span", { cls: n === loc.start.line ? "hl" : "" }, el("i", { text: String(n) }), line));
  });
  target.append(pre);
}

// The page's selection follows Cytoscape's, read once after a click's select and unselect events have all fired.
let syncQueued = false, syncShowsDetails = false, restoring = false;
function queueSync(added: boolean) {
  syncShowsDetails ||= added;
  if (syncQueued) return;
  syncQueued = true;
  queueMicrotask(() => { syncQueued = false; syncSelection(syncShowsDetails); syncShowsDetails = false; });
}
function syncSelection(showDetails: boolean) {
  if (!cy) return;
  const now = cy.$(":selected");
  const items = now.toArray().map((e) => ({ type: (e.isNode() ? "node" : "edge") as "node" | "edge", id: e.data("real") as string }));
  const same = (a: { type: string; id: string }, b: { type: string; id: string }) => a.type === b.type && a.id === b.id;
  const kept = state.selected.filter((x) => items.some((y) => same(x, y)));
  const added = items.filter((y) => !kept.some((x) => same(x, y)));
  state.selected = [...kept, ...added];
  // Highlight the edges of every selected node; the rest go back to their own color.
  cy.edges().removeClass("touch");
  now.nodes().connectedEdges().addClass("touch");
  details();
  if (showDetails) tab("details");
}

// Select from code (the page check scripts, BE-95): replaces the selection, or adds to it, as a click or a
// shift-click would. With no type, clears it.
function select(type: "node" | "edge" | undefined, id: string, add = false) {
  if (!cy) return;
  if (!add) cy.$(":selected").unselect();
  if (type) cy.getElementById(type === "edge" ? `e:${id}` : id).select();
  syncSelection(!!type);
}

function details() {
  const pane = $("pane-details");
  pane.replaceChildren();
  const m = model();
  if (!m) { pane.append(el("p", { cls: "muted", text: "Nothing to show yet." })); return; }
  const view = m.levels[state.view];
  const sel = state.selected;
  if (sel.length === 0) {
    const relCount = view.edges.reduce((s, e) => s + e.count, 0);
    pane.append(el("h3", { text: "This view" }), kv([
      ["Level", state.view === "" ? "top · files" : `inside ${displayName(state.view)}`],
      ["Nodes", `${view.nodes.length} shown${view.stubs.length ? `, ${plural(view.stubs.length, "stub")}` : ""}${view.thisNode ? ", this scope" : ""}`],
      ["Edges", `${view.edges.length}, standing for ${plural(relCount, "relation")}`],
      ["Unresolved", String(view.unresolved.length)],
      ["Run", `${m.run.runId} (${when(m.run.finished)})`],
    ]), el("p", { cls: "muted", text: "Select a node or an edge to see its details and its source; shift- or ctrl-click selects several. Double-click a node to go into it." }));
    return;
  }
  if (sel.length === 1) {
    if (sel[0].type === "node") nodeDetails(sel[0].id, pane, true);
    else edgeDetails(sel[0].id, pane, true);
    return;
  }
  // Several selected (FND-71): grouped by node, each group headed by the node's label as drawn. A selected edge goes
  // under its "to" end, the node it points to (the defined end of a use), with a group of its own if that node isn't
  // selected. Groups and their edges keep the order they were selected in.
  const groups = new Map<string, { node: boolean; edges: string[] }>();
  for (const x of sel) {
    if (x.type === "node") { const g = groups.get(x.id); if (g) g.node = true; else groups.set(x.id, { node: true, edges: [] }); continue; }
    const e = view.edges.find((y) => y.id === x.id);
    if (!e) continue;
    const g = groups.get(e.to) ?? { node: false, edges: [] };
    g.edges.push(e.id);
    groups.set(e.to, g);
  }
  pane.append(el("p", { cls: "muted", text: `${plural(sel.length, "item")} selected, in ${plural(groups.size, "group")}. Click the background to clear.` }));
  for (const [id, g] of groups) {
    const box = el("section", { cls: `selgroup${groupColor(id)}` }, el("h3", { cls: "grouphead", text: drawnLabel(id) }));
    pane.append(box);
    if (g.node) nodeDetails(id, box, false);
    for (const eid of g.edges) edgeDetails(eid, box, false);
  }
}

// A group's bar takes the identity color of the file its node is located in (UI-42), or of the node itself when it
// is a file; otherwise it stays in the selection color (UI-56).
function groupColor(id: string): string {
  const n = node(id);
  const file = n?.location?.file ?? (n && n.container === null ? n.id : undefined);
  return file ? ` id${idSlot(file)}` : "";
}

// A node's label as the graph draws it: "this scope" for the entered scope's own node, else its display name.
const drawnLabel = (id: string) => (id === model()?.levels[state.view]?.thisNode ? "this scope" : displayName(id));

function nodeDetails(id: string, pane: HTMLElement, alone: boolean) {
  const m = model()!;
  const n = node(id);
  if (!n) return;
  const pairs: [string, string | Node][] = [["Kind", `${n.kind} (${n.dataName})`], ["Name", n.label], ["ID", el("code", { text: n.id })]];
  if (n.tool) pairs.push(["Tool", n.tool]);
  if (n.owner) pairs.push(["Owner", el("code", { text: n.owner })]);
  pairs.push(["Location", locText(n.location)]);
  const what = n.owner !== undefined ? "Scope" : n.container === null ? "File" : "Node";
  pane.append(el(alone ? "h3" : "h4", { text: what }), kv(pairs));
  const src = el("div");
  pane.append(src);
  void sourceLines(n.location, src);
  if (m.levels[n.id] && n.id !== state.view) {
    const go = el("button", { text: "Go into it" });
    go.onclick = () => enter(n.id);
    pane.append(el("p", {}, go));
  }
  containsList(n.id, pane, alone);
}

// One item's box (UI-57), shared by every list in Problems and by Details' Contains: the name on the left and what the
// list says of it on the right of the first line; the note on the second line, cut short with "(...)" and in full on
// hover, or wrapped when it is the item's content (wrap); the places under it, if any; the data name faint in the
// bottom right corner. "bad" marks an invalid record.
type Pill = { text: string; cls?: "ok" | "err" | "warn" | "" };
const pillEl = (p: Pill) => el("span", { cls: `pill ${p.cls ?? ""}`.trim(), text: p.text });
function itemBox(o: {
  name: string; version?: string; what?: string; link?: Node; pill?: Pill; note?: string; wrap?: boolean;
  places?: (string | (string | Node)[])[]; type?: string; bad?: boolean; faded?: boolean; plainName?: boolean;
}) {
  const cls = ["item", o.bad ? "bad" : "", o.faded ? "faded" : "", o.places?.length || !o.type ? "" : "noplaces"].filter(Boolean).join(" ");
  // First line: the name and a faint version on the left; on the right what the list says, a link, and the pill last.
  const head = el("div", { cls: "ihead" }, el(o.plainName ? "span" : "code", { cls: "iname", text: o.name }));
  if (o.version) head.append(el("span", { cls: "iver", text: o.version }));
  const right = el("span", { cls: "iright" });
  if (o.what) right.append(el("span", { cls: "iwhat", text: o.what }));
  if (o.link) right.append(o.link);
  if (o.pill) right.append(pillEl(o.pill));
  head.append(right);
  const li = el("li", { cls }, head);
  if (o.note) li.append(el("div", { cls: `inote${o.wrap ? " wrap" : ""}`, text: o.note, title: o.wrap ? "" : o.note }));
  if (o.places?.length) li.append(el("ul", { cls: "sub" }, ...o.places.map((t) => el("li", {}, ...(typeof t === "string" ? [t] : t)))));
  if (o.type) li.append(el("code", { cls: "itype", text: o.type, title: o.type }));
  return li;
}

// The item list shared by Problems and Details (UI-57, UI-52): one item per name and data name, "name · data name ·
// <what the caller says> · <note>", its places listed under it ("path/file line:column", start only) by file, then
// line, then column. A note shared by every place is shown once on the item, otherwise on each place. Items are
// sorted by name, ignoring case. Returns the list; the caller places it.
type ItemEntry = { name: string; dataName: string; location?: Loc; note?: string; kind?: string };
function groupedItems(entries: ItemEntry[], describe: (group: ItemEntry[]) => string): HTMLUListElement {
  const groups = new Map<string, ItemEntry[]>();
  for (const e of entries) {
    const key = `${e.name}\u0000${e.dataName}`;
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }
  const at = (e: ItemEntry) => [e.location?.file ?? "", e.location?.start.line ?? 0, e.location?.start.column ?? 0] as const;
  const byPlace = (a: ItemEntry, b: ItemEntry) => { const [fa, la, ca] = at(a), [fb, lb, cb] = at(b); return fa < fb ? -1 : fa > fb ? 1 : la - lb || ca - cb; };
  const ul = el("ul", { cls: "rows" });
  for (const [key, list] of [...groups].sort(([a], [b]) => a.localeCompare(b, "en", { sensitivity: "base" }) || (a < b ? -1 : a > b ? 1 : 0))) {
    list.sort(byPlace);
    const [name, dataName] = key.split("\u0000");
    const shared = list.every((e) => e.note === list[0].note);
    ul.append(itemBox({ name, what: describe(list), note: shared ? list[0].note : undefined, type: dataName,
      places: list.map((e) => `${locText(e.location)}${!shared && e.note ? ` · ${e.note}` : ""}`) }));
  }
  return ul;
}

// What a node contains, in the form of Problems' items (UI-52, UI-57): one item per name and data name, "name · data
// name · kind", its places listed under it ("path/file line:column", start only) by file, then line; a name declared
// more than once shows how many times. Items sorted by name, ignoring case.
function containsList(id: string, pane: HTMLElement, alone: boolean) {
  const kids = childrenOf(id);
  if (kids.length === 0) return;
  pane.append(el(alone ? "h3" : "h4", { text: `Contains · ${kids.length}` }));
  const ul = groupedItems(kids.map((k) => ({ name: displayName(k.id), dataName: k.dataName, location: k.location, kind: k.kind })),
    (list) => [...new Set(list.map((e) => e.kind))].join(", ") + (list.length > 1 ? ` · ${list.length} declarations` : ""));
  pane.append(ul);
}

function edgeDetails(id: string, pane: HTMLElement, alone: boolean) {
  const e = model()!.levels[state.view].edges.find((x) => x.id === id);
  if (!e) return;
  pane.append(el(alone ? "h3" : "h4", { text: `Edge · ${plural(e.count, "relation")}` }), kv([["From", drawnLabel(e.from)], ["To", drawnLabel(e.to)], ["Kind", e.kind]]), el(alone ? "h3" : "h4", { text: "Stands for" }));
  const ul = el("ul", { cls: "rows" });
  pane.append(ul);
  for (const rid of e.members) {
    const r = rel(rid);
    if (!r) continue;
    const li = el("li", {}, el("b", { text: r.kind }), ` ${node(r.from)?.label ?? r.from} → ${r.to ? node(r.to)?.label ?? r.to : "unresolved"} · ${locText(r.location)} · `, el("code", { text: r.dataName }), ` from ${r.tool}`);
    ul.append(li);
    void sourceLines(r.location, li);
  }
}

type ToolsAnswer = {
  tools: { tool: string; position: number; toolVersion?: string }[];
  run: { runId: string; outcome: string; finished: string } | null;
  invocations: { tool: string; file_id?: string; refreshReason: string; skipped: boolean; dryRun?: string; result?: { status?: string; logPath?: string; error?: { code?: string; message?: string } } }[];
  dryRun: { time: string; invocations: { tool: string; file_id?: string; refreshReason: string; dryRun: string; error?: { code?: string; message?: string } }[] } | null;
};
let toolsData: ToolsAnswer | undefined;

async function loadTools() {
  if (!state.source) { toolsData = undefined; return toolsPane(); }
  const r = await api<ToolsAnswer>("GET", `/api/tools?source=${encodeURIComponent(state.source.sourceKey)}`);
  toolsData = r.status === 200 ? r.data : undefined;
  toolsPane();
}

function logLink(p: string) {
  const a = el("a", { text: "log" });
  a.href = `/api/log?path=${encodeURIComponent(p)}`;
  a.target = "_blank";
  a.rel = "noopener";
  a.onclick = () => report("log_opened", { path: p });
  return a;
}

// The Tools pane (UI-53, UI-58): one box per tool, in the run order, in the form of Problems' items (itemBox): the
// name and its version on the left, the log and a pill on the right, counts on the second line, failures and no-gos
// listed under it. A tool with no invocation in a run that failed was not reached: the run stopped before it.
type Inv = { tool: string; file_id?: string; skipped: boolean; dryRun?: string; result?: { status?: string; logPath?: string; error?: { code?: string; message?: string } } };
const errText = (file: string | undefined, err?: { code?: string; message?: string }) => `${file ?? "(whole run)"} · ${err?.code ? `${err.code}: ` : ""}${err?.message ?? "no-go"}`;
const versionOf = (tool: string) => toolsData?.tools.find((t) => t.tool === tool)?.toolVersion;
function failurePlace(file: string | undefined, err: { code?: string; message?: string } | undefined, logPath?: string): (string | Node)[] {
  return logPath ? [errText(file, err), " · ", logLink(logPath)] : [errText(file, err)];
}
function counts(ran: number, upToDate: number, failed: number, n: number) {
  const parts = [`${ran} ran`, `${upToDate} up to date`, ...(failed ? [`${failed} failed`] : [])];
  return `${plural(n, "invocation")}: ${parts.join(", ")}`;
}
// What stopped the run: the first tool, in order, with a failed or no-go invocation.
const stoppedAt = (order: string[], failedTools: Set<string>) => order.find((t) => failedTools.has(t));

function toolsPane() {
  const pane = $("pane-tools");
  pane.replaceChildren();
  const t = toolsData;
  const order = (t?.tools ?? []).slice().sort((a, b) => a.position - b.position).map((x) => x.tool);
  const pos = (tool: string) => (t?.tools.find((x) => x.tool === tool)?.position ?? order.indexOf(tool) + 1);

  // Live events (UI-53): while a run is in progress, and after it until the next one.
  if (state.running || state.liveEvents.length) {
    const ev = state.liveEvents;
    const finished = ev.find((e) => e.event === "run_finished") as { outcome?: string } | undefined;
    const fileCount = (ev.find((e) => e.event === "files_listed") as { fileCount?: number } | undefined)?.fileCount;
    const dryOnly = state.runKind === "dry-run" || (ev.length > 0 && !ev.some((e) => e.event === "tool_run" || e.event === "tool_skipped") && !!finished);
    pane.append(el("h3", { text: state.running ? "Run in progress" : `Last run's events · ${finished?.outcome ?? "ended"}` }));
    const toolEvents = ev.filter((e) => ["tool_skipped", "tool_dry_run", "tool_run"].includes(String(e.event)));
    const seen = [...new Set(toolEvents.map((e) => String(e.tool)))];
    const tools = [...order, ...seen.filter((x) => !order.includes(x))];
    const failedTools = new Set(toolEvents.filter((e) => e.dryRun === "no-go" || (e.event === "tool_run" && e.status !== "succeeded")).map((e) => String(e.tool)));
    const current = state.running ? String(toolEvents[toolEvents.length - 1]?.tool ?? "") : "";
    const ul = el("ul", { cls: "rows" });
    for (const tool of tools) {
      const mine = toolEvents.filter((e) => e.tool === tool);
      const ran = mine.filter((e) => e.event === "tool_run").length;
      const upToDate = mine.filter((e) => e.event === "tool_skipped").length;
      const bad = mine.filter((e) => e.dryRun === "no-go" || (e.event === "tool_run" && e.status !== "succeeded"));
      const done = new Set(mine.filter((e) => e.event !== "tool_dry_run" || e.dryRun === "no-go" || dryOnly).map((e) => String(e.file_id ?? ""))).size;
      const perFile = mine.some((e) => e.file_id !== undefined);
      let pill: Pill, faded = false, note: string | undefined;
      if (mine.length === 0) {
        if (state.running) pill = { text: "waiting" };
        else { pill = { text: "not run" }; faded = true; note = `not reached: the ${dryOnly ? "dry run" : "run"} stopped at ${stoppedAt(tools, failedTools) ?? "an earlier step"}`; }
      } else if (bad.length) pill = { text: dryOnly ? "no-go" : "failed", cls: "err" };
      else if (tool === current) pill = { text: "running", cls: "warn" };
      else if (dryOnly) pill = { text: "go", cls: "ok" };
      else pill = ran === 0 ? { text: "up to date" } : { text: "succeeded", cls: "ok" };
      if (mine.length) note = dryOnly ? `${plural(done, "invocation")} dry-run` : counts(ran, upToDate, bad.length, done);
      if (bad.length) note += ` · the ${dryOnly ? "dry run" : "run"} stopped here` + (perFile && fileCount && done < fileCount ? "; later files not run" : "");
      ul.append(itemBox({ name: tool, version: versionOf(tool), what: perFile && fileCount ? `${done} of ${fileCount} files` : undefined, pill, note, wrap: true, bad: bad.length > 0, faded,
        places: bad.map((e) => failurePlace(e.file_id as string | undefined, e.error as { code?: string; message?: string } | undefined, typeof e.logPath === "string" ? e.logPath : undefined)) }));
    }
    const refused = ev.find((e) => e.event === "run_refused") as { message?: string } | undefined;
    if (refused) ul.append(itemBox({ name: "Runner", pill: { text: "refused", cls: "err" }, note: refused.message ?? "A run is already in progress.", wrap: true, bad: true }));
    pane.append(ul);
  }

  // The settled list: the cache's last real run of this source.
  pane.append(el("h3", { text: `Tools, in order${t?.run ? ` · run ${t.run.outcome}` : ""}` }));
  if (!t || t.tools.length === 0) { pane.append(el("p", { cls: "muted", text: "No tools recorded yet: the Runner hasn't run." })); return; }
  const invs = t.invocations as Inv[];
  const isBad = (i: Inv) => i.result?.status === "failed" || i.dryRun === "no-go";
  const failedTools = new Set(invs.filter(isBad).map((i) => i.tool));
  const ul = el("ul", { cls: "rows" });
  for (const tool of order) {
    const inv = invs.filter((i) => i.tool === tool);
    const where = `#${pos(tool)} in order`;
    if (inv.length === 0) {
      const notRun = t.run?.outcome === "failed";
      ul.append(itemBox({ name: tool, version: versionOf(tool), pill: notRun ? { text: "not run" } : undefined, faded: notRun, wrap: true,
        note: notRun ? `${where} · not reached: the run stopped at ${stoppedAt(order, failedTools) ?? "an earlier step"}` : `${where} · no run of this source yet` }));
      continue;
    }
    const bad = inv.filter(isBad);
    const ran = inv.filter((i) => !i.skipped && i.result).length;
    const upToDate = inv.filter((i) => i.skipped).length;
    const perFile = inv.some((i) => i.file_id !== undefined);
    const logs = inv.map((i) => i.result?.logPath).filter((p): p is string => typeof p === "string");
    const pill: Pill = bad.length ? { text: "failed", cls: "err" } : ran === 0 ? { text: "up to date" } : { text: "succeeded", cls: "ok" };
    let note = `${where} · ${counts(ran, upToDate, bad.length, inv.length)}`;
    if (bad.length) note += " · the run stopped here" + (perFile ? "; later files, if any, not run" : "");
    ul.append(itemBox({ name: tool, version: versionOf(tool), link: logs.length ? logLink(logs[logs.length - 1]) : undefined, pill, note, wrap: true, bad: bad.length > 0,
      places: bad.map((i) => failurePlace(i.file_id, i.result?.error, bad.length > 1 ? i.result?.logPath : undefined)) }));
  }
  pane.append(ul);

  // The last dry run (a dry-run-only pass): go or no-go per tool, reasons counted; it also stops at a no-go.
  if (t.dryRun) {
    pane.append(el("h3", { text: `Last dry run · ${when(t.dryRun.time)}` }));
    const dinv = t.dryRun.invocations;
    const dFailed = new Set(dinv.filter((i) => i.dryRun === "no-go").map((i) => i.tool));
    const dl = el("ul", { cls: "rows" });
    for (const tool of order) {
      const inv = dinv.filter((i) => i.tool === tool);
      if (inv.length === 0) {
        const stopped = stoppedAt(order, dFailed);
        dl.append(itemBox({ name: tool, version: versionOf(tool), pill: { text: "not run" }, faded: true, wrap: true,
          note: stopped ? `not reached: the dry run stopped at ${stopped}` : "no invocation in the dry run" }));
        continue;
      }
      const bad = inv.filter((i) => i.dryRun === "no-go");
      const reasons = new Map<string, number>();
      for (const i of inv) reasons.set(i.refreshReason, (reasons.get(i.refreshReason) ?? 0) + 1);
      dl.append(itemBox({ name: tool, version: versionOf(tool), what: `${inv.length - bad.length} of ${inv.length}`,
        pill: bad.length ? { text: "no-go", cls: "err" } : { text: "go", cls: "ok" }, bad: bad.length > 0, wrap: true,
        note: [...reasons].map(([r, n]) => `${r}: ${n}`).join(" · ") + (bad.length ? " · the dry run stopped here" : ""),
        places: bad.map((i) => [errText(i.file_id, i.error)]) }));
    }
    pane.append(dl);
  }
}

function problemsPane() {
  const pane = $("pane-problems");
  pane.replaceChildren();
  const m = model();
  if (!m) { pane.append(el("p", { cls: "muted", text: "No graph is shown, so there is nothing to check." })); $("probcount").hidden = true; return; }
  const { invalid, extra } = m.checks;
  // Every item is an itemBox (UI-57): its name first (the record for invalid data, what is extra for extra data, the
  // name used for an unresolved relation), its data name faint in the corner (UI-54).
  pane.append(el("h3", { text: "Invalid data" }));
  if (invalid.length === 0) pane.append(el("p", { cls: "muted", text: "None: every record passed the checks." }));
  else {
    // A record per item: its ID, the tool on the right, the problem below. A problem met by several records is one
    // item: the problem, how many records, the records listed under it (UI-57).
    const byProblem = new Map<string, typeof invalid>();
    for (const i of invalid) byProblem.set(i.problem, [...(byProblem.get(i.problem) ?? []), i]);
    pane.append(el("ul", { cls: "rows" }, ...[...byProblem].map(([problem, list]) => list.length === 1
      ? itemBox({ name: list[0].recordId, what: list[0].tool, note: `${problem}. Skipped.`, wrap: true, type: list[0].dataName, bad: true })
      : itemBox({ name: `${problem}. Skipped.`, plainName: true, what: plural(list.length, "record"), type: [...new Set(list.map((i) => i.dataName))].join(", "), bad: true,
          places: list.map((i) => `${i.recordId} · ${i.tool}`) }))));
  }
  pane.append(el("h3", { text: "Extra data" }));
  if (extra.length === 0) pane.append(el("p", { cls: "muted", text: "None." }));
  // What is extra on the left, the tool on the right, the detail below, wrapped: it is the item's content (UI-57).
  else pane.append(el("ul", { cls: "rows" }, ...extra.map((x) => itemBox({ name: x.what, what: x.tool, note: x.detail, wrap: true, type: x.dataName }))));

  // Unresolved relations (UI-57): those of the view being shown, or of the whole run, as the toggle says; the choice
  // holds in every view. One item per name and data name, its mentions listed under it by file, then line. A reason
  // shared by every mention is shown once on the item, otherwise on each mention.
  const inView = state.probScope === "view";
  const ids = new Set(inView ? m.levels[state.view]?.unresolved ?? [] : m.relations.filter((r) => r.to === null).map((r) => r.id));
  const unresolved = m.relations.filter((r) => ids.has(r.id));
  pane.append(el("h3", { text: `Unresolved relations · ${inView ? "this view" : "all"}` }));
  if (unresolved.length === 0) pane.append(el("p", { cls: "muted", text: inView ? "None in this view." : "None." }));
  else {
    const ul = groupedItems(unresolved.map((r) => ({ name: relName(r), dataName: r.dataName, location: r.location, note: r.reason ?? "no reason recorded" })),
      (list) => plural(list.length, "mention"));
    pane.append(ul);
  }
  const toggle = el("div", { cls: "probscope" });
  for (const [which, text] of [["view", "This view"], ["all", "All"]] as const) {
    const b = el("button", { text, title: which === "view" ? "Unresolved relations of the view being shown" : "Unresolved relations of the whole run" });
    b.setAttribute("aria-pressed", String(state.probScope === which));
    b.onclick = () => { state.probScope = which; problemsPane(); };
    toggle.append(b);
  }
  pane.append(toggle);
  const c = $("probcount");
  c.hidden = invalid.length === 0;
  c.textContent = String(invalid.length);
}

// ---------------------------------------------------------------------------
// The page's state (section 8 of 50_viewer_ui.md)
// ---------------------------------------------------------------------------

function banner(text: string, err = false, action?: [string, () => void]) {
  const b = $("banner");
  b.replaceChildren(text);
  b.className = err ? "banner err" : "banner";
  if (action) {
    const btn = el("button", { text: action[0] });
    btn.onclick = action[1];
    b.append(btn);
  }
  b.hidden = false;
}

function render() {
  const a = state.answer;
  const s = state.source;
  $("banner").hidden = true;
  const showGraph = !!a?.model;
  $("graphbox").hidden = !showGraph;
  $("crumbs").hidden = !showGraph;
  $("empty").hidden = showGraph;
  $("empty-add").hidden = true;
  $("empty-run").hidden = true;
  if (!s) {
    $("empty-title").textContent = "Add a source to begin";
    $("empty-text").textContent = "The Viewer has no examined source yet.";
    $("empty-add").hidden = false;
  } else if (!a?.model) {
    const titles: Record<string, string> = { "no-run": "No run yet for this source", "no-good-data": "No good data for this source", unusable: "The cached graph for this source can't be used" };
    $("empty-title").textContent = titles[a?.status ?? "no-run"] ?? "Nothing to show";
    $("empty-text").textContent = a?.reason ?? "";
    $("empty-run").hidden = false;
  } else {
    const lg = a.lastGood ? `the run of ${when(a.lastGood.finished)}` : "an earlier run";
    if (a.status === "partly-invalid") banner(`${a.reason} Showing the latest run without them.`, false, ["Show the last good graph instead", () => switchGraph("last-good")]);
    else if (a.status === "last-good" && state.which === "last-good") banner(`Last good graph, from ${lg}.`, false, ["Show the latest run instead", () => switchGraph("auto")]);
    else if (a.status === "last-good") banner(`${a.reason ?? "Not the latest."} Showing the last good graph, from ${lg}.`, true);
    if (!model()!.levels[state.view]) state.view = "";
    crumbs();
    drawGraph();
  }
  details();
  problemsPane();
  toolsPane();
  statusBar();
}

function statusBar() {
  const s = state.source, a = state.answer, m = model();
  $("st-src").textContent = s ? s.sourceRoot : "No source";
  $("st-src").title = s?.sourceRoot ?? "";
  const run = $("st-run");
  run.className = "";
  if (state.running) { run.textContent = "A run is in progress"; run.className = "notlatest"; }
  else if (!a || !m) { run.textContent = a?.status === "unusable" ? "Cached graph unusable" : a?.status === "no-good-data" ? "No good data" : s ? "No run yet" : ""; run.className = a?.status === "no-run" || !a ? "" : "bad"; }
  else {
    const t = `Run ${when(m.run.finished)}`;
    const why: Record<string, [string, string]> = {
      latest: ["latest", "latest"], stored: ["cached", "latest"], "partly-invalid": ["partly invalid run shown", "notlatest"],
      "last-good": [state.which === "last-good" ? "last good graph shown" : "not the latest: the last run failed", "notlatest"],
    };
    const [label, cls] = why[a.status] ?? [a.status, ""];
    run.textContent = `${t} · ${label}`;
    run.className = cls;
  }
  const c = $("st-counts");
  if (m) {
    const unres = m.relations.filter((r) => r.to === null).length;
    c.textContent = `${m.checks.invalid.length} invalid · ${m.checks.extra.length} extra · ${unres} unresolved`;
    c.className = m.checks.invalid.length ? "linkish bad" : "linkish";
    c.hidden = false;
  } else c.hidden = true;
  const busy = state.running || !s;
  ($("run") as HTMLButtonElement).disabled = busy;
  ($("dry") as HTMLButtonElement).disabled = busy;
  ($("empty-run") as HTMLButtonElement).disabled = busy;
  ($("src") as HTMLSelectElement).disabled = state.running;
  $("runchip").hidden = !state.running;
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

async function loadSources() {
  const r = await api<{ current: string | null; sources: Source[] }>("GET", "/api/sources");
  state.sources = r.data.sources;
  const sel = $("src") as HTMLSelectElement;
  sel.replaceChildren();
  if (state.sources.length === 0) sel.append(el("option", { text: "No source yet" }));
  for (const s of state.sources) {
    const o = el("option", { text: `${s.name}${s.finished ? ` · run ${when(s.finished)}` : " · no run yet"}`, title: s.sourceRoot });
    o.value = s.sourceKey;
    sel.append(o);
  }
  const key = state.source?.sourceKey ?? r.data.current ?? state.sources[0]?.sourceKey;
  state.source = state.sources.find((s) => s.sourceKey === key);
  if (state.source) sel.value = state.source.sourceKey;
}

async function loadGraph() {
  if (!state.source) { state.answer = undefined; return render(); }
  const r = await api<Answer>("GET", `/api/graph?source=${encodeURIComponent(state.source.sourceKey)}&which=${state.which}`);
  state.answer = r.status === 200 ? r.data : { status: "no-good-data", reason: (r.data as unknown as { error?: string })?.error ?? `The backend answered ${r.status}.` };
  render();
}

async function switchGraph(which: "auto" | "last-good") {
  state.which = which;
  report("graph_switched", { which });
  await loadGraph();
}

async function openSource(key: string) {
  const r = await api("POST", "/api/sources/current", { source: key });
  if (r.status !== 204) return;
  state.source = state.sources.find((s) => s.sourceKey === key);
  state.view = "";
  state.selected = [];
  state.which = "auto";
  state.liveEvents = [];
  await loadGraph();
  await loadTools();
}

async function addSource(input: HTMLInputElement, errBox: HTMLElement) {
  errBox.textContent = "";
  const r = await api<Source & { error?: string }>("POST", "/api/sources", { sourceRoot: input.value.trim() });
  if (r.status !== 200 && r.status !== 201) { errBox.textContent = r.data?.error ?? "That source can't be added."; return; }
  input.value = "";
  ($("add") as HTMLDetailsElement).open = false;
  await loadSources();
  await openSource(r.data.sourceKey);
  await loadSources();
}

async function startRun(kind: "run" | "dry-run") {
  if (!state.source) return;
  state.liveEvents = [];
  await api("POST", kind === "run" ? "/api/run" : "/api/dry-run", { source: state.source.sourceKey });
}

// ---------------------------------------------------------------------------
// The activity line and the live stream (UI-62 to UI-72; BE-70)
// ---------------------------------------------------------------------------

const SHORT: Record<string, string> = { minimal: "min", normal: "norm", verbose: "verb" };
function addEntry(e: Entry) {
  const time = new Date(e.time);
  const hh = (n: number) => String(n).padStart(2, "0");
  const li = el("li", { cls: `entry ${e.verbosity} ${e.level}` },
    el("time", { text: `${hh(time.getHours())}:${hh(time.getMinutes())}:${hh(time.getSeconds())}` }),
    el("span", { cls: "lvl", text: SHORT[e.verbosity] ?? e.verbosity }),
    el("span", { cls: `who ${e.actor === "user" ? "you" : "app"}`, text: e.actor === "user" ? "you" : "app" }),
    el("span", { cls: "txt", text: e.text, title: e.text }));
  $("actlist").prepend(li);
  actCount();
}

// The count at the start of the activity line's controls (UI-73): the entries shown at the levels selected, over all
// the entries logged that the page holds.
function actCount() {
  const all = [...$("actlist").children] as HTMLElement[];
  const on = (v: string) => ($(`act-${v}`) as HTMLInputElement).checked;
  const shown = all.filter((e) => (e.classList.contains("minimal") && on("min")) || (e.classList.contains("normal") && on("norm")) || (e.classList.contains("verbose") && on("verb"))).length;
  $("actcount").textContent = `${shown} / ${all.length}`;
}
for (const v of ["min", "norm", "verb"]) $(`act-${v}`).addEventListener("change", actCount);
actCount();

function connect() {
  const es = new EventSource("/api/events");
  es.addEventListener("activity", (m) => addEntry(JSON.parse((m as MessageEvent).data) as Entry));
  es.addEventListener("cleared", () => { $("actlist").replaceChildren(); actCount(); });
  es.addEventListener("run_state", (m) => {
    const d = JSON.parse((m as MessageEvent).data) as { running: boolean; kind?: "run" | "dry-run" };
    state.running = d.running;
    if (d.kind) state.runKind = d.kind;
    statusBar();
    toolsPane();
  });
  es.addEventListener("runner", (m) => {
    state.liveEvents.push(JSON.parse((m as MessageEvent).data));
    if (state.liveEvents.length === 1) tab("tools");
    toolsPane();
  });
  es.addEventListener("graph_updated", async (m) => {
    const d = JSON.parse((m as MessageEvent).data) as { source: string; kind: string };
    await loadSources();
    if (d.source === state.source?.sourceKey) {
      if (d.kind === "run") { state.which = "auto"; await loadGraph(); }
      await loadTools();
    }
  });
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

document.querySelectorAll<HTMLButtonElement>(".tab").forEach((t) => (t.onclick = () => tab(t.dataset.tab ?? "details")));
$("collapse").onclick = () => document.querySelector("main.body")?.classList.toggle("closed");
$("fit").onclick = () => cy?.fit(undefined, 40);
// Text (UI-46): zoom 1, where text is drawn at its own font size, keeping the centre of the graph area in place.
$("zoomtext").onclick = () => { if (cy) cy.zoom({ level: 1, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } }); };
$("run").onclick = () => void startRun("run");
$("dry").onclick = () => void startRun("dry-run");
$("empty-run").onclick = () => void startRun("run");
$("st-counts").onclick = () => tab("problems");
($("src") as HTMLSelectElement).onchange = (ev) => void openSource((ev.target as HTMLSelectElement).value);
$("addsrc").onclick = () => void addSource($("newsrc") as HTMLInputElement, $("adderr"));
$("firstadd").onclick = () => void addSource($("firstsrc") as HTMLInputElement, $("firsterr"));
for (const [input, btn] of [["newsrc", "addsrc"], ["firstsrc", "firstadd"]]) {
  $(input).addEventListener("keydown", (e) => { if ((e as KeyboardEvent).key === "Enter") $(btn).click(); });
}
$("clear-yes").onclick = () => { ($("clear") as HTMLDetailsElement).open = false; void api("POST", "/api/activity/clear"); };
$("clear-no").onclick = () => { ($("clear") as HTMLDetailsElement).open = false; };
document.addEventListener("keydown", (e) => { if (e.key === "Escape") ($("act-open") as HTMLInputElement).checked = false; });
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (cy) { cy.style(graphStyle()); drawGraph(); } });

// A hook for the page check script (tests/viewer/): the same actions a double-click, a click or a tab gives.
// tools() redraws the Tools pane, from given data when passed (a check's made-up answer), else from the backend's.
(globalThis as unknown as { zaansouvi: unknown }).zaansouvi = { enter, select, tab, state, ready: () => !!state.answer,
  tools: (d?: ToolsAnswer) => { if (d) toolsData = d; toolsPane(); } };

tab("details");
connect();
await loadSources();
await loadGraph();
await loadTools();
