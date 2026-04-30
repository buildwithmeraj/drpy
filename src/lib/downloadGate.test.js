import test from "node:test";
import assert from "node:assert/strict";
import { claimDownloadSlot } from "./downloadGate.js";

test("claimDownloadSlot uses guarded atomic filter and increments download count", async () => {
  let capturedFilter = null;
  let capturedUpdate = null;
  let capturedOptions = null;

  const fakeResult = { _id: "link1", downloadCount: 2 };
  const db = {
    collection(name) {
      assert.equal(name, "links");
      return {
        async findOneAndUpdate(filter, update, options) {
          capturedFilter = filter;
          capturedUpdate = update;
          capturedOptions = options;
          return fakeResult;
        },
      };
    },
  };

  const now = new Date("2026-04-30T00:00:00.000Z");
  const result = await claimDownloadSlot({ db, linkId: "link1", now });

  assert.equal(result, fakeResult);
  assert.equal(capturedFilter._id, "link1");
  assert.equal(Array.isArray(capturedFilter.$and), true);
  assert.equal(capturedFilter.$and.length, 2);
  assert.deepEqual(capturedUpdate.$inc, { downloadCount: 1 });
  assert.equal(capturedUpdate.$set.updatedAt, now);
  assert.equal(capturedUpdate.$set.lastDownloadedAt, now);
  assert.deepEqual(capturedOptions, { returnDocument: "after" });
});
