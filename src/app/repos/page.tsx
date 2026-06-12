"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { I } from "@/components/sentinel/icons";
import { fetchRepos, type RepoMeta } from "@/lib/api";

export default function ReposPage() {
  const router = useRouter();
  const [repos, setRepos] = useState<RepoMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetchRepos()
      .then(setRepos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = repos.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="main">
      <div className="topbar">
        <h1>Repos</h1>
        <span className="topbar-sub">{loading ? "…" : `${filtered.length} repos`}</span>
        <div style={{ flex: 1 }}></div>
      </div>

      <div className="scroll">
        <div className="repos-wrap">
          <div className="repos-head">
            <h2>My Repos</h2>
            <div className="input" style={{ width: 320 }}>
              <I.search size={15} />
              <input placeholder="Search repos" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>

          {loading && (
            <div className="empty" style={{ padding: 80 }}>
              <I.refresh size={26} />Loading repos…
            </div>
          )}
          {error && (
            <div className="empty" style={{ padding: 80, color: "var(--fail)" }}>
              <I.repo size={28} />{error}
            </div>
          )}

          {!loading && !error && (
            <div className="repos-table">
              <div className="rt-head">
                <span>NAME</span>
                <span>FILES</span>
                <span>LAST RUN</span>
              </div>
              {filtered.map((r) => (
                <button className="rt-row" key={r.id} onClick={() => router.push(`/repos/${r.id}`)}>
                  <span className="rt-name">
                    <I.folder size={18} style={{ color: "var(--accent)" }} />
                    {r.name}
                  </span>
                  <span className="rt-dim tnum">—</span>
                  <span className="rt-dim">—</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="empty" style={{ padding: 60 }}>
                  <I.repo size={28} />
                  {q ? `No repos match "${q}"` : "No repos found"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
