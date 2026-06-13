import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { createHash, randomBytes } from "crypto";

const db = new DynamoDBClient({});
const USERS_TABLE = process.env.USERS_TABLE ?? "";

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? "{}");
    // userId comes from authorizer context if authenticated, or from body for first-key bootstrap
    const userId = event.requestContext?.authorizer?.lambda?.userId ?? body.userId;
    if (!userId) return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: "userId required" }) };

    const { name } = body;
    if (!name) return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: "name required" }) };

    const keyId = randomBytes(4).toString("hex");
    const rawKey = `sentinel_${keyId}_${userId}_${randomBytes(32).toString("hex")}`;
    const keyHash = createHash("sha256").update(rawKey).digest("hex");
    const prefix = `sentinel_${keyId}_${userId}`;
    const createdAt = Date.now();

    // DynamoDB creates the apiKeys map automatically if it doesn't exist
    await db.send(new UpdateItemCommand({
      TableName: USERS_TABLE,
      Key: { userId: { S: userId } },
      UpdateExpression: "SET apiKeys.#kid = :key",
      ExpressionAttributeNames: { "#kid": keyId },
      ExpressionAttributeValues: {
        ":key": {
          M: {
            name: { S: name },
            keyHash: { S: keyHash },
            prefix: { S: prefix },
            createdAt: { N: String(createdAt) },
          },
        },
      },
    }));

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ keyId, name, prefix, createdAt, key: rawKey }),
    };
  } catch (err) {
    // apiKeys map doesn't exist yet — init it then retry
    if (err.name === "ValidationException") {
      try {
        const body2 = JSON.parse(event.body ?? "{}");
        const userId = event.requestContext?.authorizer?.lambda?.userId ?? body2.userId;
        const { name } = body2;
        const keyId = randomBytes(4).toString("hex");
        const rawKey = `sentinel_${keyId}_${userId}_${randomBytes(32).toString("hex")}`;
        const keyHash = createHash("sha256").update(rawKey).digest("hex");
        const prefix = `sentinel_${keyId}_${userId}`;
        const createdAt = Date.now();

        await db.send(new UpdateItemCommand({
          TableName: USERS_TABLE,
          Key: { userId: { S: userId } },
          UpdateExpression: "SET apiKeys = :init",
          ExpressionAttributeValues: {
            ":init": {
              M: {
                [keyId]: {
                  M: {
                    name: { S: name },
                    keyHash: { S: keyHash },
                    prefix: { S: prefix },
                    createdAt: { N: String(createdAt) },
                  },
                },
              },
            },
          },
        }));

        return {
          statusCode: 200,
          headers: HEADERS,
          body: JSON.stringify({ keyId, name, prefix, createdAt, key: rawKey }),
        };
      } catch (retryErr) {
        console.error("[createApiKey] retry failed", retryErr);
        return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: "Failed to create key" }) };
      }
    }

    console.error("[createApiKey]", err);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: "Failed to create key" }) };
  }
};
