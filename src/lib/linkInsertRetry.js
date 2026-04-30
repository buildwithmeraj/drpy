function isDuplicateCodeError(error) {
  return (
    error &&
    (error.code === 11000 ||
      (typeof error.message === "string" && error.message.includes("E11000")))
  );
}

export async function insertLinkWithRetry({
  db,
  createCode,
  payloadBase,
  maxAttempts = 5,
}) {
  let code = "";
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    code = await createCode();
    const now = new Date();
    try {
      await db.collection("links").insertOne({
        code,
        ...payloadBase,
        createdAt: now,
        updatedAt: now,
      });
      return { inserted: true, code };
    } catch (insertError) {
      if (!isDuplicateCodeError(insertError)) {
        throw insertError;
      }
    }
  }

  return { inserted: false, code: "" };
}
