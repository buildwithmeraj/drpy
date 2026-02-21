"use client";

import Link from "next/link";
import { useState } from "react";

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
}

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!file) {
      setError("Please choose a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);

    const response = await fetch("/api/files/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setIsUploading(false);

    if (!response.ok) {
      setError(data.error || "Upload failed.");
      return;
    }

    setSuccess(`${file.name} uploaded successfully.`);
    setFile(null);
  };

  return (
    <section className="max-w-2xl mx-auto py-8">
      <h2>Upload File</h2>
      <form onSubmit={handleSubmit} className="card bg-base-200 p-6 gap-4">
        {error && <p className="text-error text-sm">{error}</p>}
        {success && <p className="text-success text-sm">{success}</p>}

        <label className="form-control">
          <span className="label-text mb-2">Choose file (max 100MB)</span>
          <input
            type="file"
            className="file-input file-input-bordered w-full"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0] || null;
              setFile(selectedFile);
            }}
          />
        </label>

        {file && (
          <p className="text-sm">
            Selected: <span className="font-semibold">{file.name}</span> (
            {formatBytes(file.size)})
          </p>
        )}

        <button type="submit" className="btn btn-primary w-full" disabled={isUploading}>
          {isUploading ? "Uploading..." : "Upload"}
        </button>

        <Link href="/files" className="btn btn-outline w-full">
          Go to My Files
        </Link>
      </form>
    </section>
  );
}
