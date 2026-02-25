"use client";

import Link from "next/link";
import { FiAlertTriangle } from "react-icons/fi";

export default function NotFound() {
  return (
    <section className="flex flex-col items-center justify-center min-h-[80dvh] px-4">
      <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm p-8 flex flex-col items-center gap-5 max-w-md w-full">
        <FiAlertTriangle className="text-warning text-5xl mb-2" />
        <h1 className="text-3xl font-bold text-base-content mb-1">
          404 - Page Not Found
        </h1>
        <p className="text-base-content/70 text-center mb-4">
          Sorry, the page you are looking for does not exist or has been moved.
        </p>
        <Link href="/" className="btn btn-primary">
          Go Home
        </Link>
      </div>
    </section>
  );
}
