"use client";

import { signOut } from "next-auth/react";
import { FiLogOut } from "react-icons/fi";

export default function LogoutButton() {
  return (
    <button
      type="button"
      className="btn btn-error text-white"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      <FiLogOut size={18} />
      Logout
    </button>
  );
}
