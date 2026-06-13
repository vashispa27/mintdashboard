import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import crypto from "crypto";

const db = new DynamoDBClient({});
const USERS_TABLE = process.env.USERS_TABLE;

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

export const handler = async (event) => {
  try {
    const { userId, password } = JSON.parse(event.body ?? "{}");

    if (!userId || !password) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: "userId and password required" }) };
    }

    const salt         = crypto.randomBytes(32).toString("hex");
    const passwordHash = hashPassword(password, salt);

    await db.send(new PutItemCommand({
      TableName: USERS_TABLE,
      Item: marshall({ userId, passwordHash, salt, createdAt: Date.now() }),
      ConditionExpression: "attribute_not_exists(userId)",
    }));

    return { statusCode: 201, headers: HEADERS, body: JSON.stringify({ ok: true, userId }) };
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return { statusCode: 409, headers: HEADERS, body: JSON.stringify({ error: "User already exists" }) };
    }
    console.error("[authRegister]", err);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: "Registration failed" }) };
  }
};
