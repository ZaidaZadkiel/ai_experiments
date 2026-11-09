// The Viewer's own store, data/viewer/ (mvp_docs/55_viewer_backend.md, sections 3 and 4; VIEW-06, VIEW-08).
//
// sources.json lists the sources; sources/<source-key>/last-good-graph.json holds each source's last good graph model.
// Every file is written atomically. Each entry records its own source root, so sources.json can be rebuilt from them.

import fs from "node:fs";
import path from "node:path";
import { readJson, sha256, writeAtomic } from "../../../shared/fsutil.ts";
import { MODEL_FORMAT_VERSION, type GraphModel } from "./model.ts";

export type Source = { sourceKey: string; sourceRoot: string; name: string; runId?: string; finished?: string };
export type EntryRead = { ok: true; model: GraphModel } | { ok: false; reason: string } | null;

const SOURCES_FORMAT_VERSION = 1;

export class Store {
  private sources: Source[] = [];

  private readonly dir: string;
  private readonly forbidden: string[];
  // No parameter properties: Node's type stripping doesn't support them.
  constructor(dir: string, forbidden: string[]) {
    this.dir = dir;
    this.forbidden = forbidden;
  }

  private get listFile() { return path.join(this.dir, "sources.json"); }
  private entryFile(key: string) { return path.join(this.dir, "sources", key, "last-good-graph.json"); }

  static keyOf(realRoot: string) { return sha256(realRoot).slice(0, 16); }

  /** Reads sources.json; if it is missing or damaged, rebuilds it from the entries (BE-32). Returns whether it rebuilt. */
  load(): boolean {
    fs.mkdirSync(path.join(this.dir, "sources"), { recursive: true });
    const raw = readJson(this.listFile) as { formatVersion?: unknown; sources?: unknown } | undefined;
    if (raw && raw.formatVersion === SOURCES_FORMAT_VERSION && Array.isArray(raw.sources) &&
        raw.sources.every((s) => s && typeof s.sourceKey === "string" && typeof s.sourceRoot === "string")) {
      this.sources = raw.sources as Source[];
      return false;
    }
    this.sources = [];
    for (const key of fs.readdirSync(path.join(this.dir, "sources")).sort()) {
      const m = readJson(this.entryFile(key)) as Partial<GraphModel> | undefined;
      if (m && typeof m.sourceRoot === "string" && m.sourceKey === key) {
        this.sources.push({ sourceKey: key, sourceRoot: m.sourceRoot, name: path.basename(m.sourceRoot), runId: m.run?.runId, finished: m.run?.finished });
      }
    }
    this.save();
    return true;
  }

  private save() {
    writeAtomic(this.listFile, JSON.stringify({ formatVersion: SOURCES_FORMAT_VERSION, sources: this.sources }, null, 2) + "\n");
  }

  list() { return this.sources.slice(); }
  get(key: string) { return this.sources.find((s) => s.sourceKey === key); }
  byRoot(realRoot: string) { return this.sources.find((s) => s.sourceRoot === realRoot); }

  /** Adds a source (BE-33): an absolute path to an existing folder outside ZaAnSouVi's own folders. */
  add(given: unknown): { source: Source; added: boolean } | { error: string } {
    if (typeof given !== "string" || given.trim() === "") return { error: "Give the absolute path of the source root." };
    if (!path.isAbsolute(given)) return { error: "The path must be absolute, for example /home/you/projects/app." };
    let real: string;
    try {
      real = fs.realpathSync(given);
      if (!fs.statSync(real).isDirectory()) return { error: "That path is not a folder." };
    } catch {
      return { error: "That folder doesn't exist or can't be read." };
    }
    for (const f of this.forbidden) {
      const rel = path.relative(f, real);
      if (rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel))) return { error: "That folder is part of ZaAnSouVi itself; pick the examined source." };
    }
    const existing = this.byRoot(real);
    if (existing) return { source: existing, added: false };
    const source: Source = { sourceKey: Store.keyOf(real), sourceRoot: real, name: path.basename(real) };
    this.sources.push(source);
    this.save();
    return { source, added: true };
  }

  /** The stored entry: its model, a reason it can't be used (VIEW-08), or null when there is none. */
  readEntry(key: string): EntryRead {
    const file = this.entryFile(key);
    if (!fs.existsSync(file)) return null;
    const m = readJson(file) as Partial<GraphModel> | undefined;
    if (!m) return { ok: false, reason: "The cached graph for this source can't be read." };
    if (m.formatVersion !== MODEL_FORMAT_VERSION) {
      return { ok: false, reason: `The cached graph was written in graph format ${String(m.formatVersion)}; this Viewer reads format ${MODEL_FORMAT_VERSION}.` };
    }
    if (!m.levels || !m.nodes || !m.run) return { ok: false, reason: "The cached graph for this source is incomplete." };
    return { ok: true, model: m as GraphModel };
  }

  /** Stores a valid model as the source's last good graph (VIEW-16), and records its run in sources.json. */
  writeEntry(model: GraphModel) {
    writeAtomic(this.entryFile(model.sourceKey), JSON.stringify(model) + "\n");
    const s = this.get(model.sourceKey);
    if (s) {
      s.runId = model.run.runId;
      s.finished = model.run.finished;
      this.save();
    }
  }
}
