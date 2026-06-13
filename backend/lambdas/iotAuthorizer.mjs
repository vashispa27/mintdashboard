import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;

function verifyJWT(token) {
  try {
    const [header, body, sig] = token.split(".");
    const expected = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp && payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export const handler = async (event) => {
  const token   = event.token;
  const payload = verifyJWT(token);

  if (!payload) return { isAuthenticated: false };

  const { userId } = payload;

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
