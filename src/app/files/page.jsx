import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getDb } from "@/lib/db";
import { DEFAULT_QUOTA_BYTES } from "@/lib/quota";
import { resolveSessionUser } from "@/lib/userQuota";
import { FiFolder } from "react-icons/fi";
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
  const folders = await db
    .collection("folders")
    .find({ userId: user._id.toString() })
    .sort({ name: 1 })
    .toArray();

  const initialFiles = files.map((file) => ({
    id: file._id.toString(),
    originalName: file.originalName,
    mimeType: file.mimeType,
    size: file.size,
    key: file.key,
    publicUrl: file.publicUrl || null,
    folder: !file.folder || file.folder === "root" ? "/" : file.folder,
    createdAt: file.createdAt,
  }));

  const folderCounts = new Map();
  folderCounts.set("/", 0);
  for (const file of initialFiles) {
    const folder = file.folder || "/";
    folderCounts.set(folder, (folderCounts.get(folder) || 0) + 1);
  }

  const initialFoldersMap = new Map();
  initialFoldersMap.set("/", {
    id: "root",
    name: "/",
    fileCount: folderCounts.get("/") || 0,
    createdAt: null,
    updatedAt: null,
    isRoot: true,
  });
  for (const folder of folders) {
    const normalizedName =
      !folder.name || folder.name === "root" ? "/" : folder.name;
    if (normalizedName === "/") continue;
    initialFoldersMap.set(normalizedName, {
      id: folder._id.toString(),
      name: normalizedName,
      fileCount: folderCounts.get(normalizedName) || 0,
      createdAt: folder.createdAt || null,
      updatedAt: folder.updatedAt || null,
      isRoot: false,
    });
  }
  for (const [name, count] of folderCounts.entries()) {
    if (!initialFoldersMap.has(name)) {
      initialFoldersMap.set(name, {
        id: name === "/" ? "root" : `name:${encodeURIComponent(name)}`,
        name,
        fileCount: count,
        createdAt: null,
        updatedAt: null,
        isRoot: name === "/",
      });
    }
  }
  const initialFolders = Array.from(initialFoldersMap.values()).sort((a, b) => {
    if (a.name === "/") return -1;
    if (b.name === "/") return 1;
    return a.name.localeCompare(b.name);
  });

  const quota = {
    usedBytes: user.storageUsedBytes || 0,
    limitBytes: user.quotaLimitBytes || DEFAULT_QUOTA_BYTES,
  };

  return (
    <section className="page-shell max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="section-title"><FiFolder className="text-primary" /> My Files</h2>
        <div className="flex gap-2">
          <Link href="/links" className="btn btn-outline">
            My Links
          </Link>
          <Link href="/upload" className="btn btn-primary">
            Upload New File
          </Link>
        </div>
      </div>

      <FilesManagerClient initialFiles={initialFiles} initialFolders={initialFolders} quota={quota} />
    </section>
  );
}
