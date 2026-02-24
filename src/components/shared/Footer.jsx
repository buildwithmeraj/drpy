import Link from "next/link";
import { FiInfo, FiMail, FiShield, FiFileText } from "react-icons/fi";

const Footer = () => {
  return (
    <footer className="pt-5 pb-20 lg:pb-5 px-[2%] bg-base-100/80 backdrop-blur border-t border-base-300">
      <div className="max-w-6xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm opacity-80">
          Copyright © 2025 {process.env.NEXT_PUBLIC_SITE_NAME}. All rights reserved.
        </div>

        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/about" className="link link-hover inline-flex items-center gap-1"><FiInfo /> About</Link>
          <Link href="/privacy" className="link link-hover inline-flex items-center gap-1"><FiShield /> Privacy</Link>
          <Link href="/tos" className="link link-hover inline-flex items-center gap-1"><FiFileText /> Terms</Link>
          <Link href="/contact" className="link link-hover inline-flex items-center gap-1"><FiMail /> Contact</Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
