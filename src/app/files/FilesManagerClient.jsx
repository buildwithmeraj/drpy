"use client";

import { useMemo, useState } from "react";
import { DEFAULT_QUOTA_BYTES } from "@/lib/quota";
import { normalizeFolderValue, sortFolders, toFolderAliasId } from "./utils";
import {
  ConfirmDeleteModal,
  CreateFolderModal,
  DeleteFolderModal,
  MoveFolderModal,
  PreviewModal,
  RenameFolderModal,
} from "@/components/filemanager/FileModals";
import FilesTable from "@/components/filemanager/FilesTable";
import FilesToolbar from "@/components/filemanager/FilesToolbar";
import FoldersSection from "@/components/filemanager/FoldersSection";
import StorageCard from "@/components/filemanager/StorageCard";

export default function FilesManagerClient({
  initialFiles,
  initialFolders,
  quota,
}) {
  const [files, setFiles] = useState(initialFiles || []);
  const [folders, setFolders] = useState(initialFolders || []);
  const [quotaUsedBytes, setQuotaUsedBytes] = useState(quota?.usedBytes || 0);
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

  const folderOptions = useMemo(
    () =>
      folderRows.map((folder) =>
        folder.name === "/" ? "/" : "/" + folder.name + "/",
      ),
    [folderRows],
  );
  const foldersForFilter = useMemo(
    () => ["<All Files>", ...folderOptions],
    [folderOptions],
  );

  const filtered = useMemo(() => {
    let next = [...files].map((file) => ({
      ...file,
      folder: normalizeFolderValue(file.folder),
    }));

    if (folderFilter !== "all") {
      const normalizedFilter = normalizeFolderValue(folderFilter);
      next = next.filter(
        (file) => normalizeFolderValue(file.folder) === normalizedFilter,
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      next = next.filter((file) => file.originalName.toLowerCase().includes(q));
    }

    const direction = sortOrder === "asc" ? 1 : -1;
    next.sort((a, b) => {
      if (sortBy === "name")
        return a.originalName.localeCompare(b.originalName) * direction;
      if (sortBy === "size") return ((a.size || 0) - (b.size || 0)) * direction;
      if (sortBy === "folder") {
        return (
          normalizeFolderValue(a.folder).localeCompare(
            normalizeFolderValue(b.folder),
          ) * direction
        );
      }
      return (
        (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
        direction
      );
    });
    return next;
  }, [files, folderFilter, search, sortBy, sortOrder]);

  const normalizedQuota = useMemo(
    () => ({
      usedBytes: quotaUsedBytes,
      limitBytes: quota?.limitBytes || DEFAULT_QUOTA_BYTES,
    }),
    [quota?.limitBytes, quotaUsedBytes],
  );

  const quotaPercent = useMemo(
    () =>
      Math.min(
        100,
        (normalizedQuota.usedBytes / normalizedQuota.limitBytes) * 100,
      ),
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
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const removeFromState = (ids) => {
    const idSet = new Set(ids);
    const removedBytes = files
      .filter((file) => idSet.has(file.id))
      .reduce((sum, file) => sum + (file.size || 0), 0);
    setFiles((prev) => prev.filter((file) => !idSet.has(file.id)));
    setSelected((prev) => prev.filter((id) => !idSet.has(id)));
    if (removedBytes > 0) {
      setQuotaUsedBytes((prev) => Math.max(0, prev - removedBytes));
    }
  };

  const performDelete = async (ids) => {
    if (!ids.length) return;
    setError("");
    setActionLoading(true);

    if (ids.length === 1) {
      const response = await fetch(`/api/files/${ids[0]}`, {
        method: "DELETE",
      });
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
      setFiles((prev) =>
        prev.map((row) =>
          row.id === ids[0] ? { ...row, folder: data.folder } : row,
        ),
      );
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
    setFiles((prev) =>
      prev.map((file) =>
        ids.includes(file.id) ? { ...file, folder: data.folder } : file,
      ),
    );
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

    setFolders((prev) =>
      prev.map((row) =>
        normalizeFolderValue(row.name) === prevName
          ? {
              ...row,
              name: updatedName,
              updatedAt: data.folder?.updatedAt || new Date().toISOString(),
            }
          : row,
      ),
    );
    setFiles((prev) =>
      prev.map((file) =>
        normalizeFolderValue(file.folder) === prevName
          ? { ...file, folder: updatedName }
          : file,
      ),
    );
    if (folderFilter === prevName) {
      setFolderFilter(updatedName);
    }
    await refreshFolders();
    return true;
  };

  const deleteFolder = async (folder) => {
    setError("");
    setActionLoading(true);

    const response = await fetch(`/api/folders/${folder.id}`, {
      method: "DELETE",
    });
    const data = await response.json().catch(() => ({}));
    setActionLoading(false);

    if (!response.ok) {
      setError(data.error || "Could not delete folder.");
      return false;
    }

    const targetName = normalizeFolderValue(folder.name);
    setFolders((prev) =>
      prev.filter((row) => normalizeFolderValue(row.name) !== targetName),
    );
    setFiles((prev) =>
      prev.map((file) =>
        normalizeFolderValue(file.folder) === targetName
          ? { ...file, folder: "/" }
          : file,
      ),
    );
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

      <StorageCard
        usedBytes={normalizedQuota.usedBytes}
        limitBytes={normalizedQuota.limitBytes}
        percent={quotaPercent}
      />

      <FoldersSection
        folderRows={folderRows}
        onAddFolder={() => setCreateFolderOpen(true)}
        onOpenFolder={(folderName) => setFolderFilter(folderName)}
        onRenameFolder={(folder) => setRenameFolderTarget(folder)}
        onDeleteFolder={(folder) => setDeleteFolderTarget(folder)}
      />

      <FilesToolbar
        search={search}
        onSearchChange={setSearch}
        folderFilter={folderFilter}
        onFolderFilterChange={setFolderFilter}
        foldersForFilter={foldersForFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        selectedCount={selected.length}
        actionLoading={actionLoading}
        onMoveSelected={() => setMoveTargetIds(selected)}
        onDeleteSelected={() => setDeleteTargetIds(selected)}
      />

      {error && <p className="alert alert-error py-2">{error}</p>}

      <FilesTable
        files={filtered}
        selected={selected}
        onSelectAll={setSelected}
        onToggleSelected={toggleSelected}
        onMoveSingle={(id) => setMoveTargetIds([id])}
        onPreview={(file) => setPreviewTarget(file)}
        onDeleteSingle={(id) => setDeleteTargetIds([id])}
      />
    </div>
  );
}
