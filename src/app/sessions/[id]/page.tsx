"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { I } from "@/components/sentinel/icons";
import { HarnessMark, HarnessBadge, StatusPill, CopyMono } from "@/components/sentinel/shared";
import { JsonlViewer } from "@/components/sentinel/jsonl-viewer";
import {
  getSession,
  LOG_TEMPLATES,
  NOW,
  fmtDur,
  fmtAgo,
  fmtClock,
  fmtTok,
  type Session,
  type LogTemplate,
} from "@/lib/agents-data";

interface LogLineData extends LogTemplate {
  id: number;
  at: number;
}

export default function SessionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const session = getSession(params.id);
  const [tab, setTab] = useState<"logs" | "jsonl">("logs");

  if (!session) {
    return (
      <div className="main">
        <div className="empty">
          <I.search size={30} />
          <div>Session not found</div>
          <button className="btn sm" onClick={() => router.push("/")}>Back to agents</button>
        </div>
      </div>
    );
  }

  const running = session.status === "running";
  const back = () => router.push("/");

  return (
    <div className="main">
      <div className="topbar">
        <button className="icon-btn" onClick={back} title="Back to agents"><I.back size={17} /></button>
        <div className="crumb">
          <span className="link" onClick={back}>Agents</span>
          <span className="sep"><I.chevR size={13} /></span>
          <HarnessMark hk={session.harness} size={18} />
          <span className="now mono">{session.id}</span>
        </div>
        <StatusPill status={session.status} />
        <div style={{ flex: 1 }}></div>
        <button className="btn ghost sm" onClick={() => router.push(`/repos/${session.repo}`)}>
          <I.folder size={14} />Browse files
        </button>
        {running ? (
          <button className="btn sm" style={{ color: "var(--fail)", borderColor: "var(--border-strong)" }}>
            <I.stop size={13} />Stop run
          </button>
        ) : (
          <button className="btn sm"><I.refresh size={13} />Re-run</button>
        )}
      </div>

      <div className="session-body">
        <div className="session-main">
          <div className="tabs">
            <button className={"tab" + (tab === "logs" ? " on" : "")} onClick={() => setTab("logs")}>
              <I.terminal size={15} />Live logs
              {running && <span className="live-tag"><span className="dot running"></span>live</span>}
            </button>
            <button className={"tab" + (tab === "jsonl" ? " on" : "")} onClick={() => setTab("jsonl")}>
              <I.code size={15} />JSONL transcript
              {running && <span className="tab-lock"><I.lock size={11} /></span>}
            </button>
          </div>
          {tab === "logs" ? <LiveLogs session={session} /> : <JsonlViewer session={session} />}
        </div>

        <MetricsRail session={session} />
      </div>
    </div>
  );
}

/* ---------- live streaming log panel ---------- */
function LiveLogs({ session }: { session: Session }) {
  const running = session.status === "running";
  const [dark, setDark] = useState(false);
  const [lines, setLines] = useState<LogLineData[]>([]);
  const [autoscroll, setAutoscroll] = useState(true);
  const [paused, setPaused] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  // read persisted theme + seed initial lines after mount (SSR-safe)
  useEffect(() => {
    setDark(localStorage.getItem("logTheme") === "dark");
    const n = session.status === "queued" ? 0 : 10;
    const base = Date.now() - n * 1400;
    const seed: LogLineData[] = [];
    for (let i = 0; i < n; i++) seed.push({ id: i, ...LOG_TEMPLATES[i % LOG_TEMPLATES.length], at: base + i * 1400 });
    idRef.current = n;
    setLines(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem("logTheme", dark ? "dark" : "light");
  }, [dark]);

  // stream new lines for running sessions
  useEffect(() => {
    if (!running || paused) return;
    const t = setInterval(() => {
      const tpl = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
      setLines((prev) => [...prev.slice(-400), { id: idRef.current++, ...tpl, at: Date.now() }]);
    }, 1100 + Math.random() * 900);
    return () => clearInterval(t);
  }, [running, paused]);

  useEffect(() => {
    if (autoscroll && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [lines, autoscroll]);

  function onScroll() {
    const el = bodyRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (atBottom !== autoscroll) setAutoscroll(atBottom);
  }

  return (
    <div className={"logs" + (dark ? " dark" : "")}>
      <div className="logs-bar">
        <span className="logs-meta mono">{session.fsPath}</span>
        <span style={{ flex: 1 }}></span>
        {running && (
          <button className="btn ghost sm" onClick={() => setPaused((p) => !p)}>
            {paused ? "Resume" : "Pause"}
          </button>
        )}
        <button className={"btn ghost sm" + (autoscroll ? " on-soft" : "")} onClick={() => setAutoscroll((a) => !a)}>
          <I.down size={13} />Follow
        </button>
        <button className="btn ghost sm"><I.down size={13} />Download</button>
        <div className="theme-toggle">
          <button className={"tt" + (!dark ? " on" : "")} onClick={() => setDark(false)} title="Light"><I.sun size={14} /></button>
          <button className={"tt" + (dark ? " on" : "")} onClick={() => setDark(true)} title="Dark"><I.moon size={14} /></button>
        </div>
      </div>

      <div className="logs-body mono" ref={bodyRef} onScroll={onScroll}>
        {lines.map((l) => <LogLine key={l.id} l={l} />)}
        {running && !paused && <div className="log-cursor"><span className="caret"></span></div>}
        {!running && <div className="log-end">— end of stream · exit {session.exitCode} —</div>}
      </div>

      {!autoscroll && running && (
        <button className="jump-btn" onClick={() => setAutoscroll(true)}>
          <I.down size={14} />Jump to live
        </button>
      )}
    </div>
  );
}

function LogLine({ l }: { l: LogLineData }) {
  const time = new Date(l.at).toLocaleTimeString([], { hour12: false });
  const cls = "ll ll-" + l.t;
  const tag = ({ think: "think", tool: "tool", bash: "bash", out: "stdout", warn: "warn", err: "error" } as Record<string, string>)[l.t] || l.t;
  return (
    <div className={cls}>
      <span className="ll-time">{time}</span>
      <span className="ll-tag">{tag}</span>
      <span className="ll-text">
        {l.t === "tool" ? (
          <>
            <b>{l.text}</b>
            {l.meta && <span className="ll-meta">  {l.meta}</span>}
          </>
        ) : (
          l.text
        )}
      </span>
    </div>
  );
}

/* ---------- right metrics rail ---------- */
function MetricsRail({ session }: { session: Session }) {
  const s = session;
  const [now, setNow] = useState(NOW);
  useEffect(() => {
    if (s.status !== "running") return;
    const mounted = Date.now();
    const t = setInterval(() => setNow(NOW + (Date.now() - mounted)), 1500);
    return () => clearInterval(t);
  }, [s.status]);

  const dur = s.status === "running" ? now - s.startedAt : s.duration;
  const timeoutPct = s.timeout ? Math.min(100, (dur / 1000 / s.timeout) * 100) : null;
  const memPct = Math.round((s.mem / s.memCap) * 100);

  return (
    <aside className="rail">
      <div className="rail-scroll">
        <Section title="Run">
          <KV label="Status"><StatusPill status={s.status} /></KV>
          <KV label="Harness"><HarnessBadge hk={s.harness} /></KV>
          <KV label="Model"><span className="mono kv-mono">{s.model}</span></KV>
          <KV label="Session"><CopyMono text={s.id} /></KV>
          <KV label="Started">
            <span>
              {fmtClock(s.startedAt)} <span style={{ color: "var(--text-3)" }}>· {fmtAgo(s.startedAt, now)}</span>
            </span>
          </KV>
          <KV label="Sandbox"><span className="mono kv-mono">{s.node}</span></KV>
        </Section>

        <Section title="Timing">
          <KV label="Duration"><span className="big-num tnum">{fmtDur(dur)}</span></KV>
          <KV label="Timeout">
            {s.timeout ? (
              <div style={{ width: "100%" }}>
                <div className="kv-row">
                  <span className="mono kv-mono">{fmtDur(s.timeout * 1000)}</span>
                  <span className="tnum" style={{ color: timeoutPct! > 80 ? "var(--timeout)" : "var(--text-3)", fontSize: 12 }}>
                    {Math.round(timeoutPct!)}%
                  </span>
                </div>
                <Meter pct={timeoutPct!} color={timeoutPct! > 80 ? "var(--timeout)" : "var(--accent)"} />
              </div>
            ) : (
              <span style={{ color: "var(--text-3)" }}>none set</span>
            )}
          </KV>
        </Section>

        <Section title="Resources">
          <KV label="CPU">
            {s.status === "running" ? (
              <div style={{ width: "100%" }}>
                <div className="kv-row"><span></span><span className="tnum kv-mono">{s.cpu}%</span></div>
                <Meter pct={s.cpu} color={s.cpu > 85 ? "var(--fail)" : "var(--run)"} />
              </div>
            ) : (
              <span style={{ color: "var(--text-3)" }}>—</span>
            )}
          </KV>
          <KV label="Memory">
            {s.status === "running" ? (
              <div style={{ width: "100%" }}>
                <div className="kv-row">
                  <span className="kv-mono mono" style={{ fontSize: 12 }}>{s.mem} / {s.memCap} MB</span>
                  <span className="tnum kv-mono">{memPct}%</span>
                </div>
                <Meter pct={memPct} color={memPct > 85 ? "var(--fail)" : "var(--accent)"} />
              </div>
            ) : (
              <span style={{ color: "var(--text-3)" }}>—</span>
            )}
          </KV>
        </Section>

        <Section title="Usage">
          <div className="usage-grid">
            <Stat label="Tokens in" value={fmtTok(s.tokensIn)} />
            <Stat label="Tokens out" value={fmtTok(s.tokensOut)} />
            <Stat label="Tool calls" value={s.toolCalls} />
            <Stat label="Cost" value={"$" + s.cost.toFixed(2)} />
          </div>
        </Section>

        <Section title="Filesystem">
          <div className="fs-path mono">{s.fsPath}</div>
          <div className="kv-actions">
            <button className="btn sm" style={{ width: "100%" }}><I.folder size={13} />Open in file browser</button>
          </div>
          <KV label="Repo">
            <span>
              {s.repo} <span className="mono" style={{ color: "var(--text-3)" }}>@ {s.branch}</span>
            </span>
          </KV>
          {s.exitCode !== null && (
            <KV label="Exit code">
              <span className={"exit " + (s.exitCode === 0 ? "ok" : "bad")}>
                {s.exitCode}{s.exitCode === 124 ? " (timeout)" : ""}
              </span>
            </KV>
          )}
        </Section>
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rail-sec">
      <div className="rail-sec-title">{title}</div>
      {children}
    </div>
  );
}
function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="kv">
      <div className="kv-label">{label}</div>
      <div className="kv-val">{children}</div>
    </div>
  );
}
function Meter({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="meter">
      <div className="meter-bar" style={{ width: Math.max(2, pct) + "%", background: color }}></div>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="stat">
      <div className="stat-val tnum">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
