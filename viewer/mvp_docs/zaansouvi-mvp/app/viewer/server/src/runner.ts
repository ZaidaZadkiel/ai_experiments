// Calling the Runner (mvp_docs/55_viewer_backend.md, section 5; BE-40 to BE-44).
// Always a separate process with an argument array, never a shell string (ARCH-03); the source root is always explicit.

import { spawn } from "node:child_process";
import type { RunnerCache } from "../../../shared/types.ts";

export type RunnerResult = { exitCode: number | null; stderr: string; badLines: number };

/** Runs the Runner, calling onEvent for each event line as it arrives (BE-42). */
export function runRunner(launcher: string, args: string[], cwd: string, onEvent: (e: Record<string, unknown>) => void): Promise<RunnerResult> {
  return new Promise((resolve) => {
    const child = spawn(launcher, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let buffer = "";
    let stderr = "";
    let badLines = 0;
    const take = (line: string) => {
      if (line.trim() === "") return;
      try {
        const e = JSON.parse(line);
        if (e && typeof e === "object") onEvent(e as Record<string, unknown>);
        else badLines++;
      } catch {
        badLines++;
      }
    };
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      buffer += chunk;
      let i: number;
      while ((i = buffer.indexOf("\n")) >= 0) {
        take(buffer.slice(0, i));
        buffer = buffer.slice(i + 1);
      }
    });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => { if (stderr.length < 8000) stderr += chunk; });
    child.on("error", (err) => resolve({ exitCode: null, stderr: err.message, badLines }));
    child.on("close", (code) => {
      take(buffer);
      resolve({ exitCode: code, stderr: stderr.trim(), badLines });
    });
  });
}

/** `zaansouvi-run --read-cache`: the Runner's cache, or null when there is none or it can't be read (RUN-13). */
export async function readCache(launcher: string, cwd: string): Promise<RunnerCache | null> {
  let cache: RunnerCache | null = null;
  const r = await runRunner(launcher, ["--read-cache"], cwd, (e) => {
    if (e.event === "cache") cache = (e.cache as RunnerCache | null) ?? null;
  });
  return r.exitCode === 0 ? cache : null;
}
