"use client";
import Link from "next/link";
import { DEFAULT_QUOTA_BYTES, formatQuotaBytes } from "@/lib/quota";
import { FaCheck, FaFolder, FaUserPlus } from "react-icons/fa6";
import { useSession } from "next-auth/react";
import { FiBarChart2, FiUpload } from "react-icons/fi";

export default function HomePricing() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  return (
    <section className="space-y-3">
      <h2>Pricing</h2>
      <article className="surface-card p-7 border-primary/30 reveal">
        <div className="flex items-end gap-2 mt-2">
          <p className="text-5xl font-black">Free Forever</p>
          <p className="opacity-70 mb-1">(for personal use)</p>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          <li>
            <FaCheck className="inline mr-1 text-success" size={16} />
            <strong>{formatQuotaBytes(DEFAULT_QUOTA_BYTES)}</strong> storage
            quota with enforcement
          </li>
          <li>
            <FaCheck className="inline mr-1 text-success" size={16} /> Unlimited
            Bandwidth
          </li>
          <li>
            <FaCheck className="inline mr-1 text-success" size={16} />
            Temporary links with expiry, password, and limits
          </li>
          <li>
            <FaCheck className="inline mr-1 text-success" size={16} />
            File manager, folders, search, bulk actions
          </li>
          <li>
            <FaCheck className="inline mr-1 text-success" size={16} />
            Dashboard analytics and bandwidth tracking
          </li>
        </ul>
        <div className="mt-5">
          {isAuthenticated ? (
            <Link href="/dashboard" className="btn btn-primary text-white">
              <FiBarChart2 className="inline" size={20} />
              Go to Dashboard
            </Link>
          ) : (
            <Link href="/signup" className="btn btn-primary text-white">
              <FaUserPlus />
              Create an Account
            </Link>
          )}
        </div>
      </article>
    </section>
  );
}
