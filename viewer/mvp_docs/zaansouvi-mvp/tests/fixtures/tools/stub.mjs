// Stand-in tool for testing the Runner without M2 and M3 (06_test_plan.md, "Runner checks").
// Its behavior comes from its name, which the launcher passes as STUB_NAME:
//   stub-go       dry run go; real run writes a valid output (one unresolved link per import symbol)
//   stub-no-go    dry run always no-go (E12)
//   stub-crash    dry run go; real run exits 3 without writing result.json
//   stub-garbage  dry run prints a line that isn't JSON
// It takes M1's symbol records, as M2 does (DATA-13), and reads no files.
import fs from "node:fs";
import path from "node:path";

const name = process.env.STUB_NAME;
const args = process.argv.slice(2);
const info = {
  tool: name, toolVersion: "0.0.1", invocation: "once", readsFiles: false,
  parameters: {
    symbols: { dataName: "code.symbol", shape: "array of code.symbol records", required: true, affectsOutput: true },
    store_path: { dataName: "zaansouvi.store_path", shape: "string", required: false, affectsOutput: false },
  },
  outputs: [{
    dataName: `code.${name}`, formatVersion: 1, represents: "relations", outputFilePattern: "output/out.json", jsonKey: "links",
    fields: { idField: "id", fromField: "from", toField: "to", kindField: "kind", locationField: "location" },
  }],
};
if (args.includes("--info")) { console.log(JSON.stringify(info)); process.exit(0); }

const input = JSON.parse(fs.readFileSync(0, "utf8"));
const symbols = input.symbols ?? [];
if (args.includes("--dry-run")) {
  if (name === "stub-garbage") { console.log("this is not json"); process.exit(0); }
  if (name === "stub-no-go" || symbols.length === 0) {
    console.log(JSON.stringify({ dryRun: "no-go", errorKind: "run", tool: name, error: { severity: "error", code: "E12", message: "stand-in no-go" } }));
    process.exit(1);
  }
  console.log(JSON.stringify({ dryRun: "go", tool: name, diagnostics: [] }));
  process.exit(0);
}
if (name === "stub-crash") process.exit(3);

const store = input.store_path;
fs.mkdirSync(path.join(store, "output"), { recursive: true });
fs.mkdirSync(path.join(store, "logs"), { recursive: true });
const links = symbols.filter((s) => s.kind === "import")
  .map((s) => ({ id: `${s.id}->`, from: s.id, to: null, kind: "import", reason: "stub", location: s.location }));
fs.writeFileSync(path.join(store, "output/out.json"),
  JSON.stringify({ tool: name, toolVersion: "0.0.1", formatVersion: 1, dataNames: { [`code.${name}`]: "links" }, links }));
const logPath = path.join(store, "logs/run.log");
fs.writeFileSync(logPath, `${new Date().toISOString()}\tinfo\trun_finished\t{}\n`);
fs.writeFileSync(path.join(store, "result.json"), JSON.stringify({
  tool: name, toolVersion: "0.0.1", status: "succeeded", outputPaths: [path.join(store, "output/out.json")],
  outputChange: "create", diagnostics: [], logPath,
}));
