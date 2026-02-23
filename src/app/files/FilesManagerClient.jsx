"use client";

import { useMemo, useState } from "react";
import CreateShareLinkButton from "./CreateShareLinkButton";
import { DEFAULT_QUOTA_BYTES } from "@/lib/quota";

function formatBytes(bytes) {
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

function normalizeFolderValue(folder) {
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

function toFolderAliasId(folderName) {
  return folderName === "/" ? "root" : `name:${encodeURIComponent(folderName)}`;
}

function sortFolders(a, b) {
  if (a.name === "/") return -1;
  if (b.name === "/") return 1;
  return a.name.localeCompare(b.name);
}

function getPreviewMode(file) {
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

function ConfirmDeleteModal({ open, count, onCancel, onConfirm, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4">
      <button className="absolute inset-0 bg-black/40" onClick={onCancel} aria-label="Close delete modal" />
      <div className="relative card bg-base-100 border border-base-300 w-full max-w-md p-5">
        <h3 className="text-lg font-semibold mb-2">Delete Confirmation</h3>
        <p className="text-sm opacity-80 mb-4">
          This will permanently delete {count} file{count > 1 ? "s" : ""} and associated share links.
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-error" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MoveFolderModal({ open, count, initialFolder = "/", folderOptions, onCancel, onConfirm, loading }) {
  const [folder, setFolder] = useState(initialFolder);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4">
      <button className="absolute inset-0 bg-black/40" onClick={onCancel} aria-label="Close move modal" />
      <div className="relative card bg-base-100 border border-base-300 w-full max-w-md p-5">
        <h3 className="text-lg font-semibold mb-2">Move to Folder</h3>
        <p className="text-sm opacity-80 mb-3">
          Move {count} file{count > 1 ? "s" : ""} to:
        </p>

        <input
          type="text"
          className="input input-bordered w-full"
          value={folder}
          onChange={(event) => setFolder(event.target.value)}
          placeholder="/"
          list="folder-options"
        />
        <datalist id="folder-options">
          {folderOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>

        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>
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

function CreateFolderModal({ open, onCancel, onConfirm, loading }) {
  const [name, setName] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4">
      <button className="absolute inset-0 bg-black/40" onClick={onCancel} aria-label="Close create folder modal" />
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
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>
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

function RenameFolderModal({ open, folder, onCancel, onConfirm, loading }) {
  const [name, setName] = useState(folder?.name || "");

  if (!open || !folder) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4">
      <button className="absolute inset-0 bg-black/40" onClick={onCancel} aria-label="Close rename folder modal" />
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
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>
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

function DeleteFolderModal({ open, folder, onCancel, onConfirm, loading }) {
  if (!open || !folder) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4">
      <button className="absolute inset-0 bg-black/40" onClick={onCancel} aria-label="Close delete folder modal" />
      <div className="relative card bg-base-100 border border-base-300 w-full max-w-md p-5">
        <h3 className="text-lg font-semibold mb-2">Delete Folder</h3>
        <p className="text-sm opacity-80 mb-4">
          Delete <span className="font-semibold">{folder.name}</span>? Files inside this folder will be moved to <span className="font-semibold">/</span>.
        </p>
        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-error" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ file, open, onClose }) {
  if (!open || !file) return null;

  const previewMode = getPreviewMode(file);
  const previewUrl = `/api/files/${file.id}/preview`;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4">
      <button className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close preview modal" />
      <div className="relative card bg-base-100 border border-base-300 w-full max-w-5xl p-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold truncate">{file.originalName}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Close
          </button>
        </div>

        {previewMode === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={file.originalName} className="max-h-[75vh] w-auto mx-auto rounded-lg border border-base-300" />
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
          <video className="w-full max-h-[75vh] rounded-lg border border-base-300" controls src={previewUrl}>
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

export default function FilesManagerClient({ initialFiles, initialFolders, quota }) {
  const [files, setFiles] = useState(initialFiles || []);
  const [folders, setFolders] = useState(initialFolders || []);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [folderFilter, setFolderFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteTargetIds, setDeleteTargetIds] = useState([]);
  const [moveTargetIds, setMoveTargetIds] = useState([]);
  const [previewTarget, setPreviewTarget] = useState(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameFolderTarget, setRenameFolderTarget] = useState(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState(null);

  const folderRows = useMemo(() => {
    const map = new Map();
    map.set("/", {
      id: "root",
      name: "/",
      isRoot: true,
      createdAt: null,
      updatedAt: null,
      fileCount: 0,
    });

    for (const folder of folders) {
      const name = normalizeFolderValue(folder?.name);
      if (!name) continue;
      map.set(name, {
        id: folder.id || toFolderAliasId(name),
        name,
        isRoot: name === "/",
        createdAt: folder.createdAt || null,
        updatedAt: folder.updatedAt || null,
        fileCount: 0,
      });
    }

    for (const file of files) {
      const name = normalizeFolderValue(file.folder);
      if (!map.has(name)) {
        map.set(name, {
          id: toFolderAliasId(name),
          name,
          isRoot: name === "/",
          createdAt: null,
          updatedAt: null,
          fileCount: 0,
        });
      }
      map.get(name).fileCount += 1;
    }

    return Array.from(map.values()).sort(sortFolders);
  }, [files, folders]);

  const folderOptions = useMemo(() => folderRows.map((folder) => folder.name), [folderRows]);

  const foldersForFilter = useMemo(() => ["all", ...folderOptions], [folderOptions]);

  const filtered = useMemo(() => {
    let next = [...files].map((file) => ({
      ...file,
      folder: normalizeFolderValue(file.folder),
    }));

    if (folderFilter !== "all") {
      const normalizedFilter = normalizeFolderValue(folderFilter);
      next = next.filter((file) => normalizeFolderValue(file.folder) === normalizedFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      next = next.filter((file) => file.originalName.toLowerCase().includes(q));
    }

    const direction = sortOrder === "asc" ? 1 : -1;
    next.sort((a, b) => {
      if (sortBy === "name") return a.originalName.localeCompare(b.originalName) * direction;
      if (sortBy === "size") return ((a.size || 0) - (b.size || 0)) * direction;
      if (sortBy === "folder") return normalizeFolderValue(a.folder).localeCompare(normalizeFolderValue(b.folder)) * direction;
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
    });
    return next;
  }, [files, folderFilter, search, sortBy, sortOrder]);

  const normalizedQuota = useMemo(
    () => ({
      usedBytes: quota?.usedBytes || 0,
      limitBytes: quota?.limitBytes || DEFAULT_QUOTA_BYTES,
    }),
    [quota],
  );

  const quotaPercent = useMemo(
    () => Math.min(100, (normalizedQuota.usedBytes / normalizedQuota.limitBytes) * 100),
    [normalizedQuota],
  );

  const refreshFolders = async () => {
    const response = await fetch("/api/folders", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return;
    setFolders(Array.isArray(data.folders) ? data.folders : []);
  };

  const ensureFolderExists = async (folderName) => {
    const normalized = normalizeFolderValue(folderName);
    if (normalized === "/") return true;

    if (folderRows.some((folder) => folder.name === normalized)) {
      return true;
    }

    const response = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: normalized }),
    });

    if (response.status === 409) {
      await refreshFolders();
      return true;
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error || "Could not ensure folder exists.");
      return false;
    }

    setFolders((prev) => [...prev, data.folder].sort(sortFolders));
    return true;
  };

  const toggleSelected = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const removeFromState = (ids) => {
    const idSet = new Set(ids);
    setFiles((prev) => prev.filter((file) => !idSet.has(file.id)));
    setSelected((prev) => prev.filter((id) => !idSet.has(id)));
  };

  const performDelete = async (ids) => {
    if (!ids.length) return;
    setError("");
    setActionLoading(true);

    if (ids.length === 1) {
      const response = await fetch(`/api/files/${ids[0]}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      setActionLoading(false);
      if (!response.ok) {
        setError(data.error || "Delete failed.");
        return;
      }
      removeFromState(ids);
      return;
    }

    const response = await fetch("/api/files/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileIds: ids }),
    });
    const data = await response.json().catch(() => ({}));
    setActionLoading(false);
    if (!response.ok) {
      setError(data.error || "Bulk delete failed.");
      return;
    }
    removeFromState(ids);
  };

  const performMove = async (ids, folder) => {
    if (!ids.length) return;
    setError("");

    const normalizedFolder = normalizeFolderValue(folder);
    const folderReady = await ensureFolderExists(normalizedFolder);
    if (!folderReady) return;

    setActionLoading(true);

    if (ids.length === 1) {
      const response = await fetch(`/api/files/${ids[0]}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: normalizedFolder }),
      });
      const data = await response.json().catch(() => ({}));
      setActionLoading(false);
      if (!response.ok) {
        setError(data.error || "Could not move file.");
        return;
      }
      setFiles((prev) => prev.map((row) => (row.id === ids[0] ? { ...row, folder: data.folder } : row)));
      setSelected((prev) => prev.filter((id) => id !== ids[0]));
      return;
    }

    const response = await fetch("/api/files/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileIds: ids, folder: normalizedFolder }),
    });
    const data = await response.json().catch(() => ({}));
    setActionLoading(false);
    if (!response.ok) {
      setError(data.error || "Bulk move failed.");
      return;
    }
    setFiles((prev) => prev.map((file) => (ids.includes(file.id) ? { ...file, folder: data.folder } : file)));
    setSelected((prev) => prev.filter((id) => !ids.includes(id)));
  };

  const createFolder = async (name) => {
    setError("");
    setActionLoading(true);

    const response = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await response.json().catch(() => ({}));
    setActionLoading(false);

    if (!response.ok) {
      setError(data.error || "Could not create folder.");
      return false;
    }

    setFolders((prev) => [...prev, data.folder].sort(sortFolders));
    return true;
  };

  const renameFolder = async (folder, nextName) => {
    setError("");
    setActionLoading(true);

    const response = await fetch(`/api/folders/${folder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nextName }),
    });
    const data = await response.json().catch(() => ({}));
    setActionLoading(false);

    if (!response.ok) {
      setError(data.error || "Could not rename folder.");
      return false;
    }

    const prevName = normalizeFolderValue(folder.name);
    const updatedName = normalizeFolderValue(data.folder?.name || nextName);

    setFolders((prev) => prev.map((row) => (
      normalizeFolderValue(row.name) === prevName
        ? { ...row, name: updatedName, updatedAt: data.folder?.updatedAt || new Date().toISOString() }
        : row
    )));
    setFiles((prev) => prev.map((file) => (
      normalizeFolderValue(file.folder) === prevName
        ? { ...file, folder: updatedName }
        : file
    )));
    if (folderFilter === prevName) {
      setFolderFilter(updatedName);
    }
    await refreshFolders();
    return true;
  };

  const deleteFolder = async (folder) => {
    setError("");
    setActionLoading(true);

    const response = await fetch(`/api/folders/${folder.id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    setActionLoading(false);

    if (!response.ok) {
      setError(data.error || "Could not delete folder.");
      return false;
    }

    const targetName = normalizeFolderValue(folder.name);
    setFolders((prev) => prev.filter((row) => normalizeFolderValue(row.name) !== targetName));
    setFiles((prev) => prev.map((file) => (
      normalizeFolderValue(file.folder) === targetName
        ? { ...file, folder: "/" }
        : file
    )));
    if (folderFilter === targetName) {
      setFolderFilter("all");
    }
    await refreshFolders();
    return true;
  };

  return (
    <div className="space-y-4">
      <ConfirmDeleteModal
        open={deleteTargetIds.length > 0}
        count={deleteTargetIds.length}
        loading={actionLoading}
        onCancel={() => setDeleteTargetIds([])}
        onConfirm={async () => {
          const ids = [...deleteTargetIds];
          await performDelete(ids);
          setDeleteTargetIds([]);
        }}
      />

      <MoveFolderModal
        open={moveTargetIds.length > 0}
        count={moveTargetIds.length}
        folderOptions={folderOptions}
        loading={actionLoading}
        onCancel={() => setMoveTargetIds([])}
        onConfirm={async (folder) => {
          const ids = [...moveTargetIds];
          await performMove(ids, folder);
          setMoveTargetIds([]);
        }}
      />

      <CreateFolderModal
        open={createFolderOpen}
        loading={actionLoading}
        onCancel={() => setCreateFolderOpen(false)}
        onConfirm={async (name) => {
          const ok = await createFolder(name);
          if (ok) setCreateFolderOpen(false);
        }}
      />

      <RenameFolderModal
        open={Boolean(renameFolderTarget)}
        folder={renameFolderTarget}
        loading={actionLoading}
        onCancel={() => setRenameFolderTarget(null)}
        onConfirm={async (name) => {
          if (!renameFolderTarget) return;
          const ok = await renameFolder(renameFolderTarget, name);
          if (ok) setRenameFolderTarget(null);
        }}
      />

      <DeleteFolderModal
        open={Boolean(deleteFolderTarget)}
        folder={deleteFolderTarget}
        loading={actionLoading}
        onCancel={() => setDeleteFolderTarget(null)}
        onConfirm={async () => {
          if (!deleteFolderTarget) return;
          const ok = await deleteFolder(deleteFolderTarget);
          if (ok) setDeleteFolderTarget(null);
        }}
      />

      <PreviewModal
        file={previewTarget}
        open={Boolean(previewTarget)}
        onClose={() => setPreviewTarget(null)}
      />

      <div className="card bg-base-200 p-5">
        <div className="flex justify-between text-sm mb-2">
          <span>Storage used</span>
          <span>
            {formatBytes(normalizedQuota.usedBytes)} / {formatBytes(normalizedQuota.limitBytes)}
          </span>
        </div>
        <progress className="progress progress-primary w-full" value={quotaPercent} max="100" />
      </div>

      <div className="card bg-base-200 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Folders</h3>
          <button className="btn btn-sm btn-primary" onClick={() => setCreateFolderOpen(true)}>
            Add Folder
          </button>
        </div>

        <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Files</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {folderRows.map((folder) => (
                <tr key={folder.id}>
                  <td className="font-medium">{folder.name}</td>
                  <td>{folder.fileCount}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="btn btn-xs btn-outline"
                        onClick={() => setFolderFilter(folder.name)}
                      >
                        Open
                      </button>
                      {!folder.isRoot && (
                        <>
                          <button
                            className="btn btn-xs btn-outline"
                            onClick={() => setRenameFolderTarget(folder)}
                          >
                            Rename
                          </button>
                          <button
                            className="btn btn-xs btn-error"
                            onClick={() => setDeleteFolderTarget(folder)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card bg-base-200 p-4 grid md:grid-cols-5 gap-3">
        <input
          type="text"
          className="input input-bordered md:col-span-2"
          placeholder="Search files..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="select select-bordered"
          value={folderFilter}
          onChange={(event) => setFolderFilter(event.target.value)}
        >
          {foldersForFilter.map((folder) => (
            <option key={folder} value={folder}>
              {folder}
            </option>
          ))}
        </select>
        <select className="select select-bordered" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="createdAt">Date</option>
          <option value="name">Name</option>
          <option value="size">Size</option>
          <option value="folder">Folder</option>
        </select>
        <select className="select select-bordered" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>

        <div className="md:col-span-5 flex flex-wrap gap-2">
          <button
            className="btn btn-sm btn-outline"
            onClick={() => setMoveTargetIds(selected)}
            disabled={!selected.length || actionLoading}
          >
            Move Selected
          </button>
          <button
            className="btn btn-sm btn-error"
            onClick={() => setDeleteTargetIds(selected)}
            disabled={!selected.length || actionLoading}
          >
            Delete Selected
          </button>
          <span className="text-sm opacity-70 self-center">{selected.length} selected</span>
        </div>
      </div>

      {error && <p className="alert alert-error py-2">{error}</p>}

      <div className="overflow-x-auto bg-base-200 rounded-box">
        <table className="table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selected.length === filtered.length}
                  onChange={(event) => setSelected(event.target.checked ? filtered.map((file) => file.id) : [])}
                />
              </th>
              <th>Name</th>
              <th>Folder</th>
              <th>Type</th>
              <th>Size</th>
              <th>Uploaded</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((file) => (
              <tr key={file.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.includes(file.id)}
                    onChange={() => toggleSelected(file.id)}
                  />
                </td>
                <td className="max-w-xs truncate" title={file.originalName}>
                  {file.originalName}
                </td>
                <td>{normalizeFolderValue(file.folder)}</td>
                <td>{file.mimeType}</td>
                <td>{formatBytes(file.size)}</td>
                <td>{new Date(file.createdAt).toLocaleString()}</td>
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    <CreateShareLinkButton fileId={file.id} />
                    <button className="btn btn-sm btn-outline" onClick={() => setMoveTargetIds([file.id])}>
                      Move
                    </button>
                    {getPreviewMode(file) && (
                      <button className="btn btn-sm btn-outline" onClick={() => setPreviewTarget(file)}>
                        Preview
                      </button>
                    )}
                    <button className="btn btn-sm btn-error" onClick={() => setDeleteTargetIds([file.id])}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
