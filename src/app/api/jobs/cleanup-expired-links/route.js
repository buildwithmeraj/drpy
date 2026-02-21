import clientPromise from "@/lib/mongodb";

export const runtime = "nodejs";

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const incoming = request.headers.get("x-cron-secret");
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;
  return incoming === secret || bearer === secret;
}

async function runCleanup(request) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const now = new Date();
    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection("links").deleteMany({
      $or: [
        { expiresAt: { $lte: now } },
        {
          $and: [
            { maxDownloads: { $type: "number" } },
            { $expr: { $gte: ["$downloadCount", "$maxDownloads"] } },
          ],
        },
      ],
    });

    return Response.json({
      ok: true,
      deletedCount: result.deletedCount || 0,
      ranAt: now.toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        error: "Cleanup job failed.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  return runCleanup(request);
}

export async function GET(request) {
  return runCleanup(request);
}
