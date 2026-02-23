import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getDb } from "@/lib/db";
import { assertCsrf } from "@/lib/security";
import { normalizeFolder, toSafeString } from "@/lib/validation";
import { resolveSessionUser } from "@/lib/userQuota";

export const runtime = "nodejs";

function decodeFolderAlias(id) {
  if (typeof id !== "string" || !id.startsWith("name:")) return null;
  try {
    return normalizeFolder(decodeURIComponent(id.slice(5)));
  } catch {
    return null;
  }
}

export async function PATCH(request, { params }) {
  try {
    const csrfError = assertCsrf(request);
    if (csrfError) return csrfError;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const aliasName = decodeFolderAlias(id);
    const isObjectId = ObjectId.isValid(id);
    if (!id || (!isObjectId && !aliasName)) {
      return Response.json({ error: "Invalid folder id." }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const nextName = normalizeFolder(toSafeString(body?.name, ""));
    if (nextName === "/") {
      return Response.json({ error: "Folder name cannot be root." }, { status: 400 });
    }

    const db = await getDb();
    const user = await resolveSessionUser(db, session.user);
    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const userId = user._id.toString();
    const folderId = isObjectId ? new ObjectId(id) : null;
    let prevName = aliasName;
    if (folderId) {
      const folder = await db.collection("folders").findOne({ _id: folderId, userId });
      if (!folder) {
        return Response.json({ error: "Folder not found." }, { status: 404 });
      }
      prevName = normalizeFolder(folder.name);
    }
    if (!prevName || prevName === "/") {
      return Response.json({ error: "Folder not found." }, { status: 404 });
    }

    const existing = await db.collection("folders").findOne({
      userId,
      name: nextName,
      ...(folderId ? { _id: { $ne: folderId } } : {}),
    });
    if (existing) {
      return Response.json({ error: "Folder already exists." }, { status: 409 });
    }

    const now = new Date();

    if (folderId) {
      await db.collection("folders").updateOne(
        { _id: folderId, userId },
        { $set: { name: nextName, updatedAt: now } },
      );
    } else {
      await db.collection("folders").deleteMany({ userId, name: prevName });
      await db.collection("folders").updateOne(
        { userId, name: nextName },
        {
          $set: { updatedAt: now },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true },
      );
    }

    await db.collection("files").updateMany(
      { userId, folder: prevName },
      { $set: { folder: nextName, updatedAt: now } },
    );

    return Response.json({
      ok: true,
      folder: {
        id,
        name: nextName,
        updatedAt: now,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: "Could not update folder.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const csrfError = assertCsrf(request);
    if (csrfError) return csrfError;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const aliasName = decodeFolderAlias(id);
    const isObjectId = ObjectId.isValid(id);
    if (!id || (!isObjectId && !aliasName)) {
      return Response.json({ error: "Invalid folder id." }, { status: 400 });
    }

    const db = await getDb();
    const user = await resolveSessionUser(db, session.user);
    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const userId = user._id.toString();
    const folderId = isObjectId ? new ObjectId(id) : null;
    let folderName = aliasName;
    if (folderId) {
      const folder = await db.collection("folders").findOne({ _id: folderId, userId });
      if (!folder) {
        return Response.json({ error: "Folder not found." }, { status: 404 });
      }
      folderName = normalizeFolder(folder.name);
    }
    if (!folderName) {
      return Response.json({ error: "Folder not found." }, { status: 404 });
    }
    if (folderName === "/") {
      return Response.json({ error: "Cannot delete root folder." }, { status: 400 });
    }

    const now = new Date();
    const moveResult = await db.collection("files").updateMany(
      { userId, folder: folderName },
      { $set: { folder: "/", updatedAt: now } },
    );

    if (folderId) {
      await db.collection("folders").deleteOne({ _id: folderId, userId });
    } else {
      await db.collection("folders").deleteMany({ userId, name: folderName });
    }

    return Response.json({ ok: true, movedFiles: moveResult.modifiedCount || 0 });
  } catch (error) {
    return Response.json(
      {
        error: "Could not delete folder.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
