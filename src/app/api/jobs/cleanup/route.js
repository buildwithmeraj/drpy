import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { resolveR2ForFile } from "@/lib/r2";

export const runtime = "nodejs";

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const incoming = request.headers.get("x-cron-secret");
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;
  return incoming === secret || bearer === secret;
}

async function runCleanup(request) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const now = new Date();
    const db = await getDb();
    const retentionDays = Number.parseInt(
      process.env.ORPHAN_FILE_RETENTION_DAYS || "30",
      10,
    );
    const cutoff = new Date(
      Date.now() -
        (Number.isFinite(retentionDays) ? retentionDays : 30) * 86400000,
    );

    // Step 1: Delete expired links
    const linksResult = await db.collection("links").deleteMany({
      $or: [
        { expiresAt: { $lte: now } },
        {
          $and: [
            { maxDownloads: { $type: "number" } },
            { $expr: { $gte: ["$downloadCount", "$maxDownloads"] } },
          ],
        },
      ],
    });

    // Step 2: Find and delete orphaned files
    const orphanFiles = await db
      .collection("files")
      .aggregate([
        { $match: { createdAt: { $lte: cutoff } } },
        {
          $lookup: {
            from: "links",
            let: { fileIdString: { $toString: "$_id" } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$fileId", "$$fileIdString"] },
                },
              },
            ],
            as: "activeLinksRaw",
          },
        },
        {
          $addFields: {
            activeLinks: {
              $filter: {
                input: "$activeLinksRaw",
                as: "link",
                cond: { $gt: ["$$link.expiresAt", now] },
              },
            },
          },
        },
        { $match: { activeLinks: { $size: 0 } } },
      ])
      .toArray();

    let orphanDeletedCount = 0;
    if (orphanFiles.length) {
      for (const file of orphanFiles) {
        const storage = resolveR2ForFile(file);
        await storage.client.send(
          new DeleteObjectCommand({
            Bucket: storage.bucketName,
            Key: file.key,
          }),
        );

        await db.collection("files").deleteOne({ _id: file._id });
        await db.collection("users").updateOne(
          {
            _id:
              typeof file.userId === "string" && ObjectId.isValid(file.userId)
                ? new ObjectId(file.userId)
                : file.userId,
          },
          {
            $inc: { storageUsedBytes: -(file.size || 0) },
            $set: { updatedAt: new Date() },
          },
        );
      }

      orphanDeletedCount = orphanFiles.length;
    }

    return Response.json({
      ok: true,
      expiredLinksDeleted: linksResult.deletedCount || 0,
      orphanFilesDeleted: orphanDeletedCount,
      retentionDays,
      ranAt: now.toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        error: "Cleanup job failed.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  return runCleanup(request);
}

export async function GET(request) {
  return runCleanup(request);
}
