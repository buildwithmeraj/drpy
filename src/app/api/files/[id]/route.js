import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getDb } from "@/lib/db";
import { resolveR2ForFile } from "@/lib/r2";
import { assertCsrf } from "@/lib/security";
import { normalizeFolder } from "@/lib/validation";
import { resolveSessionUser } from "@/lib/userQuota";

export const runtime = "nodejs";

export async function DELETE(_request, { params }) {
  try {
    const csrfError = assertCsrf(_request);
    if (csrfError) return csrfError;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id: fileId } = await params;
    if (!fileId || !ObjectId.isValid(fileId)) {
      return Response.json({ error: "Invalid file id." }, { status: 400 });
    }

    const db = await getDb();
    const user = await resolveSessionUser(db, session.user);

    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const filesCollection = db.collection("files");
    const file = await filesCollection.findOne({
      _id: new ObjectId(fileId),
      userId: user._id.toString(),
    });

    if (!file) {
      return Response.json({ error: "File not found." }, { status: 404 });
    }

    const storage = resolveR2ForFile(file);
    await storage.client.send(
      new DeleteObjectCommand({
        Bucket: storage.bucketName,
        Key: file.key,
      }),
    );

    await filesCollection.deleteOne({ _id: file._id });
    await db.collection("links").deleteMany({ fileId: file._id.toString() });

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $inc: { storageUsedBytes: -(file.size || 0) },
        $set: { updatedAt: new Date() },
      },
    );

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      {
        error: "Could not delete file.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const csrfError = assertCsrf(request);
    if (csrfError) return csrfError;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id: fileId } = await params;
    if (!fileId || !ObjectId.isValid(fileId)) {
      return Response.json({ error: "Invalid file id." }, { status: 400 });
    }

    const body = await request.json();
    const folder = normalizeFolder(body?.folder);

    const db = await getDb();
    const user = await resolveSessionUser(db, session.user);
    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const result = await db.collection("files").updateOne(
      { _id: new ObjectId(fileId), userId: user._id.toString() },
      { $set: { folder, updatedAt: new Date() } },
    );

    if (!result.matchedCount) {
      return Response.json({ error: "File not found." }, { status: 404 });
    }

    return Response.json({ ok: true, folder });
  } catch (error) {
    return Response.json(
      {
        error: "Could not update file.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
