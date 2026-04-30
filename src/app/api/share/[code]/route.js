import { getDb } from "@/lib/db";
import { getShareMetaByCode } from "@/lib/shareLookup";
import { enforceShareRateLimit } from "@/lib/shareRateLimit";
import { logApiError } from "@/lib/serverLog";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  let requestCode = null;
  try {
    const { code } = await params;
    requestCode = code;
    if (!code) {
      return Response.json({ error: "Invalid link." }, { status: 400 });
    }
    const rateLimitError = enforceShareRateLimit(request, code, "meta");
    if (rateLimitError) return rateLimitError;

    const db = await getDb();

    const meta = await getShareMetaByCode(db, code);
    if (meta.status !== 200) {
      return Response.json({ error: meta.error }, { status: meta.status });
    }

    return Response.json({
      ok: true,
      file: meta.data.file,
      link: meta.data.link,
    });
  } catch (error) {
    logApiError("share.meta.failed", {
      code: requestCode,
      error,
    });
    return Response.json(
      {
        error: "Could not load share link.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
