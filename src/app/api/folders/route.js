import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getDb } from "@/lib/db";
import { assertCsrf } from "@/lib/security";
import { normalizeFolder, toSafeString } from "@/lib/validation";
import { resolveSessionUser } from "@/lib/userQuota";

export const runtime = "nodejs";

function isRootFolder(folder) {
  return normalizeFolder(folder) === "/";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const db = await getDb();
    const user = await resolveSessionUser(db, session.user);
    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const userId = user._id.toString();

    const [fileFolderCounts, savedFolders] = await Promise.all([
      db.collection("files").aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: {
              $let: {
                vars: { folder: "$folder" },
                in: {
                  $cond: [
                    {
                      $or: [
                        { $eq: ["$$folder", null] },
                        { $eq: ["$$folder", ""] },
                        { $eq: ["$$folder", "root"] },
                        { $eq: ["$$folder", "/"] },
                      ],
                    },
                    "/",
                    "$$folder",
                  ],
                },
              },
            },
            fileCount: { $sum: 1 },
          },
        },
      ]).toArray(),
      db.collection("folders").find({ userId }).sort({ name: 1 }).toArray(),
    ]);

    const folderMap = new Map();
    folderMap.set("/", {
      id: "root",
      name: "/",
      fileCount: 0,
      createdAt: null,
      updatedAt: null,
      isRoot: true,
    });

    for (const folder of savedFolders) {
      const normalized = normalizeFolder(folder.name);
      if (isRootFolder(normalized)) continue;
      folderMap.set(normalized, {
        id: folder._id.toString(),
        name: normalized,
        fileCount: 0,
        createdAt: folder.createdAt || null,
        updatedAt: folder.updatedAt || null,
        isRoot: false,
      });
    }

    for (const row of fileFolderCounts) {
      const name = normalizeFolder(row._id || "/");
      const existing = folderMap.get(name);
      if (existing) {
        existing.fileCount = row.fileCount || 0;
      } else {
        folderMap.set(name, {
          id: name === "/" ? "root" : `name:${encodeURIComponent(name)}`,
          name,
          fileCount: row.fileCount || 0,
          createdAt: null,
          updatedAt: null,
          isRoot: name === "/",
        });
      }
    }

    const folders = Array.from(folderMap.values()).sort((a, b) => {
      if (a.name === "/") return -1;
      if (b.name === "/") return 1;
      return a.name.localeCompare(b.name);
    });

    return Response.json({ ok: true, folders });
  } catch (error) {
    return Response.json(
      {
        error: "Could not fetch folders.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const csrfError = assertCsrf(request);
    if (csrfError) return csrfError;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const rawName = toSafeString(body?.name, "");
    const name = normalizeFolder(rawName);

    if (name === "/") {
      return Response.json({ error: "Root folder already exists." }, { status: 400 });
    }

    const db = await getDb();
    const user = await resolveSessionUser(db, session.user);
    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const userId = user._id.toString();
    const now = new Date();

    const existing = await db.collection("folders").findOne({ userId, name });
    if (existing) {
      return Response.json({ error: "Folder already exists." }, { status: 409 });
    }

    const result = await db.collection("folders").insertOne({
      userId,
      name,
      createdAt: now,
      updatedAt: now,
    });

    return Response.json(
      {
        ok: true,
        folder: {
          id: result.insertedId.toString(),
          name,
          fileCount: 0,
          createdAt: now,
          updatedAt: now,
          isRoot: false,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error: "Could not create folder.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
