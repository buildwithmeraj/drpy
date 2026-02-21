import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { resolveSessionUser } from "@/lib/userQuota";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const user = await resolveSessionUser(db, session.user);

    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const files = await db
      .collection("files")
      .find({ userId: user._id.toString() })
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json({
      ok: true,
      files: files.map((file) => ({
        id: file._id.toString(),
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        key: file.key,
        publicUrl: file.publicUrl || null,
        createdAt: file.createdAt,
      })),
      quota: {
        limitBytes: user.quotaLimitBytes || 0,
        usedBytes: user.storageUsedBytes || 0,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: "Could not fetch files.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
