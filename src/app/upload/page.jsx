"use client";

import ErrorMsg from "@/components/utilities/Error";
import SuccessMsg from "@/components/utilities/Success";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaUndoAlt } from "react-icons/fa";
import { FaFolder } from "react-icons/fa6";
import {
  FiUploadCloud,
  FiFile,
  FiCheckCircle,
  FiXCircle,
  FiUpload,
} from "react-icons/fi";

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
}

export default function UploadPage() {
  const maxFileSizeMb = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || 100);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const uploadWithProgress = (formData) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/files/upload");
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(Math.max(0, Math.min(100, percent)));
      };
      xhr.onerror = () =>
        reject(new Error("Upload failed due to network error."));
      xhr.onload = () => {
        const text = xhr.responseText || "{}";
        let data = {};
        try {
          data = JSON.parse(text);
        } catch {
          data = {};
        }
        resolve({ ok: xhr.status >= 200 && xhr.status < 300, data });
      };
      xhr.send(formData);
    });

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
    setUploadProgress(0);

    let result;
    try {
      result = await uploadWithProgress(formData);
    } catch (uploadError) {
      setIsUploading(false);
      setUploadProgress(0);
      const message =
        uploadError instanceof Error ? uploadError.message : "Upload failed.";
      setError(message);
      toast.error(message);
      return;
    }
    setIsUploading(false);
    setUploadProgress(0);

    if (!result.ok) {
      const message = result.data?.error || "Upload failed.";
      setError(message);
      toast.error(message);
      return;
    }

    setSuccess(`${file.name} uploaded successfully.`);
    toast.success("File uploaded successfully.");
    setFile(null);
  };

  return (
    <section className="flex flex-col items-center justify-center min-h-[80dvh] px-2">
      <div className="w-full max-w-lg">
        <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm p-7 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 mb-2">
              <FiUpload className="text-primary text-2xl" size={30} />
              <h2 className="text-2xl font-bold">Upload File</h2>
            </div>
            <Link href="/files" className="btn btn-info btn-soft">
              <FaFolder />
              My Files
            </Link>
          </div>
          <p className="opacity-70 mb-2">
            Upload a file to your cloud storage. Max size {maxFileSizeMb}MB.
          </p>

          {error && (
            <ErrorMsg
              message={error}
              icon={<FiXCircle className="w-5 h-5" />}
            />
          )}
          {success && <SuccessMsg message={success} />}
          {isUploading && (
            <div className="space-y-2">
              <progress
                className="progress progress-primary w-full transition-all duration-300"
                value={uploadProgress}
                max="100"
              />
              <div className="text-xs text-base-content/70 text-right">
                {uploadProgress}% uploaded
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <div className="font-semibold text-base-content pb-2">
                Choose file
              </div>
              <div
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer select-none ${
                  dragging
                    ? "border-primary bg-base-100"
                    : "border-base-300 bg-base-100/60"
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
                onClick={(event) => {
                  if (event.target === event.currentTarget) {
                    document.getElementById("file-input").click();
                  }
                }}
              >
                <p className="font-medium mb-2">
                  Drag and drop file here or click to select
                </p>
                <p className="text-sm opacity-70 mb-4">Max {maxFileSizeMb}MB</p>
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  onChange={(event) => {
                    const selectedFile = event.target.files?.[0] || null;
                    applySelectedFile(selectedFile);
                  }}
                />
                {file && (
                  <>
                    <div className="divider"></div>
                    <div className="font-semibold text-base-content flex items-center gap-1 mb-1">
                      <FiFile className="text-primary" size={24} />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <div className="text-sm opacity-80">
                      ({formatBytes(file.size)})
                    </div>
                  </>
                )}
              </div>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="reset"
                className="btn btn-soft"
                onClick={() => applySelectedFile(null)}
                disabled={isUploading}
              >
                <FaUndoAlt />
                Reset
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1 font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUploading}
              >
                <FiUpload size={18} />
                {isUploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
