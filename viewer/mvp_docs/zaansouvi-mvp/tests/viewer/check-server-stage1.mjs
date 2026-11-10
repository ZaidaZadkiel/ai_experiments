// [Superseded] on 2026-11-09 by check-server.mjs for MVP 2 (FND-99): this first-stage version assumes M1 to M3 run, which they no longer do.
// BE-92 (the server's part), BE-93 and BE-94 (mvp_docs/55_viewer_backend.md, section 12): starts the Viewer backend on
// a temporary copy of zaansouvi-mvp (node_modules linked, not copied), so the real data/ is never touched, and checks
// security, the endpoints, the activity log, and how bad or missing data is handled across restarts.
// Needs a Runner cache in data/ (a real run on test-source). Usage, from zaansouvi-mvp/: node tests/viewer/check-server.mjs
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "zaansouvi-viewer-"));
const MVP = path.join(TMP, "zaansouvi-mvp");
const PORT = 4300 + Math.floor(Math.random() * 600);
const problems = [];
let passed = 0;
const check = (name, ok, detail = "") => { if (ok) { passed++; console.log(`  ok    ${name}`); } else { problems.push(`${name} ${detail}`); console.log(`  FAIL  ${name} ${detail}`); } };

// ---- a copy of the MVP: programs (node_modules linked), the test source, and data/ without data/viewer
function copyTree(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.name === "node_modules") fs.symlinkSync(a, b);
    else if (e.isDirectory()) copyTree(a, b);
    else if (e.isSymbolicLink()) fs.symlinkSync(fs.readlinkSync(a), b);
    else fs.copyFileSync(a, b);
  }
}
if (!fs.existsSync(path.join(ROOT, "data/runner/cache.json"))) { console.error("No Runner cache in data/: run app/runner/zaansouvi-run test-source first."); process.exit(2); }
copyTree(path.join(ROOT, "app"), path.join(MVP, "app"));
copyTree(path.join(ROOT, "test-source"), path.join(MVP, "test-source"));
copyTree(path.join(ROOT, "data"), path.join(MVP, "data"));
fs.rmSync(path.join(MVP, "data/viewer"), { recursive: true, force: true });
// The copied cache must name the copied source root.
const cacheFile = path.join(MVP, "data/runner/cache.json");
const cache0 = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
const SRC = path.join(MVP, "test-source");
cache0.run.sourceRoot = SRC;
fs.writeFileSync(cacheFile, JSON.stringify(cache0));

// ---- the server
let server, token, cookie = "";
async function start() {
  server = spawn(path.join(MVP, "app/viewer/zaansouvi-view"), ["--port", String(PORT)], { cwd: TMP, stdio: ["ignore", "pipe", "pipe"] });
  let out = "";
  server.stdout.on("data", (c) => (out += c));
  server.stderr.on("data", (c) => (out += c));
  for (let i = 0; i < 100 && !/token=([0-9a-f]+)/.test(out); i++) await new Promise((r) => setTimeout(r, 100));
  const m = /token=([0-9a-f]+)/.exec(out);
  if (!m) throw new Error(`the server didn't start: ${out}`);
  token = m[1];
  const r = await req("GET", `/?token=${token}`, undefined, { noCookie: true });
  cookie = (r.headers["set-cookie"]?.[0] ?? "").split(";")[0];
}
async function stop() {
  server.kill("SIGINT");
  await new Promise((r) => server.on("close", r));
}
function req(method, p, body, { headers = {}, noCookie = false, raw } = {}) {
  return new Promise((resolve, reject) => {
    const data = raw ?? (body !== undefined ? JSON.stringify(body) : undefined);
    const h = { Host: `127.0.0.1:${PORT}`, ...(noCookie ? {} : { Cookie: cookie }), ...(method === "POST" ? { Origin: `http://127.0.0.1:${PORT}`, "Content-Type": "application/json" } : {}), ...headers };
    for (const k of Object.keys(h)) if (h[k] === null) delete h[k];
    const r = http.request({ host: "127.0.0.1", port: PORT, method, path: p, headers: h }, (res) => {
      let t = "";
      res.setEncoding("utf8");
      res.on("data", (c) => (t += c));
      res.on("end", () => { let json; try { json = JSON.parse(t); } catch {} resolve({ status: res.statusCode, headers: res.headers, text: t, json }); });
    });
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });
}
const waitFor = async (cond, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await cond()) return true; await new Promise((r) => setTimeout(r, 200)); } return false; };

try {
  await start();
  console.log(`server on port ${PORT}, copy in ${TMP}`);

  console.log("BE-93: security");
  check("no cookie: 403", (await req("GET", "/api/sources", undefined, { noCookie: true })).status === 403);
  check("wrong token: 403", (await req("GET", "/?token=00", undefined, { noCookie: true })).status === 403);
  check("wrong Host: 403", (await req("GET", "/api/sources", undefined, { headers: { Host: "evil.example" } })).status === 403);
  check("POST without Origin: 403", (await req("POST", "/api/sources", {}, { headers: { Origin: null } })).status === 403);
  check("POST from another origin: 403", (await req("POST", "/api/sources", {}, { headers: { Origin: "http://evil.example" } })).status === 403);
  const page = await req("GET", "/");
  check("the page: 200 with a Content-Security-Policy", page.status === 200 && /default-src 'self'/.test(page.headers["content-security-policy"] ?? ""));
  check("a body over 64 KiB: 400", (await req("POST", "/api/sources", undefined, { raw: JSON.stringify({ x: "a".repeat(70000) }) })).status === 400);

  console.log("Sources and the graph");
  const added = await req("POST", "/api/sources", { sourceRoot: SRC });
  check("add the test source: 201", added.status === 201, `got ${added.status} ${added.text}`);
  const key = added.json?.sourceKey;
  check("a relative path is refused", (await req("POST", "/api/sources", { sourceRoot: "test-source" })).status === 400);
  check("ZaAnSouVi's own data folder is refused", (await req("POST", "/api/sources", { sourceRoot: path.join(MVP, "data") })).status === 400);
  const g1 = await req("GET", `/api/graph?source=${key}`);
  check("graph: latest, 10 views, nothing invalid", g1.json?.status === "latest" && Object.keys(g1.json.model.levels).length === 10 && g1.json.model.checks.invalid.length === 0, g1.text.slice(0, 200));
  const entryFile = path.join(MVP, "data/viewer/sources", key, "last-good-graph.json");
  check("the valid graph is stored", fs.existsSync(entryFile));

  console.log("BE-93: reads only where allowed");
  check("a listed file's lines: 200", (await req("GET", `/api/source?source=${key}&file=src/main.ts&line=7`)).json?.lines?.[2]?.includes("PRECISION"));
  check("../ in the file: 404", (await req("GET", `/api/source?source=${key}&file=../../etc/passwd&line=1`)).status === 404);
  check("a file not in the list: 404", (await req("GET", `/api/source?source=${key}&file=src/other.ts&line=1`)).status === 404);
  fs.rmSync(path.join(SRC, "src/math.ts"));
  fs.symlinkSync("/etc/hostname", path.join(SRC, "src/math.ts"));
  check("a listed file that is a link out of the source: 404", (await req("GET", `/api/source?source=${key}&file=src/math.ts&line=1`)).status === 404);
  fs.rmSync(path.join(SRC, "src/math.ts"));
  fs.copyFileSync(path.join(ROOT, "test-source/src/math.ts"), path.join(SRC, "src/math.ts"));
  const someLog = fs.readdirSync(path.join(MVP, "data/runner/logs")).find((f) => f.endsWith(".log"));
  check("a log under data/: 200 text", (await req("GET", `/api/log?path=${encodeURIComponent(path.join(MVP, "data/runner/logs", someLog))}`)).headers["content-type"]?.startsWith("text/plain"));
  check("a file outside data/: 404", (await req("GET", `/api/log?path=/etc/hostname`)).status === 404);

  console.log("BE-94: the activity log");
  const actFile = path.join(MVP, "data/viewer/activity.log");
  fs.rmSync(actFile);
  check("a page report recreates a deleted log", (await req("POST", "/api/activity", { event: "level_entered", nodeId: "src/main.ts", source: key })).status === 204 && fs.readFileSync(actFile, "utf8").includes("You entered main.ts"));
  check("an unknown page event: 400", (await req("POST", "/api/activity", { event: "anything" })).status === 400);
  check("Clear: 204, and the file holds only log_cleared", (await req("POST", "/api/activity/clear", {})).status === 204 && fs.readFileSync(actFile, "utf8").trim().split("\n").every((l) => l.includes("\tlog_cleared\t")));
  const lines = fs.readFileSync(actFile, "utf8").trim().split("\n");
  const [, level, event, details] = lines[0].split("\t");
  const d = JSON.parse(details);
  check("entries use the shared log format, with verbosity, actor and text", level === "info" && event === "log_cleared" && d.verbosity === "normal" && d.actor === "user" && typeof d.text === "string");

  console.log("Runs");
  const run = await req("POST", "/api/run", { source: key });
  const again = await req("POST", "/api/run", { source: key });
  check("a run starts: 202; a second one: 409", run.status === 202 && again.status === 409, `${run.status} ${again.status}`);
  check("the run ends and is logged", await waitFor(() => fs.readFileSync(actFile, "utf8").includes("\trun_result\t")));
  await waitFor(async () => !(await req("POST", "/api/dry-run", { source: "nope" })).text.includes("in progress"), 3000);

  console.log("BE-92: bad data, across restarts");
  const storedRun = JSON.parse(fs.readFileSync(entryFile, "utf8")).run.runId;
  const bad = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
  bad.run.runId = "bad-run";
  bad.data["code.membership"].outputs[0].records[0].parent = "src/x.ts#scope@9:9";
  fs.writeFileSync(cacheFile, JSON.stringify(bad));
  const g2 = await req("GET", `/api/graph?source=${key}`);
  check("a partly invalid run is shown, marked", g2.json?.status === "partly-invalid" && g2.json.model.checks.invalid.length === 1, g2.text.slice(0, 160));
  check("... and not stored", JSON.parse(fs.readFileSync(entryFile, "utf8")).run.runId === storedRun);
  const lg = await req("GET", `/api/graph?source=${key}&which=last-good`);
  check("the last good graph is still there", lg.json?.status === "last-good" && lg.json.model.run.runId === storedRun);
  await stop(); await start();
  const g3 = await req("GET", `/api/graph?source=${key}`);
  check("after a restart: the same answer", g3.json?.status === "partly-invalid" && g3.json.model.checks.invalid.length === 1);
  bad.run.outcome = "failed";
  fs.writeFileSync(cacheFile, JSON.stringify(bad));
  const g4 = await req("GET", `/api/graph?source=${key}`);
  check("a failed run: the last good graph, with the reason", g4.json?.status === "last-good" && /failed/.test(g4.json.reason ?? ""));
  // an entry in another format, while the Runner's cache is for another source
  const e = JSON.parse(fs.readFileSync(entryFile, "utf8"));
  e.formatVersion = 0;
  fs.writeFileSync(entryFile, JSON.stringify(e));
  bad.run.sourceRoot = "/somewhere/else";
  fs.writeFileSync(cacheFile, JSON.stringify(bad));
  const g5 = await req("GET", `/api/graph?source=${key}`);
  check("an entry in another format: unusable, with the reason", g5.json?.status === "unusable" && /format 0/.test(g5.json.reason ?? ""), g5.text.slice(0, 160));
  fs.writeFileSync(path.join(MVP, "data/viewer/sources.json"), "{ damaged");
  e.formatVersion = 1;
  fs.writeFileSync(entryFile, JSON.stringify(e));
  await stop(); await start();
  const s = await req("GET", "/api/sources");
  check("a damaged sources.json is rebuilt from the entries", s.json?.sources?.some((x) => x.sourceKey === key && x.sourceRoot === SRC));
  fs.rmSync(path.join(MVP, "data/runner"), { recursive: true, force: true });
  const g6 = await req("GET", `/api/graph?source=${key}`);
  check("with the Runner's data cleared, the cached graph is still shown", g6.json?.status === "stored", g6.text.slice(0, 120));
} catch (err) {
  problems.push(`the check stopped: ${err.stack}`);
} finally {
  if (server && server.exitCode === null) await stop();
  fs.rmSync(TMP, { recursive: true, force: true });
}
for (const p of problems) console.log(`  - ${p}`);
console.log(`\npassed: ${passed}, failed: ${problems.length}`);
process.exitCode = problems.length ? 1 : 0;
