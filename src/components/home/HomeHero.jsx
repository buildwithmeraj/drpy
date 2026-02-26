"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { FaBolt } from "react-icons/fa6";
import { FiUpload } from "react-icons/fi";
import { IoBookSharp } from "react-icons/io5";

export default function HomeHero() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent to-info text-white p-8 md:p-12 soft-glow reveal">
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-primary/20 blur-2xl" />

      <div className="relative max-w-3xl space-y-5">
        <p className="uppercase tracking-widest text-xs md:text-sm text-white/80">
          Drop it. Share it. Drpy it.
        </p>
        <h1 className="text-4xl md:text-6xl font-black leading-tight">
          Temporary File Sharing Built for Privacy
        </h1>
        <p className="text-base md:text-lg text-white/85 max-w-2xl">
          Upload once, share instantly, and keep control with expiry windows,
          passwords, download limits, and automatic cleanup.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/signup" className="btn btn-primary text-white">
            <FaBolt />
            Start Free
          </Link>
          {isAuthenticated ? (
            <Link href="/upload" className="btn btn-outline text-white">
              <FiUpload />
              Upload a File
            </Link>
          ) : (
            <Link href="/about" className="btn btn-outline text-white">
              <IoBookSharp className="mt-0.5" />
              Learn More
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
