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
  const [folder, setFolder] = useState("/");
  const [isUploading, setIsUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const applySelectedFile = (selectedFile) => {
    setError("");
    setSuccess("");
    setFile(selectedFile || null);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const selectedFile = event.dataTransfer?.files?.[0] || null;
    applySelectedFile(selectedFile);
  };

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
    formData.append("folder", folder);

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
          <div
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition ${
              dragging ? "border-primary bg-base-100" : "border-base-300 bg-base-100/60"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragging(false);
            }}
            onDrop={handleDrop}
          >
            <p className="font-medium mb-2">Drag and drop file here</p>
            <p className="text-sm opacity-70 mb-4">or choose from your device</p>
            <input
              type="file"
              className="file-input file-input-bordered w-full"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] || null;
                applySelectedFile(selectedFile);
              }}
            />
          </div>
        </label>

        <label className="form-control">
          <span className="label-text mb-2">Folder</span>
          <input
            type="text"
            className="input input-bordered"
            value={folder}
            onChange={(event) => setFolder(event.target.value)}
            placeholder="/"
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
