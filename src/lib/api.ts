"use client";

import { REPOS, resolvePath, type FileNode } from "@/lib/repos";
import { SESSIONS, type Session, type Status } from "@/lib/agents-data";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const USER_ID = process.env.NEXT_PUBLIC_USER_ID ?? "";

export interface RepoMeta {
  id: string;
  name: string;
}

function countFiles(nodes: FileNode[]): number {
  return nodes.reduce(
    (n, node) => n + (node.type === "file" ? 1 : countFiles(node.children ?? [])),
    0
  );
}

async function post<T>(path: string, body: object = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID, ...body }),
  });
  if (!res.ok) throw new Error(`${path} failed (${res.status})`);
  return res.json();
}

// ── Repos ─────────────────────────────────────────────────────────────────────

export async function fetchRepos(): Promise<RepoMeta[]> {
  if (USE_MOCK) return REPOS.map((r) => ({ id: r.id, name: r.name }));
  return post<RepoMeta[]>("/repos");
}

export async function fetchRepoTree(repoId: string): Promise<{ tree: FileNode[]; totalSize: number; fileCount: number }> {
  if (USE_MOCK) {
    const repo = REPOS.find((r) => r.id === repoId);
    if (!repo) throw new Error("Repo not found");
    return { tree: repo.tree, totalSize: repo.sizeKb * 1024, fileCount: countFiles(repo.tree) };
  }
  return post(`/repos/${repoId}/tree`);
}

export async function fetchFileContent(repoId: string, path: string): Promise<{ content: string; key: string }> {
  if (USE_MOCK) {
    const repo = REPOS.find((r) => r.id === repoId);
    if (!repo) throw new Error("Repo not found");
    const node = resolvePath(repo.tree, path);
    if (!node || node.type !== "file") throw new Error("File not found");
    return { content: node.content ?? "", key: path };
  }
  return post(`/repos/${repoId}/file`, { path });
}

// ── Sessions ──────────────────────────────────────────────────────────────────

// Normalise a raw DynamoDB record into the Session shape the UI expects.
// Streaming fields (tokens, cost, toolCalls, cpu, mem) are 0 until IoT wires them up.
function normalizeSession(raw: Record<string, unknown>): Session {
  return {
    id:        (raw.sessionId as string) ?? "",
    harness:   (raw.harness   as string) ?? "custom",
    status:    (raw.status    as Status) ?? "queued",
    repo:      (raw.repo      as string) ?? "",
    branch:    (raw.branch    as string) ?? "",
    task:      (raw.task      as string) ?? "",
    startedAt: (raw.startedAt as number) ?? 0,
    duration:  (raw.duration  as number) ?? 0,
    timeout:   (raw.timeout   as number) ?? null,
    fsPath:    (raw.fsPath    as string) ?? "",
    model:     (raw.model     as string) ?? "",
    node:      (raw.node      as string) ?? "",
    memCap:    (raw.memCap    as number) ?? 2048,
    exitCode:  raw.exitCode != null ? (raw.exitCode as number) : null,
    // streaming fields — not available until IoT phase
    tokensIn:  0,
    tokensOut: 0,
    cost:      0,
    toolCalls: 0,
    cpu:       0,
    mem:       0,
  };
}

export async function fetchSessions(): Promise<Session[]> {
  if (USE_MOCK) return SESSIONS;
  const data = await post<{ sessions: Record<string, unknown>[] }>("/sessions/list");
  return data.sessions.map(normalizeSession);
}

export async function fetchSession(sessionId: string): Promise<Session | undefined> {
  if (USE_MOCK) return SESSIONS.find((s) => s.id === sessionId);
  try {
    const data = await post<{ session: Record<string, unknown> }>("/sessions/get", { sessionId });
    return normalizeSession(data.session);
  } catch {
    return undefined;
  }
}

// ── Node process helpers (called from agent harness, not the dashboard) ───────

export async function sessionStart(params: {
  sessionId: string;
  harness: string;
  repo: string;
  branch: string;
  task: string;
  model: string;
  node: string;
  fsPath: string;
  timeout?: number;
  memCap?: number;
}): Promise<void> {
  await post("/sessions/start", params);
}

export async function sessionEnd(params: {
  sessionId: string;
  status: Status;
  exitCode?: number;
}): Promise<void> {
  await post("/sessions/end", params);
}
