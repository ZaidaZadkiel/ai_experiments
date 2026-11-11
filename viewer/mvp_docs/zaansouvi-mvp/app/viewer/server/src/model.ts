// The Viewer's graph model (mvp_docs/55_viewer_backend.md, section 6, BE-50 to BE-60).
//
// Built only from the Runner's cache (VIEW-03), with no tool-specific code (VIEW-14): it reads `represents`,
// `containedIn`, `contains`, the `fields` roles and IDs, nothing else. Pure: no I/O, no clock, so the same cache always
// gives the same model, byte for byte (BE-50).

import type { CacheDataGroup, Location, RunnerCache } from "../../../shared/types.ts";

export const MODEL_FORMAT_VERSION = 3; // 3: the index, each view's visibility, paths and reachability, the dropped records,
// what the page worked out (BE-110 to BE-115; proposed_schema/26-11-10 213900 ...). 2 (MVP 2): entries as nodes with attributes, builtins apart.

export type ModelNode = {
  id: string;
  kind: string;
  dataName: string;
  label: string;
  container: string | null; // the node this one is shown inside (VIEW-11); null for files
  tool?: string;
  owner?: string; // scopes: the node the scope belongs to (TOOL-33)
  location?: Location;
  /** MVP 2: a listed entry's status and type (RUN-35, UI-47b, UI-48); a record's other keys (VIEW-15, shown in Details). */
  attrs?: Record<string, unknown>;
  /** Format 3 (BE-114): how the page shows it: as drawn on its node, as a frame's title, the frame's notes, a listed entry's
   *  status icons and label. */
  display?: NodeDisplay;
};
export type NodeDisplay = { name: string; title: string; notes: string[]; icons?: string[]; label?: string };

export type ModelRelation = {
  id: string;
  from: string;
  to: string | null;
  kind: string;
  dataName: string;
  tool: string;
  location?: Location;
  reason?: string;
  label?: string;
  /** The record's other keys, shown in Details (VIEW-15). */
  attrs?: Record<string, unknown>;
};

export type ModelEdge = { id: string; from: string; to: string; kind: string; count: number; members: string[] };

export type ModelView = {
  nodes: string[]; // the entered node's children (the top view: the files)
  stubs: string[]; // nodes outside the entered node that edges reach (BE-53, step 2)
  thisNode: string | null; // the entered node itself, when edges start or end at it (UI-36)
  edges: ModelEdge[];
  unresolved: string[]; // relation IDs whose `to` is null and whose `from` lands on a shown node
  builtins: string[]; // MVP 2: the same, for uses of built-ins (reason "built-in"), kept apart (TPG-D5)
  // Format 3 (BE-111, BE-112, BE-114)
  render: Record<string, "node" | "member" | "stub" | "title">; // how each item is sent to render here
  memberOf: Record<string, string>; // a member written into which node's label (FND-69)
  relationEdge: Record<string, string>; // the edge each relation is drawn as part of, here
  path: string[]; // the views above this one, from the top view down
  inside: string[]; // the views one level inside, in the order of the view's nodes
  reachable: boolean; // reachable from the top view, with nothing hidden
  unconnected?: string[]; // the top view only: the entries in the "Not connected" frame (UI-47)
  memberRows: Record<string, string[]>; // the nodes whose members are written into their label, in the order drawn
  builtinGroups: { type: string; members: { name: string; relations: string[] }[] }[]; // by library type (FND-100)
};

export type Invalid = { dataName: string; tool: string; recordId: string; problem: string };
/** Format 3 (BE-113): a record the Viewer did not take into the model, as read. */
export type Dropped = { dataName: string; tool: string; why: "invalid" | "unknown group"; problem: string; record: unknown };
/** Format 3 (BE-110): the model's lookups, built once per model. */
export type ModelIndex = {
  fileOf: Record<string, string>; children: Record<string, string[]>; entries: Record<string, string[]>; folderOf: Record<string, string>;
  ancestors: Record<string, string[]>; relationsFrom: Record<string, string[]>; relationsTo: Record<string, string[]>;
};
export type Extra = { dataName: string; tool: string; what: string; detail: string };

export type GraphModel = {
  formatVersion: number;
  viewerVersion: string;
  sourceKey: string;
  sourceRoot: string;
  run: { runId: string; finished: string; outcome: string };
  files: string[];
  nodes: ModelNode[];
  relations: ModelRelation[];
  levels: Record<string, ModelView>; // "" is the top view
  checks: { invalid: Invalid[]; extra: Extra[] };
  index: ModelIndex; // format 3 (BE-110)
  dropped: Dropped[]; // format 3 (BE-113)
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const isPos = (p: unknown) => isObject(p) && Number.isInteger(p.line) && Number.isInteger(p.column);
const isLocation = (v: unknown): v is Location => isObject(v) && typeof v.file === "string" && isPos(v.start) && isPos(v.end);
const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const role = (g: CacheDataGroup, name: string, fallback: string) => g.fields?.[`${name}Field`] ?? fallback;

/** Keys the Viewer reads from a record besides the roles in `fields` (BE-52). Every other key is kept as `attrs` and shown
 *  in Details, so it is used, not extra data (VIEW-15). */
const ALSO_READ = ["reason", "name"];
const otherKeys = (g: CacheDataGroup, rec: Record<string, unknown>): Record<string, unknown> | undefined => {
  const used = new Set([...Object.values(g.fields ?? {}), ...ALSO_READ]);
  const out = Object.fromEntries(Object.entries(rec).filter(([k]) => !used.has(k)).sort(([a], [b]) => cmp(a, b)));
  return Object.keys(out).length ? out : undefined;
};
/** A listed file's type: its extension, labeled as one (UI-47b); "unknown" without one. */
const typeOf = (id: string) => {
  const name = id.split("/").pop() ?? id;
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot) : "unknown";
};

// ---------------------------------------------------------------------------
// Building the model
// ---------------------------------------------------------------------------

export function buildModel(cache: RunnerCache, sourceKey: string, viewerVersion: string): GraphModel {
  if (!cache.run) throw new Error("The Runner's cache has no real run.");
  const invalid: Invalid[] = [];
  const extra: Extra[] = [];
  // Every listed entry is a node at the top level (UI-47, UI-48): files, and in MVP 2 folders, links and others, each with
  // its status and, for a file, its type. `files` stays the list of files, whose lines may be shown.
  const entries = cache.files ?? [];
  const files = entries.filter((f) => (f.kind ?? "file") === "file").map((f) => f.id);
  const groups = Object.entries(cache.data ?? {}).sort(([a], [b]) => cmp(a, b));

  const nodes = new Map<string, ModelNode>();
  for (const f of entries) {
    const kind = f.kind ?? "file";
    const { id: _id, kind: _kind, sourceSha256: _sha, ...status } = f;
    const attrs: Record<string, unknown> = { ...status };
    if (kind === "file") attrs.type = typeOf(f.id);
    nodes.set(f.id, {
      id: f.id, kind, dataName: kind === "file" ? "files.file" : `files.${kind}`, label: f.id.split("/").pop() ?? f.id, container: null,
      ...(Object.keys(attrs).length ? { attrs } : {}),
    });
  }

  // Extra: groups of a kind the Viewer doesn't know (VIEW-15). A record's other keys are kept and shown, not extra.
  const dropped: Dropped[] = []; // BE-113: every record left out, as read
  const bad = (dataName: string, tool: string, recordId: string, problem: string, record?: unknown) => {
    invalid.push({ dataName, tool, recordId, problem });
    dropped.push({ dataName, tool, why: "invalid", problem, record: record ?? null });
  };
  const rawNode = new Map<string, unknown>(); // a node's record as read, for a node removed later (step 3)
  const recId = (rec: unknown, i: number, idKey: string) => (isObject(rec) && typeof rec[idKey] === "string" ? (rec[idKey] as string) : `#${i}`);

  // 1. Nodes (BE-51)
  const ownerOf = new Map<string, string>(); // scope ID -> owner ID, checked later
  for (const [dataName, g] of groups) {
    if (!["nodes", "relations", "containment"].includes(g.represents)) {
      for (const o of g.outputs) {
        extra.push({ dataName, tool: o.tool, what: "represents", detail: `"${String(g.represents)}" isn't known to the Viewer; not shown` });
        for (const rec of o.records) dropped.push({ dataName, tool: o.tool, why: "unknown group", problem: `represents "${String(g.represents)}"`, record: rec });
      }
      continue;
    }
    if (g.represents !== "nodes") continue;
    const [idK, parentK, labelK, kindK, locK, ownerK] = [role(g, "id", "id"), role(g, "parent", "parent"), role(g, "label", "name"), role(g, "kind", "kind"), role(g, "location", "location"), g.fields?.ownerField];
    for (const o of g.outputs) {
      o.records.forEach((rec, i) => {
        const rid = recId(rec, i, idK);
        if (!isObject(rec)) return bad(dataName, o.tool, rid, "the record isn't an object", rec);
        if (typeof rec[idK] !== "string" || rec[idK] === "") return bad(dataName, o.tool, rid, `it lacks its ID ("${idK}")`, rec);
        if (typeof rec[parentK] !== "string") return bad(dataName, o.tool, rid, `it lacks its container ("${parentK}")`, rec);
        if (rec[locK] !== undefined && !isLocation(rec[locK])) return bad(dataName, o.tool, rid, `its location ("${locK}") is malformed`, rec);
        if (ownerK && typeof rec[ownerK] !== "string") return bad(dataName, o.tool, rid, `it lacks its owner ("${ownerK}")`, rec);
        const id = rec[idK] as string;
        if (nodes.has(id)) return bad(dataName, o.tool, id, "another node has the same ID", rec);
        const n: ModelNode = {
          id, kind: typeof rec[kindK] === "string" ? (rec[kindK] as string) : "unknown", dataName, tool: o.tool,
          label: typeof rec[labelK] === "string" ? (rec[labelK] as string) : id, container: rec[parentK] as string,
        };
        if (isLocation(rec[locK])) n.location = rec[locK] as Location;
        const nAttrs = otherKeys(g, rec);
        if (nAttrs) n.attrs = nAttrs;
        if (ownerK) {
          n.owner = rec[ownerK] as string;
          ownerOf.set(id, n.owner);
        }
        nodes.set(id, n);
        rawNode.set(id, rec);
      });
    }
  }

  // 2. Containment re-sets containers (VIEW-11)
  for (const [dataName, g] of groups) {
    if (g.represents !== "containment") continue;
    const [childK, parentK] = [role(g, "child", "child"), role(g, "parent", "parent")];
    for (const o of g.outputs) {
      o.records.forEach((rec, i) => {
        const rid = recId(rec, i, childK);
        if (!isObject(rec)) return bad(dataName, o.tool, rid, "the record isn't an object", rec);
        const child = rec[childK], parent = rec[parentK];
        if (typeof child !== "string" || !nodes.has(child)) return bad(dataName, o.tool, rid, "the child isn't a known node", rec);
        if (typeof parent !== "string" || !nodes.has(parent)) return bad(dataName, o.tool, rid, "the container isn't a known node", rec);
        if (child === parent) return bad(dataName, o.tool, rid, "the child would contain itself", rec);
        nodes.get(child)!.container = parent;
      });
    }
  }

  // 3. Containers must be known, with no cycle; removing a node can orphan its members, so repeat until stable.
  for (let changed = true; changed; ) {
    changed = false;
    for (const n of [...nodes.values()]) {
      if (n.container === null) continue;
      let problem = "";
      if (!nodes.has(n.container)) problem = "its container isn't a known node";
      else {
        const seen = new Set([n.id]);
        for (let c: string | null = n.container; c !== null; c = nodes.get(c)?.container ?? null) {
          if (seen.has(c)) { problem = "its containers form a cycle"; break; }
          seen.add(c);
        }
      }
      if (problem) {
        bad(n.dataName, n.tool ?? "", n.id, problem, rawNode.get(n.id) ?? n);
        nodes.delete(n.id);
        changed = true;
      }
    }
  }

  // 4. Owners (TOOL-33): a scope whose owner isn't known stays, but nothing lifts to it through its owner.
  const scopeOfOwner = new Map<string, string>();
  for (const [scope, owner] of [...ownerOf.entries()].sort(([a], [b]) => cmp(a, b))) {
    const s = nodes.get(scope);
    if (!s) continue;
    if (!nodes.has(owner)) { bad(s.dataName, s.tool ?? "", scope, "its owner isn't a known node", rawNode.get(scope) ?? s); continue; }
    if (scopeOfOwner.has(owner)) { bad(s.dataName, s.tool ?? "", scope, "another scope has the same owner", rawNode.get(scope) ?? s); continue; }
    scopeOfOwner.set(owner, scope);
  }

  // 5. Relations (BE-52)
  const relations: ModelRelation[] = [];
  const relIds = new Set<string>();
  for (const [dataName, g] of groups) {
    if (g.represents !== "relations") continue;
    const [idK, fromK, toK, kindK, locK] = [role(g, "id", "id"), role(g, "from", "from"), role(g, "to", "to"), role(g, "kind", "kind"), role(g, "location", "location")];
    for (const o of g.outputs) {
      o.records.forEach((rec, i) => {
        const rid = recId(rec, i, idK);
        if (!isObject(rec)) return bad(dataName, o.tool, rid, "the record isn't an object", rec);
        if (typeof rec[idK] !== "string" || rec[idK] === "") return bad(dataName, o.tool, rid, `it lacks its ID ("${idK}")`, rec);
        if (relIds.has(rid) || nodes.has(rid)) return bad(dataName, o.tool, rid, "another record has the same ID", rec);
        if (typeof rec[fromK] !== "string" || !nodes.has(rec[fromK] as string)) return bad(dataName, o.tool, rid, "its source isn't a known node", rec);
        const to = rec[toK];
        if (!(to === null || (typeof to === "string" && nodes.has(to)))) return bad(dataName, o.tool, rid, "its target is neither a known node nor null", rec);
        if (rec[locK] !== undefined && !isLocation(rec[locK])) return bad(dataName, o.tool, rid, `its location ("${locK}") is malformed`, rec);
        relIds.add(rid);
        const kind = typeof rec[kindK] === "string" ? (rec[kindK] as string) : "unknown";
        if (kind === "declaration") return; // not drawn: containment shows where a symbol is declared (UI-34)
        const r: ModelRelation = { id: rid, from: rec[fromK] as string, to: to as string | null, kind, dataName, tool: o.tool };
        if (isLocation(rec[locK])) r.location = rec[locK] as Location;
        if (typeof rec.reason === "string") r.reason = rec.reason;
        if (typeof rec.name === "string") r.label = rec.name;
        const rAttrs = otherKeys(g, rec);
        if (rAttrs) r.attrs = rAttrs;
        relations.push(r);
      });
    }
  }

  // 6. Views (BE-53, BE-54)
  const children = new Map<string | null, string[]>();
  for (const n of nodes.values()) children.set(n.container, [...(children.get(n.container) ?? []), n.id]);
  const chain = (id: string): string[] => { // the node, then its containers, up to a file
    const out: string[] = [];
    for (let c: string | null = id; c !== null; c = nodes.get(c)?.container ?? null) out.push(c);
    return out;
  };
  const lift = (id: string) => scopeOfOwner.get(id) ?? id; // owners at both ends (VIEW-13, UI-34)

  const relById = new Map(relations.map((r) => [r.id, r]));
  const levels: Record<string, ModelView> = {};
  const enterable = [null, ...[...nodes.keys()].filter((id) => (children.get(id) ?? []).length > 0).sort(cmp)];
  for (const C of enterable) {
    const cChain = C === null ? [] : chain(C);
    const place = (end: string): { at: string; stub: boolean } => {
      if (end === C) return { at: end, stub: false };
      const ch = chain(end); // end ... file
      const idx = C === null ? -1 : ch.indexOf(C);
      if (C === null) return { at: ch[ch.length - 1], stub: false }; // its file
      if (idx > 0) return { at: ch[idx - 1], stub: false }; // inside C: its ancestor just below C
      // outside C: the child of the lowest common ancestor, on the end's side
      const common = ch.findIndex((a) => cChain.includes(a));
      if (common === 0) return { at: end, stub: true }; // the end contains C (for example its file): a stub for it
      return { at: common === -1 ? ch[ch.length - 1] : ch[common - 1], stub: true };
    };
    const edges = new Map<string, ModelEdge & { kinds: Set<string> }>();
    const stubs = new Set<string>();
    let thisUsed = false;
    const unresolved: string[] = [];
    const builtins: string[] = [];
    for (const r of relations) {
      const a = place(lift(r.from));
      if (r.to === null) {
        if (!a.stub) (r.reason === "built-in" ? builtins : unresolved).push(r.id);
        continue;
      }
      const b = place(lift(r.to));
      if (a.at === b.at || (a.stub && b.stub)) continue;
      const key = `${a.at}->${b.at}`;
      const e = edges.get(key) ?? { id: key, from: a.at, to: b.at, kind: r.kind, count: 0, members: [], kinds: new Set<string>() };
      e.count++;
      e.members.push(r.id);
      e.kinds.add(r.kind);
      edges.set(key, e);
      for (const p of [a, b]) {
        if (p.stub) stubs.add(p.at);
        if (p.at === C) thisUsed = true;
      }
    }
    const viewNodes = (children.get(C) ?? []).slice().sort(cmp);
    const viewEdges = [...edges.values()].sort((x, y) => cmp(x.id, y.id)).map(({ kinds, ...e }) => ({ ...e, kind: kinds.size === 1 ? e.kind : "mixed", members: e.members.sort(cmp) }));
    // Format 3 (BE-111): how each item is sent to render. In an entered view, a node whose members all have no members of
    // their own gets them written into its label (FND-69, FND-102), in the order drawn: by ID.
    const render: ModelView["render"] = {};
    const memberOf: Record<string, string> = {};
    const memberRows: Record<string, string[]> = {};
    if (C !== null) render[C] = "title";
    for (const id of viewNodes) {
      render[id] = "node";
      const kids = (children.get(id) ?? []).slice().sort(cmp);
      if (C !== null && kids.length > 0 && kids.every((k) => (children.get(k) ?? []).length === 0)) {
        memberRows[id] = kids;
        for (const k of kids) { render[k] = "member"; memberOf[k] = id; }
      }
    }
    for (const id of stubs) render[id] = "stub";
    const relationEdge: Record<string, string> = {};
    for (const e of viewEdges) for (const m of e.members) relationEdge[m] = e.id;
    const sortedBuiltins = builtins.sort(cmp);
    const linked = new Set(viewEdges.flatMap((e) => [e.from, e.to]));
    levels[C ?? ""] = {
      nodes: viewNodes,
      stubs: [...stubs].sort(cmp),
      thisNode: C !== null && thisUsed ? C : null,
      edges: viewEdges,
      unresolved: unresolved.sort(cmp),
      builtins: sortedBuiltins,
      render, memberOf, relationEdge,
      // BE-112: the views above, from the top view down; the views one level inside
      path: C === null ? [] : ["", ...chain(C).slice(1).reverse()],
      inside: viewNodes.filter((id) => (children.get(id) ?? []).length > 0),
      reachable: false, // set below, once every view is known
      ...(C === null ? { unconnected: viewNodes.filter((id) => !linked.has(id)) } : {}),
      memberRows,
      builtinGroups: builtinGroupsOf(sortedBuiltins.map((id) => relById.get(id)!), (id) => nodes.get(id)?.label),
    };
  }

  // BE-112: reachable from the top view: a view whose node is drawn as a node in a reachable view.
  levels[""].reachable = true;
  for (const queue = [""]; queue.length; ) {
    const v = levels[queue.shift()!];
    for (const id of v.inside) if (levels[id] && !levels[id].reachable) { levels[id].reachable = true; queue.push(id); }
  }

  // BE-114: what the page worked out, stated once per node.
  for (const n of nodes.values()) n.display = displayOf(n);

  // BE-110: the index.
  const index: ModelIndex = { fileOf: {}, children: {}, entries: {}, folderOf: {}, ancestors: {}, relationsFrom: {}, relationsTo: {} };
  const pos = (id: string) => nodes.get(id)?.location?.start;
  const bySource = (a: string, b: string) => { const p = pos(a), q = pos(b); return p && q ? p.line - q.line || p.column - q.column || cmp(a, b) : cmp(a, b); };
  const folders = new Set(entries.filter((f) => f.kind === "folder").map((f) => f.id));
  for (const n of nodes.values()) {
    const ch = chain(n.id);
    index.ancestors[n.id] = ch.slice(1).reverse();
    const top = nodes.get(ch[ch.length - 1]);
    if (top?.kind === "file") index.fileOf[n.id] = top.id;
    const kids = children.get(n.id);
    if (kids?.length) index.children[n.id] = kids.slice().sort(bySource);
  }
  for (const f of entries) {
    const dir = f.id.includes("/") ? f.id.slice(0, f.id.lastIndexOf("/")) : "";
    const folder = folders.has(dir) ? dir : "";
    (index.entries[folder] ??= []).push(f.id);
    if (folder) index.folderOf[f.id] = folder;
  }
  const leaf = (id: string) => id.slice(id.lastIndexOf("/") + 1);
  for (const list of Object.values(index.entries)) list.sort((a, b) => Number(!folders.has(a)) - Number(!folders.has(b)) || cmp(leaf(a), leaf(b)));
  for (const r of [...relations].sort((x, y) => cmp(x.id, y.id))) {
    (index.relationsFrom[r.from] ??= []).push(r.id);
    if (r.to !== null) (index.relationsTo[r.to] ??= []).push(r.id);
  }

  const fileOrder = new Map(entries.map((f, i) => [f.id, i]));
  const orderedNodes = [...nodes.values()].sort((x, y) =>
    (fileOrder.get(x.id) ?? Infinity) - (fileOrder.get(y.id) ?? Infinity) || cmp(x.id, y.id));
  return {
    formatVersion: MODEL_FORMAT_VERSION, viewerVersion, sourceKey, sourceRoot: cache.run.sourceRoot,
    run: { runId: cache.run.runId, finished: cache.run.finished, outcome: cache.run.outcome },
    files, nodes: orderedNodes, relations: relations.sort((x, y) => cmp(x.id, y.id)), levels,
    checks: { invalid, extra },
    index, dropped,
  };
}

// ---------------------------------------------------------------------------
// What the page worked out, now stated in the model (BE-114): the same rules as the page had (ui/src/main.ts, before
// format 3), so the Graph doesn't change.
// ---------------------------------------------------------------------------

const FUNCS = ["function", "method", "constructor"];
/** As drawn on its node (displayName): a scope's name, a listed entry's own name, a function's with "()". */
function displayName(n: ModelNode): string {
  if (n.owner !== undefined) return n.owner === n.container ? `${(n.container ?? "").split("/").pop()} · file scope` : `ƒ ${n.label}`;
  if (n.container === null) return n.label;
  return FUNCS.includes(n.kind) ? `${n.label}()` : n.label;
}
const plural = (k: number, word: string) => `${k} ${word}${k === 1 ? "" : "s"}`;
const sizeText = (bytes: number) => (bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`);
function displayOf(n: ModelNode): NodeDisplay {
  const a = n.attrs ?? {};
  const name = displayName(n);
  // As a frame's title (titleOf, UI-36): the kind, or ƒ for a function, "type" for a type alias; a scope's name as it is.
  const mark = [...FUNCS, "accessor"].includes(n.kind) ? "ƒ" : n.kind === "typeAlias" ? "type" : n.kind;
  const title = n.owner !== undefined ? name : `${mark} ${name}`;
  // The frame's notes (frameNotes, UI-37, FND-109, FND-110), in source order.
  const notes: string[] = [];
  if (a.exported === true) notes.push("exported");
  if (a.defaultExport === true) notes.push("default");
  if (typeof a.declaredWith === "string") notes.push(a.declaredWith);
  if (Array.isArray(a.modifiers)) notes.push(...a.modifiers.filter((m): m is string => typeof m === "string"));
  if (Array.isArray(a.declarations) && a.declarations.length > 1) notes.push(`${a.declarations.length} declarations`);
  if (typeof a.declaredIn === "string") notes.push(`declared in ${a.declaredIn}`);
  const d: NodeDisplay = { name, title, notes };
  if (n.container === null) {
    // A listed entry's status icons, in their fixed order (UI-48), and its label (entryLabel, UI-47b).
    const link = a.link as { outside?: boolean; target?: string } | undefined;
    const icons = [a.hidden === true && "hidden", link?.outside === false && "linkInside", link?.outside === true && "linkOutside",
      a.readOnly === true && "readOnly", typeof a.unreadable === "string" && "unreadable"].filter((x): x is string => !!x);
    if (icons.length) d.icons = icons;
    d.label = n.kind === "file" ? `${n.label} · ${typeof a.type === "string" ? a.type : "unknown"}`
      : n.kind === "folder" ? `${n.label}/ · ${typeof a.fileCount === "number" ? plural(a.fileCount, "file") : typeof a.totalBytes === "number" ? sizeText(a.totalBytes) : "?"}${a.skipped ? " · not listed file by file" : ""}`
      : n.kind === "link" ? `${n.label} → ${String(link?.target ?? "?")}`
      : `${n.label} · ${n.kind}`;
  }
  return d;
}

/** A view's built-ins grouped by library type (builtinGroups, FND-100): the part of the name before the first dot; a line
 *  named like its type is left out when the type has other members (the receivers of those members). */
function builtinGroupsOf(rels: ModelRelation[], labelOf: (id: string) => string | undefined): ModelView["builtinGroups"] {
  const groups = new Map<string, Map<string, string[]>>();
  for (const r of rels) {
    const full = typeof r.attrs?.builtin === "string" ? r.attrs.builtin : r.label ?? labelOf(r.from) ?? r.id;
    const dot = full.indexOf(".");
    const type = dot > 0 ? full.slice(0, dot) : full;
    const member = dot > 0 ? full.slice(dot + 1) : full;
    const g = groups.get(type) ?? new Map<string, string[]>();
    g.set(member, [...(g.get(member) ?? []), r.id]);
    groups.set(type, g);
  }
  const byName = (a: string, b: string) => a.localeCompare(b, "en", { sensitivity: "base" }) || cmp(a, b);
  return [...groups].sort(([a], [b]) => byName(a, b)).map(([type, members]) => {
    if (members.size > 1) members.delete(type);
    return { type, members: [...members].sort(([a], [b]) => byName(a, b)).map(([name, ids]) => ({ name, relations: ids.sort(cmp) })) };
  });
}
