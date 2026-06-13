import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const db = new DynamoDBClient({});
const TABLE = process.env.SESSIONS_TABLE;

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export const handler = async (event) => {
  try {
    const userId = event.requestContext?.authorizer?.lambda?.userId;
    const { sessionId, status, exitCode } = JSON.parse(event.body ?? "{}");

    if (!userId || !sessionId || !status) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: "userId, sessionId, status required" }) };
    }

    const endedAt = Date.now();
    const hasExitCode = exitCode != null;

    await db.send(new UpdateItemCommand({
      TableName: TABLE,
      Key: marshall({ userId, sessionId }),
      UpdateExpression: "SET #s = :status, endedAt = :endedAt" + (hasExitCode ? ", exitCode = :exitCode" : ""),
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: marshall({
        ":status": status,
        ":endedAt": endedAt,
        ...(hasExitCode && { ":exitCode": exitCode }),
      }),
    }));

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("[sessionEnd]", err);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: "Failed to end session" }) };
  }
};
