"use client";

import { useState } from "react";

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
}

export default function ShareDownloadClient({ code, initialMeta, initialError }) {
  const [meta, setMeta] = useState(initialMeta);
  const [password, setPassword] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(initialError || "");

  const handleDownload = async () => {
    setError("");
    setDownloading(true);

    const response = await fetch(`/api/share/${code}/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const data = await response.json();
      setDownloading(false);
      setError(data.error || "Download failed.");
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = meta?.file?.name || "download";
    a.click();
    URL.revokeObjectURL(url);

    setDownloading(false);
    setMeta((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        link: {
          ...prev.link,
          downloadCount: (prev.link.downloadCount || 0) + 1,
        },
      };
    });
  };

  if (!meta) {
    return <p className="text-error">{error || "Link is unavailable."}</p>;
  }

  return (
    <div className="card bg-base-200 p-6 gap-4">
      {error && <p className="text-error text-sm">{error}</p>}

      <p>
        <span className="font-semibold">File:</span> {meta.file.name}
      </p>
      <p>
        <span className="font-semibold">Size:</span> {formatBytes(meta.file.size)}
      </p>
      <p>
        <span className="font-semibold">Type:</span> {meta.file.mimeType}
      </p>
      <p>
        <span className="font-semibold">Expires:</span>{" "}
        {new Date(meta.link.expiresAt).toLocaleString()}
      </p>
      {typeof meta.link.maxDownloads === "number" && (
        <p>
          <span className="font-semibold">Downloads:</span> {meta.link.downloadCount} /{" "}
          {meta.link.maxDownloads}
        </p>
      )}

      {meta.link.hasPassword && (
        <label className="form-control">
          <span className="label-text mb-1">Password</span>
          <input
            type="password"
            className="input input-bordered"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter link password"
          />
        </label>
      )}

      <button className="btn btn-primary" onClick={handleDownload} disabled={downloading}>
        {downloading ? "Downloading..." : "Download"}
      </button>
    </div>
  );
}
