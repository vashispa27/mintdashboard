"use client";

import { useEffect, useState } from "react";
import { listApiKeys, createApiKey, revokeApiKey, type ApiKey } from "@/lib/api";
import { I } from "@/components/sentinel/icons";

export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    listApiKeys()
      .then(setKeys)
      .catch(() => setKeys([]))  // 401 = no key yet, show empty list
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const result = await createApiKey(newKeyName.trim());
      setRevealedKey(result.key);
      setNewKeyName("");
      setKeys((prev) => [{ keyId: result.keyId, name: result.prefix, prefix: result.prefix, createdAt: result.createdAt }, ...prev]);
      // refresh accurate list
      listApiKeys().then(setKeys).catch(() => {});
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(keyId: string) {
    setRevoking(keyId);
    try {
      await revokeApiKey(keyId);
      setKeys((prev) => prev.filter((k) => k.keyId !== keyId));
    } finally {
      setRevoking(null);
    }
  }

  function copyKey() {
    if (!revealedKey) return;
    navigator.clipboard.writeText(revealedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="main">
      <div className="main-header">
        <span className="main-title">Settings</span>
      </div>

      <div className="settings-body">
        <section className="settings-section">
          <div className="settings-section-head">
            <h2 className="settings-section-title">API Keys</h2>
            <p className="settings-section-desc">
              Use these keys to authenticate the CLI and agent processes. Each key grants full access as your user.
            </p>
          </div>

          {/* create form */}
          <form className="key-create-row" onSubmit={handleCreate}>
            <input
              className="key-name-input"
              placeholder="Key name (e.g. laptop, prod-agent)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              disabled={creating}
            />
            <button className="btn primary sm" type="submit" disabled={creating || !newKeyName.trim()}>
              {creating ? "Creating…" : "Create key"}
            </button>
          </form>

          {/* one-time reveal */}
          {revealedKey && (
            <div className="key-reveal">
              <div className="key-reveal-warn">
                <I.warning size={14} /> Copy this key now — it will not be shown again.
              </div>
              <div className="key-reveal-row">
                <code className="key-reveal-value mono">{revealedKey}</code>
                <button className="btn ghost sm" onClick={copyKey}>
                  {copied ? "Copied!" : <><I.copy size={13} /> Copy</>}
                </button>
                <button className="btn ghost sm" onClick={() => setRevealedKey(null)}>
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* key list */}
          {loading ? (
            <div className="empty"><I.refresh size={18} />Loading…</div>
          ) : keys.length === 0 ? (
            <div className="empty">No API keys yet.</div>
          ) : (
            <div className="key-list">
              {keys.map((k) => (
                <div className="key-row" key={k.keyId}>
                  <div className="key-info">
                    <span className="key-name">{k.name}</span>
                    <span className="key-prefix mono">{k.prefix}</span>
                  </div>
                  <span className="key-date">{new Date(k.createdAt).toLocaleDateString()}</span>
                  <button
                    className="btn ghost sm danger"
                    onClick={() => handleRevoke(k.keyId)}
                    disabled={revoking === k.keyId}
                  >
                    {revoking === k.keyId ? "Revoking…" : "Revoke"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
