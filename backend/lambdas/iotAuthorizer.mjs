import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { createHash } from "crypto";

const db = new DynamoDBClient({});
const USERS_TABLE = process.env.USERS_TABLE ?? "";

// token format: sentinel_{8hexId}_{userId}_{64hexRandom}
function parseToken(token) {
  if (!token.startsWith("sentinel_")) return null;
  const after = token.slice("sentinel_".length);
  const keyId = after.slice(0, 8);
  const rest = after.slice(9);
  const lastUnderscore = rest.lastIndexOf("_");
  if (lastUnderscore === -1) return null;
  const userId = rest.slice(0, lastUnderscore);
  if (!userId || !keyId) return null;
  return { userId, keyId };
}

async function verifyApiKey(token) {
  const parsed = parseToken(token);
  if (!parsed) return null;
  const { userId, keyId } = parsed;

  const result = await db.send(new GetItemCommand({
    TableName: USERS_TABLE,
    Key: { userId: { S: userId } },
  }));
  if (!result.Item) return null;

  const user = unmarshall(result.Item);
  const keyRecord = user.apiKeys?.[keyId];
  if (!keyRecord) return null;

  const tokenHash = createHash("sha256").update(token).digest("hex");
  if (tokenHash !== keyRecord.keyHash) return null;

  return userId;
}

export const handler = async (event) => {
  const token = event.token ?? "";

  let userId = null;
  try {
    userId = await verifyApiKey(token);
  } catch (err) {
    console.error("[iotAuthorizer]", err);
  }

  if (!userId) {
    return {
      isAuthenticated: false,
      principalId: "unknown",
      disconnectAfterInSeconds: 0,
      refreshAfterInSeconds: 300,
      policyDocuments: [],
    };
  }

  return {
    isAuthenticated: true,
    principalId: userId,
    disconnectAfterInSeconds: 86400,
    refreshAfterInSeconds: 300,
    policyDocuments: [{
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: "iot:Connect",
          Resource: "*",
        },
        {
          Effect: "Allow",
          Action: ["iot:Publish", "iot:Subscribe", "iot:Receive"],
          Resource: [
            `arn:aws:iot:*:*:topic/users/${userId}/*`,
            `arn:aws:iot:*:*:topicfilter/users/${userId}/*`,
          ],
        },
      ],
    }],
  };
};
