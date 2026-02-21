import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { getR2BucketName, getR2Client } from "@/lib/r2";
import { resolveSessionUser } from "@/lib/userQuota";

export const runtime = "nodejs";

export async function DELETE(_request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id: fileId } = await params;
    if (!fileId || !ObjectId.isValid(fileId)) {
      return Response.json({ error: "Invalid file id." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
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

    const r2Client = getR2Client();
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: getR2BucketName(),
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
