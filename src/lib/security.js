function getAllowedOrigins() {
  const configured = [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
  ].filter(Boolean);
  return configured.map((origin) => {
    try {
      return new URL(origin).origin;
    } catch {
      return null;
    }
  }).filter(Boolean);
}

export function assertCsrf(request) {
  if (process.env.NODE_ENV !== "production") return null;
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const allowed = getAllowedOrigins();
  if (!allowed.length) return null;

  const matchesOrigin = origin && allowed.includes(origin);
  const matchesReferer =
    referer &&
    (() => {
      try {
        return allowed.includes(new URL(referer).origin);
      } catch {
        return false;
      }
    })();

  if (!matchesOrigin && !matchesReferer) {
    return Response.json({ error: "CSRF validation failed." }, { status: 403 });
  }

  return null;
}
