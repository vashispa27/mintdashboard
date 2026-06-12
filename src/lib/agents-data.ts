/* ============================================================
   Mock telemetry data — agent sessions, logs, JSONL events.
   Ported from the Sentinel design prototype (data.js).
   Deterministic (seeded) so SSR and client render match.
   ============================================================ */

export type Status = "running" | "completed" | "failed" | "queued" | "timeout";

export interface HarnessMeta {
  label: string;
  mark: string;
  color: string;
  model: string;
}

export const HARNESSES: Record<string, HarnessMeta> = {
  "claude-code": { label: "Claude Code", mark: "C", color: "#C8643C", model: "claude-sonnet-4.5" },
  codex: { label: "Codex", mark: "Cx", color: "#10a37f", model: "gpt-5-codex" },
  gemini: { label: "Gemini CLI", mark: "G", color: "#4285f4", model: "gemini-2.5-pro" },
  aider: { label: "Aider", mark: "Ai", color: "#5b53d6", model: "claude-sonnet-4.5" },
  cursor: { label: "Cursor", mark: "Cu", color: "#111114", model: "composer-1" },
  custom: { label: "Custom", mark: "{}", color: "#6b6b73", model: "internal-harness" },
};

export interface Session {
  id: string;
  harness: string;
  status: Status;
  repo: string;
  branch: string;
  task: string;
  startedAt: number;
  duration: number;
  timeout: number | null;
  fsPath: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  toolCalls: number;
  cpu: number;
  mem: number;
  memCap: number;
  exitCode: number | null;
  node: string;
}

const REPOS = ["mint", "swiftace", "ledger-api", "atlas-web", "harbor", "pinventory"];
const TASKS = [
  "Refactor auth middleware to use the new token store",
  "Add availability checks across the Swift codebase",
  "Fix flaky integration tests in CI pipeline",
  "Migrate Postgres schema to support multi-tenant rows",
  "Implement JSONL telemetry exporter for sandbox runs",
  "Wire up the file-preview pane for markdown + images",
  "Resolve 14 type errors after the React 18 upgrade",
  "Generate OpenAPI client and replace fetch calls",
  "Audit and patch dependency CVEs flagged by scanner",
  "Add retry + backoff to the webhook dispatcher",
  "Port the billing cron job to the worker queue",
  "Build the agents overview grid and status badges",
];
const BRANCHES = ["main", "feat/token-store", "fix/ci-flakes", "agent/ses-run", "chore/deps", "feat/telemetry"];
const STATUSES: Status[] = [
  "running", "running", "running", "running", "completed", "completed",
  "completed", "completed", "failed", "queued", "timeout",
];

/* ---- deterministic seeded PRNG (mulberry32) ---- */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260612);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const ri = (a: number, b: number) => Math.floor(a + rand() * (b - a));
function rid(n: number) {
  const a = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < n; i++) s += a[Math.floor(rand() * a.length)];
  return s;
}

/* A fixed "now" so durations/percentages are stable between renders. */
export const NOW = 1781280000000; // 2026-06-12 ~04:00 UTC

const hkeys = Object.keys(HARNESSES);

function buildSessions(): Session[] {
  const out: Session[] = [];
  for (let i = 0; i < 28; i++) {
    const harness = pick(hkeys);
    const status: Status = i < 9 ? "running" : pick(STATUSES);
    const repo = pick(REPOS);
    const startedAgo = ri(20, 60 * 80) * 1000;
    const startedAt = NOW - startedAgo;
    const isRunning = status === "running" || status === "queued";
    const duration = status === "queued" ? 0 : isRunning ? startedAgo : ri(35, 3600) * 1000;
    const hasTimeout = rand() > 0.4;
    const timeout = hasTimeout ? pick([900, 1800, 3600, 7200]) : null;
    const id = "ses_" + rid(6);
    const tokIn = ri(8, 240) * 1000;
    const tokOut = ri(3, 80) * 1000;
    out.push({
      id,
      harness,
      status,
      repo,
      branch: pick(BRANCHES),
      task: pick(TASKS),
      startedAt,
      duration,
      timeout,
      fsPath: `/sandbox/runs/${id}/${repo}`,
      model: HARNESSES[harness].model,
      tokensIn: tokIn,
      tokensOut: tokOut,
      cost: +(((tokIn / 1e6) * 3 + (tokOut / 1e6) * 15)).toFixed(2),
      toolCalls: status === "queued" ? 0 : ri(4, 380),
      cpu: isRunning ? ri(6, 92) : 0,
      mem: isRunning ? ri(180, 1450) : 0,
      memCap: 2048,
      exitCode:
        status === "completed" ? 0 : status === "failed" ? ri(1, 137) : status === "timeout" ? 124 : null,
      node: `sbx-${ri(1, 9)}.${pick(["us-east", "us-west", "eu-cen"])}`,
    });
  }
  // stable, recognizable session pinned to the top (matches screenshot repo "mint")
  out.unshift({
    id: "ses_kak3vk",
    harness: "claude-code",
    status: "running",
    repo: "mint",
    branch: "feat/telemetry",
    task: "Implement JSONL telemetry exporter for sandbox runs",
    startedAt: NOW - 7 * 60 * 1000 - 12 * 1000,
    duration: 7 * 60 * 1000 + 12 * 1000,
    timeout: 1800,
    fsPath: "/sandbox/runs/ses_kak3vk/mint",
    model: "claude-sonnet-4.5",
    tokensIn: 184320,
    tokensOut: 41980,
    cost: 1.18,
    toolCalls: 96,
    cpu: 38,
    mem: 612,
    memCap: 2048,
    exitCode: null,
    node: "sbx-3.us-east",
  });
  return out;
}

export const SESSIONS: Session[] = buildSessions();

export function getSession(id: string): Session | undefined {
  return SESSIONS.find((s) => s.id === id);
}

/* ---- live log line templates (used to stream) ---- */
export interface LogTemplate {
  t: "think" | "tool" | "bash" | "out" | "warn" | "err";
  text: string;
  meta?: string;
}

export const LOG_TEMPLATES: LogTemplate[] = [
  { t: "think", text: "Planning approach: read the exporter module, then map event schema to JSONL." },
  { t: "tool", text: "read_file", meta: "src/telemetry/exporter.ts" },
  { t: "bash", text: '$ rg -n "writeEvent" src/telemetry' },
  { t: "out", text: "src/telemetry/exporter.ts:42:  writeEvent(ev: AgentEvent) {" },
  { t: "tool", text: "edit_file", meta: "src/telemetry/exporter.ts  (+18 −4)" },
  { t: "bash", text: "$ pnpm tsc --noEmit" },
  { t: "out", text: "Found 0 errors. Watching for file changes." },
  { t: "tool", text: "bash", meta: "pnpm vitest run telemetry" },
  { t: "out", text: "✓ exporter > emits one JSON object per line (12ms)" },
  { t: "out", text: "✓ exporter > flushes buffer on SIGTERM (8ms)" },
  { t: "think", text: "Tests pass. Adding a manual upload fallback for offline runs." },
  { t: "tool", text: "write_file", meta: "src/ui/JsonlUpload.tsx" },
  { t: "warn", text: "Large file (4.2 MB) — streaming parse instead of JSON.parse." },
  { t: "bash", text: '$ git add -A && git commit -m "telemetry: jsonl exporter"' },
  { t: "out", text: "[feat/telemetry 9f3a1c2] telemetry: jsonl exporter — 4 files changed" },
  { t: "tool", text: "grep", meta: 'pattern="AgentEvent"  path=src/' },
];

/* ---- JSONL events (post-run artifact) ---- */
export interface JsonlEvent {
  ts?: string;
  type: string;
  [key: string]: unknown;
}

export function makeJsonl(): JsonlEvent[] {
  const events: JsonlEvent[] = [];
  let ts = NOW - 7 * 60 * 1000;
  const jr = mulberry32(7);
  const push = (e: { type: string; [k: string]: unknown }) => {
    events.push({ ts: new Date(ts).toISOString(), ...e } as JsonlEvent);
    ts += Math.floor(400 + jr() * 3800);
  };
  push({ type: "session.start", session: "ses_kak3vk", harness: "claude-code", model: "claude-sonnet-4.5", repo: "mint", cwd: "/sandbox/runs/ses_kak3vk/mint" });
  push({ type: "message", role: "user", content: "Implement a JSONL telemetry exporter for sandbox runs. One event per line." });
  push({ type: "message", role: "assistant", content: "I'll start by reading the existing exporter module to understand the event schema." });
  push({ type: "tool_use", name: "read_file", input: { path: "src/telemetry/exporter.ts" }, id: "toolu_01a" });
  push({ type: "tool_result", tool: "read_file", id: "toolu_01a", ok: true, bytes: 3841, preview: "export class Exporter { writeEvent(ev: AgentEvent) { ... } }" });
  push({ type: "message", role: "assistant", content: "The exporter buffers events. I'll add a JSONL sink that appends one serialized object per line and flushes on exit." });
  push({ type: "tool_use", name: "edit_file", input: { path: "src/telemetry/exporter.ts", diff: "+18 −4" }, id: "toolu_02b" });
  push({ type: "tool_result", tool: "edit_file", id: "toolu_02b", ok: true, applied: true });
  push({ type: "tool_use", name: "bash", input: { cmd: "pnpm tsc --noEmit" }, id: "toolu_03c" });
  push({ type: "tool_result", tool: "bash", id: "toolu_03c", ok: true, exit: 0, stdout: "Found 0 errors." });
  push({ type: "tool_use", name: "bash", input: { cmd: "pnpm vitest run telemetry" }, id: "toolu_04d" });
  push({ type: "tool_result", tool: "bash", id: "toolu_04d", ok: true, exit: 0, stdout: "2 passed (20ms)" });
  push({ type: "message", role: "assistant", content: "Tests pass. The exporter now writes valid JSONL. Committing the change." });
  push({ type: "tool_use", name: "bash", input: { cmd: "git commit -am 'telemetry: jsonl exporter'" }, id: "toolu_05e" });
  push({ type: "tool_result", tool: "bash", id: "toolu_05e", ok: true, exit: 0, stdout: "[feat/telemetry 9f3a1c2] 4 files changed, 132 insertions(+)" });
  push({ type: "usage", input_tokens: 184320, output_tokens: 41980, cost_usd: 1.18 });
  push({ type: "session.end", status: "completed", exit: 0, duration_ms: 432000 });
  return events;
}

/* ---- formatting helpers ---- */
export function fmtDur(ms: number): string {
  if (!ms) return "0s";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${ss}s`;
  return `${ss}s`;
}
export function fmtAgo(ts: number, now: number = Date.now()): string {
  const s = Math.floor((now - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
export function fmtTok(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
  return "" + n;
}
export function fmtClock(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
export const STATUS_LABEL: Record<string, string> = {
  running: "Running", completed: "Completed", failed: "Failed", queued: "Queued", timeout: "Timed out",
};
