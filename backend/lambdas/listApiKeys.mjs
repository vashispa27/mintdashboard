import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

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

    const result = await db.send(new GetItemCommand({
      TableName: USERS_TABLE,
      Key: { userId: { S: userId } },
    }));

    if (!result.Item) return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: "User not found" }) };

    const user = unmarshall(result.Item);
    const apiKeys = user.apiKeys ?? {};

    const keys = Object.entries(apiKeys).map(([keyId, rec]) => ({
      keyId,
      name: rec.name,
      prefix: rec.prefix,
      createdAt: rec.createdAt,
    }));

    keys.sort((a, b) => b.createdAt - a.createdAt);

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ keys }) };
  } catch (err) {
    console.error("[listApiKeys]", err);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: "Failed to list keys" }) };
  }
};
