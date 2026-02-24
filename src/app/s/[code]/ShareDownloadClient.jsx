"use client";

import { useMemo, useState } from "react";

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
}

function statusMeta(meta, error) {
  if (meta) {
    if (typeof meta.link.maxDownloads === "number" && meta.link.downloadCount >= meta.link.maxDownloads) {
      return { label: "Download limit reached", tone: "badge-warning" };
    }
    return { label: "Link active", tone: "badge-success" };
  }
  if ((error || "").toLowerCase().includes("expired")) {
    return { label: "Expired", tone: "badge-error" };
  }
  if ((error || "").toLowerCase().includes("limit")) {
    return { label: "Limit reached", tone: "badge-warning" };
  }
  return { label: "Unavailable", tone: "badge-neutral" };
}

export default function ShareDownloadClient({ code, initialMeta, initialError }) {
  const [meta, setMeta] = useState(initialMeta);
  const [password, setPassword] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState(initialError || "");
  const [copied, setCopied] = useState(false);

  const stateBadge = statusMeta(meta, error);
  const mimeType = meta?.file?.mimeType || "";
  const previewMode = useMemo(() => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType.startsWith("text/") || mimeType === "application/json") return "text";
    return null;
  }, [mimeType]);

  const runFileAction = async (kind) => {
    setError("");
    if (kind === "download") setDownloading(true);
    if (kind === "preview") setPreviewing(true);

    const endpoint = kind === "download" ? `/api/share/${code}/download` : `/api/share/${code}/content`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || `${kind === "download" ? "Download" : "Preview"} failed.`);
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
    await navigator.clipboard.writeText(`${window.location.origin}/s/${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className="space-y-4">
      <div className="card bg-base-200 border border-base-300 shadow-sm p-6 gap-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">Share Details</h3>
          <span className={`badge ${stateBadge.tone}`}>{stateBadge.label}</span>
        </div>

        {error && <p className="alert alert-error py-2">{error}</p>}
        {!meta && !error && <p className="alert alert-warning py-2">This link is not available.</p>}

        {meta && (
          <>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <p>
                <span className="opacity-70">File</span>
                <br />
                <span className="font-semibold">{meta.file.name}</span>
              </p>
              <p>
                <span className="opacity-70">Size</span>
                <br />
                <span className="font-semibold">{formatBytes(meta.file.size)}</span>
              </p>
              <p>
                <span className="opacity-70">Type</span>
                <br />
                <span className="font-semibold">{meta.file.mimeType}</span>
              </p>
              <p>
                <span className="opacity-70">Expires</span>
                <br />
                <span className="font-semibold">{new Date(meta.link.expiresAt).toLocaleString()}</span>
              </p>
              <p>
                <span className="opacity-70">Downloads</span>
                <br />
                <span className="font-semibold">
                  {meta.link.downloadCount}
                  {typeof meta.link.maxDownloads === "number" ? ` / ${meta.link.maxDownloads}` : ""}
                </span>
              </p>
            </div>

            {meta.link.hasPassword && (
              <label className="form-control">
                <span className="label-text mb-1">Password required</span>
                <input
                  type="password"
                  className="input input-bordered"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter link password"
                />
              </label>
            )}

            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary" onClick={() => runFileAction("download")} disabled={downloading}>
                {downloading ? "Downloading..." : "Download"}
              </button>
              {previewMode && (
                <button className="btn btn-outline" onClick={() => runFileAction("preview")} disabled={previewing}>
                  {previewing ? "Loading preview..." : "Preview"}
                </button>
              )}
              <button className="btn btn-ghost" onClick={copyShareUrl}>
                {copied ? "Copied" : "Copy Link"}
              </button>
            </div>
          </>
        )}
      </div>

      {previewUrl && (
        <div className="surface-card p-4 reveal">
          <h4 className="font-semibold mb-3">Preview</h4>
          {previewMode === "image" && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={previewUrl} alt="Preview" className="max-h-[70vh] w-auto rounded-lg mx-auto" />
          )}
          {previewMode === "pdf" && (
            <iframe src={previewUrl} title="PDF Preview" className="w-full min-h-[70vh] rounded-lg border border-base-300" />
          )}
          {previewMode === "text" && (
            <iframe src={previewUrl} title="Text Preview" className="w-full min-h-[60vh] rounded-lg border border-base-300" />
          )}
        </div>
      )}
    </div>
  );
}
