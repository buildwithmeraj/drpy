import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getDb } from "@/lib/db";
import { isExpired } from "@/lib/shareLinks";
import { resolveSessionUser } from "@/lib/userQuota";
import { FiLink2 } from "react-icons/fi";
import LinksManagerClient from "./LinksManagerClient";

export const metadata = {
  title: "My Links | DRPY",
};

function status(link) {
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

export default async function LinksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login?callbackUrl=/links");
  }

  const db = await getDb();
  const user = await resolveSessionUser(db, session.user);
  if (!user) {
    redirect("/login?callbackUrl=/links");
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
    fileName: row.file?.originalName || "Unknown file",
    fileSize: row.file?.size || 0,
    hasPassword: Boolean(row.hasPassword),
    expiresAt: row.expiresAt,
    maxDownloads: row.maxDownloads,
    downloadCount: row.downloadCount || 0,
    status: status(row),
    createdAt: row.createdAt,
  }));

  return (
    <section className="page-shell max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title"><FiLink2 className="text-primary" /> My Links</h2>
        <Link href="/files" className="btn btn-primary">
          Back to Files
        </Link>
      </div>

      <LinksManagerClient initialLinks={links} />
    </section>
  );
}
