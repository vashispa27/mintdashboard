"use client";

import { useState } from "react";
import { Maximize2, Sparkles, Radio, Box, ChevronRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { MOCK_LOGS, LOG_LEVEL_META, type LogEntry } from "@/lib/telemetry";

const TIME_WINDOWS = [1, 5, 10, 25] as const;

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }) + "." + String(d.getMilliseconds()).padStart(3, "0");
}

export default function Home() {
  const [session, setSession] = useState("sess-01");
  const [harness, setHarness] = useState("claude-code");
  const [logType, setLogType] = useState("all");
  const [timeWindow, setTimeWindow] = useState<number>(5);
  const [live, setLive] = useState(true);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* App header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Box className="size-4" />
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-semibold">Telemetry</span>
            <ChevronRight className="size-3.5 text-muted-foreground" />
            <span className="font-mono text-xs text-muted-foreground">
              sandbox_a91f4c
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-muted-foreground">3 sessions active</span>
          </span>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b px-5 py-3">
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Session">
            <Select value={session} onValueChange={(v) => setSession(v ?? "")}>
              <SelectTrigger className="h-8 w-[190px] font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sess-01">sess-01 · running</SelectItem>
                <SelectItem value="sess-02">sess-02 · running</SelectItem>
                <SelectItem value="sess-03">sess-03 · stopped</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Harness">
            <Select value={harness} onValueChange={(v) => setHarness(v ?? "")}>
              <SelectTrigger className="h-8 w-[170px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claude-code">Claude Code</SelectItem>
                <SelectItem value="codex">Codex</SelectItem>
                <SelectItem value="custom-agent">Custom Agent</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Log type">
            <Select value={logType} onValueChange={(v) => setLogType(v ?? "")}>
              <SelectTrigger className="h-8 w-[150px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="tool">Tool call</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="flex items-end gap-3">
          <Field label="Window">
            <div className="flex h-8 items-center rounded-md border bg-card p-0.5">
              {TIME_WINDOWS.map((w) => (
                <button
                  key={w}
                  onClick={() => setTimeWindow(w)}
                  className={cn(
                    "h-7 rounded px-2.5 text-xs font-medium transition-colors",
                    timeWindow === w
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {w}m
                </button>
              ))}
            </div>
          </Field>

          <Button
            variant={live ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setLive((v) => !v)}
          >
            <Radio className="size-3.5" />
            {live ? "Live" : "Paused"}
          </Button>

          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <Sparkles className="size-3.5" />
            Insights
          </Button>
        </div>
      </div>

      {/* Log table */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Column header */}
        <div className="flex items-center gap-3 border-b bg-card/40 px-5 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <div className="w-4" />
          <div className="w-20">Type</div>
          <div className="flex-1">Summary</div>
          <div className="w-32 text-right">Timestamp</div>
          <button className="text-muted-foreground transition-colors hover:text-foreground">
            <Maximize2 className="size-3.5" />
          </button>
        </div>

        {/* Rows */}
        <ScrollArea className="flex-1">
          <div className="divide-y divide-border/50">
            {MOCK_LOGS.map((log) => (
              <LogRow key={log.id} log={log} />
            ))}
          </div>
        </ScrollArea>

        {/* Status bar */}
        <div className="flex h-7 shrink-0 items-center justify-between border-t bg-card/40 px-5 text-[11px] text-muted-foreground">
          <span className="font-mono">{MOCK_LOGS.length} events</span>
          <span className="font-mono">
            tail -f /sandbox/sess-01/claude-code.jsonl
          </span>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function LogRow({ log }: { log: LogEntry }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const meta = LOG_LEVEL_META[log.level];
  const json = JSON.stringify(log.raw, null, 2);

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className={cn(open && "bg-muted/30")}>
      {/* Summary row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center gap-3 px-5 py-2 text-left text-sm transition-colors hover:bg-muted/40"
      >
        <ChevronRight
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-90"
          )}
        />
        <div className="w-20">
          <Badge
            variant="outline"
            className={cn("font-mono text-[10px]", meta.className)}
          >
            {meta.label}
          </Badge>
        </div>
        <div className="flex-1 truncate font-mono text-xs text-foreground/90">
          {log.summary}
        </div>
        <div className="w-32 text-right font-mono text-xs tabular-nums text-muted-foreground">
          {formatTime(log.timestamp)}
        </div>
        <div className="w-3.5" />
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-5 pb-3 pl-12">
          <div className="relative rounded-md border bg-background">
            <div className="flex items-center justify-between border-b px-3 py-1.5">
              <span className="font-mono text-[11px] text-muted-foreground">
                raw event · {String(log.raw.type ?? "unknown")}
              </span>
              <button
                onClick={copy}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {copied ? (
                  <Check className="size-3" />
                ) : (
                  <Copy className="size-3" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed text-foreground/90">
              {json}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
