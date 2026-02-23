import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { authOptions } from "@/auth";
import { getDb } from "@/lib/db";
import { getR2UploadTarget, getTotalR2StorageLimitBytes } from "@/lib/r2";
import { DEFAULT_QUOTA_BYTES } from "@/lib/quota";
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

    const quotaLimitBytes = user.quotaLimitBytes || DEFAULT_QUOTA_BYTES;
    const storageUsedBytes = user.storageUsedBytes || 0;
    const globalStorageLimitBytes = getTotalR2StorageLimitBytes();
    const globalUsageResult = await db.collection("files").aggregate([
      {
        $group: {
          _id: null,
          totalUsedBytes: { $sum: { $ifNull: ["$size", 0] } },
        },
      },
    ]).toArray();
    const globalUsedBytes = globalUsageResult[0]?.totalUsedBytes || 0;

    if (storageUsedBytes + file.size > quotaLimitBytes) {
      return Response.json(
        { error: "Storage quota exceeded for this account." },
        { status: 403 },
      );
    }
    if (globalUsedBytes + file.size > globalStorageLimitBytes) {
      return Response.json(
        {
          error:
            "Not enough storage is available. Please contact the admin to add more storage.",
        },
        { status: 403 },
      );
    }

    const uploadTarget = getR2UploadTarget(user._id.toString());
    const bucketName = uploadTarget.bucketName;
    const contentType = policy.mimeType;
    const safeName = safeFilename(file.name);
    const key = `${user._id.toString()}/${Date.now()}-${randomUUID()}-${safeName}`;
    const body = Buffer.from(await file.arrayBuffer());

    await uploadTarget.client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
        ContentLength: file.size,
      }),
    );

    const createdAt = new Date();
    const publicBaseUrl = uploadTarget.publicBaseUrl;
    const publicUrl = publicBaseUrl ? `${publicBaseUrl.replace(/\/$/, "")}/${key}` : null;

    const insertResult = await db.collection("files").insertOne({
      userId: user._id.toString(),
      originalName: file.name,
      mimeType: contentType,
      size: file.size,
      key,
      bucket: bucketName,
      r2AccountKey: uploadTarget.accountKey,
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
          r2AccountKey: uploadTarget.accountKey,
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
