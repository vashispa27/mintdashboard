"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { I } from "@/components/sentinel/icons";
import { HarnessMark, StatusPill } from "@/components/sentinel/shared";
import {
  HARNESSES,
  NOW,
  fmtDur,
  fmtAgo,
  type Session,
} from "@/lib/agents-data";
import { fetchSessions } from "@/lib/api";
import { getIoTClient, allSessionsTopic } from "@/lib/iot";

const FILTERS: { k: string; label: string }[] = [
  { k: "all", label: "All" },
  { k: "running", label: "Running" },
  { k: "completed", label: "Completed" },
  { k: "failed", label: "Failed" },
  { k: "queued", label: "Queued" },
  { k: "timeout", label: "Timed out" },
];

export default function AgentsPage() {
  const [all, setAll] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [now, setNow] = useState(Date.now());

  const refresh = () => {
    setLoading(true);
    fetchSessions().then(setAll).finally(() => setLoading(false));
  };

  // initial load
  useEffect(() => { refresh(); }, []);

  // live clock for running durations
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(t);
  }, []);

  // IoT live patches
  useEffect(() => {
    let unsub = false;
    getIoTClient().then((client) => {
      if (unsub) return;
      client.subscribe(allSessionsTopic());
      client.on("message", (_topic, payload) => {
        try {
          const msg = JSON.parse(payload.toString());
          if (msg.type === "session.start") {
            setAll((prev) => {
              if (prev.find((s) => s.id === msg.sessionId)) return prev;
              const session = {
                ...msg,
                id: msg.sessionId,
                status: "running",
                exitCode: null,
                cost: 0,
                toolCalls: 0,
                tokensIn: 0,
                tokensOut: 0,
                cpu: 0,
                mem: 0,
              } as unknown as Session;
              return [session, ...prev];
            });
          } else if (msg.type === "session.update") {
            setAll((prev) =>
              prev.map((s) =>
                s.id === msg.sessionId ? { ...s, ...msg } : s
              )
            );
          }
        } catch { /* ignore malformed */ }
      });
    });
    return () => { unsub = true; };
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: all.length, running: 0, completed: 0, failed: 0, queued: 0, timeout: 0,
    };
    all.forEach((s) => c[s.status]++);
    return c;
  }, [all]);

  const list = useMemo(() => {
    return all.filter((s) => {
      if (filter !== "all" && s.status !== filter) return false;
      if (q) {
        const hay = (s.id + " " + s.repo + " " + s.task + " " + HARNESSES[s.harness].label).toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [all, filter, q]);

  return (
    <div className="main">
      <div className="topbar">
        <h1>Agents</h1>
        <span className="topbar-sub">{loading ? "…" : `${counts.running} running · ${all.length} total`}</span>
        <div style={{ flex: 1 }}></div>
        <div className="input" style={{ width: 260 }}>
          <I.search size={15} />
          <input
            placeholder="Search sessions, repos, tasks…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button className="icon-btn" title="Refresh" onClick={refresh} disabled={loading}><I.refresh size={16} /></button>
        <button className="btn primary sm"><I.activity size={14} />New run</button>
      </div>

      <div className="scroll">
        <div className="agents-wrap">
          <div className="seg">
            {FILTERS.map((f) => (
              <button
                key={f.k}
                className={"seg-btn" + (filter === f.k ? " on" : "")}
                onClick={() => setFilter(f.k)}
              >
                {f.k !== "all" && <span className={"dot " + f.k} style={{ animation: "none" }}></span>}
                {f.label}
                <span className="seg-count">{counts[f.k]}</span>
              </button>
            ))}
          </div>

          <div className="card-grid">
            {list.map((s) => (
              <AgentCard key={s.id} s={s} now={now} />
            ))}
          </div>
          {list.length === 0 && (
            <div className="empty" style={{ padding: "80px 0" }}>
              <I.search size={30} />
              <div>No sessions match &quot;<b>{q}</b>&quot;</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AgentCard({ s, now }: { s: Session; now: number }) {
  const router = useRouter();
  const h = HARNESSES[s.harness] ?? HARNESSES["custom"];
  const live = s.status === "running";
  const dur = live ? now - s.startedAt : s.duration;
  const pctTimeout = s.timeout ? Math.min(100, (dur / 1000 / s.timeout) * 100) : null;

  return (
    <button className={"agent-card" + (live ? " live" : "")} onClick={() => router.push(`/sessions/${s.id}`)}>
      <div className="ac-top">
        <HarnessMark hk={s.harness} size={28} />
        <div className="ac-head">
          <div className="ac-repo">
            {s.repo}
            <span className="ac-branch mono">{s.branch}</span>
          </div>
          <div className="ac-id mono">{s.id}</div>
        </div>
        <StatusPill status={s.status} />
      </div>

      <div className="ac-task">{s.task}</div>

      <div className="ac-meta">
        <span className="ac-chip"><I.clock size={13} />{s.status === "queued" ? "queued" : fmtDur(dur)}</span>
        <span className="ac-chip"><I.wrench size={13} />{s.toolCalls ?? 0} calls</span>
        <span className="ac-chip"><I.coin size={13} />${(s.cost ?? 0).toFixed(2)}</span>
        {s.exitCode != null && (
          <span className={"ac-chip" + (s.exitCode === 0 ? " ok" : " bad")}>exit {s.exitCode}</span>
        )}
      </div>

      <div className="ac-foot">
        <span className="harness" style={{ fontSize: 12 }}>
          {h.label}
          <span className="mono" style={{ color: "var(--text-4)" }}> · {h.model}</span>
        </span>
        <span style={{ flex: 1 }}></span>
        <span style={{ color: "var(--text-3)", fontSize: 12 }}>{fmtAgo(s.startedAt, now)}</span>
      </div>

      {live && (
        <div
          className="ac-progress"
          title={s.timeout ? `${Math.round(pctTimeout!)}% of ${fmtDur(s.timeout * 1000)} timeout` : "running"}
        >
          <div className="ac-progress-bar" style={{ width: (pctTimeout != null ? pctTimeout : 30) + "%" }}></div>
        </div>
      )}
    </button>
  );
}
