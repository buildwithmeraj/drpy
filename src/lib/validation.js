import { ObjectId } from "mongodb";

export function isNonEmptyString(value, max = 500) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
}

export function toSafeString(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

export function toSafeInt(value, fallback = null) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function isValidObjectId(value) {
  return typeof value === "string" && ObjectId.isValid(value);
}

export function normalizeFolder(folder) {
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
