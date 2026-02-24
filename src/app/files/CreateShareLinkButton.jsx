"use client";

import { useState } from "react";
import { FaCopy, FaGears, FaShareNodes } from "react-icons/fa6";
import toast from "react-hot-toast";

function toLocalDatetimeValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function CreateShareLinkButton({ fileId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [expiryDateTime, setExpiryDateTime] = useState("");
  const [deleteAfterDownloads, setDeleteAfterDownloads] = useState(false);
  const [maxDownloads, setMaxDownloads] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [shareLink, setShareLink] = useState("");

  const handleCreate = async () => {
    setError("");
    setShareLink("");

    const expiryDate = new Date(expiryDateTime);
    const diffMs = expiryDate.getTime() - Date.now();
    const expiryHours = Math.max(1, Math.ceil(diffMs / (60 * 60 * 1000)));

    setIsSubmitting(true);
    const response = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileId,
        password,
        expiryHours,
        deleteAfterDownloads,
        maxDownloads,
      }),
    });

    const data = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setError(data.error || "Could not create share link.");
      return;
    }

    const origin = window.location.origin;
    setShareLink(`${origin}${data.link.urlPath}`);
    toast.success("Share link created successfully!");
  };

  const copyLink = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    toast.success("Share link copied to clipboard!");
  };

  const openModal = () => {
    if (!expiryDateTime) {
      setExpiryDateTime(
        toLocalDatetimeValue(new Date(Date.now() + 24 * 60 * 60 * 1000)),
      );
    }
    setIsOpen(true);
  };

  return (
    <>
      <button className="btn btn-xs btn-info text-white" onClick={openModal}>
        <FaShareNodes />
        Share
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 grid place-items-center p-4">
          <div className="card bg-base-100 w-full max-w-md p-5 gap-3 text-left">
            <h3 className="font-semibold text-lg">Create Share Link</h3>

            {error && <p className="text-error text-sm">{error}</p>}

            <div className="form-control">
              <label className="label-text pb-1">Expiry date/time</label>
              <input
                type="datetime-local"
                className="input input-bordered w-full"
                value={expiryDateTime}
                onChange={(event) => setExpiryDateTime(event.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label-text mb-1">Password (optional)</label>
              <input
                type="password"
                className="input input-bordered w-full"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Leave blank for public link"
              />
            </div>

            <label className="label cursor-pointer justify-start gap-2">
              <input
                type="checkbox"
                className="checkbox checkbox-sm mb-1 mr-1"
                checked={deleteAfterDownloads}
                onChange={(event) =>
                  setDeleteAfterDownloads(event.target.checked)
                }
              />
              <span className="label-text">
                Delete link after X times of downloads
              </span>
            </label>

            {deleteAfterDownloads && (
              <label className="form-control">
                <span className="label-text mb-1">Max downloads</span>
                <input
                  type="number"
                  min="1"
                  className="input input-bordered w-full"
                  value={maxDownloads}
                  onChange={(event) => setMaxDownloads(event.target.value)}
                  placeholder="e.g. 10"
                />
              </label>
            )}

            {shareLink && (
              <div className="bg-base-200 rounded-xl p-3 text-sm break-all">
                <p className="font-semibold mb-1">Share URL</p>
                <p>{shareLink}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-2">
              <button className="btn btn-soft" onClick={() => setIsOpen(false)}>
                Close
              </button>
              {shareLink && (
                <button className="btn btn-info text-white" onClick={copyLink}>
                  <FaCopy />
                  Copy
                </button>
              )}
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={isSubmitting}
              >
                <FaGears />
                {isSubmitting ? "Creating..." : "Create Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
