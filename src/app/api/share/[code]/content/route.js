import bcrypt from "bcryptjs";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getR2BucketName, getR2Client } from "@/lib/r2";
import { getShareMetaByCode } from "@/lib/shareLookup";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  try {
    const { code } = await params;
    if (!code) {
      return Response.json({ error: "Invalid link." }, { status: 400 });
    }

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

    const r2Client = getR2Client();
    const object = await r2Client.send(
      new GetObjectCommand({
        Bucket: getR2BucketName(),
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

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: "Could not load preview content.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
