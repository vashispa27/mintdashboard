export type LogLevel = "info" | "tool" | "error" | "success";

export interface LogEntry {
  id: string;
  level: LogLevel;
  summary: string;
  timestamp: string; // ISO
  raw: Record<string, unknown>; // full JSONL line, arbitrary shape
}

export const LOG_LEVEL_META: Record<
  LogLevel,
  { label: string; className: string }
> = {
  info: {
    label: "info",
    className: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
  tool: {
    label: "tool",
    className: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
  success: {
    label: "success",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  error: {
    label: "error",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

export const MOCK_LOGS: LogEntry[] = [
  {
    id: "1",
    level: "info",
    summary: "Session started · harness=claude-code model=opus-4.8",
    timestamp: "2026-06-11T14:02:01.120Z",
    raw: {
      type: "session.start",
      session_id: "sess-01",
      harness: "claude-code",
      model: "claude-opus-4-8",
      cwd: "/sandbox/workspace",
      git_branch: "main",
      env: { CI: false, BUN_VERSION: "1.3.14" },
    },
  },
  {
    id: "2",
    level: "info",
    summary: "User prompt received (1.2k tokens)",
    timestamp: "2026-06-11T14:02:01.890Z",
    raw: {
      type: "message.user",
      tokens: 1243,
      content: "add a dropdown on each log row to view the full payload",
    },
  },
  {
    id: "3",
    level: "tool",
    summary: "Read(src/app/page.tsx) → 248 lines",
    timestamp: "2026-06-11T14:02:03.410Z",
    raw: {
      type: "tool.call",
      tool: "Read",
      input: { file_path: "src/app/page.tsx" },
      result: { lines: 248, bytes: 7841, truncated: false },
      duration_ms: 38,
    },
  },
  {
    id: "4",
    level: "tool",
    summary: 'Grep("useState", glob=src/**/*.tsx) → 6 matches',
    timestamp: "2026-06-11T14:02:04.002Z",
    raw: {
      type: "tool.call",
      tool: "Grep",
      input: { pattern: "useState", glob: "src/**/*.tsx", output_mode: "files_with_matches" },
      result: { matches: 6, files: ["src/app/page.tsx", "src/components/theme-toggle.tsx"] },
      duration_ms: 21,
    },
  },
  {
    id: "5",
    level: "tool",
    summary: "Bash(bun run build) running…",
    timestamp: "2026-06-11T14:02:05.770Z",
    raw: {
      type: "tool.call",
      tool: "Bash",
      input: { command: "bun run build", timeout_ms: 120000 },
      status: "running",
      pid: 48213,
    },
  },
  {
    id: "6",
    level: "error",
    summary: "Bash exited 1 · Type error in telemetry.ts:42",
    timestamp: "2026-06-11T14:02:09.330Z",
    raw: {
      type: "tool.result",
      tool: "Bash",
      exit_code: 1,
      stderr: "src/lib/telemetry.ts:42:7 - error TS2322: Type 'string' is not assignable to type 'LogLevel'.",
      duration_ms: 3551,
    },
  },
  {
    id: "7",
    level: "info",
    summary: "Reflecting on build failure, planning fix",
    timestamp: "2026-06-11T14:02:10.110Z",
    raw: {
      type: "message.assistant",
      tokens: 412,
      content: "The build failed because the level field is widened to string. I'll cast it to LogLevel.",
    },
  },
  {
    id: "8",
    level: "tool",
    summary: "Edit(src/lib/telemetry.ts) → 1 hunk applied",
    timestamp: "2026-06-11T14:02:12.640Z",
    raw: {
      type: "tool.call",
      tool: "Edit",
      input: { file_path: "src/lib/telemetry.ts", hunks: 1 },
      result: { applied: true, additions: 1, deletions: 1 },
      duration_ms: 12,
    },
  },
  {
    id: "9",
    level: "tool",
    summary: "Bash(bun run build) running…",
    timestamp: "2026-06-11T14:02:13.900Z",
    raw: {
      type: "tool.call",
      tool: "Bash",
      input: { command: "bun run build", timeout_ms: 120000 },
      status: "running",
      pid: 48390,
    },
  },
  {
    id: "10",
    level: "success",
    summary: "Build passed in 4.1s · 0 errors",
    timestamp: "2026-06-11T14:02:18.020Z",
    raw: {
      type: "tool.result",
      tool: "Bash",
      exit_code: 0,
      stdout: "✓ Compiled successfully in 4.1s\n✓ Generating static pages (4/4)",
      duration_ms: 4118,
    },
  },
  {
    id: "11",
    level: "info",
    summary: "Writing summary to user",
    timestamp: "2026-06-11T14:02:18.540Z",
    raw: { type: "message.assistant", tokens: 188, content: "Build is green. Wiring up the changelog next." },
  },
  {
    id: "12",
    level: "tool",
    summary: "Write(CHANGELOG.md) → 34 lines",
    timestamp: "2026-06-11T14:02:20.180Z",
    raw: {
      type: "tool.call",
      tool: "Write",
      input: { file_path: "CHANGELOG.md" },
      result: { lines: 34, created: true },
      duration_ms: 9,
    },
  },
  {
    id: "13",
    level: "info",
    summary: "Turn complete · 14.2s · 8.4k tokens",
    timestamp: "2026-06-11T14:02:20.910Z",
    raw: {
      type: "turn.end",
      duration_ms: 14210,
      tokens: { input: 6201, output: 2233, total: 8434 },
      tool_calls: 6,
    },
  },
];
