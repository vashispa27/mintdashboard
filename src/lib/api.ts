"use client";

import { REPOS, resolvePath, type FileNode } from "@/lib/repos";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Bucket name = userId. Hardcoded until auth is wired up.
const USER_ID = process.env.NEXT_PUBLIC_USER_ID ?? "";

export interface RepoMeta {
  id: string;
  name: string;
}

function countFiles(nodes: FileNode[]): number {
  return nodes.reduce(
    (n, node) =>
      n + (node.type === "file" ? 1 : countFiles(node.children ?? [])),
    0
  );
}

const POST = (body: object) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userId: USER_ID, ...body }),
});

export async function fetchRepos(): Promise<RepoMeta[]> {
  if (USE_MOCK) {
    return REPOS.map((r) => ({ id: r.id, name: r.name }));
  }
  const res = await fetch(`${API_URL}/repos`, POST({}));
  if (!res.ok) throw new Error(`Failed to fetch repos (${res.status})`);
  return res.json();
}

export async function fetchRepoTree(repoId: string): Promise<{
  tree: FileNode[];
  totalSize: number;
  fileCount: number;
}> {
  if (USE_MOCK) {
    const repo = REPOS.find((r) => r.id === repoId);
    if (!repo) throw new Error("Repo not found");
    return {
      tree: repo.tree,
      totalSize: repo.sizeKb * 1024,
      fileCount: countFiles(repo.tree),
    };
  }
  const res = await fetch(`${API_URL}/repos/${repoId}/tree`, POST({}));
  if (!res.ok) throw new Error(`Failed to fetch repo tree (${res.status})`);
  return res.json();
}

export async function fetchFileContent(
  repoId: string,
  path: string
): Promise<{ content: string; key: string }> {
  if (USE_MOCK) {
    const repo = REPOS.find((r) => r.id === repoId);
    if (!repo) throw new Error("Repo not found");
    const node = resolvePath(repo.tree, path);
    if (!node || node.type !== "file") throw new Error("File not found");
    return { content: node.content ?? "", key: path };
  }
  const res = await fetch(`${API_URL}/repos/${repoId}/file`, POST({ path }));
  if (!res.ok) throw new Error(`Failed to fetch file (${res.status})`);
  return res.json();
}
