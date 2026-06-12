import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({});

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export const handler = async (event) => {
  try {
    const bucket = event.queryStringParameters?.userId;

    if (!bucket) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: "Missing userId" }) };
    }

    const res = await s3.send(new ListObjectsV2Command({
      Bucket: bucket,
      Delimiter: "/",
    }));

    const repos = (res.CommonPrefixes ?? []).map((p) => {
      const name = p.Prefix.replace(/\/$/, "");
      return { id: name, name };
    });

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify(repos),
    };
  } catch (err) {
    console.error("[getRepos]", err);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: "Failed to list repos" }),
    };
  }
};