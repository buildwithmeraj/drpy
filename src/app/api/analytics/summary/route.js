import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { dateDaysAgo, formatDay } from "@/lib/analytics";
import { getDb } from "@/lib/db";
import { resolveSessionUser } from "@/lib/userQuota";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const rangeParam = request.nextUrl.searchParams.get("rangeDays");
    const rangeDays = Number.parseInt(rangeParam || "7", 10);
    const validRangeDays = [7, 30].includes(rangeDays) ? rangeDays : 7;

    const db = await getDb();
    const user = await resolveSessionUser(db, session.user);

    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const userId = user._id.toString();
    const fileCount = await db.collection("files").countDocuments({ userId });
    const activeLinkCount = await db.collection("links").countDocuments({ userId });

    const links = await db
      .collection("links")
      .find({ userId }, { projection: { downloadCount: 1 } })
      .toArray();
    const totalDownloads = links.reduce((sum, link) => sum + (link.downloadCount || 0), 0);

    const topLinks = await db
      .collection("links")
      .aggregate([
        { $match: { userId } },
        { $sort: { downloadCount: -1, createdAt: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "files",
            let: { fileObjectId: { $toObjectId: "$fileId" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$fileObjectId"] } } }],
            as: "file",
          },
        },
        { $unwind: { path: "$file", preserveNullAndEmptyArrays: true } },
      ])
      .toArray();

    const topFiles = await db
      .collection("links")
      .aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: "$fileId",
            downloadCount: { $sum: "$downloadCount" },
          },
        },
        { $sort: { downloadCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "files",
            let: { fileObjectId: { $toObjectId: "$_id" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$fileObjectId"] } } }],
            as: "file",
          },
        },
        { $unwind: { path: "$file", preserveNullAndEmptyArrays: true } },
      ])
      .toArray();

    const startDate = dateDaysAgo(validRangeDays - 1);
    const analyticsRows = await db
      .collection("analytics")
      .aggregate([
        {
          $match: {
            ownerUserId: userId,
            eventType: "download",
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    const countMap = new Map(analyticsRows.map((row) => [row._id, row.count]));
    const dailyDownloads = [];
    for (let i = validRangeDays - 1; i >= 0; i -= 1) {
      const day = formatDay(dateDaysAgo(i));
      dailyDownloads.push({ day, count: countMap.get(day) || 0 });
    }

    return Response.json({
      ok: true,
      summary: {
        fileCount,
        activeLinkCount,
        totalDownloads,
        storageUsedBytes: user.storageUsedBytes || 0,
        storageLimitBytes: user.quotaLimitBytes || 0,
      },
      dailyDownloads,
      rangeDays: validRangeDays,
      topLinks: topLinks.map((link) => ({
        code: link.code,
        urlPath: `/s/${link.code}`,
        fileName: link.file?.originalName || "Unknown file",
        downloadCount: link.downloadCount || 0,
      })),
      topFiles: topFiles.map((file) => ({
        fileId: file._id,
        fileName: file.file?.originalName || "Unknown file",
        downloadCount: file.downloadCount || 0,
      })),
    });
  } catch (error) {
    return Response.json(
      {
        error: "Could not load analytics summary.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
