const DEFAULT_MAX_UPLOAD_MB = 100;
const MB = 1024 * 1024;

const allowedMimePrefixes = [
  "image/",
  "text/",
  "video/",
  "audio/",
];

const allowedMimeExact = new Set([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/json",
  "application/xml",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/octet-stream",
]);

export function getMaxUploadBytes() {
  const envMb = Number.parseInt(process.env.MAX_UPLOAD_MB || "", 10);
  const mb = Number.isFinite(envMb) && envMb > 0 ? envMb : DEFAULT_MAX_UPLOAD_MB;
  return mb * MB;
}

export function isAllowedMimeType(mimeType) {
  if (!mimeType || typeof mimeType !== "string") return false;
  if (allowedMimeExact.has(mimeType)) return true;
  return allowedMimePrefixes.some((prefix) => mimeType.startsWith(prefix));
}

export function validateUploadPolicy(file) {
  const maxBytes = getMaxUploadBytes();

  if (!file || !(file instanceof File)) {
    return { ok: false, error: "No file provided." };
  }

  if (file.size <= 0) {
    return { ok: false, error: "File is empty." };
  }

  if (file.size > maxBytes) {
    return { ok: false, error: `File exceeds ${Math.round(maxBytes / MB)}MB upload limit.` };
  }

  const mimeType = file.type || "application/octet-stream";
  if (!isAllowedMimeType(mimeType)) {
    return { ok: false, error: "This file type is not allowed." };
  }

  return { ok: true, mimeType };
}
