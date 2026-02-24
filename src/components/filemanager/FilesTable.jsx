"use client";

import { MdDelete, MdDriveFileMove } from "react-icons/md";
import { FaEye } from "react-icons/fa6";
import { CiFileOff } from "react-icons/ci";
import {
  formatBytes,
  getPreviewMode,
  normalizeFolderValue,
} from "../../app/files/utils";
import CreateShareLinkButton from "@/app/files/CreateShareLinkButton";

export default function FilesTable({
  files,
  selected,
  onSelectAll,
  onToggleSelected,
  onMoveSingle,
  onPreview,
  onDeleteSingle,
}) {
  if (!files || files.length === 0) {
    return (
      <div className="p-8 text-center text-base-content/70">
        <CiFileOff className="inline mb-1 mr-1" />
        No files found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-base-200 rounded-box">
      <table className="table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={files.length > 0 && selected.length === files.length}
                onChange={(event) =>
                  onSelectAll(
                    event.target.checked ? files.map((file) => file.id) : [],
                  )
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
          {files.map((file) => (
            <tr key={file.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selected.includes(file.id)}
                  onChange={() => onToggleSelected(file.id)}
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
                <div className="flex justify-end gap-1">
                  <CreateShareLinkButton fileId={file.id} />
                  <button
                    className="btn btn-xs btn-secondary"
                    onClick={() => onMoveSingle(file.id)}
                  >
                    <MdDriveFileMove />
                    Move
                  </button>
                  {getPreviewMode(file) && (
                    <button
                      className="btn btn-xs btn-primary"
                      onClick={() => onPreview(file)}
                    >
                      <FaEye />
                      Preview
                    </button>
                  )}
                  <button
                    className="btn btn-xs btn-error text-white"
                    onClick={() => onDeleteSingle(file.id)}
                  >
                    <MdDelete />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
