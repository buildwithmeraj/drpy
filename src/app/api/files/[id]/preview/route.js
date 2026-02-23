import { GetObjectCommand } from "@aws-sdk/client-s3";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getDb } from "@/lib/db";
import { resolveR2ForFile } from "@/lib/r2";
import { resolveSessionUser } from "@/lib/userQuota";

export const runtime = "nodejs";

function extensionFromName(name = "") {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function resolvePreviewMimeType(mimeType = "", fileName = "") {
  const ext = extensionFromName(fileName);
  if (mimeType && mimeType !== "application/octet-stream") return mimeType;

  const byExtension = {
    pdf: "application/pdf",
    txt: "text/plain; charset=utf-8",
    md: "text/markdown; charset=utf-8",
    json: "application/json; charset=utf-8",
    csv: "text/csv; charset=utf-8",
    xml: "application/xml; charset=utf-8",
    yml: "application/yaml; charset=utf-8",
    yaml: "application/yaml; charset=utf-8",
    log: "text/plain; charset=utf-8",
  };

  return byExtension[ext] || mimeType || "application/octet-stream";
}

function isPreviewable(mimeType = "", fileName = "") {
  const resolvedMimeType = resolvePreviewMimeType(mimeType, fileName);
  const ext = extensionFromName(fileName);

  if (resolvedMimeType.startsWith("image/")) return true;
  if (resolvedMimeType.startsWith("text/")) return true;
  if (resolvedMimeType.startsWith("audio/")) return true;
  if (resolvedMimeType.startsWith("video/")) return true;
  if (resolvedMimeType === "application/pdf") return true;

  const extensionAllowList = new Set([
    "txt",
    "md",
    "json",
    "csv",
    "xml",
    "pdf",
    "png",
    "jpg",
    "jpeg",
    "gif",
    "webp",
    "svg",
    "mp3",
    "wav",
    "ogg",
    "mp4",
    "webm",
    "mov",
  ]);

  return extensionAllowList.has(ext);
}

export async function GET(_request, { params }) {
  try {
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

    const file = await db.collection("files").findOne({
      _id: new ObjectId(fileId),
      userId: user._id.toString(),
    });
    if (!file) {
      return Response.json({ error: "File not found." }, { status: 404 });
    }

    const mimeType = resolvePreviewMimeType(
      file.mimeType || "application/octet-stream",
      file.originalName,
    );
    if (!isPreviewable(mimeType, file.originalName)) {
      return Response.json(
        { error: "Preview is not available for this file type." },
        { status: 415 },
      );
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

    const dispositionType =
      mimeType.startsWith("image/") ||
      mimeType.startsWith("text/") ||
      mimeType === "application/pdf"
        ? "inline"
        : "attachment";

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `${dispositionType}; filename="${file.originalName || "preview"}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: "Could not preview file.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
