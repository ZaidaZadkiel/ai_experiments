// Small file helpers shared by the Runner and the Viewer backend.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const sha256 = (data: Buffer | string) => crypto.createHash("sha256").update(data).digest("hex");

/** Writes to a temporary name, then renames, so a reader never sees a half-written file. */
export function writeAtomic(file: string, content: string) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
}

/** Parses a JSON file; undefined when it is missing or not valid JSON. */
export function readJson(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
}

/** JSON with object keys sorted at every depth, so equal values always give the same text (RUN-20). */
export function canonicalJson(value: unknown): string {
  const sort = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === "object") {
      return Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, sort((v as Record<string, unknown>)[k])]));
    }
    return v;
  };
  return JSON.stringify(sort(value));
}
