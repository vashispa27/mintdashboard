"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  GitCommit,
  LayoutDashboard,
  TerminalSquare,
  ListTree,
  LayoutGrid,
  Rows3,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  TreeView,
  IconView,
  ListView,
  resolveDir,
} from "@/components/repos/file-views";
import { Terminal } from "@/components/repos/terminal";
import { FileViewer } from "@/components/repos/file-viewer";
import { resolvePath, type FileNode } from "@/lib/repos";
import { fetchRepoTree } from "@/lib/api";
import { cn } from "@/lib/utils";

type ViewMode = "tree" | "icons" | "list";

const VIEW_OPTIONS: { mode: ViewMode; label: string; icon: typeof ListTree }[] =
  [
    { mode: "tree", label: "Tree", icon: ListTree },
    { mode: "icons", label: "Icons", icon: LayoutGrid },
    { mode: "list", label: "List", icon: Rows3 },
  ];

export default function RepoViewerPage() {
  const params = useParams<{ repo: string }>();
  const repoId = params.repo;

  const [tree, setTree] = useState<FileNode[]>([]);
  const [fileCount, setFileCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<ViewMode>("tree");
  const [cwd, setCwd] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchRepoTree(repoId)
      .then((data) => {
        setTree(data.tree);
        setFileCount(data.fileCount);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [repoId, refreshKey]);

  const activeView = VIEW_OPTIONS.find((v) => v.mode === view)!;
  const dirNodes = resolveDir(tree, cwd);
  const selectedNode =
    view === "tree" && selected ? resolvePath(tree, selected) : undefined;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading tree…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 text-sm text-destructive">
        <AlertCircle className="size-5" />
        {error}
        <Link href="/repos" className="mt-2 text-primary underline">
          Back to repos
        </Link>
      </div>
    );
  }

  const fileArea =
    view === "tree" ? (
      <div className="flex min-h-0 flex-1">
        <aside className="w-72 shrink-0 overflow-auto border-r bg-card">
          <TreeView
            tree={tree}
            selected={selected}
            onSelect={setSelected}
          />
        </aside>
        <div className="min-w-0 flex-1">
          <FileViewer repoId={repoId} node={selectedNode} path={selected} />
        </div>
      </div>
    ) : (
    <div className="min-h-0 flex-1 overflow-auto bg-card">
      {view === "icons" && (
        <IconView
          nodes={dirNodes}
          selected={selected}
          onSelect={setSelected}
          onOpenDir={(name) => {
            setCwd((c) => [...c, name]);
            setSelected(null);
          }}
        />
      )}
      {view === "list" && (
        <ListView
          nodes={dirNodes}
          selected={selected}
          onSelect={setSelected}
          onOpenDir={(name) => {
            setCwd((c) => [...c, name]);
            setSelected(null);
          }}
        />
      )}
    </div>
    );

  return (
    <div className="flex h-screen flex-col bg-background">
        {/* Toolbar */}
        <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2.5">
          <Button
            render={<Link href="/repos" />}
            nativeButton={false}
            variant="ghost"
            size="sm"
            className="gap-2 px-2.5"
          >
            <ArrowLeft className="size-4" />
            Repos
          </Button>

          <div className="mx-1 h-5 w-px bg-border" />

          {/* Repo identity + breadcrumb */}
          <div className="flex items-center gap-1 text-sm">
            <button
              onClick={() => setCwd([])}
              className="rounded px-2 py-1 text-base font-semibold hover:bg-muted"
            >
              {repoId}
            </button>
            {view !== "tree" &&
              cwd.map((seg, i) => (
                <span key={i} className="flex items-center gap-1">
                  <ChevronRight className="size-4 text-muted-foreground" />
                  <button
                    onClick={() => setCwd(cwd.slice(0, i + 1))}
                    className="rounded px-2 py-1 text-sm hover:bg-muted"
                  >
                    {seg}
                  </button>
                </span>
              ))}
          </div>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={loading}
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <GitCommit className="size-4" />
              Commits
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <LayoutDashboard className="size-4" />
              Dashboard
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" className="gap-2" />
                }
              >
                <activeView.icon className="size-4" />
                {activeView.label}
                <ChevronDown className="size-3.5 opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {VIEW_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.mode}
                    onClick={() => setView(opt.mode)}
                    className={cn(view === opt.mode && "bg-accent")}
                  >
                    <opt.icon className="size-4" />
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant={terminalOpen ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setTerminalOpen((v) => !v)}
            >
              <TerminalSquare className="size-4" />
              Terminal
            </Button>
          </div>
        </div>

        {/* Body */}
        {terminalOpen ? (
          <ResizablePanelGroup orientation="vertical" className="min-h-0 flex-1">
            <ResizablePanel defaultSize={65} minSize={25}>
              <div className="flex h-full flex-col">{fileArea}</div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={35} minSize={15}>
              <Terminal
                repo={repoId}
                branch="main"
                onClose={() => setTerminalOpen(false)}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">{fileArea}</div>
        )}

        {/* Status bar */}
        <div className="flex h-7 shrink-0 items-center justify-between border-t bg-muted/30 px-4 text-xs text-muted-foreground">
          <span>
            {selected ?? `${dirNodes.length} items`}
          </span>
          <span className="font-mono tabular-nums">{fileCount} files</span>
        </div>
    </div>
  );
}
