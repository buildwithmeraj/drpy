"use client";
import React from "react";
import Logo from "../utilities/Logo";
import Link from "next/link";
import ThemeSwitcher from "../utilities/ThemeSwitcher";
import { signOut, useSession } from "next-auth/react";

const Navbar = () => {
  const { data: session, status } = useSession();

  return (
    <div className="grid md:grid-cols-3 justify-between gap-2 py-2 px-[2%] bg-base-200 fixed top-0 left-0 right-0 z-50">
      <Link href="/">
        <Logo />
      </Link>
      <div className="hidden md:flex place-self-center justify-center items-center text-center gap-3">
        <Link href="/" className="hover:text-primary hover:font-semibold">
          Home
        </Link>
        <Link
          href="/services"
          className="hover:text-primary hover:font-semibold"
        >
          Services
        </Link>
      </div>
      <div className="hidden md:flex place-self-end items-center gap-1">
        {status === "authenticated" ? (
          <>
            <span className="mr-3 text-sm">{session?.user?.email}</span>
            <button
              className="btn btn-sm btn-outline mr-2"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="mr-2">
              Login
            </Link>
            <Link href="/signup" className="mr-4 btn btn-sm btn-primary">
              Sign up
            </Link>
          </>
        )}
        <ThemeSwitcher />
      </div>
    </div>
  );
};

export default Navbar;
