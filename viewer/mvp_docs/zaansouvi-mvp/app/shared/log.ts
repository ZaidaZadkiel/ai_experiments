// The shared log format (DATA-16), used by the Runner and read by the Viewer backend:
//   <ISO time>\t<level>\t<event>\t<JSON details>
//   # [type] free text        (comments: a reader can drop them and lose no fact)

import fs from "node:fs";
import path from "node:path";

export type LogLevel = "info" | "warn" | "error";

export type Log = {
  path: string;
  entry: (level: LogLevel, event: string, details?: Record<string, unknown>) => void;
  comment: (type: string, text: string) => void;
};

/** Appends to `file`, creating its folder. Each line is written at once, so the log can be read while it grows. */
export function openLog(file: string): Log {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const write = (line: string) => fs.appendFileSync(file, line + "\n");
  return {
    path: file,
    entry: (level, event, details = {}) => write(`${new Date().toISOString()}\t${level}\t${event}\t${JSON.stringify(details)}`),
    comment: (type, text) => write(`# [${type}] ${text.replace(/\n/g, " ")}`),
  };
}

/** A log that writes nothing, for runs that must leave no trace (an invocation refused before it starts). */
export const nullLog: Log = { path: "", entry: () => {}, comment: () => {} };

export type LogEntry = { time: string; level: LogLevel; event: string; details: Record<string, unknown> };

/** Reads the entries of a log, dropping comment lines (DATA-16). Lines that don't parse are skipped. */
export function readLog(text: string): LogEntry[] {
  const entries: LogEntry[] = [];
  for (const line of text.split("\n")) {
    if (line === "" || line.startsWith("#")) continue;
    const [time, level, event, json] = line.split("\t");
    try {
      entries.push({ time, level: level as LogLevel, event, details: json ? JSON.parse(json) : {} });
    } catch {
      // not an entry in the shared format
    }
  }
  return entries;
}
