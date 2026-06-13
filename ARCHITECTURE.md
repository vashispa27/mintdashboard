# Sentinel — Technical Architecture

## Auth

Every request carries `Authorization: Bearer sentinel_{8hex}_{userId}_{64hex}`.

**REST**: API Gateway has a Lambda authorizer (`mint-apiAuthorizer`) attached to every route. It fires once per unique token, with a **300s TTL cache** keyed on the Authorization header — so for the same API key, only the first request in a 5-minute window hits DynamoDB. The authorizer:
1. Parses `userId` and `keyId` directly from the token string (no DB scan)
2. `GetItem` on `sentinel-users` by `userId`
3. SHA-256 hashes the full token, compares against `apiKeys[keyId].keyHash`
4. Returns `{ isAuthorized: true, context: { userId } }` — `userId` flows into every downstream Lambda via `event.requestContext.authorizer.lambda.userId`

**IoT**: Same API key passed as `?token=` query param on the MQTT WebSocket URL. `mint-iotAuthorizer` Lambda runs once at connection time, same hash-check logic. IoT Core caches the auth result for the session lifetime (`disconnectAfterInSeconds: 86400`). No Lambda invoked per message.

---

## REST API (API Gateway HTTP v2 → Lambda)

All routes are `POST`. Lambdas are Node.js 20.x, arm64, 256MB, 30s timeout. All bundled in a single zip.

| Route | Lambda | What it does |
|---|---|---|
| `POST /keys/create` | `mint-createApiKey` | **No auth** — writes `apiKeys[keyId]` map entry to `sentinel-users` |
| `POST /keys/list` | `mint-listApiKeys` | `GetItem` user record, returns `apiKeys` map without hashes |
| `POST /keys/revoke` | `mint-revokeApiKey` | `REMOVE apiKeys.#keyId` from user record |
| `POST /sessions/start` | `mint-sessionStart` | `PutItem` to `sentinel-sessions` |
| `POST /sessions/end` | `mint-sessionEnd` | `UpdateItem` status/exitCode/endedAt |
| `POST /sessions/list` | `mint-sessionsList` | `Query` by userId, computes duration, sorts by startedAt desc |
| `POST /sessions/get` | `mint-sessionGet` | `GetItem` by userId+sessionId |
| `POST /sessions/transcript` | `mint-getSessionTranscript` | `S3 GetObject` `{userId}/sessions/{sessionId}.jsonl` |
| `POST /sessions/transcript/upload` | `mint-putSessionTranscript` | `S3 PutObject` same path |
| `POST /repos` | `mint-getRepos` | `S3 ListObjectsV2` on bucket `{userId}`, filters out `sessions/` prefix |
| `POST /repos/{repoId}/tree` | `mint-getRepoMetadata` | Paginated `S3 ListObjectsV2`, builds nested file tree |
| `POST /repos/{repoId}/file` | `mint-getFileContent` | `S3 GetObject` key `{repoId}/{path}` |
| `POST /auth/login` | `mint-authLogin` | PBKDF2 password check, returns JWT (unused post API-key migration) |
| `POST /auth/register` | `mint-authRegister` | PBKDF2 hash + salt, `PutItem` to `sentinel-users` |

No Lambda-to-Lambda calls. No VPC. All Lambdas run in the default AWS network and reach DynamoDB/S3/IoT over public AWS endpoints.

---

## DynamoDB

**`sentinel-users`** — PK: `userId`

```json
{
  "userId": "vashispa",
  "passwordHash": "...",
  "salt": "...",
  "createdAt": 1234567890,
  "apiKeys": {
    "a8ec4755": {
      "name": "laptop",
      "keyHash": "sha256...",
      "prefix": "sentinel_a8ec4755_vashispa",
      "createdAt": 1234567890
    }
  }
}
```

**`sentinel-sessions`** — PK: `userId`, SK: `sessionId`

```json
{
  "userId": "vashispa",
  "sessionId": "abc-123",
  "status": "completed",
  "startedAt": 1234567890,
  "endedAt": 1234567990,
  "harness": "claude-code",
  "repo": "my-repo",
  "branch": "main",
  "task": "Fix the login bug",
  "model": "claude-opus-4",
  "node": "MacBook-Pro.local",
  "fsPath": "/Users/me/my-repo",
  "timeout": 3600,
  "memCap": 2048,
  "exitCode": 0
}
```

`duration` is computed at read time (`endedAt - startedAt`, or `now - startedAt` if running). Not stored. No GSIs. No Streams. No TTLs.

---

## S3

One bucket per user, named by `userId`. Flat key structure:

```
vashispa/
  my-repo/                          ← browsable in the file browser
    src/
      index.ts
    package.json
  another-repo/
    ...
  sessions/                         ← filtered out of file browser in getRepos.mjs
    abc-123.jsonl                   ← JSONL transcript, uploaded at session end
    def-456.jsonl
```

No presigned URLs — Lambda fetches content and proxies it through API Gateway. Works fine for text files and transcripts. Large binaries would need presigned URLs.

---

## Real-time (AWS IoT Core → MQTT over WSS)

```
CLI process                          Dashboard (browser)
     │                                      │
     │   MQTT CONNECT (API key as token)    │   MQTT CONNECT (same)
     └──────────────┬───────────────────────┘
                    ▼
            AWS IoT Core (MQTT broker)
            mint-iotAuthorizer Lambda     ← fires once per connection
                    │
       Topic: users/{userId}/sessions/{sessionId}
                    │
       CLI publishes → IoT Core fans out → Dashboard receives
```

### Message types

| type | Payload | Consumer |
|---|---|---|
| `session.start` | `{ sessionId, harness, ... }` | Agents screen (new card) |
| `session.update` | `{ sessionId, status, exitCode? }` | Agents screen + session detail |
| `session.log` | `{ sessionId, line: { t, text } }` | LiveLogs pane |
| `session.metrics` | `{ sessionId, tokensIn, tokensOut, cost, cpu, mem }` | MetricsRail |

Messages are fire-and-forget pub/sub. No persistence — if the dashboard isn't connected when a log arrives, it's gone. The JSONL transcript (uploaded to S3 at session end) is the source of truth for completed sessions.

IoT Core pricing: $1/million messages + $0.08/million connection-minutes. Negligible at this scale.

---

## Frontend Data Flow

```
Next.js 16 App Router
(all data fetching is "use client" + useEffect — no server components fetching data)

/                   fetchSessions() on mount
                    IoT subscribe to users/{userId}/sessions/#
                    session.start  → prepend card
                    session.update → patch card status

/sessions/[id]      fetchSession() on mount
                    IoT subscribe to users/{userId}/sessions/{sessionId}
                    session.log    → append to LiveLogs
                    session.update → patch status + MetricsRail
                    (completed)    → fetchTranscript() → JsonlViewer

/repos              fetchRepos() on mount
/repos/[id]         fetchRepoTree() on mount
                    fetchFileContent() on file click

/settings           listApiKeys() on mount
                    createApiKey() / revokeApiKey() on action
```

### Caching

| Layer | What | TTL |
|---|---|---|
| API Gateway authorizer | Auth result per API key | 300s |
| IoT Core | Auth result per MQTT connection | Session lifetime (up to 86400s) |
| Browser | Nothing — no SWR, no localStorage, no service worker | — |

Every page mount hits the API fresh. IoT patches local React state in memory for the duration of the tab session.

### MQTT singleton

`src/lib/iot.ts` maintains one shared `MqttClient` per browser tab, lazily initialized on first subscribe, reused across navigations. Reconnects every 3s on drop. Dynamic import keeps the `mqtt` package out of the SSR bundle.
