import Link from "next/link";

const Footer = () => {
  return (
    <footer className="pt-4 pb-20 lg:pb-4 px-[2%] bg-base-200 border-t border-base-300">
      <div className="max-w-6xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          Copyright © 2025 {process.env.NEXT_PUBLIC_SITE_NAME}. All rights reserved.
        </div>

        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/about" className="link link-hover">About</Link>
          <Link href="/privacy" className="link link-hover">Privacy</Link>
          <Link href="/tos" className="link link-hover">Terms</Link>
          <Link href="/contact" className="link link-hover">Contact</Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
