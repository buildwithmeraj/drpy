import bcrypt from "bcryptjs";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { hashIp } from "@/lib/analytics";
import { resolveR2ForFile } from "@/lib/r2";
import { claimDownloadSlot } from "@/lib/downloadGate";
import { enforceShareRateLimit } from "@/lib/shareRateLimit";
import { getShareMetaByCode } from "@/lib/shareLookup";
import { logApiError } from "@/lib/serverLog";

export const runtime = "nodejs";

function sanitizeFilename(filename) {
  return filename.replace(/["\\\r\n]/g, "_");
}

export async function POST(request, { params }) {
  let requestCode = null;
  try {
    const { code } = await params;
    requestCode = code;
    if (!code) {
      return Response.json({ error: "Invalid link." }, { status: 400 });
    }
    const rateLimitError = enforceShareRateLimit(request, code, "download");
    if (rateLimitError) return rateLimitError;

    const body = await request.json().catch(() => ({}));
    const password = body?.password?.trim() || "";

    const db = await getDb();

    const link = await db.collection("links").findOne({ code });
    if (!link) {
      return Response.json({ error: "Link not found." }, { status: 404 });
    }

    const meta = await getShareMetaByCode(db, code);
    if (meta.status !== 200) {
      return Response.json({ error: meta.error }, { status: meta.status });
    }

    if (link.hasPassword) {
      if (!password) {
        return Response.json({ error: "Password required." }, { status: 401 });
      }

      const isPasswordValid = await bcrypt.compare(password, link.passwordHash || "");
      if (!isPasswordValid) {
        return Response.json({ error: "Invalid password." }, { status: 401 });
      }
    }

    if (!meta.data.fileId || !ObjectId.isValid(meta.data.fileId)) {
      return Response.json({ error: "Invalid file reference." }, { status: 500 });
    }

    const file = await db.collection("files").findOne({ _id: new ObjectId(meta.data.fileId) });
    if (!file) {
      return Response.json({ error: "File no longer exists." }, { status: 404 });
    }

    const storage = resolveR2ForFile(file);
    const object = await storage.client.send(
      new GetObjectCommand({
        Bucket: storage.bucketName,
        Key: file.key,
      }),
    );

    if (!object.Body) {
      return Response.json({ error: "File content unavailable." }, { status: 500 });
    }

    const stream =
      typeof object.Body.transformToWebStream === "function"
        ? object.Body.transformToWebStream()
        : object.Body;

    const downloadGate = await claimDownloadSlot({ db, linkId: link._id });

    if (!downloadGate) {
      return Response.json(
        { error: "Download limit reached or link expired." },
        { status: 410 },
      );
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")?.[0]?.trim() || request.headers.get("x-real-ip");
    const userAgent = request.headers.get("user-agent") || "";

    await db.collection("analytics").insertOne({
      eventType: "download",
      ownerUserId: link.userId || null,
      linkId: link._id.toString(),
      fileId: link.fileId || null,
      bytesTransferred: file.size || 0,
      ipHash: hashIp(clientIp),
      userAgent,
      createdAt: new Date(),
    });

    const headers = {
      "Content-Type": file.mimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${sanitizeFilename(file.originalName || "download")}"`,
    };

    if (typeof file.size === "number" && file.size > 0) {
      headers["Content-Length"] = String(file.size);
    }

    return new Response(stream, {
      status: 200,
      headers,
    });
  } catch (error) {
    logApiError("share.download.failed", {
      code: requestCode,
      error,
    });
    return Response.json(
      {
        error: "Could not download file.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
