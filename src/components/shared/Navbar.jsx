"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  FiGrid,
  FiHome,
  FiInfo,
  FiLink2,
  FiLogIn,
  FiLogOut,
  FiMenu,
  FiUpload,
} from "react-icons/fi";
import { signOut, useSession } from "next-auth/react";
import Logo from "../utilities/Logo";
import ThemeSwitcher from "../utilities/ThemeSwitcher";

function AvatarButton({ session }) {
  const fallback = (session?.user?.name || session?.user?.email || "U")
    .trim()
    .slice(0, 1)
    .toUpperCase();

  return (
    <div className="avatar placeholder">
      {session?.user?.image ? (
        <div className="w-9 rounded-full ring ring-base-300">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={session.user.image} alt="Profile" />
        </div>
      ) : (
        <div className="w-9 rounded-full bg-primary text-primary-content text-sm font-semibold">
          <span>{fallback}</span>
        </div>
      )}
    </div>
  );
}

function ProfileDropdown({ session }) {
  return (
    <div className="dropdown dropdown-end">
      <button tabIndex={0} className="btn btn-ghost btn-circle">
        <AvatarButton session={session} />
      </button>
      <ul
        tabIndex={0}
        className="menu menu-sm dropdown-content z-[60] mt-2 p-2 shadow bg-base-100 rounded-box w-44 border border-base-300"
      >
        <li>
          <Link href="/dashboard">Dashboard</Link>
        </li>
        <li>
          <button onClick={() => signOut({ callbackUrl: "/" })}>Logout</button>
        </li>
      </ul>
    </div>
  );
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAuthenticated = status === "authenticated";

  const sidebarLinks = useMemo(
    () =>
      isAuthenticated
        ? [
            { href: "/", label: "Home", icon: FiHome },
            { href: "/dashboard", label: "Dashboard", icon: FiGrid },
            { href: "/upload", label: "Upload", icon: FiUpload },
            { href: "/files", label: "Files", icon: FiGrid },
            { href: "/links", label: "Links", icon: FiLink2 },
            { href: "/about", label: "About", icon: FiInfo },
          ]
        : [
            { href: "/", label: "Home", icon: FiHome },
            { href: "/about", label: "About", icon: FiInfo },
            { href: "/login", label: "Login", icon: FiLogIn },
            { href: "/signup", label: "Sign Up", icon: FiGrid },
          ],
    [isAuthenticated],
  );

  const dockLinksSmall = useMemo(
    () =>
      isAuthenticated
        ? [
            { href: "/", label: "Home", icon: FiHome },
            { href: "/upload", label: "Upload", icon: FiUpload },
            { href: "/files", label: "Files", icon: FiGrid },
            { href: "/links", label: "Links", icon: FiLink2 },
          ]
        : [
            { href: "/", label: "Home", icon: FiHome },
            { href: "/login", label: "Login", icon: FiLogIn },
            { href: "/signup", label: "Sign Up", icon: FiGrid },
          ],
    [isAuthenticated],
  );

  const dockLinksMd = useMemo(
    () =>
      isAuthenticated
        ? [
            { href: "/", label: "Home", icon: FiHome },
            { href: "/dashboard", label: "Dash", icon: FiGrid },
            { href: "/upload", label: "Upload", icon: FiUpload },
            { href: "/files", label: "Files", icon: FiGrid },
            { href: "/links", label: "Links", icon: FiLink2 },
          ]
        : [
            { href: "/", label: "Home", icon: FiHome },
            { href: "/login", label: "Login", icon: FiLogIn },
            { href: "/signup", label: "Sign Up", icon: FiGrid },
            { href: "/about", label: "About", icon: FiInfo },
            { href: "/contact", label: "Contact", icon: FiLink2 },
          ],
    [isAuthenticated],
  );

  return (
    <>
      <header className="flex items-center justify-between py-2 px-[2%] bg-base-100/80 backdrop-blur fixed top-0 left-0 right-0 z-50 border-b border-base-300">
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost btn-circle md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <FiMenu className="text-xl" />
          </button>
          <Link
            href="/"
            className="group transition-transform duration-200 hover:scale-[1.02]"
          >
            <Logo />
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <div className="hidden lg:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link href="/upload" className="btn btn-sm btn-ghost">
                  <FiUpload /> Upload
                </Link>
                <Link href="/files" className="btn btn-sm btn-ghost">
                  <FiGrid /> Files
                </Link>
                <Link href="/links" className="btn btn-sm btn-ghost">
                  <FiLink2 /> Links
                </Link>
                <ProfileDropdown session={session} />
              </>
            ) : (
              <>
                <Link href="/about" className="btn btn-sm btn-ghost">
                  About
                </Link>
                <Link href="/login" className="btn btn-sm btn-ghost">
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="btn btn-sm btn-primary soft-glow"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
          <ThemeSwitcher />
        </div>
      </header>

      {sidebarOpen && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button
            aria-label="Close Sidebar"
            className="absolute inset-0 bg-black/35"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-72 bg-base-100 border-l border-base-300 p-5 flex flex-col reveal">
            <div className="flex items-center justify-between mb-5">
              <p className="font-semibold">Navigation</p>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSidebarOpen(false)}
              >
                Close
              </button>
            </div>

            <nav className="space-y-1">
              {sidebarLinks.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className="btn btn-ghost justify-start w-full"
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="text-lg" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="mt-auto space-y-2 pt-4 border-t border-base-300">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className="btn btn-outline w-full"
                    onClick={() => setSidebarOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    className="btn btn-error w-full"
                    onClick={() => {
                      setSidebarOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                  >
                    <FiLogOut />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/signup"
                  className="btn btn-primary w-full"
                  onClick={() => setSidebarOpen(false)}
                >
                  Create Account
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-[80] lg:hidden border-t border-base-300 bg-base-100/90 backdrop-blur">
        <nav className="flex md:hidden items-stretch justify-around h-16">
          {dockLinksSmall.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center text-xs gap-1 hover:bg-base-200 transition-colors"
            >
              <item.icon className="text-base" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <nav className="hidden md:flex items-stretch justify-around h-16">
          {dockLinksMd.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center text-xs gap-1 hover:bg-base-200 transition-colors"
            >
              <item.icon className="text-base" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
