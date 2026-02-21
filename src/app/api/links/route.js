import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getDb } from "@/lib/db";
import { assertCsrf } from "@/lib/security";
import { generateShareCode, isExpired } from "@/lib/shareLinks";
import { toSafeInt } from "@/lib/validation";
import { resolveSessionUser } from "@/lib/userQuota";

export const runtime = "nodejs";

const MIN_EXPIRY_HOURS = 1;
const MAX_EXPIRY_HOURS = 30 * 24;

function linkStatus(link) {
  if (isExpired(link.expiresAt)) return "expired";
  if (
    typeof link.maxDownloads === "number" &&
    link.maxDownloads > 0 &&
    (link.downloadCount || 0) >= link.maxDownloads
  ) {
    return "limit_reached";
  }
  return "active";
}

async function createUniqueCode(db) {
  let code = generateShareCode();
  let exists = await db.collection("links").findOne({ code });
  while (exists) {
    code = generateShareCode();
    exists = await db.collection("links").findOne({ code });
  }
  return code;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const db = await getDb();
    const user = await resolveSessionUser(db, session.user);
    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const rows = await db
      .collection("links")
      .aggregate([
        { $match: { userId: user._id.toString() } },
        {
          $lookup: {
            from: "files",
            let: { fileObjectId: { $toObjectId: "$fileId" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$fileObjectId"] } } }],
            as: "file",
          },
        },
        { $unwind: { path: "$file", preserveNullAndEmptyArrays: true } },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    const links = rows.map((row) => ({
      id: row._id.toString(),
      code: row.code,
      urlPath: `/s/${row.code}`,
      fileId: row.fileId,
      fileName: row.file?.originalName || "Unknown file",
      fileSize: row.file?.size || 0,
      hasPassword: Boolean(row.hasPassword),
      expiresAt: row.expiresAt,
      maxDownloads: row.maxDownloads,
      downloadCount: row.downloadCount || 0,
      status: linkStatus(row),
      createdAt: row.createdAt,
    }));

    return Response.json({ ok: true, links });
  } catch (error) {
    return Response.json(
      {
        error: "Could not fetch links.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const csrfError = assertCsrf(request);
    if (csrfError) return csrfError;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const fileId = body?.fileId;
    const password = body?.password?.trim() || "";
    const expiryHours = toSafeInt(body?.expiryHours, 24);
    const deleteAfterDownloads = Boolean(body?.deleteAfterDownloads);
    const maxDownloadsInput = body?.maxDownloads;
    const parsedMaxDownloads = toSafeInt(maxDownloadsInput, null);
    const maxDownloads = deleteAfterDownloads ? parsedMaxDownloads : null;

    if (!fileId || !ObjectId.isValid(fileId)) {
      return Response.json({ error: "Invalid file id." }, { status: 400 });
    }

    if (expiryHours < MIN_EXPIRY_HOURS || expiryHours > MAX_EXPIRY_HOURS) {
      return Response.json(
        { error: "Expiry must be between 1 hour and 30 days." },
        { status: 400 },
      );
    }

    if (deleteAfterDownloads && (!Number.isInteger(maxDownloads) || maxDownloads < 1)) {
      return Response.json(
        { error: "Delete-after-downloads must be a positive integer." },
        { status: 400 },
      );
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

    const code = await createUniqueCode(db);
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    const hasPassword = Boolean(password);
    const passwordHash = hasPassword ? await bcrypt.hash(password, 12) : null;
    const now = new Date();

    await db.collection("links").insertOne({
      code,
      userId: user._id.toString(),
      fileId: file._id.toString(),
      hasPassword,
      passwordHash,
      expiresAt,
      maxDownloads,
      downloadCount: 0,
      lastDownloadedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    return Response.json(
      {
        ok: true,
        link: {
          code,
          urlPath: `/s/${code}`,
          expiresAt,
          hasPassword,
          maxDownloads,
          status: "active",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error: "Could not create share link.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
