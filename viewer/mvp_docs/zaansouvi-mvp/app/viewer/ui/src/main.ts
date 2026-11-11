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
type MDisplay = { name: string; title: string; notes: string[]; icons?: string[]; label?: string };
type MNode = { id: string; kind: string; dataName: string; label: string; container: string | null; tool?: string; owner?: string; location?: Loc; attrs?: Record<string, unknown>; display?: MDisplay };
type MRel = { id: string; from: string; to: string | null; kind: string; dataName: string; tool: string; location?: Loc; reason?: string; label?: string; attrs?: Record<string, unknown> };
type MEdge = { id: string; from: string; to: string; kind: string; count: number; members: string[] };
type MView = {
  nodes: string[]; stubs: string[]; thisNode: string | null; edges: MEdge[]; unresolved: string[]; builtins?: string[];
  // format 3 (55_viewer_backend.md, BE-111, BE-112, BE-114)
  render: Record<string, "node" | "member" | "stub" | "title">; memberOf: Record<string, string>; relationEdge: Record<string, string>;
  path: string[]; inside: string[]; reachable: boolean; unconnected?: string[]; memberRows: Record<string, string[]>;
  builtinGroups: { type: string; members: { name: string; relations: string[] }[] }[];
};
type MIndex = { fileOf: Record<string, string>; children: Record<string, string[]>; entries: Record<string, string[]>; folderOf: Record<string, string>;
  ancestors: Record<string, string[]>; relationsFrom: Record<string, string[]>; relationsTo: Record<string, string[]> };
type Model = {
  formatVersion: number; sourceKey: string; sourceRoot: string; run: { runId: string; finished: string; outcome: string };
  files: string[]; nodes: MNode[]; relations: MRel[]; levels: Record<string, MView>;
  checks: { invalid: { dataName: string; tool: string; recordId: string; problem: string }[]; extra: { dataName: string; tool: string; what: string; detail: string }[] };
  index: MIndex; dropped: { dataName: string; tool: string; why: string; problem: string; record: unknown }[]; // format 3 (BE-110, BE-113)
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
  kindFrames: true, // the kind frames' switch (UI-83): on by default, for the page only
  edgesFull: true, // the edges' switch (UI-85): full by default; off draws them thin, faint, with no count; for the page only
  liveEvents: [] as Record<string, unknown>[],
};
let cy: Core | undefined;
const model = () => state.answer?.model;
// Lookups by ID, built once per model, so nothing is searched node by node (FND-111 found the linear searches).
let looked: { model?: Model; nodes: Map<string, MNode>; rels: Map<string, MRel> } = { nodes: new Map(), rels: new Map() };
const look = () => {
  const m = model();
  if (looked.model !== m) looked = { model: m, nodes: new Map((m?.nodes ?? []).map((n) => [n.id, n])), rels: new Map((m?.relations ?? []).map((r) => [r.id, r])) };
  return looked;
};
const node = (id: string) => look().nodes.get(id);
const rel = (id: string) => look().rels.get(id);
// What the model states (55_viewer_backend.md, BE-110, BE-114, format 3): the page reads it and works none of it out.
const ix = () => model()?.index;
/** A node's file (BE-110); a listed entry that is not a file is its own. */
const fileOf = (id: string): string => ix()?.fileOf[id] ?? id;
// A relation's name for lists (UI-35, UI-57): its own, else its source node's (an unresolved import is named by the
// import symbol it starts from), else its ID. Generic: no data name or tool is named (VIEW-14).
const relName = (r: MRel) => r.label ?? node(r.from)?.label ?? r.id;
/** A container's members, in source order (BE-110). */
const childrenOf = (id: string) => (ix()?.children[id] ?? []).map((k) => node(k)).filter((n): n is MNode => !!n);
/** As drawn on its node (BE-114): "area()", "shapes.ts", "main.ts · file scope". */
const displayName = (id: string): string => node(id)?.display?.name ?? id;
/** As a frame's title (UI-36, BE-114): "ƒ percent()", "class Base", "file shapes.ts". */
const titleOf = (id: string): string => node(id)?.display?.title ?? id;
/** The frame's notes (FND-109, FND-110, BE-114), one per line, in source order. */
const frameNotes = (id: string): string[] => node(id)?.display?.notes ?? [];
/** The first import relation starting at a node (an import symbol's link), from the index (BE-110). */
const importOf = (id: string) => (ix()?.relationsFrom[id] ?? []).map((r) => rel(r)).find((r) => r?.kind === "import" && r.to);

// ---------------------------------------------------------------------------
// MVP 2: entries' status icons (UI-48) and the "Not connected" frame (UI-47)
// ---------------------------------------------------------------------------

/** The status icons of a listed entry, in a fixed order: basic shapes, each status its own color (UI-48a). Which ones a
 *  node has is stated by the model, by name (BE-114); the page only draws them. */
const ICONS: { name: string; svg: string; title: string }[] = [
  { name: "hidden", title: "hidden", svg: '<circle cx="5" cy="5" r="4" fill="#8a8f98"/>' },
  { name: "linkInside", title: "link inside the source", svg: '<path d="M5 0L10 5L5 10L0 5Z" fill="#2563eb"/>' },
  { name: "linkOutside", title: "link outside the source", svg: '<path d="M5 0L10 5L5 10L0 5Z" fill="#ea7a17"/>' },
  { name: "readOnly", title: "read-only", svg: '<rect x="1" y="1" width="8" height="8" fill="#9333ea"/>' },
  { name: "unreadable", title: "unreadable", svg: '<path d="M5 0L10 10H0Z" fill="#dc2626"/>' },
];
const iconUrl = (svg: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10">${svg}</svg>`);
const iconsOf = (n: MNode) => ICONS.filter((i) => n.display?.icons?.includes(i.name));
/** A listed entry's label in the "Not connected" frame (UI-47b, BE-114): "name · type", a folder's file count or size. */
const entryLabel = (n: MNode): string => n.display?.label ?? n.label;
/** In the top view: the listed entries no edge reaches, which go in the "Not connected" frame (UI-47, BE-114). */
const unconnectedOf = (view: MView): string[] => view.unconnected ?? [];

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

// ---------------------------------------------------------------------------
// Kind frames (UI-83): inside an entered view's frame, the nodes of each kind with two or more nodes in a frame of their
// own, so nodes of the same kind are kept together. Drawing only: the model is unchanged, and a frame carries no data.
// ---------------------------------------------------------------------------

/** The known kinds, in their fixed order, with their labels; any other kind follows, by its name (generic, so a kind
 *  added in the future gets its own frame with no change here). A Map, so a kind named like an object key is safe. */
const KIND_FRAMES = new Map<string, string>([
  ["namespace", "Namespaces"], ["class", "Classes"], ["interface", "Interfaces"], ["typeAlias", "Type aliases"],
  ["enum", "Enums"], ["enumMember", "Enum members"], ["constructor", "Constructors"], ["accessor", "Accessors"],
  ["property", "Properties"], ["method", "Methods"], ["function", "Functions"], ["variable", "Variables"],
  ["parameter", "Parameters"], ["import", "Imports"],
]);
const KNOWN_KINDS = [...KIND_FRAMES.keys()];
const cmpText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const kindRank = (kind: string) => (KIND_FRAMES.has(kind) ? KNOWN_KINDS.indexOf(kind) : KNOWN_KINDS.length);
const byKind = (a: string, b: string) => kindRank(a) - kindRank(b) || cmpText(a, b);
const kindFrameId = (kind: string) => `kindframe:${kind}`;

/** The kinds that get a frame in this view, with their nodes in the model's order: every kind with two or more of the
 *  view's own nodes, unless all of them are of one kind (the view's frame already holds them). None in the top view,
 *  or with the switch off. */
function kindGroups(view: MView): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  if (!state.kindFrames || state.view === "" || !node(state.view)) return groups;
  const all = new Map<string, string[]>();
  for (const id of view.nodes) { const k = node(id)?.kind ?? "unknown"; all.set(k, [...(all.get(k) ?? []), id]); }
  if (all.size < 2) return groups;
  for (const k of [...all.keys()].sort(byKind)) if (all.get(k)!.length >= 2) groups.set(k, all.get(k)!);
  return groups;
}

function elementsFor(view: MView): ElementDefinition[] {
  const m = model()!;
  const els: ElementDefinition[] = [];
  const add = (id: string, cls: string, parent?: string) => {
    const n = node(id);
    if (!n) return;
    let members = false;
    let label = cls.includes("this") ? titleOf(id) : cls.includes("free") ? entryLabel(n) : displayName(id);
    // A shown node's members are listed in its label when they are leaves (UI-30: a scope with its symbols). Drawn as
    // nested nodes they made the automatic layout overlap the scopes, so the MVP lists them instead (FND-69).
    // The members written into its label, as the model states them for this view (BE-114).
    const rows = cls.includes("shown") ? view.memberRows[id] : undefined;
    const kids = (rows ?? []).map((k) => node(k)).filter((k): k is MNode => !!k);
    if (kids.length > 0) {
      // The members in rows of about as many as there are rows (FND-102): 4 give 2 × 2, 7 give 3 rows of 3, 3 and 1,
      // so the node stays roughly square instead of one long line.
      const names = kids.map((k) => (k.kind === "import" ? `↘ ${k.label}` : displayName(k.id)));
      const cols = Math.max(1, Math.ceil(Math.sqrt(names.length)));
      const rows: string[] = [];
      for (let i = 0; i < names.length; i += cols) rows.push(names.slice(i, i + cols).join("  ·  "));
      label += "\n" + rows.join("\n");
      members = true;
    }
    const color = idColor(fileOf(id));
    let border = color;
    if (n.kind === "import") {
      const imp = importOf(id);
      if (imp?.to) border = idColor(fileOf(imp.to));
    }
    // A node that a double-click enters (it has a view of its own, and isn't the one being viewed) gets a small
    // triangle in its bottom right corner (UI-45).
    const enterable = m.levels[id] !== undefined && id !== state.view ? " enterable" : "";
    els.push({ group: "nodes", data: { id, real: id, label, color, border, parent }, classes: `${cls} ds-${n.dataName.replace(/\./g, "-")} k-${n.kind}${enterable}${members ? " has-members" : ""}` });
  };
  // The frame (UI-37, TSP-D8): for ANY entered container (a file, a class, a function, a namespace), a box holds
  // everything declared in it, and the entered node itself is the frame's title (UI-36, FND-105): a node at the top of
  // the frame, its kind and name underlined, so edges from the container's own code and edges from outside to it start
  // or end at the title, not at the frame's border. Stubs stay outside: the frame's edge shows where "here" ends.
  const frame = state.view !== "" && node(state.view) ? `frame:${state.view}` : undefined;
  if (frame) els.push({ group: "nodes", data: { id: frame, real: state.view, label: frameNotes(state.view).join("\n") }, classes: "frame scope-frame" });
  // The "Not connected" frame (UI-47, UI-48): in the top view, every listed entry no edge reaches, as a free node.
  const free = new Set(unconnectedOf(view));
  if (free.size) {
    const count = (k: string) => [...free].filter((id) => node(id)?.kind === k).length;
    const parts = [plural(count("file"), "file"), ...(["folder", "link", "other"] as const).filter((k) => count(k)).map((k) => plural(count(k), k === "other" ? "other entry" : k))];
    els.push({ group: "nodes", data: { id: "frame:unconnected", real: "", label: `Not connected · ${parts.join(", ")}` }, classes: "frame free-frame" });
  }
  // The kind frames (UI-83), inside the view's frame: not selectable, but grabbable, so dragging one moves its nodes. Their
  // `real` is the entered node, so a double-click on one does nothing (it is the view already shown).
  const groups = frame ? kindGroups(view) : new Map<string, string[]>();
  const kindOf = new Map<string, string>();
  for (const [k, ids] of groups) {
    els.push({ group: "nodes", data: { id: kindFrameId(k), real: state.view, label: KIND_FRAMES.get(k) ?? k, parent: frame }, classes: "kindframe", selectable: false, grabbable: true });
    for (const id of ids) kindOf.set(id, kindFrameId(k));
  }
  for (const id of view.nodes) add(id, free.has(id) ? "shown free" : "shown", free.has(id) ? "frame:unconnected" : (kindOf.get(id) ?? frame));
  for (const id of view.stubs) add(id, "stub");
  // The notes' spacer (FND-110): a hidden, unclickable child that makes the frame grow upward by the notes' height, so
  // the notes in the corner never reach the title's row; placed by applyFrameNotes.
  if (frame && frameNotes(state.view).length) els.push({ group: "nodes", data: { id: `notes:${state.view}`, real: "", label: "", parent: frame }, classes: "notes-spacer" });
  // The title, there even when no edge starts or ends at the entered node (the model's thisNode is then null).
  if (frame) add(state.view, "this", frame);
  else if (view.thisNode) add(view.thisNode, "this");
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
      const imp = importOf(id);
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

const underline = (color: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="10" height="2" viewBox="0 0 10 2" preserveAspectRatio="none"><rect width="10" height="2" fill="${color}"/></svg>`);
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
    // MVP 2: shapes for the kinds TypeScript gives (UI-41), and for listed entries (UI-48).
    { selector: "node.ds-code-symbol.k-class", style: { shape: "round-rectangle", "border-width": 2.5, "font-weight": "bold" } },
    { selector: "node.ds-code-symbol.k-interface", style: { shape: "round-rectangle", "border-style": "dashed", "border-width": 2, "font-style": "italic" } },
    { selector: "node.ds-code-symbol.k-typeAlias", style: { shape: "round-rectangle", "border-style": "dashed", "font-style": "italic" } },
    { selector: "node.ds-code-symbol.k-enum", style: { shape: "hexagon", "font-weight": "bold" } },
    { selector: "node.ds-code-symbol.k-enumMember", style: { shape: "rectangle", "font-size": 12 } },
    { selector: "node.ds-code-symbol.k-namespace", style: { shape: "barrel", "font-weight": "bold" } },
    { selector: "node.ds-code-symbol.k-method, node.ds-code-symbol.k-constructor", style: { shape: "ellipse" } },
    { selector: "node.ds-code-symbol.k-accessor", style: { shape: "ellipse", "border-style": "double", "border-width": 3 } },
    { selector: "node.ds-code-symbol.k-property", style: { shape: "rectangle" } },
    { selector: "node.ds-files-folder", style: { shape: "tag", /* replaced per node by applyPoints (FND-103) */ "background-color": panel, "font-size": 12 } },
    { selector: "node.ds-files-link, node.ds-files-other", style: { shape: "rhomboid", "background-color": panel, "font-size": 12 } },
    // A node listing its members (FND-102): as tall as its rows, a little room around them, the first line its name.
    { selector: "node.has-members", style: { height: "label", padding: "12px", "line-height": 1.35, "text-max-width": "420px" } },
    { selector: "node.free", style: { "font-weight": "normal", "font-size": 12, height: 30, padding: "8px" } },
    { selector: "node.stub", style: { opacity: 0.6, "font-size": 12, height: 26 } },
    { selector: "node.notes-spacer", style: { width: 1, height: 1, padding: "0px", opacity: 0, events: "no", label: "" } },
    { selector: "node.frame", style: { shape: "round-rectangle", "background-color": soft, "background-opacity": 0.45, "border-width": 1.5, "border-style": "solid", "border-color": muted, label: "data(label)", "text-valign": "top", "text-halign": "center", "text-margin-y": -6, "font-size": 13, "font-weight": "bold", color: muted, padding: "28px" } },
    // The frame's notes (FND-109): small, muted, italic, one per line; placed in the top left corner by applyFrameNotes.
    { selector: "node.scope-frame", style: { "font-size": 11, "font-weight": "normal", "font-style": "italic", "text-wrap": "wrap", "text-justification": "left", "line-height": 1.3 } },
    // The frame's title (FND-105): no box, bold, underlined (an image: Cytoscape has no text decoration).
    { selector: "node.this", style: { shape: "rectangle", "border-width": 0, "background-opacity": 0, "font-weight": "bold", "font-size": 14, padding: "4px", width: "label", height: "label",
      "background-image": underline(ink), "background-width": "100%", "background-height": "2px", "background-position-y": "100%",
      "background-clip": "none", "background-image-containment": "over" } },
    { selector: "node.member", style: { "font-size": 12, height: 24 } },
    // A kind frame (UI-83): only an outline keeping the nodes of one kind together, its kind in the plural in the top left
    // corner (applyKindLabels); not selectable (set on the element), and no overlay when tapped or dragged.
    { selector: "node.kindframe", style: { shape: "round-rectangle", "background-opacity": 0, "border-width": 1, "border-style": "solid", "border-color": muted,
      label: "data(label)", "text-valign": "top", "text-halign": "center", "font-size": 11, "font-style": "italic", "font-weight": "normal", color: muted,
      padding: `${KIND_PAD}px`, "overlay-opacity": 0 } },
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
    // Thin edges (UI-85): set by applyEdgeMode on every edge that is neither selected nor one of the selection's, so those
    // keep their own weight, color and count. Arrowheads scaled up, so the direction still shows on a thin line.
    { selector: "edge.thin", style: { width: 1, opacity: 0.35, label: "", "arrow-scale": 1.6 } },
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
  // The frame's own box can lag behind its children's new places, and so can a kind frame's (UI-83): measured block by block.
  const blocks = blocksBox(inside), low = Math.max(...inside.toArray().map((b) => blockBox(b as NodeSingular).y2));
  const bb = { x1: blocks.x1, x2: blocks.x2, y1: blocks.y1, y2: low, w: blocks.x2 - blocks.x1, h: low - blocks.y1 };
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
  // On a large frame, the ellipse passes inside the frame's corners: a stub placed there is pushed out along its own
  // direction until it clears the frame (its padding of 28px, the stub's own half size, and a margin).
  const clear = (s: NodeSingular, x: number, y: number) =>
    x + s.outerWidth() / 2 < bb.x1 - 40 || x - s.outerWidth() / 2 > bb.x2 + 40 || y + s.outerHeight() / 2 < bb.y1 - 40 || y - s.outerHeight() / 2 > bb.y2 + 40;
  for (const { s, a } of wanted) {
    let k = 1;
    while (!clear(s, cx + k * rx * Math.cos(a), cyy + k * ry * Math.sin(a)) && k < 3) k += 0.05;
    s.position({ x: cx + k * rx * Math.cos(a), y: cyy + k * ry * Math.sin(a) });
  }
}

// ---------------------------------------------------------------------------
// Hover boxes (UI-86): a node's own text in a small box near the pointer, whenever the pointer is on it; an edge's, only
// while the edge is selected. Read from the model only, set as text (VIEW-40). They select nothing and change nothing.
// ---------------------------------------------------------------------------

const TIP_CAP = 12; // lines of members or relations before "and N more"
const FRAMES = ".frame, .kindframe, .notes-spacer"; // outlines, not nodes: no box

/** A node's box: its kind and name; the path of its containers; its file and line, or its path for a listed entry; its
 *  short facts, as the frame's notes give them; and the members its label lists (FND-69, FND-102), capped. */
function nodeTip(id: string, ele: NodeSingular): string[][] {
  const n = node(id);
  if (!n) return [[id]];
  const head = n.container === null ? `${n.kind} ${n.label}` : titleOf(id);
  const path = (ix()?.ancestors[id] ?? []).map(displayName); // its containers, from the top down (BE-112)
  const lines: string[][] = [[head]];
  const facts: string[] = [];
  if (path.length) facts.push(`in ${path.join(" › ")}`);
  facts.push(n.location ? locText(n.location) : n.container === null ? n.id : "no location");
  const notes = frameNotes(id);
  if (notes.length) facts.push(notes.join(" · "));
  lines.push(facts);
  if (ele.hasClass("has-members")) {
    const kids = (snapshot()?.memberRows[id] ?? []).map((k) => node(k)).filter((k): k is MNode => !!k)
      .map((k) => (k.kind === "import" ? `↘ ${k.label}` : `${displayName(k.id)} · ${k.kind}`));
    lines.push([...kids.slice(0, TIP_CAP), ...(kids.length > TIP_CAP ? [`and ${kids.length - TIP_CAP} more`] : [])]);
  }
  return lines;
}

/** An edge's box: its kind, its two ends as drawn, how many relations it stands for, and those relations, capped. */
function edgeTip(id: string): string[][] {
  const e = snapshot()?.edges.find((x) => x.id === id);
  if (!e) return [[id]];
  const rels = e.members.map((m) => rel(m)).filter((r): r is MRel => !!r);
  // How many of them start or end in something hidden by a choice (INV-18); the edge's label stays unchanged.
  const hidden = rels.filter((r) => isHidden(r.from) || (r.to !== null && isHidden(r.to))).length;
  const rows = rels.map((r) => `${relName(r)} · ${r.kind} · ${r.location ? `${r.location.file} ${r.location.start.line}` : "no location"}`);
  return [
    [`${e.kind} · ${drawnLabel(e.from)} → ${drawnLabel(e.to)}`],
    [plural(e.count, "relation") + (hidden ? ` (${hidden} hidden)` : "")],
    [...rows.slice(0, TIP_CAP), ...(rows.length > TIP_CAP ? [`and ${rows.length - TIP_CAP} more`] : [])],
  ];
}

let tipOn: string | undefined; // the element whose box is shown
function hideTip() { tipOn = undefined; const t = document.getElementById("hovertip"); if (t) t.hidden = true; }
function showTip(eleId: string, groups: string[][], x: number, y: number) {
  const t = $("hovertip");
  t.replaceChildren(...groups.filter((g) => g.length).map((g, i) => el("div", { cls: i === 0 ? "tip-head" : "tip-part" }, ...g.flatMap((line, j) => (j ? [el("br"), line] : [line])))));
  t.hidden = false;
  tipOn = eleId;
  placeTip(x, y);
}
/** Near the pointer, below and to the right, flipped to the other side near the graph's right or bottom edge. */
function placeTip(clientX: number, clientY: number) {
  const t = $("hovertip"), box = $("graphbox").getBoundingClientRect();
  let x = clientX - box.left + 14, y = clientY - box.top + 16;
  if (x + t.offsetWidth > box.width - 4) x = Math.max(4, clientX - box.left - 14 - t.offsetWidth);
  if (y + t.offsetHeight > box.height - 4) y = Math.max(4, clientY - box.top - 16 - t.offsetHeight);
  t.style.left = `${x}px`;
  t.style.top = `${y}px`;
}

function hoverTips(c: Core) {
  let hovered: { ele: NodeSingular | EdgeSingular; x: number; y: number } | undefined;
  let moving = false; // a node or a frame being dragged: no box until the pointer comes onto a node again
  const point = (ev: { originalEvent?: Event }) => {
    const m = ev.originalEvent as MouseEvent | undefined;
    return m && typeof m.clientX === "number" ? { x: m.clientX, y: m.clientY } : undefined;
  };
  const show = () => {
    if (!hovered || moving) return hideTip();
    const ele = hovered.ele, real = ele.data("real") as string;
    if (ele.isNode()) showTip(ele.id(), nodeTip(real, ele as NodeSingular), hovered.x, hovered.y);
    else if (ele.selected()) showTip(ele.id(), edgeTip(real), hovered.x, hovered.y);
    else hideTip();
  };
  c.on("mouseover", "node, edge", (ev) => {
    const ele = ev.target as NodeSingular | EdgeSingular, p = point(ev);
    if (!p || (ele.isNode() && ele.is(FRAMES))) return;
    hovered = { ele, ...p };
    show();
  });
  c.on("mouseout", "node, edge", (ev) => { if (hovered?.ele === ev.target) { hovered = undefined; hideTip(); } });
  c.on("mousemove", (ev) => {
    const p = point(ev);
    if (!p || !hovered) return;
    hovered.x = p.x; hovered.y = p.y;
    if (tipOn) placeTip(p.x, p.y);
    // Hidden by a pan or a zoom while the pointer stayed on the element (no new mouseover then): back on the next move
    // with no button pressed, so it never flickers during a pan.
    else if (!moving && ((ev.originalEvent as MouseEvent | undefined)?.buttons ?? 0) === 0) show();
  });
  // An edge shows its box once selected while the pointer is on it, and loses it when unselected.
  c.on("select unselect", "edge", (ev) => { if (hovered?.ele === ev.target) show(); });
  c.on("grab", "node", () => { moving = true; hideTip(); });
  c.on("free", "node", () => { moving = false; });
  c.on("pan zoom", () => hideTip());
  $("cy").addEventListener("mouseleave", () => { hovered = undefined; hideTip(); });
}

/** The edges' switch (UI-85): full, every edge as styled; thin, every edge thin, faint and without its count, except a
 *  selected edge and the edges of a selected node. Classes only: nothing is laid out again, so nothing moves. */
function applyEdgeMode() {
  if (!cy) return;
  cy.edges().removeClass("thin");
  if (!state.edgesFull) cy.edges().not(".touch").not(":selected").addClass("thin");
}

/** Nodes on a compact grid of about as many columns as rows (4 give 2 × 2, 9 give 3 × 3; FND-102), in the model's order. */
function squareGrid(nodes: NodeCollection, order: Map<string, number>) {
  nodes.layout({ name: "grid", cols: Math.ceil(Math.sqrt(nodes.length)), avoidOverlap: true, avoidOverlapPadding: 40, condense: true,
    boundingBox: { x1: 0, y1: 0, w: 1, h: 1 }, sort: (p: NodeSingular, q: NodeSingular) => (order.get(p.id()) ?? 0) - (order.get(q.id()) ?? 0) } as never).run();
}

const KIND_PAD = 24; // a kind frame's padding (its style), which holds its label in the top band
/** A block's box: a node's own, or a kind frame's from its nodes and padding, since a compound node's box can lag behind
 *  its children's new places until it is drawn. */
function blockBox(ele: NodeSingular): { x1: number; y1: number; x2: number; y2: number; w: number; h: number } {
  if (!ele.hasClass("kindframe")) return ele.boundingBox({});
  const b = ele.children().boundingBox({});
  return { x1: b.x1 - KIND_PAD, y1: b.y1 - KIND_PAD, x2: b.x2 + KIND_PAD, y2: b.y2 + KIND_PAD, w: b.w + 2 * KIND_PAD, h: b.h + 2 * KIND_PAD };
}
function blocksBox(blocks: NodeCollection) {
  const bs = blocks.toArray().map((b) => blockBox(b as NodeSingular));
  return { x1: Math.min(...bs.map((b) => b.x1)), x2: Math.max(...bs.map((b) => b.x2)), y1: Math.min(...bs.map((b) => b.y1)) };
}

/** The kind frames' layout (UI-83): each frame's nodes on a square grid in the model's order. The frames, in the kinds'
 *  order, on a grid of their own, left to right, wrapping into rows so it stays roughly square; the loose nodes (the only
 *  one of their kind) along the top, above the frames, in the kinds' order, wrapping when wider than the frames. The same
 *  model gives the same places (UI-32). */
function layoutKindFrames(blocks: NodeCollection, order: Map<string, number>) {
  const GAP = 50;
  const frames = blocks.filter(".kindframe");
  frames.forEach((f) => squareGrid(f.children(), order));
  const kindOfBlock = (b: NodeSingular) => (b.hasClass("kindframe") ? b.id().slice("kindframe:".length) : node(b.id())?.kind ?? "unknown");
  const firstOf = (b: NodeSingular) => (b.hasClass("kindframe") ? Math.min(...b.children().map((c) => order.get(c.id()) ?? 0)) : order.get(b.id()) ?? 0);
  const sorted = (c: NodeCollection) => (c.toArray() as NodeSingular[]).sort((p, q) => byKind(kindOfBlock(p), kindOfBlock(q)) || firstOf(p) - firstOf(q));
  const moveTo = (b: NodeSingular, x: number, y: number) => {
    const box = blockBox(b);
    (b.hasClass("kindframe") ? b.children() : b).shift({ x: x - box.x1, y: y - box.y1 });
    return box;
  };
  // Rows of blocks from (0, top): a new row after `cols` blocks, or, with `width`, when the next block would pass it.
  const rows = (list: NodeSingular[], top: number, cols: number, width?: number) => {
    let x = 0, y = top, rowH = 0, inRow = 0, right = 0;
    for (const b of list) {
      const w = blockBox(b).w;
      if (inRow > 0 && (inRow === cols || (width !== undefined && x + w > width))) { x = 0; y += rowH + GAP; rowH = 0; inRow = 0; }
      const box = moveTo(b, x, y);
      x += box.w + GAP; right = Math.max(right, x - GAP); rowH = Math.max(rowH, box.h); inRow++;
    }
    return { bottom: inRow ? y + rowH : top, right };
  };
  const framed = sorted(frames), loose = sorted(blocks.not(frames));
  // The frames first, at 0, to learn their width; then the loose nodes above them, and the frames moved down below.
  const grid = rows(framed, 0, Math.ceil(Math.sqrt(framed.length)));
  const band = rows(loose, 0, Infinity, Math.max(grid.right, 1));
  if (loose.length) frames.forEach((f) => void f.children().shift({ x: 0, y: band.bottom + GAP }));
}

/** A kind frame's label in its top left corner, inside it, like the frame's notes (applyFrameNotes): the label is anchored
 *  at the top and moved by the frame's and the label's measured sizes. Rerun when a node inside is dragged, since the
 *  frame's width follows its nodes. */
function applyKindLabels() {
  cy!.nodes(".kindframe").forEach((f) => {
    const lb = f.boundingBox({ includeNodes: false, includeEdges: false, includeLabels: true, includeOverlays: false } as never);
    f.style({ "text-margin-x": -f.outerWidth() / 2 + lb.w / 2 + 10, "text-margin-y": lb.h + 5 } as never);
  });
}
let kindLabelsQueued = false;
function queueKindLabels() {
  if (kindLabelsQueued) return;
  kindLabelsQueued = true;
  requestAnimationFrame(() => { kindLabelsQueued = false; if (cy) applyKindLabels(); });
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

/** Status icons in a column on the left inside the node (UI-48), drawn as background images beside the enterable mark
 *  (UI-45), so a node carrying both keeps both. Set per node, since each has its own list of images. */
/** The folder's point (FND-103): Cytoscape's "tag" draws its point a fixed share of the node's width, so a wide folder
 *  got a long, flat point. The point is drawn with a right angle at its tip instead, whatever the node's size: it reaches
 *  in by half the node's height, set per node as a polygon once the node's size is known. */
function pointDepth(ele: NodeSingular): number {
  return ele.hasClass("ds-files-folder") ? bodyHeight(ele) / 2 : 0;
}
function bodyHeight(ele: NodeSingular): number {
  return ele.outerHeight() - 2 * parseFloat(String(ele.style("border-width")));
}
function applyPoints() {
  cy!.nodes(".ds-files-folder").forEach((ele) => {
    const w = ele.outerWidth() - 2 * parseFloat(String(ele.style("border-width")));
    const x = Math.max(-1, 1 - (2 * pointDepth(ele)) / w);
    ele.style({ shape: "polygon", "shape-polygon-points": [-1, -1, x, -1, 1, 0, x, 1, -1, 1].join(" ") } as never);
    // The "can be entered" mark (UI-45) moves left of the point; with status icons, applyIcons has placed it already.
    if (ele.hasClass("enterable") && !ele.data("icons")) ele.style("background-offset-x", `-${7 + pointDepth(ele)}px`);
  });
}

/** The frame's notes in its top left corner, inside it (FND-109). A compound node's label can only sit above, below
 *  or across it, so the label is anchored at the top and moved by the frame's and the label's measured sizes. Labels
 *  take no clicks (Cytoscape's text-events default), so the notes are not interactive. */
function applyFrameNotes() {
  cy!.nodes(".scope-frame").forEach((f) => {
    if (!f.data("label")) return;
    const lb = f.boundingBox({ includeNodes: false, includeEdges: false, includeLabels: true, includeOverlays: false } as never);
    // The spacer goes above the title by the notes' height: the frame's top moves up, and the notes, drawn from it,
    // end above the title's row (FND-110: in narrow frames, two lines reached the title).
    const spacer = f.children(".notes-spacer"), title = f.children(".this");
    if (spacer.length && title.length) spacer.first().position({ x: title.first().position("x"), y: title.boundingBox({}).y1 - lb.h - 4 });
    f.style({ "text-margin-x": -f.outerWidth() / 2 + lb.w / 2 + 14, "text-margin-y": lb.h + 8 } as never);
  });
}

function applyIcons() {
  const ink = css("--ink");
  cy!.nodes().forEach((ele) => {
    const n = node(ele.data("real"));
    const icons = n && ele.data("id") === n.id ? iconsOf(n) : [];
    if (!icons.length) return;
    const images = icons.map((i) => iconUrl(i.svg));
    const xs = icons.map(() => "0%"), ys = icons.map(() => "0%");
    const ox = icons.map(() => "5px"), oy = icons.map((_, k) => `${5 + k * 12}px`);
    const w = icons.map(() => "9px"), h = icons.map(() => "9px");
    if (ele.hasClass("this")) { // the title keeps its underline (FND-105)
      images.push(underline(ink)); xs.push("0%"); ys.push("100%"); ox.push("0px"); oy.push("0px"); w.push("100%"); h.push("2px");
    }
    if (ele.hasClass("enterable")) {
      images.push(enterMark(ink)); xs.push("100%"); ys.push("100%"); ox.push(`-${7 + pointDepth(ele)}px`); oy.push("-6px"); w.push("10px"); h.push("7px");
    }
    ele.style({
      "background-image": images, "background-position-x": xs, "background-position-y": ys, "background-offset-x": ox, "background-offset-y": oy,
      "background-width": w, "background-height": h, "background-clip": "none", "background-image-containment": "over", "background-image-opacity": 0.95,
      "text-margin-x": 9, "padding-left": "22px", "min-height": `${10 + icons.length * 12}px`,
    } as never);
    ele.data("icons", icons.map((i) => i.title).join(", "));
  });
}

function drawGraph() {
  const m = model();
  const view = snapshot();
  if (!m || !view) return;
  const els = elementsFor(view);
  if (!cy) {
    cy = cytoscape({ container: $("cy"), elements: [], style: graphStyle(), wheelSensitivity: 0.7, minZoom: 0.2, maxZoom: 3, boxSelectionEnabled: false });
    // Cytoscape keeps the selection: a click selects one item, shift- or ctrl-click adds one, a click on the background
    // clears it. The page follows it (syncSelection), so several selected items all show in Details (FND-71).
    cy.on("select", "node, edge", (ev) => {
      const t = ev.target as NodeSingular | EdgeSingular;
      // A selection a redraw restores is not a click: no activity entry, and the drawer keeps its tab. Cytoscape may report
      // it after the redraw has finished, so the redraw names what it restores and each report is matched to it, whenever
      // it comes (a hide in the Inventory switched the drawer to Details, found by the user).
      if (restoredIds.delete(t.id())) { queueSync(false); return; }
      if (!restoring) report("node_selected", { nodeId: t.data("real") }); // one entry per item, no new key (FND-71)
      queueSync(true);
    });
    cy.on("unselect", "node, edge", () => queueSync(false));
    hoverTips(cy);
    cy.on("zoom", zoomReadout);
    cy.on("dbltap", "node", (ev) => enter((ev.target as NodeSingular).data("real")));
    // A kind frame's width follows its nodes, so its label is placed again when one of them is dragged (UI-83).
    cy.on("position", "node", (ev) => { if ((ev.target as NodeSingular).parent(".kindframe").length) queueKindLabels(); });
  }
  hideTip();
  cy.elements().remove();
  cy.add(els);
  // Redrawing the same view (a new run, a change of color scheme) keeps what is still there selected, without
  // logging it again.
  restoring = true;
  restoredIds.clear();
  for (const x of state.selected) {
    const ele = cy.getElementById(x.type === "edge" ? `e:${x.id}` : x.id);
    if (ele.nonempty()) { restoredIds.add(ele.id()); ele.select(); }
  }
  restoring = false;
  const kept = keepLayout;
  seedPositions(view);
  cy.style(graphStyle());
  const cose = { name: "cose", animate: false, randomize: false, nodeRepulsion: () => 90000, idealEdgeLength: () => 140, componentSpacing: 120, padding: 40, nestingFactor: 0.9 };
  const freeFrame = cy.nodes(".free-frame");
  const frame = cy.nodes(".frame").not(".free-frame");
  if (kept) {
    // A hide (INV-33): every node that stays goes back to where it was; no layout, no fit. Frames size themselves to
    // what is left; a node whose place wasn't kept (none on a hide) stays where it was seeded.
    // Each node is measured first, as a layout would: Cytoscape takes a node never measured to take no space and doesn't
    // draw it (the stubs vanished on a hide until this, found by the user).
    cy.nodes().filter((n) => !n.isParent()).forEach((n) => {
      void n.layoutDimensions({ nodeDimensionsIncludeLabels: true });
      const p = kept.get(n.id());
      if (p) n.position(p);
    });
  } else if (freeFrame.length > 0) {
    // The top view with a "Not connected" frame (UI-47): the connected files laid out as usual, the free nodes on a grid
    // inside the frame, ordered by ID, the frame placed to the right of the connected ones.
    const inside = freeFrame.children();
    const rest = cy.nodes().not(freeFrame).not(inside);
    if (rest.length > 1) rest.union(cy.edges()).layout(cose as never).run();
    else if (rest.length === 1) rest.position({ x: 0, y: 0 });
    inside.layout({ name: "grid", cols: Math.ceil(Math.sqrt(inside.length)), avoidOverlap: true, avoidOverlapPadding: 30, condense: true,
      boundingBox: { x1: 0, y1: 0, w: 1, h: 1 }, sort: (p: NodeSingular, q: NodeSingular) => (p.id() < q.id() ? -1 : 1) } as never).run();
    if (rest.length) {
      const a = rest.boundingBox({}), b = inside.boundingBox({});
      inside.shift({ x: a.x2 + 160 - b.x1, y: a.y1 - b.y1 });
    }
  } else if (frame.length > 0) {
    // With a scope frame (UI-37), the force layout let stubs drift into the frame and scattered its contents, which
    // have few edges between them. So the contents go on a compact grid, in the model's order
    // (sorted by ID), the title centered above them (FND-105), and the stubs are placed around the frame (placeStubs).
    const inside = frame.children();
    const title = inside.filter(".this");
    const rest = inside.not(title).not(".notes-spacer");
    const order = new Map(view.nodes.map((id, i) => [id, i]));
    if (rest.filter(".kindframe").length) layoutKindFrames(rest, order); // UI-83
    else if (rest.length) squareGrid(rest, order);
    if (title.length) {
      const bb = rest.length ? blocksBox(rest) : { x1: 0, x2: 0, y1: 0 };
      title.position({ x: (bb.x1 + bb.x2) / 2, y: bb.y1 - 50 - title.outerHeight() / 2 });
    }
    placeStubs(inside);
  } else {
    const n = view.nodes.length + view.stubs.length;
    cy.layout(n <= 1 ? { name: "grid" } : cose as never).run();
  }
  applyIcons();
  applyPoints();
  applyFrameNotes();
  applyKindLabels();
  applyEdgeMode();
  $<HTMLButtonElement>("edgesw").setAttribute("aria-pressed", String(state.edgesFull));
  const sw = $<HTMLButtonElement>("kindsw");
  sw.disabled = state.view === "";
  sw.setAttribute("aria-pressed", String(state.kindFrames));
  if (!kept) cy.fit(undefined, 40);
  zoomReadout();
  drawKey(view);
  $("unres").textContent = unresolvedLine(view);
}

// ---------------------------------------------------------------------------
// Moving between levels (UI-31): double-click goes in, the breadcrumb goes back
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// The page's model layer (05_viewer.md, VIEW-51): the shared state is the current view (state.view) and the nodes hidden
// by a choice (layer.hidden, INV-33). Every move goes through go(); every reader (the Graph, the breadcrumb, the hover
// boxes, and the Inventory to come) reads one snapshot of the current view. It selects from what the backend stated and
// takes out what is hidden; it redoes no lifting (INV-18).
// ---------------------------------------------------------------------------

const layer = { hidden: new Set<string>(), hiddenKinds: new Set<string>(), version: 0 };
/** Hidden by a choice: the node, or one of its containers (BE-112's ancestors). */
const isHidden = (id: string): boolean => {
  if (layer.hidden.size === 0 && layer.hiddenKinds.size === 0) return false;
  const ixx = ix();
  const up = [id, ...(ixx?.ancestors[id] ?? [])];
  // A listed entry's folders count as its containers here, so hiding a folder hides the files in it (INV-33).
  const entry = (ixx?.ancestors[id] ?? [])[0] ?? id;
  for (let f = ixx?.folderOf[entry]; f; f = ixx?.folderOf[f]) up.push(f);
  return up.some((a) => layer.hidden.has(a) || layer.hiddenKinds.has(node(a)?.kind ?? ""));
};
/** A change of what is hidden (INV-33): at once, in lockstep; if the view shown becomes hidden, the nearest view above it
 *  that is still shown is shown instead. */
function hiddenChanged() {
  const viewBefore = state.view, before = snapshot();
  layer.version++;
  if (state.view !== "" && isHidden(state.view)) {
    const up = [...(model()?.levels[state.view]?.path ?? [])].reverse().find((v) => v === "" || !isHidden(v)) ?? "";
    state.view = up; state.selected = [];
  }
  // A hide keeps the layout: nothing in the view moves and the zoom stays; the layout runs again only when the view shown
  // gets a node back (a show), or when it changed (the view shown was hidden).
  const after = snapshot(), had = new Set([...(before?.nodes ?? []), ...(before?.stubs ?? [])]);
  const gained = [...(after?.nodes ?? []), ...(after?.stubs ?? [])].some((id) => !had.has(id));
  if (cy && state.view === viewBefore && !gained) keepLayout = new Map(cy.nodes().map((n) => [n.id(), { ...n.position() }]));
  render();
  keepLayout = undefined;
  if ($("pane-inventory").classList.contains("on")) invContent(); // the selected row's visibility and its [Show in graph]
}
let snap: { key: string; model?: Model; view?: MView } = { key: "" };
/** Positions to keep on the next draw (a hide, INV-33): node ID -> position. */
let keepLayout: Map<string, { x: number; y: number }> | undefined;
/** The current view as the backend stated it, with the hidden nodes and their edges taken out; made once per change. */
function snapshot(): MView | undefined {
  const m = model();
  const key = `${state.view}\u0000${layer.version}`;
  if (snap.model === m && snap.key === key) return snap.view;
  const v = m?.levels[state.view];
  let out = v;
  if (v && (layer.hidden.size > 0 || layer.hiddenKinds.size > 0)) { // nodes or kinds hidden (INV-33)
    const keep = (id: string) => !isHidden(id);
    const edges = v.edges.filter((e) => keep(e.from) && keep(e.to));
    const pick = <T,>(o: Record<string, T>, ok: (k: string, val: T) => boolean) => Object.fromEntries(Object.entries(o).filter(([k, val]) => ok(k, val)));
    out = {
      ...v,
      nodes: v.nodes.filter(keep), stubs: v.stubs.filter(keep), edges,
      render: pick(v.render, (k) => keep(k)), memberOf: pick(v.memberOf, (k) => keep(k)),
      relationEdge: pick(v.relationEdge, (_k, e) => edges.some((x) => x.id === e)),
      memberRows: Object.fromEntries(Object.entries(v.memberRows).filter(([k]) => keep(k)).map(([k, rows]) => [k, rows.filter(keep)])),
      inside: v.inside.filter(keep), unconnected: v.unconnected?.filter(keep),
    };
  }
  snap = { key, model: m, view: out };
  return out;
}
/** Every move goes through here (VIEW-51): a double-click in the Graph, a breadcrumb item, [Show in graph]. */
function go(id: string, event: "level_entered" | "level_left") {
  const m = model();
  if (!m?.levels[id] || id === state.view) return;
  state.view = id;
  state.selected = [];
  report(event, { nodeId: id });
  render();
}
function enter(id: string) { go(id, "level_entered"); }
/** Another source: the view and the hidden set start over (INV-40); a new run of the same source keeps both. */
function resetLayer() {
  state.view = ""; layer.hidden.clear(); layer.hiddenKinds.clear(); layer.version++;
  inv.open = new Set(["root"]); inv.sel = undefined; inv.query = ""; inv.forModel = undefined; // another source: the Inventory starts over (INV-40)
  ($("inv-q") as HTMLInputElement).value = "";
}
/** The breadcrumb (UI-82): the views above the current one, each a button, from the model's path (BE-112); a file's
 *  folders as plain text before it, since folders are not views (M2Q-1); and on the last item a dropdown of the views
 *  one level inside. Every click goes through the model layer (go). */
function crumbs() {
  const box = $("crumbs");
  box.replaceChildren();
  const s = state.source, v = snapshot();
  if (!s || !model() || !v) return;
  const sep = () => box.append(" › ");
  const item = (id: string, text: string, here: boolean) => {
    if (here) return el("span", { cls: "here", text });
    const b = el("button", { text });
    b.onclick = () => go(id, "level_left");
    return b;
  };
  const chain = state.view === "" ? [""] : [...v.path, state.view];
  chain.forEach((id, i) => {
    const here = i === chain.length - 1;
    if (i > 0) sep();
    if (id === "") box.append(item("", s.name, here));
    else {
      if (node(id)?.container === null) { // a listed entry: the folders it sits in, as plain text
        const folders: string[] = [];
        for (let f = ix()?.folderOf[id]; f; f = ix()?.folderOf[f]) folders.unshift(f);
        for (const f of folders) { box.append(el("span", { cls: "crumb-folder", text: displayName(f) })); sep(); }
      }
      box.append(item(id, displayName(id), here));
    }
    if (here && v.inside.length) box.append(crumbMenu(v.inside));
  });
}
/** The dropdown of the views one level inside (UI-82): every one, in the view's order, scrolling past 20. */
function crumbMenu(inside: string[]): HTMLElement {
  const wrap = el("span", { cls: "crumb-more" });
  const open = el("button", { cls: "crumb-open", text: `(${plural(inside.length, "scope")}) ▾`, title: `${plural(inside.length, "view")} one level inside: open the list` });
  open.setAttribute("aria-haspopup", "true");
  open.setAttribute("aria-expanded", "false");
  const menu = el("div", { cls: "crumb-menu" });
  menu.hidden = true;
  for (const id of inside) {
    const b = el("button", { text: displayName(id), title: titleOf(id) });
    b.onclick = () => { close(); go(id, "level_entered"); };
    menu.append(b);
  }
  const close = () => { menu.hidden = true; open.setAttribute("aria-expanded", "false"); document.removeEventListener("mousedown", outside, true); };
  const outside = (e: Event) => { if (!wrap.contains(e.target as Node)) close(); };
  open.onclick = () => {
    if (!menu.hidden) return close();
    menu.hidden = false;
    open.setAttribute("aria-expanded", "true");
    document.addEventListener("mousedown", outside, true);
  };
  wrap.addEventListener("keydown", (e) => { if ((e as KeyboardEvent).key === "Escape") close(); });
  wrap.append(open, menu);
  return wrap;
}

// ---------------------------------------------------------------------------
// The drawer (UI-50 to UI-55)
// ---------------------------------------------------------------------------

function tab(name: string) {
  document.querySelectorAll<HTMLElement>(".tab").forEach((t) => t.classList.toggle("on", t.dataset.tab === name));
  document.querySelectorAll<HTMLElement>(".pane").forEach((p) => p.classList.toggle("on", p.id === `pane-${name}`));
  if (name === "inventory") { drawInventory(); invContent(); }
}

function kv(pairs: [string, string | Node][]) {
  const dl = el("dl", { cls: "kv" });
  for (const [k, v] of pairs) dl.append(el("dt", { text: k }), el("dd", {}, v));
  return dl;
}
const locText = (l?: Loc) => (l ? `${l.file} ${l.start.line}:${l.start.column}` : "no location");

const isLoc = (x: unknown): x is Loc => !!x && typeof x === "object" && typeof (x as Loc).file === "string" &&
  Number.isInteger((x as Loc).start?.line) && Number.isInteger((x as Loc).end?.line);

/** The text a range covers (FND-106): its lines from the source, the first cut at the start column, the last at the
 *  end column (end is exclusive, as in every location). Written as text, never as HTML. */
async function rangeText(loc: Loc, target: HTMLElement) {
  if (!state.source) return;
  const r = await api<{ firstLine: number; lines: string[]; cut?: boolean }>("GET", `/api/source?source=${encodeURIComponent(state.source.sourceKey)}&file=${encodeURIComponent(loc.file)}&line=${loc.start.line}&end=${loc.end.line}`);
  if (r.status !== 200) { target.append(el("span", { cls: "muted", text: "(source not available)" })); return; }
  // The answer must be exactly the range's lines (FND-107): a server started before end existed answers with the
  // lines around the start instead, and cutting those gave every record on that line the same wrong text.
  const want = loc.end.line - loc.start.line + 1;
  if (r.data.firstLine !== loc.start.line || (r.data.cut ? r.data.lines.length >= want : r.data.lines.length !== want)) {
    target.append(el("span", { cls: "muted", text: "(the server didn't give this range's lines: restart the Viewer)" }));
    return;
  }
  const lines = [...r.data.lines];
  if (!r.data.cut) lines[lines.length - 1] = lines[lines.length - 1].slice(0, loc.end.column - 1); // the end first: on one line, the start cut must not shift it
  lines[0] = lines[0].slice(loc.start.column - 1);
  // Numbered like the lines around a location, the line number then the text (FND-108), wrapped (CSS).
  const pre = el("pre", { cls: "src wrap" });
  lines.forEach((line, i) => pre.append(el("span", {}, el("i", { text: String(loc.start.line + i) }), line)));
  if (r.data.cut) pre.append(el("span", {}, el("i", { text: "" }), "(…)"));
  target.append(pre);
}

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
const restoredIds = new Set<string>(); // the elements a redraw re-selects, until Cytoscape reports each (drawGraph)
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
  applyEdgeMode();
  details();
  // A selection made by [Show in graph] keeps the drawer's tab: the guard is used up by the first report of a selection,
  // whenever Cytoscape sends it, not after a fixed time (on a larger graph it came later than any fixed wait).
  if (showDetails) { if (stayInTab) { stayInTab = false; clearTimeout(stayTimer); } else tab("details"); }
}
let stayInTab = false; // a selection made by [Show in graph] keeps the drawer's tab (INV-15)
let stayTimer: ReturnType<typeof setTimeout> | undefined;

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
  const view = snapshot()!;
  const sel = state.selected;
  if (sel.length === 0) {
    const relCount = view.edges.reduce((s, e) => s + e.count, 0);
    pane.append(el("h3", { text: "This view" }), kv([
      ["Level", state.view === "" ? "top · files" : `inside ${displayName(state.view)}`],
      ["Nodes", `${view.nodes.length} shown${view.stubs.length ? `, ${plural(view.stubs.length, "stub")}` : ""}`],
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

// A node's label as the graph draws it: the frame's title for the entered node (FND-105), else its display name.
const drawnLabel = (id: string) => (id === state.view && state.view !== "" ? titleOf(id) : displayName(id));

function nodeDetails(id: string, pane: HTMLElement, alone: boolean) {
  const m = model()!;
  const n = node(id);
  if (!n) return;
  const pairs: [string, string | Node][] = [["Kind", `${n.kind} (${n.dataName})`], ["Name", n.label], ["ID", el("code", { text: n.id })]];
  if (n.tool) pairs.push(["Tool", n.tool]);
  if (n.owner) pairs.push(["Owner", el("code", { text: n.owner })]);
  pairs.push(["Location", locText(n.location)]);
  // Every other key of the record, as "key: value" (VIEW-15, FND-69 item 2): shown, so not extra data.
  for (const [k, v] of Object.entries(n.attrs ?? {})) {
    pairs.push([k, typeof v === "string" || typeof v === "number" || typeof v === "boolean" ? String(v) : el("code", { text: JSON.stringify(v) })]);
  }
  const icons = iconsOf(n).map((i) => i.title);
  if (icons.length) pairs.push(["Status", icons.join(", ")]);
  const what = n.owner !== undefined ? "Scope" : n.container === null ? (n.kind === "file" ? "File" : n.kind === "folder" ? "Folder" : "Entry") : n.kind === "file" ? "File" : "Node";
  pane.append(el(alone ? "h3" : "h4", { text: what }), kv(pairs));
  const src = el("div");
  pane.append(src);
  // The source box (FND-108): the text the record's range covers, numbered and wrapped, one column per range when a
  // record has several. A record with no range keeps the lines around it.
  const ranges = (Array.isArray(n.attrs?.range) ? n.attrs.range : [n.attrs?.range]).filter(isLoc);
  if (ranges.length) {
    const cols = el("div", { cls: "rangecols" });
    cols.style.gridTemplateColumns = `repeat(${ranges.length}, minmax(0, 1fr))`;
    for (const r of ranges) { const box = el("div"); cols.append(box); void rangeText(r, box); }
    src.append(cols);
  } else void sourceLines(n.location, src);
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

// Built-ins grouped by the library type that declares them (FND-100), as the model states the groups (BE-114): one box per
// type, "N members · N uses"; one line per member, "member — places", sorted by place. The page only lays them out.
function builtinBoxes(groups: MView["builtinGroups"]): HTMLUListElement {
  const place = (r: MRel) => `${r.location?.file ?? "?"} ${r.location?.start.line ?? "?"}:${r.location?.start.column ?? "?"}`;
  const byPlace = (x: MRel, y: MRel) => (place(x) < place(y) ? -1 : place(x) > place(y) ? 1 : 0);
  const ul = el("ul", { cls: "rows" });
  for (const g of groups) {
    const members = g.members.map((m) => ({ name: m.name, rels: m.relations.map((id) => rel(id)).filter((r): r is MRel => !!r).sort(byPlace) }));
    const uses = members.reduce((n, m) => n + m.rels.length, 0);
    const dataNames = [...new Set(members.flatMap((m) => m.rels.map((r) => r.dataName)))].join(", ");
    ul.append(itemBox({
      name: g.type, what: `${plural(members.length, "member")} · ${plural(uses, "use")}`, type: dataNames,
      places: members.map((m) => `${m.name} — ${m.rels.map(place).join(", ")}`),
    }));
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
  const e = snapshot()!.edges.find((x) => x.id === id);
  if (!e) return;
  pane.append(el(alone ? "h3" : "h4", { text: `Edge · ${plural(e.count, "relation")}` }), kv([["From", drawnLabel(e.from)], ["To", drawnLabel(e.to)], ["Kind", e.kind]]), el(alone ? "h3" : "h4", { text: "Stands for" }));
  const ul = el("ul", { cls: "rows" });
  pane.append(ul);
  for (const rid of e.members) {
    const r = rel(rid);
    if (!r) continue;
    const more = Object.entries(r.attrs ?? {}).map(([k, v]) => ` · ${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`).join("");
    const li = el("li", {}, el("b", { text: r.kind }), ` ${node(r.from)?.label ?? r.from} → ${r.to ? node(r.to)?.label ?? r.to : "unresolved"} · ${locText(r.location)} · `, el("code", { text: r.dataName }), ` from ${r.tool}${more}`);
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
type Inv = { tool: string; file_id?: string; skipped: boolean; dryRun?: string; dryRunError?: { code?: string; message?: string }; result?: { status?: string; logPath?: string; error?: { code?: string; message?: string } } };
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
      places: bad.map((i) => failurePlace(i.file_id, i.result?.error ?? i.dryRunError, bad.length > 1 ? i.result?.logPath : undefined)) }));
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
  const ids = new Set(inView ? m.levels[state.view]?.unresolved ?? [] : m.relations.filter((r) => r.to === null && r.reason !== "built-in").map((r) => r.id));
  const unresolved = m.relations.filter((r) => ids.has(r.id));
  pane.append(el("h3", { text: `Unresolved relations · ${inView ? "this view" : "all"}` }));
  if (unresolved.length === 0) pane.append(el("p", { cls: "muted", text: inView ? "None in this view." : "None." }));
  else {
    const ul = groupedItems(unresolved.map((r) => ({ name: relName(r), dataName: r.dataName, location: r.location, note: r.reason ?? "no reason recorded" })),
      (list) => plural(list.length, "mention"));
    pane.append(ul);
  }
  // Built-ins (TPG-D5): uses of names TypeScript's library declares, listed apart and not counted as unresolved.
  // The top view holds every built-in use (each one's start lands on its file), so its groups are the whole run's.
  const groups = (inView ? m.levels[state.view] : m.levels[""])?.builtinGroups ?? [];
  pane.append(el("h3", { text: `Built-ins · ${inView ? "this view" : "all"}` }));
  if (groups.length === 0) pane.append(el("p", { cls: "muted", text: inView ? "None in this view." : "None." }));
  else pane.append(builtinBoxes(groups));
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
  drawInventory(); // its marks follow the view (INV-12); it never opens, closes or scrolls by itself
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
    const unres = m.relations.filter((r) => r.to === null && r.reason !== "built-in").length;
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
  resetLayer();
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
// The Inventory (51_viewer_inventory.md; first pass, read-only: hiding and [Show in graph] come next). A tree of what the
// model holds, built once per model and lazily (INV-39): a row's children are made when it is first opened. It keeps its
// own selection (INV-13, INV-36), open rows and search; its marks read the model layer's snapshot (INV-10, INV-12).
// ---------------------------------------------------------------------------

type InvRow = { key: string; text: string; marks?: string; kind: "root" | "section" | "folder" | "entry" | "symbol" | "view" | "group" | "edge" | "json"; ref?: string; view?: string; value?: unknown; muted?: boolean };
const inv = {
  open: new Set<string>(["root"]), sel: undefined as string | undefined, focus: undefined as string | undefined, visible: [] as string[], query: "", regex: false, matches: [] as string[], at: -1,
  rows: new Map<string, InvRow>(), kids: new Map<string, string[]>(), parent: new Map<string, string>(), forModel: undefined as Model | undefined,
};
/** Keys the Graph draws from a node's attrs (BE-114's facts, the status icons, a listed entry's label); every other key a
 *  tool wrote is unused (INV-7). Known by name here until the model states it. */
const DRAWN_KEYS = new Set(["exported", "defaultExport", "declaredWith", "modifiers", "declarations", "declaredIn", "type", "hidden", "link", "readOnly", "unreadable", "fileCount", "totalBytes", "skipped"]);
const unusedKeys = (n: MNode) => Object.keys(n.attrs ?? {}).filter((k) => !DRAWN_KEYS.has(k)).filter((k) => !(k === "declarations" && Array.isArray(n.attrs?.declarations) && n.attrs.declarations.length < 2));

const KIND_WORD = (n: MNode) => (["function", "method", "constructor", "accessor"].includes(n.kind) ? "ƒ" : n.kind === "typeAlias" ? "type" : n.kind);
/** The Inventory's model: reset when the model changes; kept open rows, selection and search when it is the same source (INV-40). */
function invModel() {
  const m = model();
  if (inv.forModel === m) return;
  inv.forModel = m;
  inv.rows.clear(); inv.kids.clear(); inv.parent.clear();
  if (!m) return;
  addRow({ key: "root", text: state.source?.name ?? "source", kind: "root" });
  for (const [key, text] of [["sec:files", "Files"], ["sec:views", "Views · computed by the Viewer"], ["sec:model", "Model"]]) { addRow({ key, text, kind: "section" }); }
  inv.kids.set("root", ["sec:files", "sec:views", "sec:model"]);
  for (const k of ["sec:files", "sec:views", "sec:model"]) inv.parent.set(k, "root");
  if (inv.sel && !findable(inv.sel)) inv.sel = undefined;
  for (const k of [...inv.open]) if (!findable(k)) inv.open.delete(k);
  runSearch();
}
const addRow = (r: InvRow) => { inv.rows.set(r.key, r); return r.key; };
/** A row's children, made the first time they are asked for (INV-39). */
function invKids(key: string): string[] {
  const done = inv.kids.get(key);
  if (done) return done;
  const m = model(); const ixx = ix();
  const out: string[] = [];
  const row = inv.rows.get(key);
  if (!m || !ixx || !row) return out;
  const nodeRow = (id: string) => {
    const n = node(id);
    const k = `f:${id}`;
    if (!n) return addRow({ key: k, text: id, kind: "symbol", ref: id });
    const kind = n.container === null ? (n.kind === "folder" ? "folder" : "entry") : "symbol";
    const text = n.container === null ? (n.kind === "folder" ? `${n.label}/` : n.label) : `${KIND_WORD(n)} ${n.label}`;
    return addRow({ key: k, text, kind, ref: id });
  };
  if (key === "sec:files") for (const e of ixx.entries[""] ?? []) out.push(nodeRow(e));
  else if (row.kind === "folder") for (const e of ixx.entries[row.ref!] ?? []) out.push(nodeRow(e));
  else if (row.kind === "entry" || row.kind === "symbol") for (const c of ixx.children[row.ref!] ?? []) out.push(nodeRow(c));
  else if (key === "sec:views") out.push(addRow({ key: "v:", text: "top view", kind: "view", view: "" }));
  else if (row.kind === "view") {
    const v = m.levels[row.view!];
    for (const [g, n] of [["nodes", v.nodes.length], ["stubs", v.stubs.length], ["edges", v.edges.length]] as const) {
      if (n) out.push(addRow({ key: `vg:${row.view}:${g}`, text: `${g} · ${n}`, kind: "group", view: row.view, ref: g }));
    }
    const under = Object.entries(m.levels).filter(([id, x]) => id !== "" && (x.path[x.path.length - 1] ?? null) === row.view).map(([id]) => id);
    const order = new Map(v.nodes.map((id, i) => [id, i]));
    under.sort((a, b) => (order.get(a) ?? 1e9) - (order.get(b) ?? 1e9) || (a < b ? -1 : 1));
    for (const id of under) out.push(addRow({ key: `v:${id}`, text: displayName(id), kind: "view", view: id }));
  } else if (row.kind === "group") {
    const v = m.levels[row.view!];
    if (row.ref === "edges") for (const e of v.edges) out.push(addRow({ key: `ve:${row.view}:${e.id}`, text: `${displayName(e.from)} → ${displayName(e.to)} · ${e.count > 1 ? `${e.count} · ` : ""}${e.kind}`, kind: "edge", view: row.view, ref: e.id }));
    else for (const id of (row.ref === "nodes" ? v.nodes : v.stubs)) out.push(addRow({ key: `vn:${row.view}:${id}`, text: `${node(id) ? KIND_WORD(node(id)!) : ""} ${displayName(id)}`.trim(), kind: "symbol", ref: id, view: row.view }));
  } else if (key === "sec:model") {
    const rest: Record<string, unknown> = { formatVersion: m.formatVersion, sourceKey: m.sourceKey, sourceRoot: m.sourceRoot, run: m.run, files: m.files, checks: m.checks, dropped: m.dropped };
    for (const [k, val] of Object.entries(rest)) out.push(jsonRow(`j:${k}`, k, val, k === "dropped"));
  } else if (row.kind === "json" && row.value && typeof row.value === "object") {
    for (const [k, val] of Object.entries(row.value as Record<string, unknown>)) out.push(jsonRow(`${key}/${k}`, k, val, row.muted));
  }
  inv.kids.set(key, out);
  for (const c of out) inv.parent.set(c, key);
  return out;
}
function jsonRow(key: string, name: string, value: unknown, unused = false): string {
  const leaf = value === null || typeof value !== "object";
  const shown = leaf ? `${name}: ${JSON.stringify(value)}` : `${name} ${Array.isArray(value) ? `[${value.length}]` : `{${Object.keys(value as object).length}}`}`;
  return addRow({ key, text: shown, kind: "json", value, muted: unused });
}
const hasKids = (key: string) => {
  const r = inv.rows.get(key);
  if (!r) return false;
  if (r.kind === "root" || r.kind === "section" || r.kind === "view" || r.kind === "group") return true;
  if (r.kind === "folder") return (ix()?.entries[r.ref!] ?? []).length > 0;
  if (r.kind === "entry" || r.kind === "symbol") return !r.view && (ix()?.children[r.ref!] ?? []).length > 0;
  if (r.kind === "json") return !!r.value && typeof r.value === "object" && Object.keys(r.value as object).length > 0;
  return false;
};
/** Whether a key can be reached in this model (its row can be made from the root). */
function findable(key: string): boolean {
  if (inv.rows.has(key)) return true;
  if (key.startsWith("f:")) return !!node(key.slice(2));
  if (key.startsWith("v:")) return !!model()?.levels[key.slice(2)];
  return false;
}
/** The chain of rows above a Files row, made as needed, so a match or a selection can be shown (INV-17). */
function invPath(key: string): string[] {
  if (!key.startsWith("f:")) { const out: string[] = []; for (let p = inv.parent.get(key); p; p = inv.parent.get(p)) out.unshift(p); return out; }
  const id = key.slice(2), ixx = ix()!;
  const up: string[] = [...(ixx.ancestors[id] ?? [])];
  const top = up[0] ?? id;
  const folders: string[] = [];
  for (let f = ixx.folderOf[top]; f; f = ixx.folderOf[f]) folders.unshift(f);
  const chain = ["root", "sec:files", ...folders.map((f) => `f:${f}`), ...up.map((a) => `f:${a}`)];
  for (const k of chain) invKids(k); // make every row on the way
  return chain;
}

// ---- marks (INV-32), read from the snapshot of the current view
function invMarks(r: InvRow): string {
  const v = snapshot();
  if (r.kind === "view") {
    const x = model()?.levels[r.view!];
    return x?.reachable && (r.view === "" || !isHidden(r.view!)) ? "reachable" : "no direct path";
  }
  if (!r.ref || !(r.kind === "folder" || r.kind === "entry" || r.kind === "symbol")) return "";
  const n = node(r.ref);
  if (!n) return "";
  const out: string[] = [];
  if (n.display?.icons?.length) out.push(n.display.icons.map((i) => ICONS.find((x) => x.name === i)?.title ?? i).join(", "));
  if (n.attrs?.exported === true) out.push("exp");
  if (model()?.levels[n.id]) out.push("▸view");
  // The visibility mark always last, so the circles line up at the right edge.
  out.push(isHidden(n.id) ? "⊘" : v?.render[n.id] ? "●" : "○");
  return out.join(" ");
}
const visibilityText = (id: string) => {
  if (isHidden(id)) return "hidden by a choice";
  const how = snapshot()?.render[id];
  return how === "node" ? "rendered in this view, as a node" : how === "member" ? `rendered in this view, in ${displayName(snapshot()!.memberOf[id])}'s label` : how === "stub" ? "rendered in this view, as a stub" : how === "title" ? "rendered in this view, as the frame's title" : "not in this view";
};

// ---- drawing
function drawInventory() {
  const pane = $("pane-inventory");
  if (!pane.classList.contains("on")) return;
  invModel();
  const tree = $("inv-tree");
  const keep = tree.scrollTop, keepX = tree.scrollLeft;
  tree.replaceChildren();
  if (!model()) { tree.append(el("p", { cls: "muted", text: "No graph to examine yet." })); return; }
  // The rows sit in one box as wide as the widest row, so every row, and the selected one's highlight, spans the whole
  // width the tree scrolls over, not only the visible part.
  const box = el("div", { cls: "inv-rows" });
  tree.append(box);
  inv.visible = [];
  const walk = (key: string, depth: number) => {
    const r = inv.rows.get(key);
    if (!r) return;
    const open = inv.open.has(key), kids = hasKids(key);
    inv.visible.push(key);
    const line = el("div", { cls: `inv-row${inv.sel === key ? " sel" : ""}${inv.focus === key ? " focus" : ""}${r.muted ? " unused" : ""}${inv.matches.includes(key) ? " match" : ""}` });
    line.dataset.key = key;
    // "You're here" in a column of its own at the tree's left edge, pinned there whatever the sideways scroll; the
    // indentation comes after it.
    const here = (r.kind === "view" && r.view === state.view) || (!!r.ref && !r.view && r.kind !== "view" && r.ref === state.view && state.view !== "");
    const gutter = el("span", { cls: "inv-here", text: here ? "⌖" : "", title: here ? "You're here: the view being shown" : "" });
    line.append(gutter);
    const tw = el("span", { cls: `inv-twisty ${kids ? (open ? "open" : "closed") : "leaf"}`, text: kids ? (open ? "▼" : "▶") : "·" });
    tw.style.marginLeft = `${depth * 14}px`;
    tw.onclick = (e) => { e.stopPropagation(); if (!kids) return; open ? inv.open.delete(key) : inv.open.add(key); drawInventory(); };
    line.append(tw);
    // A checkbox on each node of the Files section: unticked hides it, and everything inside it, from the Graph (INV-33).
    if (key.startsWith("f:") && r.ref) {
      const cb = el("input", { cls: "inv-check", title: "Shown in the Graph; untick to hide it and everything inside it" }) as HTMLInputElement;
      cb.type = "checkbox";
      cb.checked = !layer.hidden.has(r.ref);
      cb.disabled = !layer.hidden.has(r.ref) && isHidden(r.ref); // hidden by a container or a kind: not its own choice
      cb.onclick = (e) => { e.stopPropagation(); cb.checked ? layer.hidden.delete(r.ref!) : layer.hidden.add(r.ref!); hiddenChanged(); };
      line.append(cb);
    }
    line.append(el("span", { cls: "inv-text", text: r.text }));
    const marks = invMarks(r) + (r.muted ? " unused" : "");
    if (marks.trim()) line.append(el("span", { cls: "inv-marks", text: marks.trim() }));
    line.onclick = () => { inv.sel = key; inv.focus = key; drawInventory(); invContent(); tree.focus({ preventScroll: true }); };
    box.append(line);
    if (open && kids) for (const c of invKids(key)) walk(c, depth + 1);
  };
  walk("root", 0);
  drawShowRow();
  tree.scrollTop = keep;
  tree.scrollLeft = keepX;
  drawMatchStrip();
  ($("inv-expand") as HTMLButtonElement).disabled = !inv.sel;
  $("inv-count").textContent = inv.query ? `${inv.matches.length} ${inv.matches.length === 1 ? "match" : "matches"}` : "";
}
/** The kinds' toggles (INV-33), in a fixed order, the least likely to be hidden first and the most likely last (decided by the
 *  user, 2026-11-10); every known kind always there, so the grid never moves; a kind the source doesn't have disabled;
 *  a kind not known here after them. The per-kind toggles are M2Q-6's filters. Files and folders have none: hiding every
 *  file would empty the Graph. */
const SHOW_ORDER = ["namespace", "class", "interface", "typeAlias", "enum", "function", "method", "constructor", "accessor", "property", "enumMember", "import", "parameter", "variable"];
/** The bar at the bottom of the Inventory pane, "Show: all ▴", and its panel, opened upward over the content area like the
 *  activity line: the toggles in a grid of equal buttons, and [show all]. */
function drawShowRow() {
  const pop = $("inv-show"), bar = $<HTMLButtonElement>("inv-show-open");
  const present = new Set((model()?.nodes ?? []).filter((n) => n.container !== null).map((n) => n.kind));
  const kinds = [...SHOW_ORDER, ...[...present].filter((k) => !SHOW_ORDER.includes(k)).sort()];
  const grid = el("div", { cls: "inv-show-grid" });
  for (const k of kinds) {
    const name = KIND_FRAMES.get(k) ?? k;
    const b = el("button", { text: name, title: present.has(k) ? `${name}: shown in the Graph when pressed; press to hide or show them` : `${name}: none in this source` }) as HTMLButtonElement;
    b.setAttribute("aria-pressed", String(!layer.hiddenKinds.has(k)));
    b.disabled = !present.has(k);
    b.onclick = () => { layer.hiddenKinds.has(k) ? layer.hiddenKinds.delete(k) : layer.hiddenKinds.add(k); hiddenChanged(); };
    grid.append(b);
  }
  // [Recalc] (asked by the user, 2026-11-10): the view laid out again from the start and fitted, what is hidden left out;
  // it undoes the gaps a hide leaves (a hide keeps the layout) and any dragging; what is hidden and selected stays.
  const recalc = el("button", { cls: "inv-recalc", text: "Recalc", title: "Lay out the view again and fit it" }) as HTMLButtonElement;
  recalc.onclick = () => { keepLayout = undefined; drawGraph(); };
  grid.append(recalc);
  const all = el("button", { cls: "inv-showall", text: "show all", title: "Show every node and kind again" }) as HTMLButtonElement;
  all.disabled = layer.hidden.size === 0 && layer.hiddenKinds.size === 0;
  all.onclick = () => { layer.hidden.clear(); layer.hiddenKinds.clear(); hiddenChanged(); };
  pop.replaceChildren(grid, all);
  const kindsOff = [...layer.hiddenKinds].filter((k) => present.has(k)).length, nodesOff = layer.hidden.size;
  const what = kindsOff || nodesOff ? [kindsOff ? plural(kindsOff, "kind") : "", nodesOff ? plural(nodesOff, "node") : ""].filter(Boolean).join(", ") + " hidden" : "all";
  bar.textContent = `Show: ${what} ${pop.hidden ? "▴" : "▾"}`;
  bar.setAttribute("aria-expanded", String(!pop.hidden));
}
function toggleShowPanel(open?: boolean) {
  const pop = $("inv-show");
  pop.hidden = !(open ?? pop.hidden);
  drawShowRow();
}

// ---- [Show in graph] (INV-15): as if the person had navigated and clicked in the Graph by hand
type GraphTarget = { view: string; select?: { type: "node" | "edge"; id: string } } | { why: string };
/** Where a node is drawn as a node: the view shown, when it is drawn there (a node, a stub, the title, or a member in a
 *  label, which selects the label's node); else its container's view. */
function nodeTarget(id: string): GraphTarget {
  if (isHidden(id)) return { why: "hidden by a choice" };
  const here = snapshot()?.render[id];
  if (here === "node" || here === "stub" || here === "title") return { view: state.view, select: { type: "node", id } };
  if (here === "member") return { view: state.view, select: { type: "node", id: snapshot()!.memberOf[id] } };
  const n = node(id), m = model();
  if (!n || !m) return { why: "not in the model" };
  const v = n.container ?? "";
  const lv = m.levels[v];
  if (!lv || (v !== "" && (!lv.reachable || isHidden(v)))) return { why: "in no view the Graph can reach" };
  const how = lv.render[id];
  if (how === "member") return { view: v, select: { type: "node", id: lv.memberOf[id] } };
  return { view: v, select: { type: "node", id } };
}
/** Where a relation is drawn: the view shown, else the deepest view above its start where an edge stands for it. */
function relationTarget(rid: string): GraphTarget {
  const r = rel(rid), m = model();
  if (!r || !m) return { why: "not in the model" };
  if (isHidden(r.from) || (r.to !== null && isHidden(r.to))) return { why: "an end is hidden by a choice" };
  const hereEdge = snapshot()?.relationEdge[rid];
  if (hereEdge) return { view: state.view, select: { type: "edge", id: hereEdge } };
  const chain = [...(ix()?.ancestors[r.from] ?? [])].reverse().concat([""]);
  for (const v of chain) {
    const lv = m.levels[v], e = lv?.relationEdge[rid];
    if (e && (v === "" || (lv.reachable && !isHidden(v)))) return { view: v, select: { type: "edge", id: e } };
  }
  return { why: "drawn in no view the Graph can reach" };
}
function viewTarget(v: string): GraphTarget {
  const lv = model()?.levels[v];
  if (!lv) return { why: "not in the model" };
  if (v !== "" && (!lv.reachable || isHidden(v))) return { why: isHidden(v) ? "hidden by a choice" : "no direct path" };
  return { view: v };
}
function showInGraph(t: GraphTarget) {
  if ("why" in t) return;
  stayInTab = true; // set before anything is selected or redrawn
  if (t.view !== state.view) go(t.view, "level_entered");
  if (!cy) return;
  cy.$(":selected").unselect();
  if (t.select) cy.getElementById(t.select.type === "edge" ? `e:${t.select.id}` : t.select.id).select();
  syncSelection(false);
  glow(t.select ? cy.getElementById(t.select.type === "edge" ? `e:${t.select.id}` : t.select.id) : cy.nodes(".this").first());
  // Cytoscape reports the selection later, after the redraw; the guard waits for that report (syncSelection). With
  // nothing selected no report comes, so it lapses after 2 s, and a later click in the Graph opens Details as usual.
  clearTimeout(stayTimer);
  stayTimer = setTimeout(() => { stayInTab = false; }, t.select ? 2000 : 0);
  drawInventory();
}
/** A short glow around what [Show in graph] lands on, fading out (about 1.2 s), so the eye finds it; it may play off
 *  screen. A new press restarts it. Skipped when the system asks for reduced motion; the selection marks the target. */
function glow(ele: cytoscapeType.CollectionReturnValue | cytoscapeType.NodeSingular | cytoscapeType.EdgeSingular) {
  if (!ele || ele.empty() || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  ele.stop(true, false);
  ele.style({ "underlay-color": css("--accent"), "underlay-opacity": 0.55, "underlay-padding": 12, "underlay-shape": "round-rectangle" } as never);
  ele.animate({ style: { "underlay-opacity": 0 } as never }, { duration: 1200, easing: "ease-out", complete: () => { ele.removeStyle("underlay-color underlay-opacity underlay-padding underlay-shape"); } });
}
function showButton(t: GraphTarget, small = false): HTMLButtonElement {
  const b = el("button", { cls: small ? "inv-show-one" : "inv-showgraph", text: small ? "show" : "Show in graph", title: "why" in t ? `Can't be shown: ${t.why}` : "Show it in the Graph, as navigating there and clicking it would" }) as HTMLButtonElement;
  b.disabled = "why" in t;
  b.onclick = (e) => { e.stopPropagation(); showInGraph(t); };
  return b;
}

/** The search's overview strip (INV-43): a small square beside the tree for each match, where its row sits among the rows
 *  shown (a match inside a closed row at its nearest shown parent), as a scrollbar would place it; the current match
 *  darker and outlined. Only an indication: it takes no clicks and moves nothing. Empty with no search or no match. */
function drawMatchStrip() {
  const strip = $("inv-strip"), tree = $("inv-tree");
  strip.replaceChildren();
  placeStrip();
  const box = tree.querySelector<HTMLElement>(".inv-rows");
  if (!inv.query || !inv.matches.length || !box || box.scrollHeight === 0) return;
  const current = inv.at >= 0 ? inv.matches[inv.at] : undefined;
  const at = new Map<number, boolean>(); // top, in tenths of a percent -> holds the current match
  for (const key of inv.matches) {
    const chain = [...invPath(key), key];
    let shown = chain[0];
    for (let i = 0; i < chain.length - 1 && inv.open.has(chain[i]); i++) shown = chain[i + 1];
    const row = tree.querySelector<HTMLElement>(`[data-key="${CSS.escape(shown)}"]`);
    if (!row) continue;
    // Its middle, measured from the top of the rows' box (not from the pane).
    const r = row.getBoundingClientRect(), b = box.getBoundingClientRect();
    // A share of the rows' height, or of the tree's when the rows don't fill it, as a scrollbar would place it.
    const top = Math.round(((r.top - b.top + r.height / 2) / Math.max(b.height, tree.clientHeight)) * 1000);
    at.set(top, (at.get(top) ?? false) || key === current);
  }
  // Squares closer than 2 px merge into one, so a crowded search doesn't fill the strip.
  const px = strip.clientHeight || 1;
  let last = -Infinity;
  for (const [top, cur] of [...at].sort(([a], [b]) => a - b)) {
    const y = (top / 1000) * px;
    if (y - last < 2 && !cur) continue;
    last = y;
    const sq = el("span", { cls: `inv-mark${cur ? " current" : ""}` });
    sq.style.top = `${top / 10}%`;
    strip.append(sq);
  }
}
/** The strip sits just right of the tree, as tall as it, in the pane's padding, so nothing in the layout moves. */
function placeStrip() {
  const strip = $("inv-strip"), tree = $("inv-tree");
  strip.style.top = `${tree.offsetTop}px`;
  strip.style.height = `${tree.offsetHeight}px`;
  strip.style.left = `${tree.offsetLeft + tree.offsetWidth + 2}px`;
}

/** [expand selected] (INV-16): the selected row and everything under it; on the root row, everything. Asks first above
 *  2,000 rows (INV-39). */
function expandSelected() {
  if (!inv.sel) return;
  const all: string[] = [];
  const grow = (k: string) => { if (!hasKids(k)) return; all.push(k); for (const c of invKids(k)) grow(c); };
  grow(inv.sel);
  const rows = all.reduce((n, k) => n + invKids(k).length, 0);
  if (rows > 2000 && !confirm(`This opens ${rows} rows. Go on?`)) return;
  for (const k of all) inv.open.add(k);
  drawInventory();
}
function collapseAll() { inv.open = new Set(["root"]); drawInventory(); }

// ---- search (INV-17, INV-35): nodes only, by name and ID; its own list of matches, in the tree's order
function runSearch() {
  inv.matches = []; inv.at = -1;
  const q = inv.query.trim();
  if (!q || !ix()) return;
  let test: (s: string) => boolean;
  try { const re = inv.regex ? new RegExp(q, "i") : null; const low = q.toLowerCase(); test = re ? (s) => re.test(s) : (s) => s.toLowerCase().includes(low); }
  catch { test = () => false; }
  const ixx = ix()!;
  const visit = (id: string) => {
    const n = node(id);
    if (n && (test(n.label) || test(n.id))) inv.matches.push(`f:${id}`);
    if (n?.kind === "folder") for (const e of ixx.entries[id] ?? []) visit(e);
    else for (const c of ixx.children[id] ?? []) visit(c);
  };
  for (const e of ixx.entries[""] ?? []) visit(e);
}
/** [next] and [previous]: select the match as if clicked, open the rows above it, scroll to it, show its content. */
function jump(step: 1 | -1) {
  if (!inv.matches.length) return;
  inv.at = (inv.at + step + inv.matches.length) % inv.matches.length;
  const key = inv.matches[inv.at];
  for (const k of invPath(key)) inv.open.add(k);
  inv.sel = key;
  inv.focus = key;
  drawInventory();
  invContent();
  document.querySelector<HTMLElement>(`#inv-tree [data-key="${CSS.escape(key)}"]`)?.scrollIntoView({ block: "nearest" });
}

/** Keyboard navigation in the tree (INV-41, INV-42): ↑ and ↓ move the focus only; Enter shows a row's content when it has
 *  nothing inside, else opens it; → opens, or moves to the first sub-item; ← closes, or moves to the parent, one step a
 *  press; Esc clears the selection and goes to the search field. The keys act only while the tree has the focus. */
function treeKey(e: KeyboardEvent) {
  const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "Escape"];
  if (!keys.includes(e.key) || e.altKey || e.ctrlKey || e.metaKey) return;
  e.preventDefault();
  if (e.key === "Escape") {
    inv.sel = undefined; inv.focus = undefined;
    drawInventory(); invContent();
    ($("inv-q") as HTMLInputElement).focus();
    return;
  }
  const vis = inv.visible;
  let f = inv.focus && vis.includes(inv.focus) ? inv.focus : (inv.sel && vis.includes(inv.sel) ? inv.sel : vis[0]);
  if (!f) return;
  const at = vis.indexOf(f), open = inv.open.has(f), kids = hasKids(f);
  if (e.key === "ArrowUp") f = vis[Math.max(0, at - 1)];
  else if (e.key === "ArrowDown") f = vis[Math.min(vis.length - 1, at + 1)];
  else if (e.key === "ArrowRight") { if (kids && !open) inv.open.add(f); else if (kids) f = invKids(f)[0] ?? f; }
  else if (e.key === "ArrowLeft") { if (kids && open) inv.open.delete(f); else f = inv.parent.get(f) ?? f; }
  else if (e.key === "Enter") {
    if (kids) { if (!open) inv.open.add(f); }
    else { inv.sel = f; invContent(); }
  }
  inv.focus = f;
  drawInventory();
  document.querySelector<HTMLElement>(`#inv-tree [data-key="${CSS.escape(f)}"]`)?.scrollIntoView({ block: "nearest" });
}

// ---- the content area (INV-37, INV-14)
function invContent() {
  const box = $("inv-content");
  box.replaceChildren();
  const r = inv.sel ? inv.rows.get(inv.sel) : undefined;
  if (!r) { box.append(el("p", { cls: "muted", text: "Select a row to see it here." })); return; }
  const kv = (pairs: [string, string | Node][]) => el("dl", { cls: "inv-kv" }, ...pairs.flatMap(([k, v]) => [el("dt", { text: k }), el("dd", {}, v)]));
  if ((r.kind === "folder" || r.kind === "entry" || r.kind === "symbol") && r.ref && node(r.ref)) {
    const n = node(r.ref)!;
    box.append(el("div", { cls: "inv-head", text: n.container === null ? `${n.kind} ${n.label}` : titleOf(n.id) }));
    const copy = el("button", { cls: "inv-copy", text: "copy" });
    copy.onclick = () => void navigator.clipboard?.writeText(n.id);
    const unused = unusedKeys(n);
    box.append(kv([
      ["ID", el("span", {}, el("code", { text: n.id }), " ", copy)],
      ["Place", n.location ? locText(n.location) : n.id],
      ["Here", visibilityText(n.id) + (model()?.levels[n.id] ? " · has a view" : "")],
      ...(unused.length ? [["Unused", unused.join(", ")] as [string, string]] : []),
    ]));
    box.append(showButton(nodeTarget(n.id)));
    relationLists(box, n.id);
  } else if (r.kind === "view") {
    const v = model()!.levels[r.view!];
    box.append(el("div", { cls: "inv-head", text: r.view === "" ? "top view" : `view of ${titleOf(r.view!)}` }));
    box.append(kv([["Path", r.view === "" ? "—" : [...v.path.map((p) => (p === "" ? state.source?.name ?? "top" : displayName(p))), displayName(r.view!)].join(" › ")],
      ["Holds", `${plural(v.nodes.length, "node")}, ${plural(v.stubs.length, "stub")}, ${plural(v.edges.length, "edge")}`],
      ["Reachable", v.reachable && (r.view === "" || !isHidden(r.view!)) ? "yes" : "no direct path"], ["Here", r.view === state.view ? "you're here" : "another view"]]));
    box.append(showButton(viewTarget(r.view!)));
  } else if (r.kind === "edge") {
    const e = model()!.levels[r.view!].edges.find((x) => x.id === r.ref);
    if (e) {
      box.append(el("div", { cls: "inv-head", text: `${e.kind} · ${displayName(e.from)} → ${displayName(e.to)}` }));
      const ve = viewTarget(r.view!);
      box.append(showButton("why" in ve ? ve : { view: r.view!, select: { type: "edge", id: e.id } }));
      box.append(relList(`Stands for (${e.members.length})`, e.members, r.view!));
    }
  } else {
    box.append(el("div", { cls: "inv-head", text: r.text }));
    if (r.kind === "json") box.append(el("pre", { cls: "inv-json", text: JSON.stringify(r.value, null, 1).slice(0, 4000) }));
    if (r.muted) box.append(el("p", { cls: "muted", text: "unused: in the model, not represented in the Graph" }));
  }
}
/** Uses and Used by (INV-14): its own relations, or with its members' (INV-14, "including members"); each list collapsed
 *  to its count, opened by a click. */
let invWithMembers = false;
function relationLists(box: HTMLElement, id: string) {
  const ixx = ix()!;
  const ids = [id, ...(invWithMembers ? descendants(id) : [])];
  const from = ids.flatMap((x) => ixx.relationsFrom[x] ?? []), to = ids.flatMap((x) => ixx.relationsTo[x] ?? []);
  const kids = descendants(id).length;
  if (kids) {
    const t = el("label", { cls: "inv-members" });
    const cb = el("input") as HTMLInputElement; cb.type = "checkbox"; cb.checked = invWithMembers;
    cb.onchange = () => { invWithMembers = cb.checked; invContent(); };
    t.append(cb, ` including members (${kids})`);
    box.append(t);
  }
  box.append(relList(`Uses (${from.length})`, from, state.view), relList(`Used by (${to.length})`, to, state.view));
}
const descendants = (id: string): string[] => (ix()?.children[id] ?? []).flatMap((c) => [c, ...descendants(c)]);
function relList(title: string, ids: string[], viewId: string, itemOf = inv.sel?.startsWith("f:") ? inv.sel.slice(2) : ""): HTMLElement {
  const d = el("details", { cls: "inv-rels" }) as HTMLDetailsElement;
  d.append(el("summary", { text: title }));
  const v = model()?.levels[viewId];
  const rows = ids.map((x) => rel(x)).filter((r): r is MRel => !!r).map((r) => {
    // An end in another file than the item's is named with its file ("app.ts › Circle"), so an import reads apart from its target.
    const name = (x: string) => (fileOf(x) !== fileOf(itemOf) && fileOf(x) !== x ? `${displayName(fileOf(x))} › ${displayName(x)}` : displayName(x));
    const other = r.to === null ? `${relName(r)} (${r.reason ?? "unresolved"})` : name(r.to);
    const where = r.location ? `${r.location.file} ${r.location.start.line}` : "";
    const edge = v?.relationEdge[r.id];
    const seen = edge ? `drawn in ${displayName(edge.split("->")[0])} → ${displayName(edge.split("->")[1])}` : "not in this view";
    return el("li", {}, `${name(r.from)} → ${other} · ${r.kind} · ${where}`, el("span", { cls: "muted", text: ` · ${seen}` }), " ", showButton(r.to === null ? { why: r.reason === "built-in" ? "a built-in is not drawn" : "unresolved, not drawn" } : relationTarget(r.id), true));
  });
  d.append(rows.length ? el("ul", { cls: "inv-rellist" }, ...rows) : el("p", { cls: "muted", text: "none" }));
  return d;
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

document.querySelectorAll<HTMLButtonElement>(".tab").forEach((t) => (t.onclick = () => tab(t.dataset.tab ?? "details")));
// The drawer's handle (UI-88): drag to set the drawer's width, between 360 px and the window less 400 px; while dragging the
// drawer is drawn over the Graph, which is redrawn once, on release. A double-click restores 380 px; the button on the
// handle collapses the drawer to a strip and reopens it at its width. The width is remembered in this browser.
{
  const body = document.querySelector<HTMLElement>("main.body")!, drawer = $("drawer"), handle = $("drawer-handle"), toggle = $<HTMLButtonElement>("drawer-toggle");
  const DEFAULT = 380, MIN = 360, KEY = "zaansouvi.drawerWidth";
  const clamp = (w: number) => Math.round(Math.max(MIN, Math.min(w, window.innerWidth - 400)));
  let width = DEFAULT;
  try { const saved = Number(localStorage.getItem(KEY)); if (saved > 0) width = saved; } catch { /* storage blocked: the default */ }
  const redraw = () => requestAnimationFrame(() => cy?.resize());
  const apply = () => {
    width = clamp(width);
    body.style.setProperty("--drawer-w", body.classList.contains("closed") ? "34px" : `${width}px`);
    try { localStorage.setItem(KEY, String(width)); } catch { /* storage blocked: kept for this page only */ }
  };
  const setClosed = (closed: boolean) => {
    body.classList.toggle("closed", closed);
    toggle.textContent = closed ? "›" : "‹";
    toggle.title = closed ? "Open the drawer" : "Collapse the drawer";
    apply(); redraw();
  };
  apply();
  toggle.onclick = (e) => { e.stopPropagation(); setClosed(!body.classList.contains("closed")); };
  toggle.addEventListener("pointerdown", (e) => e.stopPropagation());
  handle.addEventListener("dblclick", (e) => { if (e.target === toggle || body.classList.contains("closed")) return; width = DEFAULT; apply(); redraw(); });
  handle.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || body.classList.contains("closed")) return;
    e.preventDefault();
    const r = drawer.getBoundingClientRect();
    // Drawn over the Graph while dragging: fixed at its place, its width following the pointer; the grid keeps its column.
    Object.assign(drawer.style, { top: `${r.top}px`, height: `${r.height}px`, right: `${window.innerWidth - r.right}px`, width: `${r.width}px` });
    drawer.classList.add("overlay");
    handle.classList.add("dragging");
    const right = r.right;
    const move = (ev: PointerEvent) => { drawer.style.width = `${clamp(right - ev.clientX)}px`; };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      width = clamp(right - ev.clientX);
      drawer.classList.remove("overlay");
      handle.classList.remove("dragging");
      for (const k of ["top", "height", "right", "width"]) drawer.style.removeProperty(k);
      apply(); redraw();
    };
    // On the window, so the drag goes on when the pointer leaves the narrow handle.
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  });
  window.addEventListener("resize", () => { apply(); });
}
$("fit").onclick = () => cy?.fit(undefined, 40);
// The Inventory's controls (INV-16, INV-17)
$("inv-expand").onclick = expandSelected;
$("inv-collapse").onclick = collapseAll;
$("inv-q").addEventListener("input", (e) => { inv.query = (e.target as HTMLInputElement).value; runSearch(); drawInventory(); });
$("inv-q").addEventListener("keydown", (e) => { if ((e as KeyboardEvent).key === "Enter") jump((e as KeyboardEvent).shiftKey ? -1 : 1); });
$("inv-regex").onclick = () => { inv.regex = !inv.regex; $("inv-regex").setAttribute("aria-pressed", String(inv.regex)); runSearch(); drawInventory(); };
$("inv-next").onclick = () => jump(1);
// The kinds' panel (INV-33): opened and closed by its bar; closed by a press outside it or Esc.
$("inv-show-open").onclick = () => toggleShowPanel();
document.addEventListener("pointerdown", (e) => { if (!$("inv-show").hidden && !$("inv-showbar").contains(e.target as Node)) toggleShowPanel(false); }, true);
$("inv-tree").addEventListener("keydown", (e) => treeKey(e as KeyboardEvent));
// Esc anywhere in the Inventory pane goes to the search field (INV-41): from the content area, a selected text, the copy
// button, the relation lists, the buttons. Selected text has no focus, so the pane remembers whether the last press was
// in it; Esc after a click elsewhere (the Graph) is left alone. In the tree, Esc also clears the selection (treeKey).
{
  let inPane = false;
  document.addEventListener("pointerdown", (e) => { inPane = $("pane-inventory").contains(e.target as Node); }, true);
  document.addEventListener("focusin", (e) => { inPane = $("pane-inventory").contains(e.target as Node); });
  document.addEventListener("keydown", (e) => {
    const q = $("inv-q") as HTMLInputElement, pane = $("pane-inventory");
    if (e.key === "Escape" && !$("inv-show").hidden) toggleShowPanel(false); // Esc closes the kinds' panel too
    if (e.key !== "Escape" || !pane.classList.contains("on") || e.target === q || e.target === $("inv-tree")) return;
    if (!inPane && !pane.contains(document.activeElement)) return;
    q.focus();
  });
}
// The strip follows the tree's size: the drawer's handle, the window, the content area (INV-43).
new ResizeObserver(() => drawMatchStrip()).observe($("inv-tree"));
$("inv-prev").onclick = () => jump(-1);
// Middle-button panning (UI-84): dragging with the middle button moves the view only. The button is caught on the graph's
// container in the capture phase, before Cytoscape's own listeners on its canvas, so nothing is selected, unselected or
// dragged, wherever the drag starts, on a node, an edge, a frame or the background. Its default (Firefox's autoscroll, a
// paste on Linux) is prevented over the graph only.
{
  const box = $("cy");
  let last: { x: number; y: number } | undefined;
  const stop = (e: Event) => { e.preventDefault(); e.stopPropagation(); };
  box.addEventListener("mousedown", (e) => {
    if (e.button !== 1 || !cy) return;
    stop(e);
    last = { x: e.clientX, y: e.clientY };
    box.classList.add("panning");
  }, true);
  window.addEventListener("mousemove", (e) => {
    if (!last || !cy) return;
    if ((e.buttons & 4) === 0) { last = undefined; box.classList.remove("panning"); return; } // released outside the page
    stop(e);
    cy.panBy({ x: e.clientX - last.x, y: e.clientY - last.y });
    last = { x: e.clientX, y: e.clientY };
  }, true);
  window.addEventListener("mouseup", (e) => {
    if (e.button !== 1 || !last) return;
    stop(e);
    last = undefined;
    box.classList.remove("panning");
  }, true);
  box.addEventListener("auxclick", (e) => { if (e.button === 1) stop(e); }, true);
}
// The edges' switch (UI-85): full or thin, without drawing the view again, so nothing moves.
$("edgesw").onclick = () => { state.edgesFull = !state.edgesFull; $("edgesw").setAttribute("aria-pressed", String(state.edgesFull)); applyEdgeMode(); };
// The kind frames' switch (UI-83): on by default, for the page only; redraws the view, keeping the selection.
$("kindsw").onclick = () => { state.kindFrames = !state.kindFrames; drawGraph(); };
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
(globalThis as unknown as { zaansouvi: unknown }).zaansouvi = { enter, select, tab, state, ready: () => !!state.answer, go, snapshot, layer,
  tools: (d?: ToolsAnswer) => { if (d) toolsData = d; toolsPane(); }, inv };

tab("details");
connect();
await loadSources();
await loadGraph();
await loadTools();
