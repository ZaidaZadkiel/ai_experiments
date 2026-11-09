// The activity log (mvp_docs/55_viewer_backend.md, section 10; VIEW-17; 50_viewer_ui.md, UI-62 to UI-72).
//
// One file, data/viewer/activity.log, in the shared log format (DATA-16): <time> TAB <level> TAB <event> TAB <JSON details>,
// every entry's details holding verbosity, actor and text (reference schema, section 15). Only one backend uses the
// file, so it may be deleted and recreated at any time: each entry opens, appends and closes it (BE-81). The session's
// entries are also kept in memory, for the live stream (BE-70).

import fs from "node:fs";
import path from "node:path";

export type Verbosity = "minimal" | "normal" | "verbose";
export type Actor = "user" | "app";
export type Level = "info" | "warn" | "error";

export type ActivityEntry = {
  time: string;
  level: Level;
  event: string;
  verbosity: Verbosity;
  actor: Actor;
  text: string;
  [fact: string]: unknown;
};

export class Activity {
  readonly entries: ActivityEntry[] = [];
  private listeners = new Set<(kind: "entry" | "cleared", e?: ActivityEntry) => void>();

  private readonly file: string;
  // No parameter properties: Node's type stripping doesn't support them.
  constructor(file: string) {
    this.file = file;
  }

  private append(line: string) {
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.appendFileSync(this.file, line + "\n");
    } catch (e) {
      // The log must never stop the server (BE-61); say so once on standard error.
      process.stderr.write(`zaansouvi-view: can't write ${this.file}: ${(e as Error).message}\n`);
    }
  }

  comment(type: string, text: string) {
    this.append(`# [${type}] ${text.replace(/\n/g, " ")}`);
  }

  log(level: Level, event: string, verbosity: Verbosity, actor: Actor, text: string, facts: Record<string, unknown> = {}) {
    const time = new Date().toISOString();
    const entry: ActivityEntry = { time, level, event, verbosity, actor, text, ...facts };
    this.entries.push(entry);
    this.append(`${time}\t${level}\t${event}\t${JSON.stringify({ verbosity, actor, text, ...facts })}`);
    for (const l of this.listeners) l("entry", entry);
    return entry;
  }

  /** Clear (UI-72): deletes the file and the session's entries; the next entry starts the file again. */
  clear() {
    try {
      fs.rmSync(this.file, { force: true });
    } catch {
      // nothing to do: it may already be gone
    }
    this.entries.length = 0;
    for (const l of this.listeners) l("cleared");
    this.log("info", "log_cleared", "normal", "user", "You cleared the log");
  }

  subscribe(listener: (kind: "entry" | "cleared", e?: ActivityEntry) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
