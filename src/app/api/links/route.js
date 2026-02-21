import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { generateShareCode } from "@/lib/shareLinks";
import { resolveSessionUser } from "@/lib/userQuota";

export const runtime = "nodejs";

const MIN_EXPIRY_HOURS = 1;
const MAX_EXPIRY_HOURS = 30 * 24;

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const fileId = body?.fileId;
    const password = body?.password?.trim() || "";
    const expiryHours = toInt(body?.expiryHours, 24);
    const maxDownloadsInput = body?.maxDownloads;
    const maxDownloads =
      maxDownloadsInput === "" || maxDownloadsInput === null || maxDownloadsInput === undefined
        ? null
        : toInt(maxDownloadsInput, null);

    if (!fileId || !ObjectId.isValid(fileId)) {
      return Response.json({ error: "Invalid file id." }, { status: 400 });
    }

    if (expiryHours < MIN_EXPIRY_HOURS || expiryHours > MAX_EXPIRY_HOURS) {
      return Response.json(
        { error: "Expiry must be between 1 hour and 30 days." },
        { status: 400 },
      );
    }

    if (maxDownloads !== null && (!Number.isInteger(maxDownloads) || maxDownloads < 1)) {
      return Response.json(
        { error: "Max downloads must be a positive integer." },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db();
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

    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    const hasPassword = Boolean(password);
    const passwordHash = hasPassword ? await bcrypt.hash(password, 12) : null;

    let code = generateShareCode();
    let codeExists = await db.collection("links").findOne({ code });
    while (codeExists) {
      code = generateShareCode();
      codeExists = await db.collection("links").findOne({ code });
    }

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
