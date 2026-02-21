import { ObjectId } from "mongodb";

const DEFAULT_QUOTA_BYTES = 5 * 1024 * 1024 * 1024;

export async function resolveSessionUser(db, sessionUser) {
  const users = db.collection("users");
  const id = sessionUser?.id;
  const email = sessionUser?.email?.toLowerCase()?.trim();

  let user = null;

  if (id && ObjectId.isValid(id)) {
    user = await users.findOne({ _id: new ObjectId(id) });
  }

  if (!user && email) {
    user = await users.findOne({ email });
  }

  if (!user) {
    return null;
  }

  const missingFields = {};

  if (typeof user.quotaLimitBytes !== "number") {
    missingFields.quotaLimitBytes = DEFAULT_QUOTA_BYTES;
  }

  if (typeof user.storageUsedBytes !== "number") {
    missingFields.storageUsedBytes = 0;
  }

  if (Object.keys(missingFields).length) {
    missingFields.updatedAt = new Date();
    await users.updateOne({ _id: user._id }, { $set: missingFields });
    user = { ...user, ...missingFields };
  }

  return user;
}
