"use client";

import { FileCode2 } from "lucide-react";
import { FileNode, formatBytes, formatDate } from "@/lib/repos";
import { FileIcon } from "@/components/repos/file-icon";

export function FileViewer({
  node,
  path,
}: {
  node: FileNode | undefined;
  path: string | null;
}) {
  if (!node || node.type === "folder") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
        <FileCode2 className="size-8 opacity-30" />
        <p className="text-sm">
          {node?.type === "folder"
            ? "Select a file to preview its contents"
            : "Select a file from the tree"}
        </p>
      </div>
    );
  }

  const lines = (node.content ?? "").replace(/\n$/, "").split("\n");

  return (
    <div className="flex h-full flex-col bg-background">
      {/* File header */}
      <div className="flex shrink-0 items-center gap-2 border-b bg-card/40 px-4 py-2">
        <FileIcon name={node.name} />
        <span className="font-mono text-sm">{path ?? node.name}</span>
        <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          {node.size != null && <span>{formatBytes(node.size)}</span>}
          {node.modified && <span>{formatDate(node.modified)}</span>}
        </span>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-auto">
        {node.content ? (
          <pre className="flex min-w-max font-mono text-xs leading-relaxed">
            <code className="select-none border-r bg-muted/20 px-3 py-3 text-right text-muted-foreground/60">
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </code>
            <code className="px-4 py-3 text-foreground/90">
              {lines.map((line, i) => (
                <div key={i} className="whitespace-pre">
                  {line || " "}
                </div>
              ))}
            </code>
          </pre>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No preview available for this file type
          </div>
        )}
      </div>
    </div>
  );
}
