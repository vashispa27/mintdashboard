import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import crypto from "crypto";

const db = new DynamoDBClient({});
const USERS_TABLE = process.env.USERS_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

function signJWT(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body   = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig    = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

export const handler = async (event) => {
  try {
    const { userId, password } = JSON.parse(event.body ?? "{}");

    if (!userId || !password) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: "userId and password required" }) };
    }

    const result = await db.send(new GetItemCommand({
      TableName: USERS_TABLE,
      Key: marshall({ userId }),
    }));

    if (!result.Item) {
      return { statusCode: 401, headers: HEADERS, body: JSON.stringify({ error: "Invalid credentials" }) };
    }

    const user = unmarshall(result.Item);
    const hash = hashPassword(password, user.salt);

    if (hash !== user.passwordHash) {
      return { statusCode: 401, headers: HEADERS, body: JSON.stringify({ error: "Invalid credentials" }) };
    }

    const token = signJWT({
      userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    });

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ token, userId }) };
  } catch (err) {
    console.error("[authLogin]", err);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: "Login failed" }) };
  }
};
