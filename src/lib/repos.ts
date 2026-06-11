export interface FileNode {
  name: string;
  type: "file" | "folder";
  size?: number; // bytes, files only
  modified?: string; // ISO
  content?: string; // file body for the viewer
  children?: FileNode[];
}

export interface Repo {
  id: string;
  name: string;
  description: string;
  branch: string;
  visibility: "private" | "public";
  language: string;
  sizeKb: number;
  modified: string; // ISO
  agent: string; // which agent owns/works this repo
  tree: FileNode[];
}

const now = "2026-06-11T09:24:00Z";

export const REPOS: Repo[] = [
  {
    id: "mint-dashboard",
    name: "mint-dashboard",
    description: "Live telemetry dashboard for agent sandboxes",
    branch: "main",
    visibility: "private",
    language: "TypeScript",
    sizeKb: 2480,
    modified: "2026-06-11T08:51:00Z",
    agent: "claude-code",
    tree: [
      {
        name: "src",
        type: "folder",
        modified: "2026-06-11T08:51:00Z",
        children: [
          {
            name: "app",
            type: "folder",
            modified: "2026-06-11T08:40:00Z",
            children: [
              {
                name: "layout.tsx",
                type: "file",
                size: 980,
                modified: "2026-06-11T08:12:00Z",
                content: `import type { Metadata } from "next";\nimport "./globals.css";\nimport { ThemeProvider } from "@/components/theme-provider";\n\nexport const metadata: Metadata = {\n  title: "Sandbox Telemetry",\n  description: "Live telemetry for agent sandboxes",\n};\n\nexport default function RootLayout({\n  children,\n}: {\n  children: React.ReactNode;\n}) {\n  return (\n    <html lang="en" suppressHydrationWarning>\n      <body>\n        <ThemeProvider attribute="class" defaultTheme="dark">\n          {children}\n        </ThemeProvider>\n      </body>\n    </html>\n  );\n}\n`,
              },
              {
                name: "page.tsx",
                type: "file",
                size: 7841,
                modified: "2026-06-11T08:51:00Z",
                content: `"use client";\n\nimport { useState } from "react";\nimport { MOCK_LOGS, LOG_LEVEL_META } from "@/lib/telemetry";\n\nconst TIME_WINDOWS = [1, 5, 10, 25] as const;\n\nexport default function Home() {\n  const [live, setLive] = useState(true);\n  const [timeWindow, setTimeWindow] = useState(5);\n\n  return (\n    <div className="flex h-screen flex-col bg-background">\n      {/* header, toolbar, and log table render here */}\n      {MOCK_LOGS.map((log) => (\n        <LogRow key={log.id} log={log} />\n      ))}\n    </div>\n  );\n}\n`,
              },
              {
                name: "globals.css",
                type: "file",
                size: 6120,
                modified: "2026-06-10T19:02:00Z",
                content: `@import "tailwindcss";\n@import "tw-animate-css";\n\n@custom-variant dark (&:is(.dark *));\n\n:root {\n  --radius: 0.625rem;\n  --background: oklch(1 0 0);\n  --primary: oklch(0.67 0.16 245);\n}\n\n.dark {\n  --background: oklch(0 0 0);\n  --primary: oklch(0.67 0.16 245);\n}\n`,
              },
            ],
          },
          {
            name: "components",
            type: "folder",
            modified: "2026-06-11T07:30:00Z",
            children: [
              { name: "theme-toggle.tsx", type: "file", size: 612, modified: "2026-06-11T07:30:00Z" },
              { name: "theme-provider.tsx", type: "file", size: 280, modified: "2026-06-11T07:28:00Z" },
            ],
          },
          {
            name: "lib",
            type: "folder",
            modified: "2026-06-11T08:20:00Z",
            children: [
              { name: "telemetry.ts", type: "file", size: 5210, modified: "2026-06-11T08:20:00Z" },
              { name: "utils.ts", type: "file", size: 166, modified: "2026-06-10T18:00:00Z" },
            ],
          },
        ],
      },
      {
        name: "package.json",
        type: "file",
        size: 842,
        modified: "2026-06-11T07:10:00Z",
        content: `{\n  "name": "mint-dashboard",\n  "private": true,\n  "scripts": {\n    "dev": "next dev",\n    "build": "next build",\n    "start": "next start"\n  },\n  "dependencies": {\n    "next": "16.2.9",\n    "react": "19.2.4",\n    "next-themes": "^0.4.6"\n  }\n}\n`,
      },
      {
        name: "tsconfig.json",
        type: "file",
        size: 602,
        modified: "2026-06-10T17:55:00Z",
        content: `{\n  "compilerOptions": {\n    "target": "ES2020",\n    "strict": true,\n    "jsx": "preserve",\n    "paths": { "@/*": ["./src/*"] }\n  },\n  "include": ["src"]\n}\n`,
      },
      {
        name: "README.md",
        type: "file",
        size: 1420,
        modified: "2026-06-10T17:40:00Z",
        content: `# mint-dashboard\n\nLive telemetry dashboard for agent sandboxes.\n\n## Getting started\n\n\`\`\`bash\nbun install\nbun run dev\n\`\`\`\n\nOpen http://localhost:3000 to view the dashboard.\n`,
      },
      {
        name: ".gitignore",
        type: "file",
        size: 310,
        modified: "2026-06-10T17:40:00Z",
        content: `node_modules\n.next\nout\n.env*.local\n*.log\n`,
      },
    ],
  },
  {
    id: "scraper-agent",
    name: "scraper-agent",
    description: "Autonomous web scraping pipeline with retry + dedupe",
    branch: "feat/proxy-pool",
    visibility: "private",
    language: "Python",
    sizeKb: 5310,
    modified: "2026-06-11T06:02:00Z",
    agent: "codex",
    tree: [
      {
        name: "scraper",
        type: "folder",
        modified: "2026-06-11T06:02:00Z",
        children: [
          { name: "__init__.py", type: "file", size: 0, modified: "2026-06-09T11:00:00Z" },
          { name: "crawler.py", type: "file", size: 8120, modified: "2026-06-11T06:02:00Z" },
          { name: "dedupe.py", type: "file", size: 3340, modified: "2026-06-10T22:10:00Z" },
          { name: "proxy_pool.py", type: "file", size: 2210, modified: "2026-06-11T05:40:00Z" },
        ],
      },
      { name: "tests", type: "folder", modified: "2026-06-10T20:00:00Z", children: [
        { name: "test_crawler.py", type: "file", size: 4100, modified: "2026-06-10T20:00:00Z" },
      ] },
      { name: "requirements.txt", type: "file", size: 240, modified: "2026-06-09T10:00:00Z" },
      { name: "README.md", type: "file", size: 980, modified: "2026-06-09T10:00:00Z" },
    ],
  },
  {
    id: "infra-bot",
    name: "infra-bot",
    description: "Terraform + k8s manifests managed by an ops agent",
    branch: "main",
    visibility: "public",
    language: "HCL",
    sizeKb: 1120,
    modified: "2026-06-10T14:33:00Z",
    agent: "claude-code",
    tree: [
      { name: "terraform", type: "folder", modified: "2026-06-10T14:33:00Z", children: [
        { name: "main.tf", type: "file", size: 5200, modified: "2026-06-10T14:33:00Z" },
        { name: "variables.tf", type: "file", size: 1800, modified: "2026-06-10T13:00:00Z" },
      ] },
      { name: "k8s", type: "folder", modified: "2026-06-10T12:00:00Z", children: [
        { name: "deployment.yaml", type: "file", size: 2100, modified: "2026-06-10T12:00:00Z" },
        { name: "service.yaml", type: "file", size: 640, modified: "2026-06-10T12:00:00Z" },
      ] },
      { name: "Makefile", type: "file", size: 420, modified: "2026-06-09T09:00:00Z" },
    ],
  },
  {
    id: "rag-pipeline",
    name: "rag-pipeline",
    description: "Embedding + retrieval service over internal docs",
    branch: "main",
    visibility: "private",
    language: "Python",
    sizeKb: 8740,
    modified: "2026-06-09T18:12:00Z",
    agent: "custom-agent",
    tree: [
      { name: "ingest.py", type: "file", size: 6200, modified: "2026-06-09T18:12:00Z" },
      { name: "retrieve.py", type: "file", size: 4400, modified: "2026-06-09T17:00:00Z" },
      { name: "embeddings", type: "folder", modified: "2026-06-09T16:00:00Z", children: [
        { name: "store.parquet", type: "file", size: 8200000, modified: "2026-06-09T16:00:00Z" },
      ] },
      { name: "config.yaml", type: "file", size: 520, modified: "2026-06-08T10:00:00Z" },
    ],
  },
  {
    id: "playground",
    name: "playground",
    description: "Scratch repo for one-off experiments",
    branch: "main",
    visibility: "private",
    language: "JavaScript",
    sizeKb: 64,
    modified: "2026-06-08T11:45:00Z",
    agent: "claude-code",
    tree: [
      { name: "index.js", type: "file", size: 1200, modified: "2026-06-08T11:45:00Z" },
      { name: "notes.md", type: "file", size: 800, modified: "2026-06-08T11:00:00Z" },
    ],
  },
];

export function getRepo(id: string): Repo | undefined {
  return REPOS.find((r) => r.id === id);
}

/** Resolve a "a/b/c.ext" path within a tree to its node. */
export function resolvePath(tree: FileNode[], path: string): FileNode | undefined {
  const segments = path.split("/").filter(Boolean);
  let nodes: FileNode[] | undefined = tree;
  let node: FileNode | undefined;
  for (const seg of segments) {
    node = nodes?.find((n) => n.name === seg);
    if (!node) return undefined;
    nodes = node.children;
  }
  return node;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

void now;
