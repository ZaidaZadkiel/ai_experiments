// zaansouvi-view: the ZaAnSouVi MVP Viewer backend (mvp_docs/05_viewer.md, 55_viewer_backend.md, 50_viewer_ui.md).
//
// A local HTTP server on 127.0.0.1. It gets codebase data only from the Runner (--read-cache, and the events of the
// runs it starts), builds and checks the graph model (model.ts), keeps its own store in data/viewer/ (store.ts) and an
// activity log (activity.ts), and serves the page. Started by hand; prints the URL; runs until stopped (VIEW-07).

import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import type { RunnerCache } from "../../../shared/types.ts";
import { Activity, type ActivityEntry } from "./activity.ts";
import { buildModel, type GraphModel } from "./model.ts";
import { readCache, runRunner } from "./runner.ts";
import { Store, type Source } from "./store.ts";

/** The most lines /api/source gives for one range (FND-106). */
const RANGE_LINES = 200;

// ---------------------------------------------------------------------------
// Places (BE-12): everything is found from this file's location, so the working folder doesn't matter
// ---------------------------------------------------------------------------

const VIEWER_DIR = path.resolve(import.meta.dirname, "..", "..");
const MVP_ROOT = path.resolve(VIEWER_DIR, "..", "..");
const DATA = path.join(MVP_ROOT, "data");
const VIEWER_DATA = path.join(DATA, "viewer");
const RUNNER = path.join(MVP_ROOT, "app", "runner", "zaansouvi-run");
const UI_DIST = path.join(VIEWER_DIR, "ui", "dist");
const UI_STATIC = path.join(VIEWER_DIR, "ui", "static");
const CYTOSCAPE = path.join(VIEWER_DIR, "node_modules", "cytoscape", "dist", "cytoscape.min.js");
const VERSION = (JSON.parse(fs.readFileSync(path.join(VIEWER_DIR, "package.json"), "utf8")) as { version: string }).version;
const DEFAULT_PORT = 4310;
const MAX_BODY = 64 * 1024;

const HELP = `zaansouvi-view ${VERSION}: the ZaAnSouVi MVP Viewer

Usage:
  zaansouvi-view [--port <n>]      start the Viewer on 127.0.0.1 (default port ${DEFAULT_PORT})
  zaansouvi-view --help | --version

Prints the URL to open in your browser, then runs until you stop it with Ctrl + C.
`;

// ---------------------------------------------------------------------------
// Options (BE-11, BE-13)
// ---------------------------------------------------------------------------

function startupError(message: string): never {
  process.stderr.write(`zaansouvi-view: ${message}\n`);
  process.exit(2);
}

let port = DEFAULT_PORT;
{
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help") { process.stdout.write(HELP); process.exit(0); }
    if (a === "--version") { process.stdout.write(`zaansouvi-view ${VERSION}\n`); process.exit(0); }
    if (a === "--port") {
      const v = Number(argv[++i]);
      if (!Number.isInteger(v) || v < 1 || v > 65535) startupError("--port needs a number from 1 to 65535.");
      port = v;
      continue;
    }
    startupError(`unknown option ${a}. Run with --help to see the options.`);
  }
}
if (!fs.existsSync(path.join(UI_DIST, "main.js"))) startupError(`the page isn't built. Run: (cd ${VIEWER_DIR} && npm run build)`);
if (!fs.existsSync(CYTOSCAPE)) startupError(`Cytoscape isn't installed. Run: (cd ${VIEWER_DIR} && npm install)`);

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

try {
  fs.mkdirSync(path.join(VIEWER_DATA, "sources"), { recursive: true });
} catch (e) {
  startupError(`can't create ${VIEWER_DATA}: ${(e as Error).message}`);
}
const activity = new Activity(path.join(VIEWER_DATA, "activity.log"));
const store = new Store(VIEWER_DATA, [path.join(MVP_ROOT, "data"), path.join(MVP_ROOT, "app")].map((p) => { try { return fs.realpathSync(p); } catch { return p; } }));
const token = crypto.randomBytes(32).toString("hex");
const COOKIE = "zaansouvi_session";
let current: string | null = null; // the current source's key (BE-34)
let running: { kind: "run" | "dry-run"; source: string } | null = null;
const shown = new Map<string, GraphModel>(); // the last model given to the page per source, for labels in the activity log
const checkedRuns = new Set<string>(); // runs whose output has been checked and logged once

// ---------------------------------------------------------------------------
// The live stream (BE-70)
// ---------------------------------------------------------------------------

const streams = new Set<http.ServerResponse>();
function send(res: http.ServerResponse, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}
function broadcast(event: string, data: unknown) {
  for (const s of streams) send(s, event, data);
}
activity.subscribe((kind, e) => broadcast(kind === "entry" ? "activity" : "cleared", e ?? {}));
setInterval(() => { for (const s of streams) s.write(": keep-alive\n\n"); }, 15000).unref();

// ---------------------------------------------------------------------------
// Graphs (BE-56, BE-57)
// ---------------------------------------------------------------------------

const realOrSame = (p: string) => { try { return fs.realpathSync(p); } catch { return p; } };

type GraphAnswer = {
  status: "latest" | "stored" | "partly-invalid" | "last-good" | "no-good-data" | "no-run" | "unusable";
  reason?: string;
  model?: GraphModel;
  lastGood?: { runId: string; finished: string };
};

async function graphFor(source: Source, which: "auto" | "last-good"): Promise<GraphAnswer> {
  const entry = store.readEntry(source.sourceKey);
  const stored = entry?.ok ? entry.model : undefined;
  const lastGood = stored ? { runId: stored.run.runId, finished: stored.run.finished } : undefined;
  const fallback = (reason: string): GraphAnswer =>
    stored ? { status: "last-good", reason, model: stored, lastGood } : { status: "no-good-data", reason };

  if (which === "last-good") {
    if (stored) return { status: "last-good", model: stored, lastGood };
    return { status: entry && !entry.ok ? "unusable" : "no-run", reason: entry && !entry.ok ? entry.reason : "There is no good graph for this source yet." };
  }

  const cache = await readCache(RUNNER, DATA);
  const forThis = !!cache?.run && realOrSame(cache.run.sourceRoot) === source.sourceRoot;
  if (forThis && cache?.run) {
    if (cache.run.outcome !== "succeeded") return fallback("Not the latest: the last run failed.");
    if (stored && stored.run.runId === cache.run.runId) return { status: "latest", model: stored, lastGood };
    return checkAndStore(cache, source, stored, lastGood);
  }
  if (stored) return { status: "stored", model: stored, lastGood };
  if (entry && !entry.ok) return { status: "unusable", reason: `${entry.reason} Run this source to rebuild it.` };
  return { status: "no-run", reason: "No run yet for this source. Run it to see its graph." };
}

function checkAndStore(cache: RunnerCache, source: Source, stored: GraphModel | undefined, lastGood: GraphAnswer["lastGood"]): GraphAnswer {
  let model: GraphModel;
  try {
    model = buildModel(cache, source.sourceKey, VERSION);
  } catch (e) {
    const reason = `The run's output couldn't be turned into a graph: ${(e as Error).message}`;
    activity.log("warn", "backend_warning", "minimal", "app", reason, { sourceRoot: source.sourceRoot });
    return stored ? { status: "last-good", reason, model: stored, lastGood } : { status: "no-good-data", reason };
  }
  const { invalid, extra } = model.checks;
  const firstTime = !checkedRuns.has(model.run.runId);
  checkedRuns.add(model.run.runId);
  if (firstTime) {
    const text = invalid.length === 0 && extra.length === 0 ? "Checked the run's output: nothing invalid, no extra data"
      : `Checked the run's output: ${invalid.length} record${invalid.length === 1 ? "" : "s"} invalid, ${extra.length} extra`;
    activity.log("info", "output_checked", "normal", "app", text, { runId: model.run.runId, counts: { invalidCount: invalid.length, extraCount: extra.length } });
    for (const i of invalid) activity.log("info", "output_checked", "verbose", "app", `Invalid: ${i.dataName} ${i.recordId}: ${i.problem}`, { item: i });
    for (const x of extra) activity.log("info", "output_checked", "verbose", "app", `Extra: ${x.dataName}: ${x.detail}`, { item: x });
  }
  if (invalid.length > 0) {
    if (firstTime) activity.log("warn", "output_partly_invalid", "minimal", "app",
      `The run's output is partly invalid: ${invalid.length} record${invalid.length === 1 ? "" : "s"} skipped; the last good graph is kept`, { runId: model.run.runId });
    return { status: "partly-invalid", reason: `Partly invalid: ${invalid.length} record${invalid.length === 1 ? "" : "s"} skipped.`, model, lastGood };
  }
  store.writeEntry(model);
  return { status: "latest", model, lastGood: { runId: model.run.runId, finished: model.run.finished } };
}

// ---------------------------------------------------------------------------
// Runs (BE-40 to BE-43)
// ---------------------------------------------------------------------------

function describeEvent(e: Record<string, unknown>): string {
  const where = `${e.tool}${e.file_id ? `, ${e.file_id}` : ""}`;
  const err = e.error as { code?: string; message?: string } | undefined;
  switch (e.event) {
    case "run_started": return `${e.mode === "dry-run" ? "Dry run" : "Run"} started on ${e.sourceRoot}`;
    case "files_listed": return `${e.fileCount} files listed`;
    case "tool_skipped": return `${where}: skipped, up to date`;
    case "tool_dry_run": return `${where}: ${e.dryRun}${e.dryRun === "no-go" && err ? ` (${err.code}: ${err.message})` : ` (${e.refreshReason})`}`;
    case "tool_run": return `${where}: ${e.status === "succeeded" ? `ran, output ${e.outputChange ?? "written"}` : `failed (${err?.code}: ${err?.message})`}`;
    case "run_finished": return `Runner finished: ${e.outcome}, exit code ${e.exitCode}`;
    case "run_refused": return `Runner refused to run: ${err?.message ?? "no reason given"}`;
    default: return `Runner event ${String(e.event)}`;
  }
}

async function startRun(kind: "run" | "dry-run", source: Source) {
  running = { kind, source: source.sourceKey };
  broadcast("run_state", { running: true, kind, source: source.sourceKey });
  const args = kind === "run" ? [source.sourceRoot] : [source.sourceRoot, "--dry-run-only"];
  let ran = 0, skipped = 0, errors = 0, go = 0, noGo = 0, outcome = "failed";
  let refused: string | undefined;
  const result = await runRunner(RUNNER, args, DATA, (e) => {
    broadcast("runner", e);
    activity.log("info", "runner_event", "verbose", "app", describeEvent(e), { runnerEvent: e });
    if (e.event === "tool_run") { ran++; if (e.status !== "succeeded") errors++; }
    if (e.event === "tool_skipped") skipped++;
    if (e.event === "tool_dry_run") { if (e.dryRun === "go") go++; else noGo++; }
    if (e.event === "run_finished") outcome = String(e.outcome);
    if (e.event === "run_refused") refused = (e.error as { message?: string } | undefined)?.message ?? "no reason given";
  });
  if (result.badLines > 0) activity.log("warn", "backend_warning", "minimal", "app", `The Runner printed ${result.badLines} line(s) that aren't events; ignored`);
  if (refused !== undefined) {
    activity.log("warn", "run_refused", "minimal", "app", `Run refused by the Runner: ${refused}`);
  } else if (kind === "dry-run") {
    const text = `Dry run resulted in ${noGo === 0 ? "0 errors" : `${noGo} no-go`}: ${go} of ${go + noGo} go`;
    activity.log(noGo === 0 && result.exitCode === 0 ? "info" : "warn", "dry_run_result", "minimal", "app", text, { counts: { goCount: go, noGoCount: noGo } });
  } else {
    errors += noGo; // in a real run, a no-go stops the run: an error
    if (outcome !== "succeeded" && errors === 0) errors = 1;
    const text = `Run ${outcome}: ${ran} ran, ${skipped} skipped, ${errors} error${errors === 1 ? "" : "s"}`;
    activity.log(outcome === "succeeded" ? "info" : "error", "run_result", "minimal", "app", text,
      { outcome, counts: { ranCount: ran, skippedCount: skipped, errorCount: errors } });
  }
  if (result.exitCode === null) activity.log("error", "backend_error", "minimal", "app", `The Runner couldn't be started: ${result.stderr}`);
  else if (result.exitCode !== 0 && refused === undefined && result.stderr) {
    activity.log("warn", "backend_warning", "normal", "app", `The Runner ended with exit code ${result.exitCode}: ${result.stderr.split("\n")[0]}`);
  }
  if (kind === "run") {
    try {
      const answer = await graphFor(source, "auto");
      if (answer.model) shown.set(source.sourceKey, answer.model);
    } catch (e) {
      activity.log("error", "backend_error", "minimal", "app", `Couldn't read the run's result: ${(e as Error).message}`);
    }
  }
  running = null;
  broadcast("run_state", { running: false, kind, source: source.sourceKey });
  broadcast("graph_updated", { source: source.sourceKey, kind });
}

// ---------------------------------------------------------------------------
// HTTP helpers and security (BE-63, BE-71 to BE-73)
// ---------------------------------------------------------------------------

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};
const NO_TOKEN_TEXT = "This page needs the link printed by zaansouvi-view.";

function reply(res: http.ServerResponse, status: number, body: unknown, type = "application/json; charset=utf-8") {
  const text = type.startsWith("application/json") ? JSON.stringify(body) : String(body);
  res.writeHead(status, { ...SECURITY_HEADERS, "Content-Type": type, "Cache-Control": "no-store" });
  res.end(text);
}
const fail = (res: http.ServerResponse, status: number, error: string) => reply(res, status, { error });

function sameToken(given: string | undefined) {
  if (!given) return false;
  const a = Buffer.from(given), b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function cookieToken(req: http.IncomingMessage) {
  const c = req.headers.cookie ?? "";
  for (const part of c.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === COOKIE) return v.join("=");
  }
  return undefined;
}
function readBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    // Past the limit, the rest is read and dropped, so the client still gets its 400 rather than a reset connection.
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size <= MAX_BODY) chunks.push(c);
    });
    req.on("end", () => {
      if (size > MAX_BODY) return reject(new Error("The request body is too large."));
      if (chunks.length === 0) return resolve({});
      try {
        const v = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        if (v && typeof v === "object" && !Array.isArray(v)) resolve(v as Record<string, unknown>);
        else reject(new Error("The request body must be a JSON object."));
      } catch {
        reject(new Error("The request body isn't valid JSON."));
      }
    });
    req.on("error", reject);
  });
}

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".log": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon",
};
function serveFile(res: http.ServerResponse, file: string) {
  let data: Buffer;
  try {
    data = fs.readFileSync(file);
  } catch {
    return fail(res, 404, "Not found.");
  }
  res.writeHead(200, { ...SECURITY_HEADERS, "Content-Type": CONTENT_TYPES[path.extname(file)] ?? "application/octet-stream", "Cache-Control": "no-cache" });
  res.end(data);
}
const isInside = (base: string, p: string) => { const rel = path.relative(base, p); return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel)); };

function sourceParam(url: URL, body?: Record<string, unknown>): Source | undefined {
  const key = (body?.source as string | undefined) ?? url.searchParams.get("source") ?? undefined;
  return key ? store.get(key) : undefined;
}

// ---------------------------------------------------------------------------
// Routes (BE section 8)
// ---------------------------------------------------------------------------

const PAGE_EVENTS: Record<string, { verbosity: "normal" | "verbose"; text: (label: string, body: Record<string, unknown>) => string }> = {
  level_entered: { verbosity: "verbose", text: (l) => `You entered ${l}` },
  level_left: { verbosity: "verbose", text: (l) => `You went back to ${l}` },
  node_selected: { verbosity: "verbose", text: (l) => `You selected ${l}` },
  log_opened: { verbosity: "normal", text: (_l, b) => `You opened the log ${typeof b.path === "string" ? path.basename(b.path) : ""}`.trim() },
  graph_switched: { verbosity: "normal", text: (_l, b) => b.which === "last-good" ? "You switched to the last good graph" : "You switched to the latest run" },
};

function labelOf(sourceKey: string | undefined, nodeId: unknown): string {
  if (typeof nodeId !== "string") return "the top level";
  if (nodeId === "") return "the top level";
  const arrow = nodeId.indexOf("->"); // an edge of a view: <from>-><to> (BE-53)
  if (arrow > 0) return `the edge ${labelOf(sourceKey, nodeId.slice(0, arrow))} → ${labelOf(sourceKey, nodeId.slice(arrow + 2))}`;
  const n = sourceKey ? shown.get(sourceKey)?.nodes.find((x) => x.id === nodeId) : undefined;
  if (!n) return nodeId;
  // Generic (VIEW-14): a node with an owner is a scope; one owned by its own container is the file scope.
  if (n.owner !== undefined) return n.owner === n.container ? `the file scope of ${path.basename(n.container ?? "")}` : `scope ${n.label}`;
  return n.label;
}

async function route(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
  const method = req.method ?? "GET";

  // Host (BE-71): only our own name and port, so a page that rebinds a name to 127.0.0.1 gets nothing.
  const host = req.headers.host ?? "";
  if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) return reply(res, 403, NO_TOKEN_TEXT, "text/plain; charset=utf-8");

  // The token, once, in the URL printed at start; then a session cookie (BE-71).
  if (method === "GET" && url.pathname === "/" && url.searchParams.has("token")) {
    if (!sameToken(url.searchParams.get("token") ?? undefined)) return reply(res, 403, NO_TOKEN_TEXT, "text/plain; charset=utf-8");
    res.writeHead(303, { ...SECURITY_HEADERS, "Set-Cookie": `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/`, Location: "/", "Cache-Control": "no-store" });
    return res.end();
  }
  if (!sameToken(cookieToken(req))) return reply(res, 403, NO_TOKEN_TEXT, "text/plain; charset=utf-8");

  // Origin on every POST (BE-71).
  if (method === "POST") {
    const origin = req.headers.origin;
    if (origin !== `http://127.0.0.1:${port}` && origin !== `http://localhost:${port}`) return fail(res, 403, "Requests must come from the Viewer's own page.");
  }

  let body: Record<string, unknown> = {};
  if (method === "POST") {
    try {
      body = await readBody(req);
    } catch (e) {
      return fail(res, 400, (e as Error).message);
    }
  }
  const key = `${method} ${url.pathname}`;

  // ---- the page
  if (key === "GET /") return serveFile(res, path.join(UI_STATIC, "index.html"));
  if (method === "GET" && url.pathname.startsWith("/ui/")) {
    const name = url.pathname.slice(4);
    if (!/^[A-Za-z0-9_-]+\.(js|css|svg|png|ico)$/.test(name)) return fail(res, 404, "Not found.");
    const fromDist = path.join(UI_DIST, name);
    return serveFile(res, fs.existsSync(fromDist) ? fromDist : path.join(UI_STATIC, name));
  }
  if (key === "GET /lib/cytoscape.js") return serveFile(res, CYTOSCAPE);

  // ---- sources (VIEW-08, BE-30 to BE-34)
  if (key === "GET /api/sources") return reply(res, 200, { current, sources: store.list() });
  if (key === "POST /api/sources") {
    const r = store.add(body.sourceRoot);
    if ("error" in r) return fail(res, 400, r.error);
    if (r.added) activity.log("info", "source_added", "normal", "user", `You added the source "${r.source.sourceRoot}"`, { sourceRoot: r.source.sourceRoot });
    return reply(res, r.added ? 201 : 200, r.source);
  }
  if (key === "POST /api/sources/current") {
    const s = sourceParam(url, body);
    if (!s) return fail(res, 404, "No such source.");
    if (running) return fail(res, 409, "A run is in progress; switch sources when it ends.");
    current = s.sourceKey;
    activity.log("info", "source_opened", "normal", "user", `You opened folder "${s.sourceRoot}" for examination`, { sourceRoot: s.sourceRoot });
    return reply(res, 204, "", "text/plain");
  }

  // ---- the graph (BE-57)
  if (key === "GET /api/graph") {
    const s = sourceParam(url);
    if (!s) return fail(res, 404, "No such source.");
    const which = url.searchParams.get("which") === "last-good" ? "last-good" : "auto";
    try {
      const answer = await graphFor(s, which);
      if (answer.model) shown.set(s.sourceKey, answer.model);
      if (answer.status === "stored" || answer.status === "latest") {
        // logged once per source and run: the page asks again on every reload
        const tag = `${s.sourceKey}:${answer.model?.run.runId}`;
        if (!loadedOnce.has(tag)) {
          loadedOnce.add(tag);
          activity.log("info", "cached_graph_loaded", "normal", "app", `Loaded the graph from the run of ${answer.model?.run.finished.replace("T", " ").slice(0, 16)}`, { runId: answer.model?.run.runId });
        }
      }
      if (answer.status === "unusable") activity.log("warn", "entry_unusable", "minimal", "app", `The cached graph for ${s.name} can't be used: ${answer.reason}`);
      return reply(res, 200, answer);
    } catch (e) {
      activity.log("error", "backend_error", "minimal", "app", `Couldn't build the graph: ${(e as Error).message}`);
      return fail(res, 500, "The graph couldn't be built; see the activity log.");
    }
  }

  // ---- tools (VIEW-31)
  if (key === "GET /api/tools") {
    const s = sourceParam(url);
    const cache = await readCache(RUNNER, DATA);
    const forThis = !!s && !!cache?.run && realOrSame(cache.run.sourceRoot) === s.sourceRoot;
    const dryForThis = !!s && !!cache?.dryRun && (forThis || !cache?.run);
    return reply(res, 200, {
      tools: (cache?.tools ?? []).map((t) => ({ tool: t.tool, position: t.position, toolVersion: t.info?.toolVersion })),
      run: forThis ? cache?.run : null,
      invocations: forThis ? (cache?.invocations ?? []).map((i) => ({ tool: i.tool, file_id: i.file_id, refreshReason: i.refreshReason, skipped: i.skipped ?? false, dryRun: i.dryRun?.dryRun, ...(i.dryRun?.error ? { dryRunError: i.dryRun.error } : {}), result: i.result })) : [],
      dryRun: dryForThis ? cache?.dryRun : null,
    });
  }

  // ---- runs (VIEW-05, VIEW-32)
  if (key === "POST /api/run" || key === "POST /api/dry-run") {
    const kind = key === "POST /api/run" ? "run" : "dry-run";
    const s = sourceParam(url, body);
    if (!s) return fail(res, 404, "No such source.");
    if (running) {
      activity.log("warn", "run_refused", "minimal", "app", "Run refused: a run is already in progress");
      return fail(res, 409, "A run is already in progress.");
    }
    activity.log("info", kind === "run" ? "run_requested" : "dry_run_requested", "normal", "user", kind === "run" ? "You executed a manual run" : "You started a dry run", { sourceRoot: s.sourceRoot });
    void startRun(kind, s).catch((e) => {
      running = null;
      activity.log("error", "backend_error", "minimal", "app", `The run failed in the Viewer: ${(e as Error).message}`);
      broadcast("run_state", { running: false, kind, source: s.sourceKey });
    });
    return reply(res, 202, { started: kind });
  }

  // ---- source lines (VIEW-30, BE-72)
  if (key === "GET /api/source") {
    const s = sourceParam(url);
    const file = url.searchParams.get("file") ?? "";
    const line = Number(url.searchParams.get("line"));
    const model = s ? (shown.get(s.sourceKey) ?? (() => { const e = store.readEntry(s.sourceKey); return e?.ok ? e.model : undefined; })()) : undefined;
    // Only lines of a listed file a tool read as text (security.md, section 7; MVP 2 lists every file, so binary or very
    // large files are kept out this way). A first-stage graph has no readBy: its files were all .ts files a tool read.
    const entry = model?.nodes.find((n) => n.id === file);
    const anyReadBy = !!model?.nodes.some((n) => Array.isArray(n.attrs?.readBy));
    const readByTool = !anyReadBy || (Array.isArray(entry?.attrs?.readBy) && !entry?.attrs?.unreadable);
    if (!s || !model || !model.files.includes(file) || !readByTool || !Number.isInteger(line) || line < 1) return fail(res, 404, "Not found.");
    let real: string;
    try {
      real = fs.realpathSync(path.join(s.sourceRoot, file));
    } catch {
      return fail(res, 404, "Not found.");
    }
    if (!isInside(realOrSame(s.sourceRoot), real)) return fail(res, 404, "Not found.");
    const all = fs.readFileSync(real, "utf8").split(/\r?\n/);
    // With end (FND-106): the lines line to end, a record's range, at most RANGE_LINES of them; else 2 lines around line.
    if (url.searchParams.has("end")) {
      const end = Number(url.searchParams.get("end"));
      if (!Number.isInteger(end) || end < line) return fail(res, 404, "Not found.");
      const last = Math.min(all.length, end, line + RANGE_LINES - 1);
      return reply(res, 200, { file, firstLine: line, lines: all.slice(line - 1, last), cut: last < end });
    }
    const first = Math.max(1, line - 2);
    return reply(res, 200, { file, firstLine: first, lines: all.slice(first - 1, Math.min(all.length, line + 2)) });
  }

  // ---- logs (BE-72)
  if (key === "GET /api/log") {
    const p = url.searchParams.get("path") ?? "";
    let real: string;
    try {
      real = fs.realpathSync(p);
    } catch {
      return fail(res, 404, "Not found.");
    }
    if (!real.endsWith(".log") || !isInside(realOrSame(DATA), real)) return fail(res, 404, "Not found.");
    return serveFile(res, real);
  }

  // ---- the live stream (BE-70)
  if (key === "GET /api/events") {
    res.writeHead(200, { ...SECURITY_HEADERS, "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store", Connection: "keep-alive" });
    res.write(": connected\n\n");
    for (const e of activity.entries) send(res, "activity", e);
    send(res, "run_state", running ? { running: true, ...running } : { running: false });
    streams.add(res);
    req.on("close", () => streams.delete(res));
    return;
  }

  // ---- the activity log (BE-82, BE-83)
  if (key === "POST /api/activity") {
    const ev = typeof body.event === "string" ? PAGE_EVENTS[body.event] : undefined;
    if (!ev) return fail(res, 400, "Unknown activity event.");
    const sourceKey = typeof body.source === "string" ? body.source : undefined;
    const facts: Record<string, unknown> = {};
    if (typeof body.nodeId === "string") facts.nodeId = body.nodeId;
    activity.log("info", body.event as string, ev.verbosity, "user", ev.text(labelOf(sourceKey, body.nodeId), body), facts);
    return reply(res, 204, "", "text/plain");
  }
  if (key === "POST /api/activity/clear") {
    activity.clear();
    return reply(res, 204, "", "text/plain");
  }

  return fail(res, 404, "Not found.");
}
const loadedOnce = new Set<string>();

// ---------------------------------------------------------------------------
// Start and stop (BE-12 to BE-14)
// ---------------------------------------------------------------------------

const server = http.createServer((req, res) => {
  route(req, res).catch((e) => {
    // Never let one request take the server down (BE-61).
    activity.log("error", "backend_error", "minimal", "app", `A request failed: ${(e as Error).message}`);
    if (!res.headersSent) fail(res, 500, "Internal error; see the activity log.");
    else res.end();
  });
});
server.on("error", (e: NodeJS.ErrnoException) => {
  if (e.code === "EADDRINUSE") startupError(`port ${port} is in use. Start with --port <n> to use another.`);
  startupError(e.message);
});
server.listen(port, "127.0.0.1", () => {
  const rebuilt = store.load();
  current = store.list()[0]?.sourceKey ?? null;
  activity.comment("session", `zaansouvi-view ${VERSION}, port ${port}`);
  activity.log("info", "viewer_started", "minimal", "app", `Viewer ${VERSION} started on port ${port}`, { port });
  if (rebuilt && store.list().length > 0) activity.log("warn", "backend_warning", "minimal", "app", "sources.json was missing or damaged; rebuilt from the cached graphs");
  process.stdout.write(`ZaAnSouVi Viewer ${VERSION}\nOpen in your browser: http://127.0.0.1:${port}/?token=${token}\nStop with Ctrl + C.\n`);
});

function stop() {
  activity.log("info", "viewer_stopped", "minimal", "app", "Viewer stopped");
  for (const s of streams) s.end();
  server.close();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

export type { ActivityEntry };
