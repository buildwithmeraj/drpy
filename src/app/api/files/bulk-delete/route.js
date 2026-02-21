import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getDb } from "@/lib/db";
import { getR2BucketName, getR2Client } from "@/lib/r2";
import { assertCsrf } from "@/lib/security";
import { resolveSessionUser } from "@/lib/userQuota";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const csrfError = assertCsrf(request);
    if (csrfError) return csrfError;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const fileIds = Array.isArray(body?.fileIds) ? body.fileIds : [];
    const validIds = fileIds.filter((id) => typeof id === "string" && ObjectId.isValid(id));

    if (!validIds.length) {
      return Response.json({ error: "No valid file ids provided." }, { status: 400 });
    }

    const db = await getDb();
    const user = await resolveSessionUser(db, session.user);
    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const objectIds = validIds.map((id) => new ObjectId(id));
    const files = await db
      .collection("files")
      .find({ _id: { $in: objectIds }, userId: user._id.toString() })
      .toArray();

    if (!files.length) {
      return Response.json({ error: "No files matched." }, { status: 404 });
    }

    const r2Client = getR2Client();
    const bucket = getR2BucketName();
    for (const file of files) {
      await r2Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: file.key,
        }),
      );
    }

    const totalDeletedBytes = files.reduce((sum, file) => sum + (file.size || 0), 0);
    const fileIdStrings = files.map((file) => file._id.toString());
    await db.collection("files").deleteMany({ _id: { $in: files.map((file) => file._id) } });
    await db.collection("links").deleteMany({ fileId: { $in: fileIdStrings } });
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $inc: { storageUsedBytes: -totalDeletedBytes },
        $set: { updatedAt: new Date() },
      },
    );

    return Response.json({ ok: true, deletedCount: files.length });
  } catch (error) {
    return Response.json(
      {
        error: "Bulk delete failed.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
