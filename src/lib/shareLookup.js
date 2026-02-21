import { ObjectId } from "mongodb";
import { isExpired } from "@/lib/shareLinks";

export async function getShareMetaByCode(db, code) {
  const link = await db.collection("links").findOne({ code });
  if (!link) {
    return { status: 404, error: "Link not found." };
  }

  if (isExpired(link.expiresAt)) {
    return { status: 410, error: "Link has expired." };
  }

  const downloadCount = link.downloadCount || 0;
  if (
    typeof link.maxDownloads === "number" &&
    link.maxDownloads > 0 &&
    downloadCount >= link.maxDownloads
  ) {
    return { status: 410, error: "Download limit reached." };
  }

  const fileId = link.fileId;
  if (!fileId || !ObjectId.isValid(fileId)) {
    return { status: 500, error: "Invalid file reference." };
  }

  const file = await db.collection("files").findOne({ _id: new ObjectId(fileId) });
  if (!file) {
    return { status: 404, error: "File no longer exists." };
  }

  return {
    status: 200,
    data: {
      fileId: link.fileId,
      file: {
        id: file._id.toString(),
        name: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
      },
      link: {
        id: link._id.toString(),
        code: link.code,
        fileId: link.fileId,
        expiresAt: link.expiresAt,
        hasPassword: Boolean(link.hasPassword),
        maxDownloads: link.maxDownloads,
        downloadCount,
      },
    },
  };
}
