import { getDb } from "@/lib/db";
import { getShareMetaByCode } from "@/lib/shareLookup";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  try {
    const { code } = await params;
    if (!code) {
      return Response.json({ error: "Invalid link." }, { status: 400 });
    }

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
    return Response.json(
      {
        error: "Could not load share link.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
