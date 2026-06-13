import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});

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

    const key = `sessions/${sessionId}.jsonl`;
    const result = await s3.send(new GetObjectCommand({ Bucket: userId, Key: key }));
    const content = await result.Body.transformToString();

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ content, key }) };
  } catch (err) {
    if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) {
      return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: "Transcript not found" }) };
    }
    console.error("[getSessionTranscript]", err);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: "Failed to fetch transcript" }) };
  }
};
