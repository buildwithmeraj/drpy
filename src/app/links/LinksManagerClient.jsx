"use client";

import { useMemo, useState } from "react";
import BrandedQrCode from "@/components/utilities/BrandedQrCode";

function statusBadge(status) {
  if (status === "active") return "badge-success";
  if (status === "expired") return "badge-error";
  if (status === "limit_reached") return "badge-warning";
  return "badge-neutral";
}

export default function LinksManagerClient({ initialLinks }) {
  const [links, setLinks] = useState(initialLinks || []);
  const [loadingId, setLoadingId] = useState("");
  const [error, setError] = useState("");

  const sorted = useMemo(
    () =>
      [...links].sort((a, b) => {
        const at = new Date(a.createdAt).getTime();
        const bt = new Date(b.createdAt).getTime();
        return bt - at;
      }),
    [links],
  );

  const apiAction = async (linkId, payload, method = "PATCH") => {
    setError("");
    setLoadingId(linkId);

    const response = await fetch(`/api/links/${linkId}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "PATCH" ? JSON.stringify(payload) : undefined,
    });

    const data = await response.json().catch(() => ({}));
    setLoadingId("");

    if (!response.ok) {
      setError(data.error || "Action failed.");
      return null;
    }

    return data;
  };

  const revoke = async (linkId) => {
    const data = await apiAction(linkId, { action: "revoke" });
    if (!data?.ok) return;
    setLinks((prev) => prev.filter((link) => link.id !== linkId));
  };

  const extend = async (linkId) => {
    const hours = window.prompt("Extend by how many hours? (1 - 720)", "24");
    if (!hours) return;
    const data = await apiAction(linkId, { action: "extend", expiryHours: hours });
    if (!data?.ok) return;
    setLinks((prev) =>
      prev.map((link) => (link.id === linkId ? { ...link, expiresAt: data.expiresAt, status: "active" } : link)),
    );
  };

  const regenerate = async (linkId) => {
    const data = await apiAction(linkId, { action: "regenerate" });
    if (!data?.ok) return;
    setLinks((prev) =>
      prev.map((link) =>
        link.id === linkId
          ? {
              ...link,
              code: data.code,
              urlPath: data.urlPath,
            }
          : link,
      ),
    );
  };

  const copy = async (urlPath) => {
    await navigator.clipboard.writeText(`${window.location.origin}${urlPath}`);
  };

  if (!sorted.length) {
    return <p className="opacity-80">No share links yet. Create one from your files page.</p>;
  }

  return (
    <div className="space-y-3">
      {error && <p className="alert alert-error py-2">{error}</p>}

      {sorted.map((link) => {
        const fullUrl = `${window.location.origin}${link.urlPath}`;

        return (
          <div key={link.id} className="surface-card p-4 reveal">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{link.fileName}</span>
                  <span className={`badge ${statusBadge(link.status)}`}>{link.status}</span>
                </div>
                <p className="text-sm opacity-80">
                  <a href={link.urlPath} target="_blank" rel="noreferrer" className="link link-primary break-all">
                    {link.urlPath}
                  </a>
                </p>
                <p className="text-sm opacity-80">
                  Downloads: {link.downloadCount}
                  {typeof link.maxDownloads === "number" ? ` / ${link.maxDownloads}` : ""} | Expires:{" "}
                  {new Date(link.expiresAt).toLocaleString()}
                </p>
                {link.hasPassword && <p className="text-xs badge badge-neutral">Password protected</p>}
              </div>

              <BrandedQrCode value={fullUrl} size={120} />
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <button className="btn btn-sm btn-outline" onClick={() => copy(link.urlPath)}>
                Copy
              </button>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => extend(link.id)}
                disabled={loadingId === link.id}
              >
                Extend
              </button>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => regenerate(link.id)}
                disabled={loadingId === link.id}
              >
                Regenerate
              </button>
              <button
                className="btn btn-sm btn-error"
                onClick={() => revoke(link.id)}
                disabled={loadingId === link.id}
              >
                Revoke
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
