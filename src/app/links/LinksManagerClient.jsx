"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import LinkCard from "../../components/linksmanager/LinkCard";
import ExtendModal from "../../components/linksmanager/ExtendModal";
import ErrorMsg from "@/components/utilities/Error";

export default function LinksManagerClient({ initialLinks }) {
  const [links, setLinks] = useState(initialLinks || []);
  const [loadingId, setLoadingId] = useState("");
  const [error, setError] = useState("");
  const [extendModal, setExtendModal] = useState({
    open: false,
    link: null,
    type: "hours",
  });

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
      toast.error(data.error || "Action failed.");
      return null;
    }

    return data;
  };

  const revoke = async (linkId) => {
    const data = await apiAction(linkId, { action: "revoke" });
    if (!data?.ok) return;
    setLinks((prev) => prev.filter((link) => link.id !== linkId));
    toast.success("Link revoked!");
  };

  const openExtendModal = (link, type = "hours") => {
    setExtendModal({ open: true, link, type });
  };

  const handleExtendSubmit = async (value) => {
    if (!extendModal.link) return;
    const linkId = extendModal.link.id;

    if (extendModal.type === "downloads") {
      const currentMax = Number(extendModal.link.maxDownloads || 0);
      const nextMax = currentMax + Number(value || 0);
      const data = await apiAction(linkId, {
        action: "update",
        maxDownloads: nextMax,
      });
      if (!data?.ok) return;

      setLinks((prev) =>
        prev.map((link) =>
          link.id === linkId
            ? {
                ...link,
                maxDownloads: nextMax,
                status: "active",
              }
            : link,
        ),
      );
      setExtendModal({ open: false, link: null, type: "hours" });
      toast.success("Download limit extended!");
      return;
    }

    const data = await apiAction(linkId, {
      action: "extend",
      expiryHours: value,
    });
    if (!data?.ok) return;

    setLinks((prev) =>
      prev.map((link) =>
        link.id === linkId
          ? {
              ...link,
              expiresAt: data.expiresAt,
              status: "active",
            }
          : link,
      ),
    );
    setExtendModal({ open: false, link: null, type: "hours" });
    toast.success("Link extended!");
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
    toast.success("Link code regenerated!");
  };

  if (!sorted.length) {
    return (
      <div className="bg-base-100 rounded-2xl border border-base-300 p-10 text-center text-base-content/70">
        <div className="text-lg font-semibold mb-1">No links found</div>
        <div>Create a share link from your files page to get started.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <ErrorMsg message={error} />}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((link) => (
          <LinkCard
            key={link.id}
            link={link}
            onExtend={openExtendModal}
            onRegenerate={regenerate}
            onRevoke={revoke}
            loadingId={loadingId}
          />
        ))}
      </div>

      <ExtendModal
        open={extendModal.open}
        onClose={() =>
          setExtendModal({ open: false, link: null, type: "hours" })
        }
        onSubmit={handleExtendSubmit}
        type={extendModal.type}
        maxValue={1000}
      />
    </div>
  );
}
