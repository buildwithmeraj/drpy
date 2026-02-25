"use client";

import { useState } from "react";

export default function ExtendModal({ open, onClose, onSubmit, type, maxValue }) {
  const [value, setValue] = useState(type === "hours" ? 24 : 1);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close modal" />
      <div className="relative card bg-base-100 border border-base-300 w-full max-w-xs p-6 rounded-2xl shadow-xl">
        <h3 className="font-semibold text-lg mb-2">
          Extend {type === "hours" ? "Expiry Time" : "Download Limit"}
        </h3>
        <label className="form-control mb-3">
          <span className="label-text mb-1">
            {type === "hours" ? "Add hours (1-720)" : "Add downloads"}
          </span>
          <input
            type="number"
            min={1}
            max={type === "hours" ? 720 : maxValue || 1000}
            className="input input-bordered w-full"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => onSubmit(Number(value))}
            disabled={!value || value < 1}
          >
            Extend
          </button>
        </div>
      </div>
    </div>
  );
}
