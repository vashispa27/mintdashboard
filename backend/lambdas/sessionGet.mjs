import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const db = new DynamoDBClient({});
const TABLE = process.env.SESSIONS_TABLE;

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export const handler = async (event) => {
  try {
    const userId = event.requestContext?.authorizer?.lambda?.userId;
    const { sessionId } = JSON.parse(event.body ?? "{}");

    if (!userId || !sessionId) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: "userId and sessionId required" }) };
    }

    const result = await db.send(new GetItemCommand({
      TableName: TABLE,
      Key: marshall({ userId, sessionId }),
    }));

    if (!result.Item) {
      return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: "Session not found" }) };
    }

    const session = unmarshall(result.Item);
    const now = Date.now();
    session.duration = session.status === "running"
      ? now - session.startedAt
      : (session.endedAt ? session.endedAt - session.startedAt : 0);

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ session }) };
  } catch (err) {
    console.error("[sessionGet]", err);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: "Failed to get session" }) };
  }
};
