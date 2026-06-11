"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  GitBranch,
  Lock,
  Globe,
  Star,
  Clock,
  User,
  HardDrive,
  Box,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { FolderIcon } from "@/components/repos/file-icon";
import { REPOS, formatBytes, formatDate } from "@/lib/repos";
import { cn } from "@/lib/utils";

const SIDEBAR = [
  { icon: Box, label: "My Repos", active: true },
  { icon: Star, label: "Favorites" },
  { icon: Clock, label: "Recents" },
];

export default function ReposPage() {
  const [query, setQuery] = useState("");
  const repos = REPOS.filter(
    (r) =>
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-background">
      <div className="flex min-h-0 flex-1">
          {/* Finder sidebar */}
          <aside className="flex w-52 shrink-0 flex-col gap-4 border-r bg-muted/30 p-3">
            <div>
              <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Library
              </p>
              <nav className="flex flex-col gap-0.5">
                {SIDEBAR.map((item) => (
                  <button
                    key={item.label}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      item.active
                        ? "bg-primary/15 text-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="size-4 text-primary" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div>
              <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Account
              </p>
              <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <User className="size-3.5" />
                </span>
                abhinav
              </button>
            </div>
          </aside>

          {/* Main */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Toolbar */}
            <div className="flex items-center gap-3 border-b px-4 py-2.5">
              <h1 className="text-sm font-semibold">My Repos</h1>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search repos"
                  className="h-8 pl-8"
                />
              </div>
              <span className="ml-auto text-xs text-muted-foreground">
                {repos.length} repos
              </span>
            </div>

            {/* Column header */}
            <div className="flex items-center gap-3 border-b bg-muted/20 px-4 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <div className="flex-1 pl-7">Name</div>
              <div className="w-40">Branch</div>
              <div className="w-24">Size</div>
              <div className="w-28">Modified</div>
            </div>

            {/* Repo list */}
            <div className="min-h-0 flex-1 overflow-auto">
              {repos.map((repo) => (
                <Link
                  key={repo.id}
                  href={`/repos/${repo.id}`}
                  className="group flex items-center gap-3 border-b border-border/40 px-4 py-2.5 transition-colors hover:bg-primary/10"
                >
                  <FolderIcon className="size-5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {repo.name}
                      </span>
                      {repo.visibility === "private" ? (
                        <Lock className="size-3 text-muted-foreground" />
                      ) : (
                        <Globe className="size-3 text-muted-foreground" />
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {repo.description}
                    </p>
                  </div>
                  <div className="flex w-40 items-center gap-1.5 text-xs text-muted-foreground">
                    <GitBranch className="size-3.5" />
                    <span className="truncate font-mono">{repo.branch}</span>
                  </div>
                  <div className="flex w-24 items-center gap-1.5 text-xs text-muted-foreground">
                    <HardDrive className="size-3.5" />
                    {formatBytes(repo.sizeKb * 1024)}
                  </div>
                  <div className="w-28 text-xs text-muted-foreground">
                    {formatDate(repo.modified)}
                  </div>
                </Link>
              ))}

              {repos.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
                  <Search className="size-6 opacity-40" />
                  No repos match “{query}”
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}
