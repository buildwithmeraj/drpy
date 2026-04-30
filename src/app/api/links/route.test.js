import test from "node:test";
import assert from "node:assert/strict";
import { insertLinkWithRetry } from "../../../lib/linkInsertRetry.js";

test("insertLinkWithRetry retries on duplicate-key error and succeeds", async () => {
  let attempt = 0;
  let insertedDoc = null;

  const db = {
    collection(name) {
      assert.equal(name, "links");
      return {
        async insertOne(doc) {
          attempt += 1;
          if (attempt === 1) {
            const err = new Error("E11000 duplicate key error");
            err.code = 11000;
            throw err;
          }
          insertedDoc = doc;
          return { acknowledged: true };
        },
      };
    },
  };

  const result = await insertLinkWithRetry({
    db,
    createCode: async () => (attempt === 0 ? "abc123" : "def456"),
    payloadBase: {
      userId: "u1",
      fileId: "f1",
      hasPassword: false,
      passwordHash: null,
      expiresAt: new Date("2026-04-30T00:00:00.000Z"),
      maxDownloads: 1,
      downloadCount: 0,
      lastDownloadedAt: null,
    },
    maxAttempts: 5,
  });

  assert.equal(result.inserted, true);
  assert.equal(result.code, "def456");
  assert.equal(attempt, 2);
  assert.equal(insertedDoc.code, "def456");
});
