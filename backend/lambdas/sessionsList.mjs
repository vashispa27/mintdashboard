import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const db = new DynamoDBClient({});
const TABLE = process.env.SESSIONS_TABLE;

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export const handler = async (event) => {
  try {
    const { userId } = JSON.parse(event.body ?? "{}");

    if (!userId) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: "userId required" }) };
    }

    const result = await db.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: marshall({ ":uid": userId }),
    }));

    const now = Date.now();
    const sessions = (result.Items ?? [])
      .map(unmarshall)
      .map((s) => ({
        ...s,
        duration: s.status === "running"
          ? now - s.startedAt
          : (s.endedAt ? s.endedAt - s.startedAt : 0),
      }))
      .sort((a, b) => b.startedAt - a.startedAt);

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ sessions }) };
  } catch (err) {
    console.error("[sessionsList]", err);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: "Failed to list sessions" }) };
  }
};
