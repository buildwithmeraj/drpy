let indexesPromise = null;

export function ensureDbIndexes(db) {
  if (!indexesPromise) {
    indexesPromise = (async () => {
      await db.collection("users").createIndex({ email: 1 }, { unique: true, name: "users_email_unique" });
      await db.collection("files").createIndex({ userId: 1 }, { name: "files_userId" });
      await db.collection("links").createIndex({ code: 1 }, { unique: true, name: "links_code_unique" });
      await db.collection("links").createIndex({ expiresAt: 1 }, { name: "links_expiresAt" });
      await db
        .collection("analytics")
        .createIndex({ ownerUserId: 1, createdAt: -1 }, { name: "analytics_ownerUserId_createdAt" });
    })().catch((error) => {
      indexesPromise = null;
      throw error;
    });
  }

  return indexesPromise;
}
