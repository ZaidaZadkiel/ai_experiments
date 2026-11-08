// The MVP's single database (ARCH-10, 02_data_contracts.md "Database tables"). Only the Runner writes it (ARCH-11).
// It keeps what the refresh check needs; what the Viewer reads is in the Runner's cache (RUN-27).

import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export const CONFIG_VERSION = 1; // RUN-04

const SCHEMA = `
CREATE TABLE IF NOT EXISTS config_version (version INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS config_tools (name TEXT PRIMARY KEY, launcher TEXT NOT NULL, info TEXT NOT NULL, version TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS config_ordering (position INTEGER PRIMARY KEY, tool TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS config_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS project_source (id INTEGER PRIMARY KEY CHECK (id = 1), source_root TEXT NOT NULL, listed_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS project_files (file_id TEXT PRIMARY KEY, size INTEGER NOT NULL, sha256 TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS project_outputs (
  tool TEXT NOT NULL, data_name TEXT NOT NULL, format_version INTEGER NOT NULL, output_path TEXT NOT NULL,
  produced_at TEXT NOT NULL, fingerprint TEXT NOT NULL, PRIMARY KEY (tool, data_name, output_path));
CREATE TABLE IF NOT EXISTS project_runs (
  run_id TEXT PRIMARY KEY, mode TEXT NOT NULL, started TEXT NOT NULL, finished TEXT, outcome TEXT, exit_code INTEGER, log_path TEXT);
CREATE TABLE IF NOT EXISTS project_tool_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, run_id TEXT NOT NULL, mode TEXT NOT NULL, tool TEXT NOT NULL, file_id TEXT NOT NULL DEFAULT '',
  refresh_reason TEXT NOT NULL, dry_run_result TEXT, real_run_result TEXT, fingerprint TEXT, at TEXT NOT NULL);
`;

export type Db = ReturnType<typeof wrap>;

/** Reads one saved setting without creating anything: used before the Runner may write (RUN-03, RUN-29). */
export function readSettingIfExists(file: string, key: string): string | undefined {
  if (!fs.existsSync(file)) return undefined;
  try {
    const db = new DatabaseSync(file);
    try {
      const row = db.prepare("SELECT value FROM config_settings WHERE key = ?").get(key) as { value: string } | undefined;
      return row?.value;
    } finally {
      db.close();
    }
  } catch {
    return undefined;
  }
}

/** Opens or creates the database. Returns the found version when it is unknown, so the caller can refuse (RUN-04). */
export function openDb(file: string): { db: Db } | { unknownVersion: unknown } {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const raw = new DatabaseSync(file);
  raw.exec(SCHEMA);
  const row = raw.prepare("SELECT version FROM config_version").get() as { version: number } | undefined;
  if (row === undefined) raw.prepare("INSERT INTO config_version (version) VALUES (?)").run(CONFIG_VERSION);
  else if (row.version !== CONFIG_VERSION) {
    raw.close();
    return { unknownVersion: row.version };
  }
  return { db: wrap(raw) };
}

function wrap(raw: DatabaseSync) {
  const now = () => new Date().toISOString();
  return {
    close: () => raw.close(),

    setSetting(key: string, value: string) {
      raw.prepare("INSERT INTO config_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
    },
    getSetting(key: string): string | undefined {
      return (raw.prepare("SELECT value FROM config_settings WHERE key = ?").get(key) as { value: string } | undefined)?.value;
    },

    /** RUN-05: the record of tools and the ordering are rewritten on every start. */
    writeTools(tools: { name: string; launcher: string; info: unknown; version: string }[], order: string[]) {
      raw.exec("DELETE FROM config_tools; DELETE FROM config_ordering;");
      const ins = raw.prepare("INSERT INTO config_tools (name, launcher, info, version) VALUES (?, ?, ?, ?)");
      for (const t of tools) ins.run(t.name, t.launcher, JSON.stringify(t.info), t.version);
      const pos = raw.prepare("INSERT INTO config_ordering (position, tool) VALUES (?, ?)");
      order.forEach((name, i) => pos.run(i + 1, name));
    },

    /** RUN-06 */
    writeFiles(sourceRoot: string, files: { id: string; size: number; sha256: string }[]) {
      raw.exec("DELETE FROM project_files;");
      const ins = raw.prepare("INSERT INTO project_files (file_id, size, sha256) VALUES (?, ?, ?)");
      for (const f of files) ins.run(f.id, f.size, f.sha256);
      raw.prepare("INSERT INTO project_source (id, source_root, listed_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET source_root = excluded.source_root, listed_at = excluded.listed_at")
        .run(sourceRoot, now());
    },

    startRun(runId: string, mode: "real" | "dry-run", started: string, logPath: string) {
      raw.prepare("INSERT INTO project_runs (run_id, mode, started, log_path) VALUES (?, ?, ?, ?)").run(runId, mode, started, logPath);
    },
    finishRun(runId: string, outcome: string, exitCode: number, finished: string) {
      raw.prepare("UPDATE project_runs SET finished = ?, outcome = ?, exit_code = ? WHERE run_id = ?").run(finished, outcome, exitCode, runId);
    },

    recordToolRun(r: {
      runId: string; mode: "real" | "dry-run"; tool: string; fileId?: string; refreshReason: string;
      dryRunResult?: string; realRunResult?: string; fingerprint?: string;
    }) {
      raw.prepare(
        "INSERT INTO project_tool_runs (run_id, mode, tool, file_id, refresh_reason, dry_run_result, real_run_result, fingerprint, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(r.runId, r.mode, r.tool, r.fileId ?? "", r.refreshReason, r.dryRunResult ?? null, r.realRunResult ?? null, r.fingerprint ?? null, now());
    },

    /** The last real run of an invocation that started the tool (skips excluded), for `never-run` and `last-failed` (RUN-20). */
    lastRealRun(tool: string, fileId: string | undefined): { real_run_result: string | null; fingerprint: string | null } | undefined {
      return raw.prepare(
        "SELECT real_run_result, fingerprint FROM project_tool_runs WHERE mode = 'real' AND tool = ? AND file_id = ? AND refresh_reason <> 'skipped' AND (real_run_result IS NOT NULL OR dry_run_result = 'no-go') ORDER BY id DESC LIMIT 1",
      ).get(tool, fileId ?? "") as { real_run_result: string | null; fingerprint: string | null } | undefined;
    },
    /** The fingerprint of the last successful real run of an invocation (RUN-20, `inputs-changed`). */
    lastSuccess(tool: string, fileId: string | undefined): string | undefined {
      return (raw.prepare(
        "SELECT fingerprint FROM project_tool_runs WHERE mode = 'real' AND tool = ? AND file_id = ? AND real_run_result = 'succeeded' ORDER BY id DESC LIMIT 1",
      ).get(tool, fileId ?? "") as { fingerprint: string } | undefined)?.fingerprint;
    },

    /** RUN-10, RUN-22 */
    recordOutput(tool: string, dataName: string, formatVersion: number, outputPath: string, fingerprint: string) {
      raw.prepare(
        "INSERT INTO project_outputs (tool, data_name, format_version, output_path, produced_at, fingerprint) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(tool, data_name, output_path) DO UPDATE SET format_version = excluded.format_version, produced_at = excluded.produced_at, fingerprint = excluded.fingerprint",
      ).run(tool, dataName, formatVersion, outputPath, now(), fingerprint);
    },
  };
}
