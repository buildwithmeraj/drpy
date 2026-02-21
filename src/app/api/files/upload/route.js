import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { authOptions } from "@/auth";
import { getDb } from "@/lib/db";
import { getR2BucketName, getR2Client, getR2PublicBaseUrl } from "@/lib/r2";
import { assertCsrf } from "@/lib/security";
import { validateUploadPolicy } from "@/lib/uploadPolicy";
import { resolveSessionUser } from "@/lib/userQuota";
import { normalizeFolder } from "@/lib/validation";

export const runtime = "nodejs";

function safeFilename(name) {
  return name.replace(/[^\w.\-]/g, "_");
}

export async function POST(request) {
  try {
    const csrfError = assertCsrf(request);
    if (csrfError) return csrfError;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = normalizeFolder(formData.get("folder"));
    const policy = validateUploadPolicy(file);
    if (!policy.ok) {
      return Response.json({ error: policy.error }, { status: 400 });
    }

    const db = await getDb();
    const user = await resolveSessionUser(db, session.user);

    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const quotaLimitBytes = user.quotaLimitBytes || 0;
    const storageUsedBytes = user.storageUsedBytes || 0;

    if (storageUsedBytes + file.size > quotaLimitBytes) {
      return Response.json(
        { error: "Storage quota exceeded for this account." },
        { status: 403 },
      );
    }

    const bucketName = getR2BucketName();
    const contentType = policy.mimeType;
    const safeName = safeFilename(file.name);
    const key = `${user._id.toString()}/${Date.now()}-${randomUUID()}-${safeName}`;
    const body = Buffer.from(await file.arrayBuffer());

    const r2Client = getR2Client();
    await r2Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
        ContentLength: file.size,
      }),
    );

    const createdAt = new Date();
    const publicBaseUrl = getR2PublicBaseUrl();
    const publicUrl = publicBaseUrl ? `${publicBaseUrl.replace(/\/$/, "")}/${key}` : null;

    const insertResult = await db.collection("files").insertOne({
      userId: user._id.toString(),
      originalName: file.name,
      mimeType: contentType,
      size: file.size,
      key,
      bucket: bucketName,
      publicUrl,
      folder,
      createdAt,
      updatedAt: createdAt,
    });

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $inc: { storageUsedBytes: file.size },
        $set: { updatedAt: new Date() },
      },
    );

    return Response.json(
      {
        ok: true,
        file: {
          id: insertResult.insertedId.toString(),
          originalName: file.name,
          mimeType: contentType,
          size: file.size,
          key,
          publicUrl,
          folder,
          createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error: "Upload failed.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
