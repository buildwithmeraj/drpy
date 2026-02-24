export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
}

function extensionFromName(name = "") {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

export function normalizeFolderValue(folder) {
  if (typeof folder !== "string" || !folder.trim()) return "/";
  const cleaned = folder
    .trim()
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\/|\/$/g, "");
  if (!cleaned) return "/";
  if (cleaned.toLowerCase() === "root") return "/";
  return cleaned;
}

export function toFolderAliasId(folderName) {
  return folderName === "/" ? "root" : `name:${encodeURIComponent(folderName)}`;
}

export function sortFolders(a, b) {
  if (a.name === "/") return -1;
  if (b.name === "/") return 1;
  return a.name.localeCompare(b.name);
}

export function getPreviewMode(file) {
  const mime = file?.mimeType || "";
  const ext = extensionFromName(file?.originalName || "");

  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (
    mime.startsWith("text/") ||
    ["txt", "md", "json", "csv", "xml", "log", "yml", "yaml"].includes(ext)
  ) {
    return "text";
  }

  return null;
}
