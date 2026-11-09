// The Viewer's graph model (mvp_docs/55_viewer_backend.md, section 6, BE-50 to BE-60).
//
// Built only from the Runner's cache (VIEW-03), with no tool-specific code (VIEW-14): it reads `represents`,
// `containedIn`, `contains`, the `fields` roles and IDs, nothing else. Pure: no I/O, no clock, so the same cache always
// gives the same model, byte for byte (BE-50).

import type { CacheDataGroup, Location, RunnerCache } from "../../../shared/types.ts";

export const MODEL_FORMAT_VERSION = 1;

export type ModelNode = {
  id: string;
  kind: string;
  dataName: string;
  label: string;
  container: string | null; // the node this one is shown inside (VIEW-11); null for files
  tool?: string;
  owner?: string; // scopes: the node the scope belongs to (TOOL-33)
  location?: Location;
};

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
};

export type ModelEdge = { id: string; from: string; to: string; kind: string; count: number; members: string[] };

export type ModelView = {
  nodes: string[]; // the entered node's children (the top view: the files)
  stubs: string[]; // nodes outside the entered node that edges reach (BE-53, step 2)
  thisNode: string | null; // the entered node itself, when edges start or end at it (UI-36)
  edges: ModelEdge[];
  unresolved: string[]; // relation IDs whose `to` is null and whose `from` lands on a shown node
};

export type Invalid = { dataName: string; tool: string; recordId: string; problem: string };
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
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const isPos = (p: unknown) => isObject(p) && Number.isInteger(p.line) && Number.isInteger(p.column);
const isLocation = (v: unknown): v is Location => isObject(v) && typeof v.file === "string" && isPos(v.start) && isPos(v.end);
const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const role = (g: CacheDataGroup, name: string, fallback: string) => g.fields?.[`${name}Field`] ?? fallback;

/** Keys the Viewer reads from a record besides the roles in `fields` (BE-52). Anything else is extra (VIEW-15). */
const ALSO_READ = ["reason", "name"];

// ---------------------------------------------------------------------------
// Building the model
// ---------------------------------------------------------------------------

export function buildModel(cache: RunnerCache, sourceKey: string, viewerVersion: string): GraphModel {
  if (!cache.run) throw new Error("The Runner's cache has no real run.");
  const invalid: Invalid[] = [];
  const extra: Extra[] = [];
  const files = (cache.files ?? []).map((f) => f.id);
  const groups = Object.entries(cache.data ?? {}).sort(([a], [b]) => cmp(a, b));

  const nodes = new Map<string, ModelNode>();
  for (const f of files) nodes.set(f, { id: f, kind: "file", dataName: "files.file", label: f.split("/").pop() ?? f, container: null });

  // Extra: groups of a kind the Viewer doesn't know, and keys it doesn't read (VIEW-15).
  const unusedKeys = new Map<string, { tool: string; keys: Set<string> }>();
  const noteKeys = (dataName: string, tool: string, g: CacheDataGroup, rec: Record<string, unknown>) => {
    const used = new Set([...Object.values(g.fields ?? {}), ...ALSO_READ]);
    for (const k of Object.keys(rec)) {
      if (used.has(k)) continue;
      const u = unusedKeys.get(dataName) ?? { tool, keys: new Set<string>() };
      u.keys.add(k);
      unusedKeys.set(dataName, u);
    }
  };
  const bad = (dataName: string, tool: string, recordId: string, problem: string) => invalid.push({ dataName, tool, recordId, problem });
  const recId = (rec: unknown, i: number, idKey: string) => (isObject(rec) && typeof rec[idKey] === "string" ? (rec[idKey] as string) : `#${i}`);

  // 1. Nodes (BE-51)
  const ownerOf = new Map<string, string>(); // scope ID -> owner ID, checked later
  for (const [dataName, g] of groups) {
    if (!["nodes", "relations", "containment"].includes(g.represents)) {
      for (const o of g.outputs) extra.push({ dataName, tool: o.tool, what: "represents", detail: `"${String(g.represents)}" isn't known to the Viewer; not shown` });
      continue;
    }
    if (g.represents !== "nodes") continue;
    const [idK, parentK, labelK, kindK, locK, ownerK] = [role(g, "id", "id"), role(g, "parent", "parent"), role(g, "label", "name"), role(g, "kind", "kind"), role(g, "location", "location"), g.fields?.ownerField];
    for (const o of g.outputs) {
      o.records.forEach((rec, i) => {
        const rid = recId(rec, i, idK);
        if (!isObject(rec)) return bad(dataName, o.tool, rid, "the record isn't an object");
        noteKeys(dataName, o.tool, g, rec);
        if (typeof rec[idK] !== "string" || rec[idK] === "") return bad(dataName, o.tool, rid, `it lacks its ID ("${idK}")`);
        if (typeof rec[parentK] !== "string") return bad(dataName, o.tool, rid, `it lacks its container ("${parentK}")`);
        if (rec[locK] !== undefined && !isLocation(rec[locK])) return bad(dataName, o.tool, rid, `its location ("${locK}") is malformed`);
        if (ownerK && typeof rec[ownerK] !== "string") return bad(dataName, o.tool, rid, `it lacks its owner ("${ownerK}")`);
        const id = rec[idK] as string;
        if (nodes.has(id)) return bad(dataName, o.tool, id, "another node has the same ID");
        const n: ModelNode = {
          id, kind: typeof rec[kindK] === "string" ? (rec[kindK] as string) : "unknown", dataName, tool: o.tool,
          label: typeof rec[labelK] === "string" ? (rec[labelK] as string) : id, container: rec[parentK] as string,
        };
        if (isLocation(rec[locK])) n.location = rec[locK] as Location;
        if (ownerK) {
          n.owner = rec[ownerK] as string;
          ownerOf.set(id, n.owner);
        }
        nodes.set(id, n);
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
        if (!isObject(rec)) return bad(dataName, o.tool, rid, "the record isn't an object");
        noteKeys(dataName, o.tool, g, rec);
        const child = rec[childK], parent = rec[parentK];
        if (typeof child !== "string" || !nodes.has(child)) return bad(dataName, o.tool, rid, "the child isn't a known node");
        if (typeof parent !== "string" || !nodes.has(parent)) return bad(dataName, o.tool, rid, "the container isn't a known node");
        if (child === parent) return bad(dataName, o.tool, rid, "the child would contain itself");
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
        bad(n.dataName, n.tool ?? "", n.id, problem);
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
    if (!nodes.has(owner)) { bad(s.dataName, s.tool ?? "", scope, "its owner isn't a known node"); continue; }
    if (scopeOfOwner.has(owner)) { bad(s.dataName, s.tool ?? "", scope, "another scope has the same owner"); continue; }
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
        if (!isObject(rec)) return bad(dataName, o.tool, rid, "the record isn't an object");
        noteKeys(dataName, o.tool, g, rec);
        if (typeof rec[idK] !== "string" || rec[idK] === "") return bad(dataName, o.tool, rid, `it lacks its ID ("${idK}")`);
        if (relIds.has(rid) || nodes.has(rid)) return bad(dataName, o.tool, rid, "another record has the same ID");
        if (typeof rec[fromK] !== "string" || !nodes.has(rec[fromK] as string)) return bad(dataName, o.tool, rid, "its source isn't a known node");
        const to = rec[toK];
        if (!(to === null || (typeof to === "string" && nodes.has(to)))) return bad(dataName, o.tool, rid, "its target is neither a known node nor null");
        if (rec[locK] !== undefined && !isLocation(rec[locK])) return bad(dataName, o.tool, rid, `its location ("${locK}") is malformed`);
        relIds.add(rid);
        const kind = typeof rec[kindK] === "string" ? (rec[kindK] as string) : "unknown";
        if (kind === "declaration") return; // not drawn: containment shows where a symbol is declared (UI-34)
        const r: ModelRelation = { id: rid, from: rec[fromK] as string, to: to as string | null, kind, dataName, tool: o.tool };
        if (isLocation(rec[locK])) r.location = rec[locK] as Location;
        if (typeof rec.reason === "string") r.reason = rec.reason;
        if (typeof rec.name === "string") r.label = rec.name;
        relations.push(r);
      });
    }
  }
  for (const [dataName, u] of [...unusedKeys.entries()].sort(([a], [b]) => cmp(a, b))) {
    extra.push({ dataName, tool: u.tool, what: "keys", detail: `not read by the Viewer: ${[...u.keys].sort().join(", ")}` });
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
    for (const r of relations) {
      const a = place(lift(r.from));
      if (r.to === null) {
        if (!a.stub) unresolved.push(r.id);
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
    levels[C ?? ""] = {
      nodes: (children.get(C) ?? []).slice().sort(cmp),
      stubs: [...stubs].sort(cmp),
      thisNode: C !== null && thisUsed ? C : null,
      edges: [...edges.values()].sort((x, y) => cmp(x.id, y.id)).map(({ kinds, ...e }) => ({ ...e, kind: kinds.size === 1 ? e.kind : "mixed", members: e.members.sort(cmp) })),
      unresolved: unresolved.sort(cmp),
    };
  }

  const fileOrder = new Map(files.map((f, i) => [f, i]));
  const orderedNodes = [...nodes.values()].sort((x, y) =>
    (fileOrder.get(x.id) ?? Infinity) - (fileOrder.get(y.id) ?? Infinity) || cmp(x.id, y.id));
  return {
    formatVersion: MODEL_FORMAT_VERSION, viewerVersion, sourceKey, sourceRoot: cache.run.sourceRoot,
    run: { runId: cache.run.runId, finished: cache.run.finished, outcome: cache.run.outcome },
    files, nodes: orderedNodes, relations: relations.sort((x, y) => cmp(x.id, y.id)), levels,
    checks: { invalid, extra },
  };
}
