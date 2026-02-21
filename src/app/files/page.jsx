import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { resolveSessionUser } from "@/lib/userQuota";
import DeleteFileButton from "./DeleteFileButton";
import CreateShareLinkButton from "./CreateShareLinkButton";

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
}

export const metadata = {
  title: "My Files | DRPY",
};

export default async function FilesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login?callbackUrl=/files");
  }

  const client = await clientPromise;
  const db = client.db();
  const user = await resolveSessionUser(db, session.user);

  if (!user) {
    redirect("/login?callbackUrl=/files");
  }

  const files = await db
    .collection("files")
    .find({ userId: user._id.toString() })
    .sort({ createdAt: -1 })
    .toArray();

  const usedBytes = user.storageUsedBytes || 0;
  const limitBytes = user.quotaLimitBytes || 0;
  const quotaPercent = limitBytes ? Math.min(100, (usedBytes / limitBytes) * 100) : 0;

  return (
    <section className="max-w-4xl mx-auto py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2>My Files</h2>
        <Link href="/upload" className="btn btn-primary">
          Upload New File
        </Link>
      </div>

      <div className="card bg-base-200 p-5 mb-5">
        <div className="flex justify-between text-sm mb-2">
          <span>Storage used</span>
          <span>
            {formatBytes(usedBytes)} / {formatBytes(limitBytes)}
          </span>
        </div>
        <progress
          className="progress progress-primary w-full"
          value={quotaPercent}
          max="100"
        />
      </div>

      {files.length === 0 ? (
        <div className="card bg-base-200 p-6">
          <p className="mb-3">No uploaded files yet.</p>
          <Link href="/upload" className="btn btn-outline w-fit">
            Upload your first file
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-200 rounded-box">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Size</th>
                <th>Uploaded</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file._id.toString()}>
                  <td className="max-w-xs truncate" title={file.originalName}>
                    {file.originalName}
                  </td>
                  <td>{file.mimeType}</td>
                  <td>{formatBytes(file.size)}</td>
                  <td>{new Date(file.createdAt).toLocaleString()}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <CreateShareLinkButton fileId={file._id.toString()} />
                      <DeleteFileButton fileId={file._id.toString()} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
