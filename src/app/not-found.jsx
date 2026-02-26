"use client";

import Link from "next/link";
import { FiAlertTriangle, FiArrowLeft, FiHome } from "react-icons/fi";

export default function NotFound() {
  return (
    <section className="flex flex-col items-center justify-center min-h-[80dvh] px-4">
      <div className="w-full max-w-xl bg-base-100 rounded-3xl border border-base-300 shadow-sm p-8 md:p-10">
        <div className="flex items-center justify-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-warning/10 text-warning mb-5">
            <FiAlertTriangle size={30} />
          </div>
        </div>

        <p className="text-sm font-semibold text-center tracking-wider text-primary mb-2">
          ERROR 404
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-base-content mb-3">
          We can&#39;t find that page
        </h1>
        <p className="text-base-content/70 mb-7">
          The page may have been removed, renamed, or is temporarily
          unavailable.
        </p>

        <div className="flex justify-center flex-wrap gap-3">
          <Link href="/" className="btn btn-primary">
            <FiHome />
            Go Home
          </Link>
          <button
            className="btn btn-outline"
            type="button"
            onClick={() => window.history.back()}
          >
            <FiArrowLeft />
            Go Back
          </button>
        </div>
      </div>
    </section>
  );
}
