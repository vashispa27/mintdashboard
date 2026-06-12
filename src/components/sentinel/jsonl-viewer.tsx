"use client";

import { useRef, useState, type ReactNode } from "react";
import { I } from "@/components/sentinel/icons";
import { makeJsonl, STATUS_LABEL, type Session, type JsonlEvent } from "@/lib/agents-data";

export function JsonlViewer({ session }: { session: Session }) {
  const running = session.status === "running" || session.status === "queued";
  const [mode, setMode] = useState<"timeline" | "raw">("timeline");
  const [uploaded, setUploaded] = useState<JsonlEvent[] | null>(null);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  // auto-available events only once the run has ended (ingested artifact)
  const ingested = !running ? makeJsonl() : null;
  const events = uploaded || ingested;

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const lines = String(r.result).split(/\r?\n/).filter(Boolean);
      const parsed: JsonlEvent[] = [];
      for (const ln of lines) {
        try {
          parsed.push(JSON.parse(ln));
        } catch {
          parsed.push({ type: "raw", content: ln });
        }
      }
      setUploaded(parsed);
    };
    r.readAsText(f);
  }

  if (!events) {
    return (
      <div className="jsonl-pane">
        <div className="jsonl-locked">
          <div className="jl-badge"><I.lock size={20} /></div>
          <div className="jl-title">JSONL not available yet</div>
          <p className="jl-desc">
            The transcript artifact is written when the run finishes. This session is
            <b> {STATUS_LABEL[session.status].toLowerCase()}</b> on a remote sandbox (
            <span className="mono">{session.node}</span>), so the file hasn&apos;t been ingested. It will
            appear here automatically on completion.
          </p>
          <div className="jl-or">or load it manually</div>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            <I.upload size={15} />Upload .jsonl
          </button>
          <input ref={fileRef} type="file" accept=".jsonl,.json,.txt" onChange={onFile} hidden />
          <div className="jl-path mono">{session.fsPath}/transcript.jsonl</div>
        </div>
      </div>
    );
  }

  return (
    <div className="jsonl-pane">
      <div className="jsonl-bar">
        <div className="seg sm">
          <button className={"seg-btn" + (mode === "timeline" ? " on" : "")} onClick={() => setMode("timeline")}>
            <I.list size={13} />Timeline
          </button>
          <button className={"seg-btn" + (mode === "raw" ? " on" : "")} onClick={() => setMode("raw")}>
            <I.code size={13} />Raw
          </button>
        </div>
        <span className="jsonl-count">{events.length} events</span>
        {uploaded ? (
          <span className="jsonl-src"><I.upload size={12} /> uploaded</span>
        ) : (
          <span className="jsonl-src ok"><I.dot size={11} /> auto-ingested</span>
        )}
        <div style={{ flex: 1 }}></div>
        <button className="btn ghost sm" onClick={() => fileRef.current?.click()}>
          <I.upload size={13} />Replace
        </button>
        <input ref={fileRef} type="file" accept=".jsonl,.json,.txt" onChange={onFile} hidden />
        <button className="btn ghost sm"><I.down size={13} />Download</button>
      </div>

      {mode === "raw" ? (
        <div className="jsonl-raw mono">
          {events.map((e, i) => (
            <div className="jr-line" key={i}>
              <span className="jr-num">{i + 1}</span>
              <span className="jr-json">{colorizeJson(JSON.stringify(e))}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="jsonl-timeline">
          {events.map((e, i) => (
            <EventRow
              key={i}
              e={e}
              collapsed={!!collapsed[i]}
              onToggle={() => setCollapsed((c) => ({ ...c, [i]: !c[i] }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EventRow({ e, collapsed, onToggle }: { e: JsonlEvent; collapsed: boolean; onToggle: () => void }) {
  const t = e.type;
  const time = e.ts
    ? new Date(e.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "";
  let kind = "meta";
  let icon: ReactNode = <I.dot size={12} />;
  let title = t;
  let accent = "var(--text-3)";

  if (t === "message" && e.role === "user") { kind = "user"; title = "User"; accent = "var(--accent)"; }
  else if (t === "message") { kind = "assistant"; title = "Assistant"; accent = "#7c5cff"; }
  else if (t === "tool_use") { kind = "tool"; title = String(e.name); icon = <I.wrench size={12} />; accent = "#0f8a6a"; }
  else if (t === "tool_result") { kind = "result"; title = (String(e.tool) || "tool") + " · result"; icon = <I.chevR size={12} />; accent = e.ok ? "#0f8a6a" : "var(--fail)"; }
  else if (t === "usage") { kind = "usage"; title = "Token usage"; icon = <I.coin size={12} />; }
  else if (t.startsWith("session")) { kind = "session"; title = t === "session.start" ? "Session start" : "Session end"; icon = <I.activity size={12} />; accent = "var(--text-2)"; }

  const expandable = t === "tool_use" || t === "tool_result" || t === "usage" || t.startsWith("session");

  return (
    <div className={"ev ev-" + kind}>
      <div className="ev-rail">
        <span className="ev-tick" style={{ background: accent }}></span>
      </div>
      <div className="ev-body">
        <button
          className="ev-head"
          onClick={expandable ? onToggle : undefined}
          style={{ cursor: expandable ? "pointer" : "default" }}
        >
          {expandable && (
            <span className="ev-chev" style={{ transform: collapsed ? "none" : "rotate(90deg)" }}>
              <I.chevR size={12} />
            </span>
          )}
          <span className="ev-icon" style={{ color: accent }}>{icon}</span>
          <span className="ev-title" style={{ color: accent }}>{title}</span>
          <span className="ev-type mono">{t}</span>
          <span style={{ flex: 1 }}></span>
          <span className="ev-time mono">{time}</span>
        </button>

        {t === "message" && <div className="ev-msg">{String(e.content)}</div>}

        {expandable && !collapsed && <pre className="ev-json mono">{prettyJson(stripTs(e))}</pre>}
        {t === "tool_use" && collapsed && e.input != null && (
          <div className="ev-inline mono">{compactInput(e.input as Record<string, unknown>)}</div>
        )}
      </div>
    </div>
  );
}

function stripTs(e: JsonlEvent) {
  const c = { ...e };
  delete c.ts;
  return c;
}
function compactInput(o: Record<string, unknown>) {
  return Object.entries(o)
    .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join("  ");
}
function prettyJson(o: unknown) {
  return JSON.stringify(o, null, 2);
}
function colorizeJson(str: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /("(\\.|[^"\\])*"\s*:)|("(\\.|[^"\\])*")|(\b(true|false|null)\b)|(-?\d+\.?\d*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(str))) {
    if (m.index > last) parts.push(<span key={last + "p"}>{str.slice(last, m.index)}</span>);
    let cls = "j-num";
    if (m[1]) cls = "j-key";
    else if (m[3]) cls = "j-str";
    else if (m[5]) cls = "j-bool";
    parts.push(<span key={m.index} className={cls}>{m[0]}</span>);
    last = re.lastIndex;
  }
  if (last < str.length) parts.push(<span key="end">{str.slice(last)}</span>);
  return parts;
}
