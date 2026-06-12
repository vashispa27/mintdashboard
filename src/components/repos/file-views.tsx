"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { FileNode, formatBytes, formatDate } from "@/lib/repos";
import { FileIcon, FolderIcon } from "@/components/repos/file-icon";
import { cn } from "@/lib/utils";

function kindOf(node: FileNode): string {
  if (node.type === "folder") return "Folder";
  const ext = node.name.split(".").pop()?.toUpperCase();
  return ext ? `${ext} file` : "Document";
}

/** Resolve a cwd path (folder names) to the child nodes at that location. */
export function resolveDir(tree: FileNode[], cwd: string[]): FileNode[] {
  let nodes = tree;
  for (const segment of cwd) {
    const next = nodes.find((n) => n.name === segment && n.type === "folder");
    if (!next?.children) return [];
    nodes = next.children;
  }
  return nodes;
}

function sortNodes(nodes: FileNode[]): FileNode[] {
  return [...nodes].sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

/* ---------------------------------- Tree --------------------------------- */

export function TreeView({ tree,
  selected,
  onSelect,
}: {
  tree: FileNode[];
  selected: string | null;
  onSelect: (path: string) => void;
}) {
  return (
    <div className="py-1.5 text-sm">
      {sortNodes(tree).map((node) => (
        <TreeNode
          key={node.name}
          node={node}
          depth={0}
          path={node.name}
          selected={selected}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function TreeNode({
  node,
  depth,
  path,
  selected,
  onSelect,
}: {
  node: FileNode;
  depth: number;
  path: string;
  selected: string | null;
  onSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(depth < 1);
  const isFolder = node.type === "folder";
  const isSelected = selected === path;

  return (
    <div>
      <button
        onClick={() => {
          onSelect(path);
          if (isFolder) setOpen((v) => !v);
        }}
        className={cn(
          "group flex w-full items-center gap-2 py-1.5 pr-2 text-left transition-colors hover:bg-muted/60",
          isSelected && "bg-primary/15 hover:bg-primary/15"
        )}
        style={{ paddingLeft: depth * 16 + 8 }}
      >
        {isFolder ? (
          <ChevronRight
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-90"
            )}
          />
        ) : (
          <span className="w-4 shrink-0" />
        )}
        {isFolder ? <FolderIcon open={open} /> : <FileIcon name={node.name} />}
        <span className="truncate">{node.name}</span>
      </button>

      {isFolder && open && node.children && (
        <div>
          {sortNodes(node.children).map((child) => (
            <TreeNode
              key={child.name}
              node={child}
              depth={depth + 1}
              path={`${path}/${child.name}`}
              selected={selected}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- Icons --------------------------------- */

export function IconView({
  nodes,
  selected,
  onSelect,
  onOpenDir,
}: {
  nodes: FileNode[];
  selected: string | null;
  onSelect: (name: string) => void;
  onOpenDir: (name: string) => void;
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2 p-4">
      {sortNodes(nodes).map((node) => (
        <button
          key={node.name}
          onClick={() => onSelect(node.name)}
          onDoubleClick={() =>
            node.type === "folder" && onOpenDir(node.name)
          }
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-lg p-3 text-center transition-colors",
            selected === node.name ? "bg-primary/15" : "hover:bg-muted/50"
          )}
        >
          {node.type === "folder" ? (
            <FolderIcon className="size-12" />
          ) : (
            <FileIcon name={node.name} className="size-12" />
          )}
          <span className="line-clamp-2 text-xs leading-tight">
            {node.name}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------- List --------------------------------- */

export function ListView({
  nodes,
  selected,
  onSelect,
  onOpenDir,
}: {
  nodes: FileNode[];
  selected: string | null;
  onSelect: (name: string) => void;
  onOpenDir: (name: string) => void;
}) {
  return (
    <div className="text-sm">
      <div className="sticky top-0 flex items-center gap-3 border-b bg-card/95 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground backdrop-blur">
        <div className="flex-1">Name</div>
        <div className="w-24">Size</div>
        <div className="w-28">Kind</div>
        <div className="w-28">Modified</div>
      </div>
      {sortNodes(nodes).map((node) => (
        <button
          key={node.name}
          onClick={() => onSelect(node.name)}
          onDoubleClick={() =>
            node.type === "folder" && onOpenDir(node.name)
          }
          className={cn(
            "flex w-full items-center gap-3 border-b border-border/40 px-4 py-2 text-left transition-colors",
            selected === node.name ? "bg-primary/15" : "hover:bg-muted/40"
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {node.type === "folder" ? (
              <FolderIcon />
            ) : (
              <FileIcon name={node.name} />
            )}
            <span className="truncate">{node.name}</span>
          </div>
          <div className="w-24 text-xs text-muted-foreground">
            {node.type === "file" && node.size != null
              ? formatBytes(node.size)
              : "--"}
          </div>
          <div className="w-28 text-xs text-muted-foreground">
            {kindOf(node)}
          </div>
          <div className="w-28 text-xs text-muted-foreground">
            {node.modified ? formatDate(node.modified) : "--"}
          </div>
        </button>
      ))}
    </div>
  );
}
