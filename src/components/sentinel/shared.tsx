"use client";

import { useState } from "react";
import { I } from "@/components/sentinel/icons";
import { HARNESSES, STATUS_LABEL } from "@/lib/agents-data";

export function HarnessMark({ hk, size = 20 }: { hk: string; size?: number }) {
  const h = HARNESSES[hk];
  if (!h) return null;
  return (
    <span
      className="harness-mark"
      style={{
        background: h.color,
        width: size,
        height: size,
        fontSize: size < 18 ? 9 : 11,
        borderRadius: size < 18 ? 4 : 5,
      }}
    >
      {h.mark}
    </span>
  );
}

export function HarnessBadge({ hk, showModel }: { hk: string; showModel?: boolean }) {
  const h = HARNESSES[hk];
  if (!h) return null;
  return (
    <span className="harness">
      <HarnessMark hk={hk} />
      <span>{h.label}</span>
      {showModel && (
        <span style={{ color: "var(--text-3)", fontWeight: 450 }} className="mono">
          · {h.model}
        </span>
      )}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={"status " + status}>
      <span className={"dot " + status}></span>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

export function CopyMono({ text, children }: { text: string; children?: React.ReactNode }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="copychip mono"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1000);
      }}
      title="Copy"
    >
      {children || text}
      <span style={{ opacity: 0.55, display: "inline-flex" }}>
        {done ? <I.dot size={12} /> : <I.copy size={12} />}
      </span>
    </button>
  );
}
