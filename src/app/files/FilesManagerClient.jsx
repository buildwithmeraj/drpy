"use client";

import { useMemo, useState } from "react";
import CreateShareLinkButton from "./CreateShareLinkButton";

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
}

export default function FilesManagerClient({ initialFiles, quota }) {
  const [files, setFiles] = useState(initialFiles || []);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [folderFilter, setFolderFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const folders = useMemo(() => {
    const set = new Set(files.map((file) => file.folder || "root"));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [files]);

  const filtered = useMemo(() => {
    let next = [...files];
    if (folderFilter !== "all") {
      next = next.filter((file) => (file.folder || "root") === folderFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      next = next.filter((file) => file.originalName.toLowerCase().includes(q));
    }

    const direction = sortOrder === "asc" ? 1 : -1;
    next.sort((a, b) => {
      if (sortBy === "name") return a.originalName.localeCompare(b.originalName) * direction;
      if (sortBy === "size") return ((a.size || 0) - (b.size || 0)) * direction;
      if (sortBy === "folder") return (a.folder || "root").localeCompare(b.folder || "root") * direction;
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
    });
    return next;
  }, [files, folderFilter, search, sortBy, sortOrder]);

  const quotaPercent = useMemo(() => {
    if (!quota?.limitBytes) return 0;
    return Math.min(100, ((quota.usedBytes || 0) / quota.limitBytes) * 100);
  }, [quota]);

  const toggleSelected = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const removeFromState = (ids) => {
    const idSet = new Set(ids);
    setFiles((prev) => prev.filter((file) => !idSet.has(file.id)));
    setSelected((prev) => prev.filter((id) => !idSet.has(id)));
  };

  const deleteSingle = async (id) => {
    setError("");
    setActionLoading(true);
    const response = await fetch(`/api/files/${id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    setActionLoading(false);
    if (!response.ok) {
      setError(data.error || "Delete failed.");
      return;
    }
    removeFromState([id]);
  };

  const bulkDelete = async () => {
    if (!selected.length) return;
    setError("");
    setActionLoading(true);
    const response = await fetch("/api/files/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileIds: selected }),
    });
    const data = await response.json().catch(() => ({}));
    setActionLoading(false);
    if (!response.ok) {
      setError(data.error || "Bulk delete failed.");
      return;
    }
    removeFromState(selected);
  };

  const bulkMove = async () => {
    if (!selected.length) return;
    const folder = window.prompt("Move selected files to folder", "root");
    if (!folder) return;

    setError("");
    setActionLoading(true);
    const response = await fetch("/api/files/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileIds: selected, folder }),
    });
    const data = await response.json().catch(() => ({}));
    setActionLoading(false);
    if (!response.ok) {
      setError(data.error || "Bulk move failed.");
      return;
    }
    setFiles((prev) => prev.map((file) => (selected.includes(file.id) ? { ...file, folder: data.folder } : file)));
    setSelected([]);
  };

  return (
    <div className="space-y-4">
      <div className="card bg-base-200 p-5">
        <div className="flex justify-between text-sm mb-2">
          <span>Storage used</span>
          <span>
            {formatBytes(quota.usedBytes)} / {formatBytes(quota.limitBytes)}
          </span>
        </div>
        <progress className="progress progress-primary w-full" value={quotaPercent} max="100" />
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
          {folders.map((folder) => (
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
          <button className="btn btn-sm btn-outline" onClick={bulkMove} disabled={!selected.length || actionLoading}>
            Move Selected
          </button>
          <button className="btn btn-sm btn-error" onClick={bulkDelete} disabled={!selected.length || actionLoading}>
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
                  onChange={(event) =>
                    setSelected(event.target.checked ? filtered.map((file) => file.id) : [])
                  }
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
                <td>{file.folder || "root"}</td>
                <td>{file.mimeType}</td>
                <td>{formatBytes(file.size)}</td>
                <td>{new Date(file.createdAt).toLocaleString()}</td>
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    <CreateShareLinkButton fileId={file.id} />
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={async () => {
                        const folder = window.prompt("Folder name", file.folder || "root");
                        if (!folder) return;
                        const response = await fetch(`/api/files/${file.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ folder }),
                        });
                        const data = await response.json().catch(() => ({}));
                        if (!response.ok) {
                          setError(data.error || "Could not move file.");
                          return;
                        }
                        setFiles((prev) =>
                          prev.map((row) => (row.id === file.id ? { ...row, folder: data.folder } : row)),
                        );
                      }}
                    >
                      Move
                    </button>
                    <button className="btn btn-sm btn-error" onClick={() => deleteSingle(file.id)}>
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
