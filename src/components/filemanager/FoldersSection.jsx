"use client";

export default function FoldersSection({
  folderRows,
  onOpenFolder,
  onRenameFolder,
  onDeleteFolder,
  onAddFolder,
}) {
  return (
    <div className="card bg-base-200 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Folders</h3>
        <button className="btn btn-sm btn-primary" onClick={onAddFolder}>
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
                    <button className="btn btn-xs btn-primary" onClick={() => onOpenFolder(folder.name)}>
                      Open
                    </button>
                    {!folder.isRoot && (
                      <>
                        <button className="btn btn-xs btn-info text-white" onClick={() => onRenameFolder(folder)}>
                          Rename
                        </button>
                        <button className="btn btn-xs btn-error text-white" onClick={() => onDeleteFolder(folder)}>
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
  );
}
