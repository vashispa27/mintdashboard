import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { createHash } from "crypto";

const db = new DynamoDBClient({});
const USERS_TABLE = process.env.USERS_TABLE ?? "";

// token format: sentinel_{8hexId}_{userId}_{64hexRandom}
function parseToken(token) {
  if (!token.startsWith("sentinel_")) return null;
  const after = token.slice("sentinel_".length); // {8hexId}_{userId}_{64hexRandom}
  const keyId = after.slice(0, 8);
  const rest = after.slice(9); // {userId}_{64hexRandom}
  const lastUnderscore = rest.lastIndexOf("_");
  if (lastUnderscore === -1) return null;
  const userId = rest.slice(0, lastUnderscore);
  if (!userId || !keyId) return null;
  return { userId, keyId };
}

export const handler = async (event) => {
  const authHeader = event.headers?.authorization ?? event.headers?.Authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) return { isAuthorized: false };

  const parsed = parseToken(token);
  if (!parsed) return { isAuthorized: false };

  const { userId, keyId } = parsed;

  try {
    const result = await db.send(new GetItemCommand({
      TableName: USERS_TABLE,
      Key: { userId: { S: userId } },
    }));

    if (!result.Item) return { isAuthorized: false };

    const user = unmarshall(result.Item);
    const keyRecord = user.apiKeys?.[keyId];
    if (!keyRecord) return { isAuthorized: false };

    const tokenHash = createHash("sha256").update(token).digest("hex");
    if (tokenHash !== keyRecord.keyHash) return { isAuthorized: false };

    return { isAuthorized: true, context: { userId } };
  } catch (err) {
    console.error("[apiAuthorizer]", err);
    return { isAuthorized: false };
  }
};
