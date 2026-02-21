import clientPromise from "@/lib/mongodb";
import { ensureDbIndexes } from "@/lib/dbIndexes";

export async function getDb() {
  const client = await clientPromise;
  const db = client.db();
  await ensureDbIndexes(db);
  return db;
}
