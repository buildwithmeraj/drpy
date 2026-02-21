import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getDb } from "@/lib/db";
import { resolveSessionUser } from "@/lib/userQuota";
import FilesManagerClient from "./FilesManagerClient";

export const metadata = {
  title: "My Files | DRPY",
};

export default async function FilesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login?callbackUrl=/files");
  }

  const db = await getDb();
  const user = await resolveSessionUser(db, session.user);
  if (!user) {
    redirect("/login?callbackUrl=/files");
  }

  const files = await db
    .collection("files")
    .find({ userId: user._id.toString() })
    .sort({ createdAt: -1 })
    .toArray();

  const initialFiles = files.map((file) => ({
    id: file._id.toString(),
    originalName: file.originalName,
    mimeType: file.mimeType,
    size: file.size,
    key: file.key,
    publicUrl: file.publicUrl || null,
    folder: file.folder || "root",
    createdAt: file.createdAt,
  }));

  const quota = {
    usedBytes: user.storageUsedBytes || 0,
    limitBytes: user.quotaLimitBytes || 0,
  };

  return (
    <section className="max-w-6xl mx-auto py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2>My Files</h2>
        <div className="flex gap-2">
          <Link href="/links" className="btn btn-outline">
            My Links
          </Link>
          <Link href="/upload" className="btn btn-primary">
            Upload New File
          </Link>
        </div>
      </div>

      <FilesManagerClient initialFiles={initialFiles} quota={quota} />
    </section>
  );
}
