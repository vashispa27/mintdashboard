"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Star,
  Clock,
  User,
  Box,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { FolderIcon } from "@/components/repos/file-icon";
import { cn } from "@/lib/utils";
import { fetchRepos, type RepoMeta } from "@/lib/api";

const SIDEBAR = [
  { icon: Box, label: "My Repos", active: true },
  { icon: Star, label: "Favorites" },
  { icon: Clock, label: "Recents" },
];

export default function ReposPage() {
  const [repos, setRepos] = useState<RepoMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchRepos()
      .then(setRepos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = repos.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-background">
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="flex w-60 shrink-0 flex-col gap-5 border-r bg-muted/30 p-4">
          <div>
            <p className="px-2 pb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Library
            </p>
            <nav className="flex flex-col gap-0.5">
              {SIDEBAR.map((item) => (
                <button
                  key={item.label}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                    item.active
                      ? "bg-primary/15 text-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="size-4.5 text-primary" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div>
            <p className="px-2 pb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Account
            </p>
            <button className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-primary">
                <User className="size-4" />
              </span>
              abhinav
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Toolbar */}
          <div className="flex items-center gap-3 border-b px-5 py-3">
            <h1 className="text-base font-semibold">My Repos</h1>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search repos"
                className="h-9 pl-9"
              />
            </div>
            <span className="ml-auto text-sm text-muted-foreground">
              {loading ? "…" : `${filtered.length} repos`}
            </span>
          </div>

          {/* Column header */}
          <div className="flex items-center gap-3 border-b bg-muted/20 px-5 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <div className="flex-1 pl-8">Name</div>
          </div>

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-auto">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading repos…
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center gap-2 py-20 text-sm text-destructive">
                <AlertCircle className="size-4" />
                {error}
              </div>
            )}

            {!loading && !error && filtered.map((repo) => (
              <Link
                key={repo.id}
                href={`/repos/${repo.id}`}
                className="flex items-center gap-3 border-b border-border/40 px-5 py-3.5 transition-colors hover:bg-primary/10"
              >
                <FolderIcon className="size-6 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="truncate text-base font-medium">{repo.name}</span>
                </div>
              </Link>
            ))}

            {!loading && !error && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
                <Search className="size-6 opacity-40" />
                {query ? `No repos match "${query}"` : "No repos found in bucket"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
