"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { I } from "@/components/sentinel/icons";
import { fetchRepoTree, fetchFileContent } from "@/lib/api";
import type { FileNode } from "@/lib/repos";

const IMG_EXT = ["png", "jpg", "jpeg", "gif", "webp", "svg", "ico", "bmp"];
const MD_EXT = ["md", "markdown"];

function extOf(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}
function kindOf(node: FileNode): "dir" | "img" | "md" | "json" | "code" {
  if (node.type === "folder") return "dir";
  const e = extOf(node.name);
  if (IMG_EXT.includes(e)) return "img";
  if (MD_EXT.includes(e)) return "md";
  if (e === "json") return "json";
  return "code";
}
function fileIcon(node: FileNode) {
  const k = kindOf(node);
  if (k === "dir") return <I.folder size={16} style={{ color: "var(--accent)" }} />;
  if (k === "img") return <I.image size={15} style={{ color: "#d6489a" }} />;
  if (k === "md") return <I.file size={15} style={{ color: "var(--text-3)" }} />;
  if (k === "json") return <I.fileCode size={15} style={{ color: "#c2920a" }} />;
  return <I.fileCode size={15} style={{ color: "var(--text-3)" }} />;
}

function sortNodes(nodes: FileNode[]): FileNode[] {
  return [...nodes].sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

interface Selected {
  node: FileNode;
  path: string;
}

export default function RepoBrowserPage() {
  const params = useParams<{ repo: string }>();
  const router = useRouter();
  const repoId = params.repo;

  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sel, setSel] = useState<Selected | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchRepoTree(repoId)
      .then((data) => setTree(data.tree))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [repoId, refreshKey]);

  const toggle = (path: string) => setOpen((o) => ({ ...o, [path]: !o[path] }));
  const back = () => router.push("/repos");

  return (
    <div className="main">
      <div className="topbar">
        <button className="icon-btn" onClick={back} title="Back to repos"><I.back size={17} /></button>
        <div className="crumb">
          <span className="link" onClick={back}>Repos</span>
          <span className="sep"><I.chevR size={13} /></span>
          <span className="now" style={{ fontWeight: 650 }}>{repoId}</span>
        </div>
        <div style={{ flex: 1 }}></div>
        <button className="icon-btn" title="Refresh" onClick={() => setRefreshKey((k) => k + 1)} disabled={loading}>
          <I.refresh size={16} />
        </button>
      </div>

      <div className="browser">
        <div className="tree">
          {loading && <div className="empty" style={{ padding: 40 }}><I.refresh size={22} />Loading…</div>}
          {error && <div className="empty" style={{ padding: 40, color: "var(--fail)" }}><I.repo size={22} />{error}</div>}
          {!loading && !error && sortNodes(tree).map((node) => (
            <TreeNode
              key={node.name}
              node={node}
              depth={0}
              path={node.name}
              open={open}
              toggle={toggle}
              sel={sel}
              onSelect={setSel}
            />
          ))}
        </div>
        <FilePreview repoId={repoId} sel={sel} />
      </div>
    </div>
  );
}

function TreeNode({
  node,
  depth,
  path,
  open,
  toggle,
  sel,
  onSelect,
}: {
  node: FileNode;
  depth: number;
  path: string;
  open: Record<string, boolean>;
  toggle: (path: string) => void;
  sel: Selected | null;
  onSelect: (s: Selected) => void;
}) {
  const isDir = node.type === "folder";
  const isOpen = isDir && open[path];
  const selected = sel?.path === path;
  return (
    <>
      <button
        className={"tnode" + (selected ? " sel" : "")}
        style={{ paddingLeft: 10 + depth * 16 }}
        onClick={() => (isDir ? toggle(path) : onSelect({ node, path }))}
      >
        <span className="tn-chev" style={{ transform: isOpen ? "rotate(90deg)" : "none", visibility: isDir ? "visible" : "hidden" }}>
          <I.chevR size={12} />
        </span>
        {isDir ? (
          isOpen ? <I.folderOpen size={16} style={{ color: "var(--accent)" }} /> : <I.folder size={16} style={{ color: "var(--accent)" }} />
        ) : (
          fileIcon(node)
        )}
        <span className="tn-name">{node.name}</span>
      </button>
      {isDir && isOpen && node.children &&
        sortNodes(node.children).map((c) => (
          <TreeNode
            key={c.name}
            node={c}
            depth={depth + 1}
            path={`${path}/${c.name}`}
            open={open}
            toggle={toggle}
            sel={sel}
            onSelect={onSelect}
          />
        ))}
    </>
  );
}

function FilePreview({ repoId, sel }: { repoId: string; sel: Selected | null }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isImg = sel ? kindOf(sel.node) === "img" : false;

  useEffect(() => {
    if (!sel || sel.node.type !== "file" || isImg) {
      setContent(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetchFileContent(repoId, sel.path)
      .then((d) => setContent(d.content))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [repoId, sel, isImg]);

  if (!sel) {
    return (
      <div className="preview empty">
        <I.code size={34} />
        <div>Select a file to preview its contents</div>
      </div>
    );
  }

  if (isImg) {
    return (
      <div className="preview">
        <PreviewHead node={sel.node} />
        <div className="preview-img">
          <div className="img-placeholder">
            <I.image size={40} />
            <div className="mono" style={{ fontSize: 12, marginTop: 8 }}>{sel.node.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>image preview</div>
          </div>
        </div>
      </div>
    );
  }

  const isMd = kindOf(sel.node) === "md";

  return (
    <div className="preview">
      <PreviewHead node={sel.node} />
      <div className="preview-body">
        {loading && <div className="empty" style={{ padding: 40 }}><I.refresh size={22} />Loading…</div>}
        {error && <div className="empty" style={{ padding: 40, color: "var(--fail)" }}>{error}</div>}
        {!loading && !error && content !== null && (
          isMd ? <div className="md">{renderMarkdown(content)}</div> : <pre className="code-view mono">{content}</pre>
        )}
      </div>
    </div>
  );
}

function PreviewHead({ node }: { node: FileNode }) {
  return (
    <div className="preview-head">
      <span className="ph-name">
        {fileIcon(node)}
        <span className="mono">{node.name}</span>
      </span>
      <div style={{ flex: 1 }}></div>
      <button className="btn ghost sm"><I.copy size={13} />Copy</button>
      <button className="btn ghost sm"><I.down size={13} />Download</button>
    </div>
  );
}

/* tiny markdown renderer (headings, bold, code, hr, quote, lists) */
function renderMarkdown(src: string): ReactNode[] {
  const lines = src.split("\n");
  const out: ReactNode[] = [];
  let inCode = false;
  let code: string[] = [];
  let key = 0;
  const inline = (t: string): ReactNode[] => {
    const parts: ReactNode[] = [];
    const re = /(\*\*[^*]+\*\*)|(`[^`]+`)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(t))) {
      if (m.index > last) parts.push(t.slice(last, m.index));
      if (m[1]) parts.push(<b key={m.index}>{m[1].slice(2, -2)}</b>);
      else parts.push(<code key={m.index} className="mono">{m[2].slice(1, -1)}</code>);
      last = re.lastIndex;
    }
    if (last < t.length) parts.push(t.slice(last));
    return parts;
  };
  for (const ln of lines) {
    if (ln.trim().startsWith("```")) {
      if (inCode) {
        out.push(<pre key={key++} className="md-code mono">{code.join("\n")}</pre>);
        code = [];
        inCode = false;
      } else inCode = true;
      continue;
    }
    if (inCode) {
      code.push(ln);
      continue;
    }
    if (ln.startsWith("### ")) out.push(<h3 key={key++}>{inline(ln.slice(4))}</h3>);
    else if (ln.startsWith("## ")) out.push(<h2 key={key++}>{inline(ln.slice(3))}</h2>);
    else if (ln.startsWith("# ")) out.push(<h1 key={key++}>{inline(ln.slice(2))}</h1>);
    else if (ln.startsWith("> ")) out.push(<blockquote key={key++}>{inline(ln.slice(2))}</blockquote>);
    else if (ln.startsWith("- ")) out.push(<li key={key++}>{inline(ln.slice(2))}</li>);
    else if (ln.trim() === "---") out.push(<hr key={key++} />);
    else if (ln.trim() === "") out.push(<div key={key++} style={{ height: 8 }} />);
    else out.push(<p key={key++}>{inline(ln)}</p>);
  }
  return out;
}
