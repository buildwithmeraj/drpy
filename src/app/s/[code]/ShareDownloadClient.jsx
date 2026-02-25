"use client";

import { useMemo, useState } from "react";
import { FiDownload, FiEye, FiCopy, FiLock, FiX } from "react-icons/fi";
import { FaRegFileAlt } from "react-icons/fa";
import ErrorMsg from "@/components/utilities/Error";
import WarningMsg from "@/components/utilities/Warning";
import { IoQrCodeOutline } from "react-icons/io5";
import BrandedQrCode from "@/components/utilities/BrandedQrCode";
import { FaFile } from "react-icons/fa6";

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
}

function statusMeta(meta, error) {
  if (meta) {
    if (
      typeof meta.link.maxDownloads === "number" &&
      meta.link.downloadCount >= meta.link.maxDownloads
    ) {
      return {
        label: "Download limit reached",
        classes: "bg-warning/10 text-warning border border-warning/20",
      };
    }
    return {
      label: "Link active",
      classes: "bg-primary/10 text-primary border border-primary/20",
    };
  }
  if ((error || "").toLowerCase().includes("expired")) {
    return {
      label: "Expired",
      classes: "bg-error/10 text-error border border-error/20",
    };
  }
  if ((error || "").toLowerCase().includes("limit")) {
    return {
      label: "Limit reached",
      classes: "bg-warning/10 text-warning border border-warning/20",
    };
  }
  return {
    label: "Unavailable",
    classes: "bg-base-200 text-base-content border border-base-300",
  };
}

export default function ShareDownloadClient({
  code,
  initialMeta,
  initialError,
}) {
  const [meta, setMeta] = useState(initialMeta);
  const [password, setPassword] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState(initialError || "");
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const stateBadge = statusMeta(meta, error);
  const mimeType = meta?.file?.mimeType || "";
  const previewMode = useMemo(() => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType.startsWith("text/") || mimeType === "application/json")
      return "text";
    return null;
  }, [mimeType]);

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/s/${code}` : "";

  const runFileAction = async (kind) => {
    setError("");
    if (kind === "download") setDownloading(true);
    if (kind === "preview") setPreviewing(true);

    const endpoint =
      kind === "download"
        ? `/api/share/${code}/download`
        : `/api/share/${code}/content`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(
        data.error || `${kind === "download" ? "Download" : "Preview"} failed.`,
      );
      setDownloading(false);
      setPreviewing(false);
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    if (kind === "download") {
      const a = document.createElement("a");
      a.href = url;
      a.download = meta?.file?.name || "download";
      a.click();
      URL.revokeObjectURL(url);
      setMeta((prev) =>
        prev
          ? {
              ...prev,
              link: {
                ...prev.link,
                downloadCount: (prev.link.downloadCount || 0) + 1,
              },
            }
          : prev,
      );
      setDownloading(false);
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(url);
    setPreviewing(false);
  };

  const copyShareUrl = async () => {
    await navigator.clipboard.writeText(
      typeof window !== "undefined"
        ? `${window.location.origin}/s/${code}`
        : "",
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FaRegFileAlt className="text-primary" size={22} />
            <h3 className="text-lg font-semibold">File Details</h3>
          </div>
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${stateBadge.classes}`}
          >
            {stateBadge.label}
          </span>
        </div>

        {error && <ErrorMsg message={error} />}
        {!meta && !error && (
          <WarningMsg message=" This link is not available." />
        )}

        {meta && (
          <div className="flex flex-col gap-4">
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="col-span-full">
                <span className="opacity-70">File Name</span>
                <div className="font-semibold flex items-center gap-2 line-clamp-1">
                  {meta.file.name}
                </div>
              </div>
              <div>
                <span className="opacity-70">Size</span>
                <div className="font-semibold">
                  {formatBytes(meta.file.size)}
                </div>
              </div>
              <div>
                <span className="opacity-70">Type</span>
                <div className="font-semibold">{meta.file.mimeType}</div>
              </div>
              <div>
                <span className="opacity-70">Expires</span>
                <div className="font-semibold">
                  {new Date(meta.link.expiresAt).toLocaleString()}
                </div>
              </div>
              <div>
                <span className="opacity-70">Downloads</span>
                <div className="font-semibold">
                  {meta.link.downloadCount}
                  {typeof meta.link.maxDownloads === "number" ? (
                    <span className="text-base-content/40 font-normal">
                      {" "}
                      / {meta.link.maxDownloads}
                    </span>
                  ) : null}
                </div>
              </div>
              {meta.link.hasPassword && (
                <div className="sm:col-span-2 card bg-base-200 p-4 rounded-xl border border-base-300">
                  <div className="flex items-center gap-2">
                    <span className="opacity-70 flex items-center gap-1">
                      <FiLock size={18} /> Password required
                    </span>
                    <input
                      type="password"
                      className="input input-bordered mt-1 flex-1"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter unlock password"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                className="btn btn-primary text-white flex items-center gap-2"
                type="button"
                onClick={() => setQrOpen(true)}
              >
                <IoQrCodeOutline />
                QR Code
              </button>
              <button
                className="btn btn-info text-white flex items-center gap-2"
                onClick={copyShareUrl}
                type="button"
              >
                <FiCopy />
                {copied ? "Copied" : "Copy Link"}
              </button>
              {previewMode && (
                <button
                  className="btn btn-secondary text-white flex items-center gap-2"
                  onClick={() => runFileAction("preview")}
                  disabled={previewing}
                  type="button"
                >
                  <FiEye />
                  {previewing ? "Loading preview..." : "Preview"}
                </button>
              )}
              <button
                className="btn btn-success text-white flex items-center gap-2"
                onClick={() => runFileAction("download")}
                disabled={downloading}
                type="button"
              >
                <FiDownload />
                {downloading ? "Downloading..." : "Download"}
              </button>
            </div>
          </div>
        )}
      </div>

      {qrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-base-100 rounded-2xl border border-base-300 shadow-xl p-8 flex flex-col items-center">
            <div className="mb-4">
              <BrandedQrCode value={shareUrl} size={200} />
            </div>
            <div className="text-center">
              <div className="font-semibold text-base-content mb-1">
                Scan to open link
              </div>
              <div className="text-xs text-base-content/60">{shareUrl}</div>
              <button
                className="btn btn-sm btn-soft mt-4"
                onClick={() => setQrOpen(false)}
                aria-label="Close QR code"
                type="button"
              >
                <FiX size={20} /> Close
              </button>
            </div>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <FiEye />
              Preview
            </h4>
            <button
              className="btn btn-sm btn-soft"
              onClick={() => setPreviewUrl(null)}
              type="button"
            >
              <FiX size={20} /> Close
            </button>
          </div>
          <div className="divider mt-1"></div>
          {previewMode === "image" && (
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-[70vh] w-auto rounded-lg mx-auto"
            />
          )}
          {previewMode === "pdf" && (
            <iframe
              src={previewUrl}
              title="PDF Preview"
              className="w-full min-h-[70vh] rounded-lg border border-base-300"
            />
          )}
          {previewMode === "text" && (
            <iframe
              src={previewUrl}
              title="Text Preview"
              className="w-full min-h-[60vh] rounded-lg border border-base-300"
            />
          )}
        </div>
      )}
    </div>
  );
}
