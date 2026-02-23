import nodemailer from "nodemailer";
import { assertCsrf } from "@/lib/security";
import { isNonEmptyString, toSafeString } from "@/lib/validation";

export const runtime = "nodejs";

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request) {
  try {
    const csrfError = assertCsrf(request);
    if (csrfError) return csrfError;

    const body = await request.json().catch(() => ({}));
    const name = toSafeString(body?.name);
    const email = toSafeString(body?.email).toLowerCase();
    const subject = toSafeString(body?.subject);
    const message = toSafeString(body?.message);

    if (!isNonEmptyString(name, 120) || !isNonEmptyString(subject, 180) || !isNonEmptyString(message, 5000)) {
      return Response.json({ error: "Please fill in all required fields." }, { status: 400 });
    }

    if (!validEmail(email) || email.length > 180) {
      return Response.json({ error: "Please provide a valid email." }, { status: 400 });
    }

    const smtpHost = requiredEnv("SMTP_HOST");
    const smtpPort = Number.parseInt(requiredEnv("SMTP_PORT"), 10);
    const smtpUser = requiredEnv("SMTP_USER");
    const smtpPass = requiredEnv("SMTP_PASS");
    const adminEmail = requiredEnv("ADMIN_EMAIL");
    const smtpSecure = String(process.env.SMTP_SECURE || "false") === "true";
    const fromEmail = process.env.SMTP_FROM || `DRPY <${smtpUser}>`;

    if (!Number.isFinite(smtpPort) || smtpPort <= 0) {
      return Response.json({ error: "Server email configuration is invalid." }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

    await transporter.sendMail({
      from: fromEmail,
      to: adminEmail,
      replyTo: email,
      subject: `[DRPY Contact] ${subject}`,
      text: `New contact message\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <p><strong>Message:</strong><br />${safeMessage}</p>
      `,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Contact mail error:", error);
    const details = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      {
        error: "Could not send message. Please try again later.",
        ...(process.env.NODE_ENV !== "production" ? { details } : {}),
      },
      { status: 500 },
    );
  }
}
