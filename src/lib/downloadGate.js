export async function claimDownloadSlot({ db, linkId, now = new Date() }) {
  return db.collection("links").findOneAndUpdate(
    {
      _id: linkId,
      $and: [
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: now } },
          ],
        },
        {
          $or: [
            { maxDownloads: { $exists: false } },
            { maxDownloads: null },
            { maxDownloads: { $lte: 0 } },
            {
              $expr: {
                $lt: [{ $ifNull: ["$downloadCount", 0] }, "$maxDownloads"],
              },
            },
          ],
        },
      ],
    },
    {
      $inc: { downloadCount: 1 },
      $set: { updatedAt: now, lastDownloadedAt: now },
    },
    { returnDocument: "after" },
  );
}
