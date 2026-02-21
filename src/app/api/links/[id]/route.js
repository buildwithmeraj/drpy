import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getDb } from "@/lib/db";
import { assertCsrf } from "@/lib/security";
import { generateShareCode } from "@/lib/shareLinks";
import { toSafeInt } from "@/lib/validation";
import { resolveSessionUser } from "@/lib/userQuota";

export const runtime = "nodejs";

async function createUniqueCode(db) {
  let code = generateShareCode();
  let exists = await db.collection("links").findOne({ code });
  while (exists) {
    code = generateShareCode();
    exists = await db.collection("links").findOne({ code });
  }
  return code;
}

async function getAuthorizedLink(db, sessionUser, linkId) {
  const user = await resolveSessionUser(db, sessionUser);
  if (!user) return { error: "User not found.", status: 404 };
  const link = await db.collection("links").findOne({
    _id: new ObjectId(linkId),
    userId: user._id.toString(),
  });
  if (!link) return { error: "Link not found.", status: 404 };
  return { user, link };
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
    if (!id || !ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid link id." }, { status: 400 });
    }

    const body = await request.json();
    const action = body?.action;

    const db = await getDb();
    const data = await getAuthorizedLink(db, session.user, id);
    if (data.error) {
      return Response.json({ error: data.error }, { status: data.status });
    }

    if (action === "extend") {
      const expiryHours = toSafeInt(body?.expiryHours, null);
      if (!expiryHours || expiryHours < 1 || expiryHours > 30 * 24) {
        return Response.json(
          { error: "Expiry extension must be between 1 hour and 30 days." },
          { status: 400 },
        );
      }

      const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
      await db.collection("links").updateOne(
        { _id: data.link._id },
        { $set: { expiresAt, updatedAt: new Date() } },
      );
      return Response.json({ ok: true, action, expiresAt });
    }

    if (action === "regenerate") {
      const code = await createUniqueCode(db);
      await db.collection("links").updateOne(
        { _id: data.link._id },
        { $set: { code, updatedAt: new Date() } },
      );
      return Response.json({ ok: true, action, code, urlPath: `/s/${code}` });
    }

    if (action === "revoke") {
      await db.collection("links").deleteOne({ _id: data.link._id });
      return Response.json({ ok: true, action });
    }

    return Response.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    return Response.json(
      {
        error: "Could not update link.",
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
    if (!id || !ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid link id." }, { status: 400 });
    }

    const db = await getDb();
    const data = await getAuthorizedLink(db, session.user, id);
    if (data.error) {
      return Response.json({ error: data.error }, { status: data.status });
    }

    await db.collection("links").deleteOne({ _id: data.link._id });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      {
        error: "Could not revoke link.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
