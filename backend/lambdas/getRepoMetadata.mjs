/**
 * POST /repos/{repoId}/tree
 * Body: { "userId": "089830610897-us-east-1-an" }
 *
 * userId is the S3 bucket name. Lists all objects under {repoId}/ prefix
 * and builds a nested file tree.
 *
 * IAM role needs: s3:ListBucket on the user's bucket
 */

import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({});

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

async function listAllObjects(bucket, prefix) {
  const objects = [];
  let token;
  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: token,
    }));
    objects.push(...(res.Contents ?? []));
    token = res.NextContinuationToken;
  } while (token);
  return objects;
}

function buildTree(objects, prefix) {
  const root = [];
  for (const obj of objects) {
    const relative = (obj.Key ?? "").slice(prefix.length);
    // Skip folder marker objects (keys ending with /)
    if (relative.endsWith("/") || relative === "") continue;
    const parts = relative.split("/").filter(Boolean);
    if (parts.length === 0) continue;

    let nodes = root;
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      if (isLast) {
        nodes.push({
          name,
          type: "file",
          size: obj.Size,
          modified: obj.LastModified?.toISOString() ?? null,
        });
      } else {
        let folder = nodes.find((n) => n.name === name && n.type === "folder");
        if (!folder) {
          folder = { name, type: "folder", children: [] };
          nodes.push(folder);
        }
        nodes = folder.children;
      }
    }
  }
  return root;
}

export const handler = async (event) => {
  const userId = event.requestContext?.authorizer?.lambda?.userId;
  const repoId = event.pathParameters?.repoId;

  if (!userId || !repoId) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: "Missing userId or repoId" }) };
  }

  try {
    const prefix = `${repoId}/`;
    const objects = await listAllObjects(userId, prefix);

    if (objects.length === 0) {
      return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: "Repo not found or empty" }) };
    }

    const tree = buildTree(objects, prefix);
    const totalSize = objects.reduce((s, o) => s + (o.Size ?? 0), 0);
    const fileCount = objects.length;

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ tree, totalSize, fileCount }),
    };
  } catch (err) {
    console.error("[getRepoMetadata]", err);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: "Failed to fetch repo tree" }) };
  }
};
