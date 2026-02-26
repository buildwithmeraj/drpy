import Link from "next/link";
import { FiInfo, FiMail, FiShield, FiFileText } from "react-icons/fi";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "DRPY";

  return (
    <footer className="pt-5 pb-5 px-[2%] bg-base-100/80 backdrop-blur border-t border-base-300 mb-16 lg:mb-0">
      <div className="max-w-7xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm opacity-80 text-center lg:text-left w-full lg:w-auto">
          Copyright © {currentYear} {siteName}. All rights reserved.
        </div>

        <nav className="hidden lg:flex lg:flex-wrap lg:items-center lg:gap-4 text-sm">
          <Link
            href="/about"
            className="link link-hover inline-flex items-center gap-1"
          >
            <FiInfo /> About
          </Link>
          <Link
            href="/privacy"
            className="link link-hover inline-flex items-center gap-1"
          >
            <FiShield /> Privacy
          </Link>
          <Link
            href="/tos"
            className="link link-hover inline-flex items-center gap-1"
          >
            <FiFileText /> Terms
          </Link>
          <Link
            href="/contact"
            className="link link-hover inline-flex items-center gap-1"
          >
            <FiMail /> Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
