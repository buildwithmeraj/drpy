import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getDb } from "@/lib/db";
import { DEFAULT_QUOTA_BYTES } from "@/lib/quota";
import { resolveSessionUser } from "@/lib/userQuota";
import { normalizeFolder } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(request) {
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

    const search = request.nextUrl.searchParams.get("search")?.trim() || "";
    const folderParam = request.nextUrl.searchParams.get("folder");
    const sortBy = request.nextUrl.searchParams.get("sortBy") || "createdAt";
    const sortOrder = request.nextUrl.searchParams.get("sortOrder") === "asc" ? 1 : -1;

    const query = { userId: user._id.toString() };
    if (folderParam && folderParam !== "all") {
      const normalizedFolder = normalizeFolder(folderParam);
      query.folder =
        normalizedFolder === "/" ? { $in: ["/", "root", "", null] } : normalizedFolder;
    }
    if (search) {
      query.originalName = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    }

    const sortFieldMap = {
      createdAt: "createdAt",
      name: "originalName",
      size: "size",
      folder: "folder",
    };
    const sortField = sortFieldMap[sortBy] || "createdAt";
    const files = await db.collection("files").find(query).sort({ [sortField]: sortOrder }).toArray();

    return Response.json({
      ok: true,
      files: files.map((file) => ({
        id: file._id.toString(),
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        key: file.key,
        publicUrl: file.publicUrl || null,
        folder: !file.folder || file.folder === "root" ? "/" : file.folder,
        createdAt: file.createdAt,
      })),
      quota: {
        limitBytes: user.quotaLimitBytes || DEFAULT_QUOTA_BYTES,
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
