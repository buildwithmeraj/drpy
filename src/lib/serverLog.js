function toErrorDetails(error) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    message: typeof error === "string" ? error : "Unknown error",
  };
}

export function logApiError(event, details = {}) {
  const payload = {
    level: "error",
    event,
    timestamp: new Date().toISOString(),
    ...details,
  };

  if (details.error) {
    payload.error = toErrorDetails(details.error);
  }

  console.error(JSON.stringify(payload));
}
