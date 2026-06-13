"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { I } from "@/components/sentinel/icons";
import { SESSIONS } from "@/lib/agents-data";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const running = SESSIONS.filter((s) => s.status === "running").length;

  const onAgents = pathname === "/" || pathname.startsWith("/sessions");
  const onRepos = pathname.startsWith("/repos");
  const onSettings = pathname.startsWith("/settings");

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-brand">
          <span className="nav-logo">
            <I.activity size={15} style={{ color: "#fff" }} />
          </span>
          <div>
            <div className="nav-title">Sentinel</div>
            <div className="nav-sub">agent telemetry</div>
          </div>
        </div>

        <div className="nav-section">Library</div>
        <Link href="/" className={"nav-item" + (onAgents ? " active" : "")}>
          <I.activity size={17} />
          <span>Agents</span>
          <span className="count">{running}</span>
        </Link>
        <Link href="/repos" className={"nav-item" + (onRepos ? " active" : "")}>
          <I.repo size={17} />
          <span>Repos</span>
        </Link>
        <Link href="/repos" className="nav-item">
          <I.star size={17} />
          <span>Favorites</span>
        </Link>
        <Link href="/" className="nav-item">
          <I.clock size={17} />
          <span>Recents</span>
        </Link>

        <div className="nav-spacer"></div>

        <Link href="/settings" className={"nav-item" + (onSettings ? " active" : "")}>
          <I.settings size={17} />
          <span>Settings</span>
        </Link>

        <div className="nav-section">Account</div>
        <div className="nav-account">
          <span className="avatar">A</span>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 13.5, fontWeight: 550 }}>abhinav</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>pro workspace</div>
          </div>
        </div>
      </nav>

      {children}
    </div>
  );
}
