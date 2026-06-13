"use client";

import { useEffect, useState } from "react";
import { I } from "@/components/sentinel/icons";
import { type Session } from "@/lib/agents-data";
import { fetchTranscript } from "@/lib/api";

export interface JsonlEvent {
  ts?: string;
  type: string;
  [key: string]: unknown;
}

export function JsonlViewer({ session }: { session: Session }) {
  const running = session.status === "running" || session.status === "queued";
  const [events, setEvents] = useState<JsonlEvent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (running) return;
    setLoading(true);
    fetchTranscript(session.id)
      .then((content) => {
        const parsed = content
          .split(/\r?\n/)
          .filter(Boolean)
          .map((ln) => { try { return JSON.parse(ln) as JsonlEvent; } catch { return null; } })
          .filter((e): e is JsonlEvent => e !== null);
        setEvents(parsed);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [session.id, running]);

  if (running) {
    return (
      <div className="jsonl-pane">
        <div className="jsonl-locked">
          <div className="jl-badge"><I.terminal size={20} /></div>
          <div className="jl-title">Session in progress</div>
          <p className="jl-desc">
            The transcript will be available here once the run completes and the agent uploads the JSONL artifact.
          </p>
          <div className="jl-path mono">{session.fsPath}/transcript.jsonl</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="jsonl-pane">
        <div className="empty"><I.refresh size={22} />Loading transcript…</div>
      </div>
    );
  }

  if (notFound || !events) {
    return (
      <div className="jsonl-pane">
        <div className="jsonl-locked">
          <div className="jl-badge"><I.file size={20} /></div>
          <div className="jl-title">No transcript found</div>
          <p className="jl-desc">
            The agent did not upload a JSONL transcript for this session.
          </p>
          <div className="jl-path mono">{session.fsPath}/transcript.jsonl</div>
        </div>
      </div>
    );
  }

  return (
    <div className="jsonl-pane">
      <div className="jsonl-bar">
        <span className="jsonl-count">{events.length} events</span>
        <div style={{ flex: 1 }}></div>
        <button className="btn ghost sm"><I.down size={13} />Download</button>
      </div>

      <div className="jsonl-timeline">
        {events.map((e, i) => (
          <EventRow
            key={i}
            e={e}
            collapsed={collapsed[i] !== false}
            onToggle={() => setCollapsed((c) => ({ ...c, [i]: !c[i] }))}
          />
        ))}
      </div>
    </div>
  );
}

function EventRow({ e, collapsed, onToggle }: { e: JsonlEvent; collapsed: boolean; onToggle: () => void }) {
  const t = e.type ?? "unknown";
  const time = e.ts
    ? new Date(e.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "";

  let accent = "var(--text-3)";
  let label = t;

  if (t === "message" && e.role === "user")      { accent = "var(--accent)";  label = "User"; }
  else if (t === "message")                       { accent = "#7c5cff";        label = "Assistant"; }
  else if (t === "tool_use")                      { accent = "#0f8a6a";        label = String(e.name); }
  else if (t === "tool_result")                   { accent = e.ok ? "#0f8a6a" : "var(--fail)"; label = `${e.tool} · result`; }
  else if (t === "usage")                         { accent = "var(--text-2)";  label = "Usage"; }
  else if (t === "session.start")                 { accent = "var(--run)";     label = "Session start"; }
  else if (t === "session.end")                   { accent = "var(--text-2)";  label = "Session end"; }

  const body = { ...e };
  delete body.ts;

  const hasContent = t === "message" && typeof e.content === "string";
  const hasJson = !hasContent;

  return (
    <div className={"ev ev-" + t.replace(".", "-")}>
      <div className="ev-rail">
        <span className="ev-tick" style={{ background: accent }}></span>
      </div>
      <div className="ev-body">
        <button className="ev-head" onClick={onToggle}>
          <span className="ev-chev" style={{ transform: collapsed ? "none" : "rotate(90deg)", opacity: 0.5 }}>
            <I.chevR size={12} />
          </span>
          <span className="ev-title" style={{ color: accent }}>{label}</span>
          <span className="ev-type mono">{t}</span>
          <span style={{ flex: 1 }}></span>
          <span className="ev-time mono">{time}</span>
        </button>

        {!collapsed && hasContent && (
          <div className="ev-msg">{String(e.content)}</div>
        )}
        {!collapsed && hasJson && (
          <pre className="ev-json mono">{JSON.stringify(body, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
