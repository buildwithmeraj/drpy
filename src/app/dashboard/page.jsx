import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { dateDaysAgo, formatBytes, formatDay } from "@/lib/analytics";
import { getDb } from "@/lib/db";
import { resolveSessionUser } from "@/lib/userQuota";

export const metadata = {
  title: "Dashboard | DRPY",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const db = await getDb();
  const user = await resolveSessionUser(db, session.user);

  if (!user) {
    redirect("/login?callbackUrl=/dashboard");
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

  const startDate = dateDaysAgo(6);
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
          bytes: { $sum: { $ifNull: ["$bytesTransferred", 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  const countMap = new Map(analyticsRows.map((row) => [row._id, row.count]));
  const bytesMap = new Map(analyticsRows.map((row) => [row._id, row.bytes || 0]));
  const dailyDownloads = [];
  const dailyBandwidth = [];
  let totalBandwidthBytes = 0;
  for (let i = 6; i >= 0; i -= 1) {
    const day = formatDay(dateDaysAgo(i));
    dailyDownloads.push({ day, count: countMap.get(day) || 0 });
    const bytes = bytesMap.get(day) || 0;
    totalBandwidthBytes += bytes;
    dailyBandwidth.push({ day, bytes });
  }

  const maxDayCount = Math.max(1, ...dailyDownloads.map((item) => item.count));
  const maxBandwidth = Math.max(1, ...dailyBandwidth.map((item) => item.bytes));
  const storageUsedBytes = user.storageUsedBytes || 0;
  const storageLimitBytes = user.quotaLimitBytes || 0;
  const storagePercent = storageLimitBytes
    ? Math.min(100, (storageUsedBytes / storageLimitBytes) * 100)
    : 0;

  return (
    <section className="max-w-5xl mx-auto py-8">
      <h2>Dashboard</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <div className="card bg-base-200 p-4">
          <p className="text-sm">Files</p>
          <p className="text-2xl font-bold">{fileCount}</p>
        </div>
        <div className="card bg-base-200 p-4">
          <p className="text-sm">Active Links</p>
          <p className="text-2xl font-bold">{activeLinkCount}</p>
        </div>
        <div className="card bg-base-200 p-4">
          <p className="text-sm">Total Downloads</p>
          <p className="text-2xl font-bold">{totalDownloads}</p>
        </div>
        <div className="card bg-base-200 p-4">
          <p className="text-sm">Bandwidth (7d)</p>
          <p className="text-2xl font-bold">{formatBytes(totalBandwidthBytes)}</p>
        </div>
        <div className="card bg-base-200 p-4">
          <p className="text-sm">Storage Used</p>
          <p className="text-2xl font-bold">{formatBytes(storageUsedBytes)}</p>
          <p className="text-xs opacity-75">of {formatBytes(storageLimitBytes)}</p>
        </div>
      </div>

      <div className="card bg-base-200 p-5 mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span>Storage quota</span>
          <span>
            {formatBytes(storageUsedBytes)} / {formatBytes(storageLimitBytes)}
          </span>
        </div>
        <progress className="progress progress-primary w-full" value={storagePercent} max="100" />
      </div>

      <div className="card bg-base-200 p-5 mb-4">
        <h3 className="font-semibold mb-3">Downloads (Last 7 Days)</h3>
        <div className="space-y-2">
          {dailyDownloads.map((item) => (
            <div key={item.day} className="grid grid-cols-[90px_1fr_50px] gap-3 items-center">
              <span className="text-xs opacity-75">{item.day.slice(5)}</span>
              <div className="w-full bg-base-300 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 bg-primary rounded-full"
                  style={{ width: `${(item.count / maxDayCount) * 100}%` }}
                />
              </div>
              <span className="text-sm text-right">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card bg-base-200 p-5 mb-4">
        <h3 className="font-semibold mb-3">Bandwidth (Last 7 Days)</h3>
        <div className="space-y-2">
          {dailyBandwidth.map((item) => (
            <div key={item.day} className="grid grid-cols-[90px_1fr_90px] gap-3 items-center">
              <span className="text-xs opacity-75">{item.day.slice(5)}</span>
              <div className="w-full bg-base-300 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 bg-accent rounded-full"
                  style={{ width: `${(item.bytes / maxBandwidth) * 100}%` }}
                />
              </div>
              <span className="text-sm text-right">{formatBytes(item.bytes)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="card bg-base-200 p-5">
          <h3 className="font-semibold mb-3">Top Downloaded Links</h3>
          <div className="space-y-2 text-sm">
            {topLinks.length ? (
              topLinks.map((row) => (
                <p key={row.code} className="flex justify-between gap-3">
                  <span className="truncate">{row.file?.originalName || "Unknown file"}</span>
                  <span className="font-semibold">{row.downloadCount || 0}</span>
                </p>
              ))
            ) : (
              <p className="opacity-70">No downloads yet.</p>
            )}
          </div>
        </div>
        <div className="card bg-base-200 p-5">
          <h3 className="font-semibold mb-3">Top Downloaded Files</h3>
          <div className="space-y-2 text-sm">
            {topFiles.length ? (
              topFiles.map((row) => (
                <p key={row._id} className="flex justify-between gap-3">
                  <span className="truncate">{row.file?.originalName || "Unknown file"}</span>
                  <span className="font-semibold">{row.downloadCount || 0}</span>
                </p>
              ))
            ) : (
              <p className="opacity-70">No downloads yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="alert alert-info mb-4">
        Expired links are cleaned up automatically. Files are retained by default unless orphan cleanup is enabled.
      </div>

      <div className="card bg-base-200 p-6 gap-3">
        <p>
          <span className="font-semibold">Name:</span> {session.user.name || "Not set"}
        </p>
        <p>
          <span className="font-semibold">Email:</span> {session.user.email}
        </p>
        <p>
          <span className="font-semibold">User ID:</span> {session.user.id || "N/A"}
        </p>
        <div className="pt-2 flex gap-2 flex-wrap">
          <Link href="/" className="btn btn-primary">
            Home
          </Link>
          <Link href="/files" className="btn btn-outline">
            My Files
          </Link>
        </div>
      </div>
    </section>
  );
}
