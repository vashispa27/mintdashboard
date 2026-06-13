import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const db = new DynamoDBClient({});
const USERS_TABLE = process.env.USERS_TABLE ?? "";

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export const handler = async (event) => {
  try {
    const userId = event.requestContext?.authorizer?.lambda?.userId;
    if (!userId) return { statusCode: 401, headers: HEADERS, body: JSON.stringify({ error: "Unauthorized" }) };

    const { keyId } = JSON.parse(event.body ?? "{}");
    if (!keyId) return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: "keyId required" }) };

    await db.send(new UpdateItemCommand({
      TableName: USERS_TABLE,
      Key: { userId: { S: userId } },
      UpdateExpression: "REMOVE apiKeys.#kid",
      ExpressionAttributeNames: { "#kid": keyId },
    }));

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("[revokeApiKey]", err);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: "Failed to revoke key" }) };
  }
};
