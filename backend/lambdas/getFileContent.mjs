/**
 * POST /repos/{repoId}/file
 * Body: { "userId": "089830610897-us-east-1-an", "path": "src/index.ts" }
 *
 * userId is the S3 bucket name. Fetches file at key: {repoId}/{path}
 *
 * IAM role needs: s3:GetObject on the user's bucket
 */

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export const handler = async (event) => {
  const { userId, path: filePath } = JSON.parse(event.body ?? "{}");
  const repoId = event.pathParameters?.repoId;

  if (!userId || !repoId || !filePath) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: "Missing userId, repoId, or path" }) };
  }

  try {
    const key = `${repoId}/${filePath}`;
    const res = await s3.send(new GetObjectCommand({
      Bucket: userId,
      Key: key,
    }));

    const content = await res.Body.transformToString("utf-8");
    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ content, key }),
    };
  } catch (err) {
    if (err.name === "NoSuchKey") {
      return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: "File not found" }) };
    }
    console.error("[getFileContent]", err);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: "Failed to fetch file" }) };
  }
};
