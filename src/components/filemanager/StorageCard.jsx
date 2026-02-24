"use client";

import { formatBytes } from "../../app/files/utils";

export default function StorageCard({ usedBytes, limitBytes, percent }) {
  return (
    <div className="card bg-base-200 p-5">
      <div className="flex justify-between text-sm mb-2">
        <span>Storage used</span>
        <span>
          {formatBytes(usedBytes)} / {formatBytes(limitBytes)}
        </span>
      </div>
      <progress
        className="progress progress-primary w-full"
        value={percent}
        max="100"
      />
    </div>
  );
}
