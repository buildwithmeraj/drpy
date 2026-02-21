import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { dateDaysAgo, formatDay } from "@/lib/analytics";
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

    const client = await clientPromise;
    const db = client.db();
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
