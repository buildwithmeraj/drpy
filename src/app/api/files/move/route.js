import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getDb } from "@/lib/db";
import { assertCsrf } from "@/lib/security";
import { normalizeFolder } from "@/lib/validation";
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
    const folder = normalizeFolder(body?.folder);
    const validIds = fileIds.filter((id) => typeof id === "string" && ObjectId.isValid(id));

    if (!validIds.length) {
      return Response.json({ error: "No valid file ids provided." }, { status: 400 });
    }

    const db = await getDb();
    const user = await resolveSessionUser(db, session.user);
    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const result = await db.collection("files").updateMany(
      {
        _id: { $in: validIds.map((id) => new ObjectId(id)) },
        userId: user._id.toString(),
      },
      {
        $set: {
          folder,
          updatedAt: new Date(),
        },
      },
    );

    return Response.json({ ok: true, modifiedCount: result.modifiedCount || 0, folder });
  } catch (error) {
    return Response.json(
      {
        error: "Could not move files.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
