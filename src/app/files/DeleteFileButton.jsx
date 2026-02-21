"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function DeleteFileButton({ fileId }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    setError("");

    const response = await fetch(`/api/files/${fileId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Delete failed.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        className="btn btn-sm btn-error"
        onClick={handleDelete}
        disabled={isPending}
      >
        {isPending ? "Deleting..." : "Delete"}
      </button>
      {error && <span className="text-error text-xs">{error}</span>}
    </div>
  );
}
