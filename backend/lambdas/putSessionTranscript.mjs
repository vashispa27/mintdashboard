import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export const handler = async (event) => {
  try {
    const userId = event.requestContext?.authorizer?.lambda?.userId;
    const { sessionId, content } = JSON.parse(event.body ?? "{}");

    if (!userId || !sessionId || !content) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: "userId, sessionId, content required" }) };
    }

    const key = `sessions/${sessionId}.jsonl`;

    await s3.send(new PutObjectCommand({
      Bucket: userId,
      Key: key,
      Body: content,
      ContentType: "application/x-ndjson",
    }));

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true, key }) };
  } catch (err) {
    console.error("[putSessionTranscript]", err);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: "Failed to upload transcript" }) };
  }
};
