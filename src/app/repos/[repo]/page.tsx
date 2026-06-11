"use client";

import { useState } from "react";
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
import { getRepo, resolvePath } from "@/lib/repos";
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
  const repo = getRepo(params.repo);

  const [view, setView] = useState<ViewMode>("tree");
  const [cwd, setCwd] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);

  if (!repo) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-black text-muted-foreground">
        <p>Repo not found.</p>
        <Link href="/repos" className="text-primary underline">
          Back to repos
        </Link>
      </div>
    );
  }

  const activeView = VIEW_OPTIONS.find((v) => v.mode === view)!;
  const dirNodes = resolveDir(repo.tree, cwd);
  const selectedNode =
    view === "tree" && selected ? resolvePath(repo.tree, selected) : undefined;

  const fileArea =
    view === "tree" ? (
      <div className="flex min-h-0 flex-1">
        <aside className="w-64 shrink-0 overflow-auto border-r bg-card">
          <TreeView
            tree={repo.tree}
            selected={selected}
            onSelect={setSelected}
          />
        </aside>
        <div className="min-w-0 flex-1">
          <FileViewer node={selectedNode} path={selected} />
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
        <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
          <Button
            render={<Link href="/repos" />}
            nativeButton={false}
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2"
          >
            <ArrowLeft className="size-4" />
            Repos
          </Button>

          <div className="mx-1 h-5 w-px bg-border" />

          {/* Repo identity + breadcrumb */}
          <div className="flex items-center gap-1 text-sm">
            <button
              onClick={() => setCwd([])}
              className="rounded px-1.5 py-0.5 font-semibold hover:bg-muted"
            >
              {repo.name}
            </button>
            <GitBranch className="size-3 text-muted-foreground" />
            <span className="mr-1 font-mono text-xs text-muted-foreground">
              {repo.branch}
            </span>
            {view !== "tree" &&
              cwd.map((seg, i) => (
                <span key={i} className="flex items-center gap-1">
                  <ChevronRight className="size-3.5 text-muted-foreground" />
                  <button
                    onClick={() => setCwd(cwd.slice(0, i + 1))}
                    className="rounded px-1.5 py-0.5 hover:bg-muted"
                  >
                    {seg}
                  </button>
                </span>
              ))}
          </div>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5">
              <GitCommit className="size-4" />
              Commits
            </Button>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5">
              <LayoutDashboard className="size-4" />
              Dashboard
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" className="h-8 gap-1.5" />
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
              className="h-8 gap-1.5"
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
                repo={repo.name}
                branch={repo.branch}
                onClose={() => setTerminalOpen(false)}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">{fileArea}</div>
        )}

        {/* Status bar */}
        <div className="flex h-6 shrink-0 items-center justify-between border-t bg-muted/30 px-3 text-[11px] text-muted-foreground">
          <span>
            {selected ? selected : `${dirNodes.length} items`}
          </span>
          <span className="font-mono">{repo.language}</span>
        </div>
    </div>
  );
}
