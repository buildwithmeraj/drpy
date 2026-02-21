import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = body?.name?.trim();
    const email = body?.email?.toLowerCase()?.trim();
    const password = body?.password;

    if (!name || !email || !password) {
      return Response.json(
        { error: "Name, email and password are required." },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return Response.json({ error: "Invalid email address." }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");

    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return Response.json(
        { error: "An account already exists with this email." },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await users.insertOne({
      name,
      email,
      password: hashedPassword,
      image: null,
      emailVerified: null,
      quotaLimitBytes: 5 * 1024 * 1024 * 1024,
      storageUsedBytes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Could not create account. Please try again." },
      { status: 500 },
    );
  }
}
