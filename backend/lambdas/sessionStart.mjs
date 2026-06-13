import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const db = new DynamoDBClient({});
const TABLE = process.env.SESSIONS_TABLE;

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? "{}");
    const { userId, sessionId, harness, repo, branch, task, model, node, fsPath, timeout, memCap } = body;

    if (!userId || !sessionId) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: "userId and sessionId required" }) };
    }

    const item = {
      userId,
      sessionId,
      status: "running",
      startedAt: Date.now(),
      ...(harness  && { harness }),
      ...(repo     && { repo }),
      ...(branch   && { branch }),
      ...(task     && { task }),
      ...(model    && { model }),
      ...(node     && { node }),
      ...(fsPath   && { fsPath }),
      ...(timeout  != null && { timeout }),
      ...(memCap   != null && { memCap }),
    };

    await db.send(new PutItemCommand({ TableName: TABLE, Item: marshall(item) }));

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true, sessionId }) };
  } catch (err) {
    console.error("[sessionStart]", err);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: "Failed to start session" }) };
  }
};
