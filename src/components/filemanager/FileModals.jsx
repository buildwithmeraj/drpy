"use client";

import { useState } from "react";
import { getPreviewMode } from "../../app/files/utils";

export function ConfirmDeleteModal({
  open,
  count,
  onCancel,
  onConfirm,
  loading,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4">
      <button
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-label="Close delete modal"
      />
      <div className="relative card bg-base-100 border border-base-300 w-full max-w-md p-5">
        <h3 className="text-lg font-semibold mb-2">Delete Confirmation</h3>
        <p className="text-sm opacity-80 mb-4">
          This will permanently delete {count} file{count > 1 ? "s" : ""} and
          associated share links. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-error"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MoveFolderModal({
  open,
  count,
  initialFolder = "/",
  folderOptions,
  onCancel,
  onConfirm,
  loading,
}) {
  const [folder, setFolder] = useState(initialFolder);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4">
      <button
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-label="Close move modal"
      />
      <div className="relative card bg-base-100 border border-base-300 w-full max-w-md p-5">
        <h3 className="text-lg font-semibold mb-2">Move to Folder</h3>
        <p className="text-sm opacity-80 mb-3">
          Move {count} file{count > 1 ? "s" : ""} to:
        </p>
        <select
          className="select select-bordered w-full"
          value={folderOptions.includes(folder) ? folder : ""}
          onChange={(event) => setFolder(event.target.value)}
        >
          {folderOptions.map((option) => (
            <option key={option} value={option}>
              {option === "/" ? "/" : option}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2 mt-4">
          <button
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onConfirm(folder)}
            disabled={loading || !folder.trim()}
          >
            {loading ? "Moving..." : "Move"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CreateFolderModal({ open, onCancel, onConfirm, loading }) {
  const [name, setName] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4">
      <button
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-label="Close create folder modal"
      />
      <div className="relative card bg-base-100 border border-base-300 w-full max-w-md p-5">
        <h3 className="text-lg font-semibold mb-2">Add Folder</h3>
        <input
          type="text"
          className="input input-bordered w-full"
          placeholder="Folder name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onConfirm(name)}
            disabled={loading || !name.trim()}
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function RenameFolderModal({
  open,
  folder,
  onCancel,
  onConfirm,
  loading,
}) {
  const [name, setName] = useState(folder?.name || "");

  if (!open || !folder) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4">
      <button
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-label="Close rename folder modal"
      />
      <div className="relative card bg-base-100 border border-base-300 w-full max-w-md p-5">
        <h3 className="text-lg font-semibold mb-2">Rename Folder</h3>
        <input
          type="text"
          className="input input-bordered w-full"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Folder name"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onConfirm(name)}
            disabled={loading || !name.trim()}
          >
            {loading ? "Renaming..." : "Rename"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeleteFolderModal({
  open,
  folder,
  onCancel,
  onConfirm,
  loading,
}) {
  if (!open || !folder) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4">
      <button
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-label="Close delete folder modal"
      />
      <div className="relative card bg-base-100 border border-base-300 w-full max-w-md p-5">
        <h3 className="text-lg font-semibold mb-2">Delete Folder</h3>
        <p className="text-sm opacity-80 mb-4">
          Delete <span className="font-semibold">{folder.name}</span>? Files
          inside this folder will be moved to{" "}
          <span className="font-semibold">/</span>.
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-error"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PreviewModal({ file, open, onClose }) {
  if (!open || !file) return null;

  const previewMode = getPreviewMode(file);
  const previewUrl = `/api/files/${file.id}/preview`;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4">
      <button
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Close preview modal"
      />
      <div className="relative card bg-base-100 border border-base-300 w-full max-w-5xl p-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold truncate">
            {file.originalName}
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Close
          </button>
        </div>

        {previewMode === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={file.originalName}
            className="max-h-[75vh] w-auto mx-auto rounded-lg border border-base-300"
          />
        )}

        {previewMode === "pdf" && (
          <iframe
            src={previewUrl}
            title={`Preview ${file.originalName}`}
            className="w-full min-h-[75vh] rounded-lg border border-base-300"
          />
        )}

        {previewMode === "text" && (
          <iframe
            src={previewUrl}
            title={`Preview ${file.originalName}`}
            className="w-full min-h-[70vh] rounded-lg border border-base-300 bg-base-100"
          />
        )}

        {previewMode === "audio" && (
          <audio className="w-full mt-6" controls src={previewUrl}>
            Your browser does not support audio preview.
          </audio>
        )}

        {previewMode === "video" && (
          <video
            className="w-full max-h-[75vh] rounded-lg border border-base-300"
            controls
            src={previewUrl}
          >
            Your browser does not support video preview.
          </video>
        )}

        {!previewMode && (
          <p className="alert alert-warning">
            Preview is not available for this file type.
          </p>
        )}
      </div>
    </div>
  );
}
