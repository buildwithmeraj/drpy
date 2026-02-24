"use client";

import { FaSearch } from "react-icons/fa";
import { MdDelete, MdDriveFileMove } from "react-icons/md";
export default function FilesToolbar({
  search,
  onSearchChange,
  folderFilter,
  onFolderFilterChange,
  foldersForFilter,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  selectedCount,
  actionLoading,
  onMoveSelected,
  onDeleteSelected,
}) {
  return (
    <div className="card bg-base-200 p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="relative">
        <FaSearch className="absolute left-3 top-3 text-gray-400 z-10" />
        <input
          type="text"
          className="input input-bordered md:col-span-2 pl-10"
          placeholder="Search files..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <select
        className="select select-bordered"
        value={folderFilter}
        onChange={(event) => onFolderFilterChange(event.target.value)}
      >
        {foldersForFilter.map((folder) => (
          <option key={folder} value={folder}>
            {folder}
          </option>
        ))}
      </select>
      <select
        className="select select-bordered"
        value={sortBy}
        onChange={(event) => onSortByChange(event.target.value)}
      >
        <option value="createdAt">Date</option>
        <option value="name">Name</option>
        <option value="size">Size</option>
        <option value="folder">Folder</option>
      </select>
      <select
        className="select select-bordered"
        value={sortOrder}
        onChange={(event) => onSortOrderChange(event.target.value)}
      >
        <option value="desc">Desc</option>
        <option value="asc">Asc</option>
      </select>

      {selectedCount ? (
        <div className="md:col-span-full flex flex-wrap gap-3 justify-center">
          <div className="self-center">
            <div className={`badge badge-sm mr-2 mb-0.5 badge-info text-white`}>
              {selectedCount}
            </div>
            Selected
          </div>

          <button
            className="btn btn-xs btn-secondary"
            onClick={onMoveSelected}
            disabled={!selectedCount || actionLoading}
          >
            <MdDriveFileMove />
            Move Selected
          </button>
          <button
            className="btn btn-xs btn-error"
            onClick={onDeleteSelected}
            disabled={!selectedCount || actionLoading}
          >
            <MdDelete />
            Delete Selected
          </button>
        </div>
      ) : (
        ""
      )}
    </div>
  );
}
