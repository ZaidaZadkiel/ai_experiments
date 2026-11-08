// Shared types for the Runner and the Viewer backend (01_architecture.md, "Shared library").
// Key names follow DATA-19 and the reference schema (mvp_docs/proposed_schema/, sections 5, 9, 12, 13).
// Tools never import this: they are separate programs (ARCH-02).

export type Position = { line: number; column: number };
export type Location = { file: string; start: Position; end: Position };

export type Diagnostic = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  location?: Location;
  details?: unknown;
};

// ---------------------------------------------------------------------------
// --info (DATA-08)
// ---------------------------------------------------------------------------

export type Represents = "nodes" | "relations" | "containment";

export type ParameterInfo = {
  dataName: string;
  shape?: string;
  required?: boolean;
  affectsOutput?: boolean;
  description?: string;
  whenAbsent?: string;
};

export type OutputInfo = {
  dataName: string;
  formatVersion: number;
  represents: Represents;
  containedIn?: string;
  contains?: string;
  outputFilePattern: string;
  jsonKey: string;
  fields?: Record<string, string>;
};

export type ToolInfo = {
  tool: string;
  toolVersion: string;
  invocation: "per-file" | "once";
  /** A tool that reads files states its patterns and declares `source_root`; one that reads none says `false` (toolset.md 4.2). */
  readsFiles: { filePatterns?: string[]; [extra: string]: unknown } | false;
  parameters: Record<string, ParameterInfo>;
  outputs: OutputInfo[];
  [extra: string]: unknown;
};

/** The known parameter that marks a tool reading files; every file path it uses is resolved against it (toolset.md 4.2). */
export const SOURCE_ROOT_PARAMETER = "source_root";
export const SOURCE_ROOT_DATA_NAME = "project.source_root";

// ---------------------------------------------------------------------------
// Runner events, Viewer mode (03_runner.md, event table; schema section 9)
// ---------------------------------------------------------------------------

export type RefreshReason = "missing" | "never-run" | "last-failed" | "inputs-changed" | "upstream-refresh" | "up-to-date";

export type RunnerEvent =
  | { event: "run_started"; runId: string; mode: "real" | "dry-run"; sourceRoot: string; time: string }
  | { event: "files_listed"; fileCount: number }
  | { event: "tool_skipped"; tool: string; file_id?: string; refreshReason: "up-to-date" }
  | {
      event: "tool_dry_run";
      tool: string;
      file_id?: string;
      refreshReason: RefreshReason;
      dryRun: "go" | "no-go";
      errorKind?: "run" | "invocation";
      error?: Diagnostic;
      staleInputs: string[];
    }
  | { event: "tool_run"; tool: string; file_id?: string; status: "succeeded" | "failed"; error?: Diagnostic; logPath?: string; outputChange?: string }
  | { event: "run_finished"; runId: string; outcome: "succeeded" | "failed"; exitCode: number; time: string; logPath: string }
  | { event: "run_refused"; error: Diagnostic; exitCode: number }
  | { event: "cache"; cache: RunnerCache | null };

// ---------------------------------------------------------------------------
// The Runner's cache (RUN-27; schema section 13)
// ---------------------------------------------------------------------------

export type CacheOutput = { tool: string; dataRef: string; file?: string; records: unknown[] };

export type CacheDataGroup = {
  represents: Represents;
  containedIn?: string;
  contains?: string;
  fields?: Record<string, string>;
  outputs: CacheOutput[];
};

export type CacheInvocation = {
  tool: string;
  file_id?: string;
  refreshReason: RefreshReason;
  input?: Record<string, unknown>;
  dryRun?: { dryRun: "go" | "no-go"; errorKind?: string; error?: Diagnostic; diagnostics?: Diagnostic[] };
  result?: unknown;
  skipped?: true;
};

export type DryRunDiagnostics = {
  runId: string;
  time: string;
  invocations: {
    tool: string;
    file_id?: string;
    refreshReason: RefreshReason;
    dryRun: "go" | "no-go";
    error?: Diagnostic;
    diagnostics?: Diagnostic[];
    staleInputs: string[];
  }[];
};

export type RunnerCache = {
  formatVersion: number;
  run?: {
    runId: string;
    mode: "real";
    outcome: "succeeded" | "failed";
    exitCode: number;
    started: string;
    finished: string;
    sourceRoot: string;
    logPath: string;
  };
  files?: { id: string; sourceBytes: number; sourceSha256: string }[];
  tools?: { tool: string; position: number; info: ToolInfo }[];
  invocations?: CacheInvocation[];
  data?: Record<string, CacheDataGroup>;
  dryRun?: DryRunDiagnostics;
};
