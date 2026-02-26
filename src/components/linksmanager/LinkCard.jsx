"use client";

import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { FaCopy, FaGears, FaClock, FaDownload, FaLock } from "react-icons/fa6";
import { MdDelete } from "react-icons/md";
import { IoQrCodeOutline } from "react-icons/io5";
import { FiX } from "react-icons/fi";
import BrandedQrCode from "@/components/utilities/BrandedQrCode";
import { statusBadge } from "../../app/links/utils";
import { useCallback, useState } from "react";

export default function LinkCard({
  link,
  onExtend,
  onRegenerate,
  onRevoke,
  loadingId,
}) {
  const [qrOpen, setQrOpen] = useState(false);

  const expired = link.status === "expired";
  const limitReached = link.status === "limit_reached";
  const canExtendDownloads = typeof link.maxDownloads === "number";
  const badge = statusBadge(link.status);

  const getFullUrl = useCallback(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${link.urlPath}`;
  }, [link.urlPath]);

  const copy = async () => {
    const fullUrl = getFullUrl();
    if (!fullUrl) return;
    await navigator.clipboard.writeText(fullUrl);
    toast.success("Link copied to clipboard!");
  };

  return (
    <>
      <div
        className={`min-w-0 bg-base-100 rounded-2xl border border-base-300 shadow-sm p-3 lg:p-5 flex flex-col gap-3 transition-opacity ${
          expired ? "opacity-60" : ""
        }`}
      >
        <div className="flex flex-col gap-1.5">
          <span className="font-bold text-base-content text-base truncate">
            {link.fileName}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${badge.classes}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full inline-block ${badge.dot}`}
              />
              {badge.label}
            </span>
            {link.hasPassword && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-base-200 border border-warning text-warning">
                <FaLock className="text-[10px]" /> Protected
              </span>
            )}
          </div>
        </div>

        <div className="bg-base-200 border border-base-300 rounded-xl p-2 flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm text-base-content/60 font-medium">
                Share URL
              </span>
              <div className="flex items-center min-w-0 justify-end">
                <Link
                  href={link.urlPath}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary text-sm truncate min-w-0 flex-1 hover:underline"
                >
                  <Image
                    src="/icon.svg"
                    width={16}
                    height={16}
                    alt="Link icon"
                    className="mr-1 inline-block"
                  />
                  {link.urlPath}
                </Link>
              </div>
            </div>
            <div className="flex justify-end flex-col gap-2 shrink-0">
              <button
                onClick={copy}
                className="btn btn-info text-white btn-sm"
                title="Copy link"
              >
                <FaCopy /> Copy Link
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary text-white flex items-center gap-1"
                onClick={() => setQrOpen(true)}
              >
                <IoQrCodeOutline size={18} />
                QR Code
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm text-base-content">
            <FaDownload className="opacity-60 shrink-0 mb-1" size={24} />
            <div>
              <div className="text-xs text-base-content/50 font-medium leading-none mb-0.5">
                Downloads
              </div>
              <div className="font-semibold">
                {link.downloadCount}
                {typeof link.maxDownloads === "number" && (
                  <span className="text-base-content/40 font-normal">
                    {" "}
                    / {link.maxDownloads}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-base-content justify-self-end">
            <FaClock className="opacity-60 shrink-0" size={24} />
            <div>
              <div className="text-xs text-base-content/50 font-medium leading-none mb-0.5">
                Expires
              </div>
              <div className="font-semibold">
                {new Date(link.expiresAt).toLocaleDateString("en-US", {
                  month: "numeric",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            className="btn btn-primary text-white disabled:cursor-not-allowed w-full"
            onClick={() =>
              onExtend(
                link,
                canExtendDownloads && limitReached ? "downloads" : "hours",
              )
            }
            disabled={loadingId === link.id || expired}
          >
            {canExtendDownloads && limitReached ? (
              <FaDownload className="text-xs" />
            ) : (
              <FaClock size={14} />
            )}
            Extend
          </button>
          <button
            className="btn btn-info text-white disabled:cursor-not-allowed w-full"
            onClick={() => onRegenerate(link.id)}
            disabled={loadingId === link.id || expired}
          >
            <FaGears size={18} />
            Regenerate
          </button>
          <button
            className="btn btn-error text-white disabled:cursor-not-allowed w-full"
            onClick={() => onRevoke(link.id)}
            disabled={loadingId === link.id}
          >
            <MdDelete size={18} />
            Revoke
          </button>
        </div>
      </div>

      {qrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-base-100 rounded-2xl border border-base-300 shadow-xl p-8 flex flex-col items-center">
            <div className="mb-4">
              <BrandedQrCode value={getFullUrl()} size={200} />
            </div>
            <div className="text-center">
              <div className="font-semibold text-base-content mb-1">
                Scan to open link
              </div>
              <div className="text-xs text-base-content/60">{getFullUrl()}</div>
              <button
                className="btn btn-sm btn-soft mt-4"
                onClick={() => setQrOpen(false)}
                aria-label="Close QR code"
                type="button"
              >
                <FiX size={20} /> Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
