"use client";

import { useState, useRef, useEffect } from "react";
import { X, TerminalSquare } from "lucide-react";

interface Line {
  prompt?: string;
  text: string;
}

export function Terminal({
  repo,
  branch,
  onClose,
}: {
  repo: string;
  branch: string;
  onClose: () => void;
}) {
  const promptStr = `${repo} ${branch} %`;
  const [history, setHistory] = useState<Line[]>([
    { text: "Last login: agent session · read-only preview" },
    { prompt: promptStr, text: "ls" },
    { text: "src  package.json  tsconfig.json  README.md  .gitignore" },
  ]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView();
  }, [history]);

  const run = () => {
    const cmd = input.trim();
    if (!cmd) return;
    // No real logic yet — just echo the command into history.
    setHistory((h) => [
      ...h,
      { prompt: promptStr, text: cmd },
      { text: `zsh: command runner not wired yet — '${cmd.split(" ")[0]}'` },
    ]);
    setInput("");
  };

  return (
    <div
      className="flex h-full flex-col bg-[#0a0a0a] font-mono text-xs"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Terminal header */}
      <div className="flex h-7 shrink-0 items-center gap-2 border-b border-white/10 bg-white/5 px-3 text-muted-foreground">
        <TerminalSquare className="size-3.5" />
        <span className="text-[11px]">
          {repo} — zsh — 80×24
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="ml-auto rounded p-0.5 hover:bg-white/10 hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-auto p-3 leading-relaxed text-zinc-300">
        {history.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-words">
            {line.prompt && (
              <span className="text-emerald-400">{line.prompt} </span>
            )}
            <span className={line.prompt ? "text-zinc-100" : "text-zinc-400"}>
              {line.text}
            </span>
          </div>
        ))}

        {/* Active input line */}
        <div className="flex items-center">
          <span className="text-emerald-400">{promptStr}&nbsp;</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            autoFocus
            spellCheck={false}
            className="flex-1 bg-transparent text-zinc-100 caret-emerald-400 outline-none"
          />
        </div>
        <div ref={endRef} />
      </div>
    </div>
  );
}
