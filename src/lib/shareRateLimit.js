const buckets = new Map();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = {
  meta: 120,
  content: 60,
  download: 30,
};

function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const xRealIp = request.headers.get("x-real-ip");
  return forwardedFor?.split(",")?.[0]?.trim() || xRealIp || "unknown";
}

function shouldCleanup(now) {
  return now % 17 === 0;
}

function cleanupExpired(now) {
  for (const [key, value] of buckets.entries()) {
    if (value.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function enforceShareRateLimit(request, code, action) {
  const limit = MAX_REQUESTS[action] ?? 60;
  const now = Date.now();
  const ip = getClientIp(request);
  const key = `${action}:${code}:${ip}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
  } else if (existing.count >= limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.resetAt - now) / 1000),
    );
    return Response.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
        },
      },
    );
  } else {
    existing.count += 1;
    buckets.set(key, existing);
  }

  if (shouldCleanup(now)) {
    cleanupExpired(now);
  }

  return null;
}
