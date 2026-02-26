import Link from "next/link";
import {
  FiTarget,
  FiUploadCloud,
  FiLink2,
  FiLock,
  FiClock,
  FiBarChart2,
  FiShield,
} from "react-icons/fi";

export const metadata = {
  title: "About | DRPY",
};

export default function AboutPage() {
  return (
    <section className="page-shell max-w-4xl">
      <h1 className="section-title">
        <FiTarget className="text-primary" /> About DRPY
      </h1>
      <p className="opacity-85">
        DRPY is a temporary file-sharing platform designed for fast delivery and controlled access.
        The goal is simple: upload once, share securely, and let links expire on your terms.
      </p>

      <div className="surface-card p-6 space-y-6 reveal">
        <div>
          <h2 className="text-xl font-semibold mb-3">What DRPY Solves</h2>
          <ul className="space-y-2 opacity-90">
            <li className="flex items-start gap-2"><FiUploadCloud className="mt-1 text-primary" /> Upload and organize files quickly.</li>
            <li className="flex items-start gap-2"><FiLink2 className="mt-1 text-primary" /> Create short, shareable links in seconds.</li>
            <li className="flex items-start gap-2"><FiLock className="mt-1 text-primary" /> Protect links with passwords and download limits.</li>
            <li className="flex items-start gap-2"><FiClock className="mt-1 text-primary" /> Automatically expire links to reduce long-term exposure.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Operational Focus</h2>
          <ul className="space-y-2 opacity-90">
            <li className="flex items-start gap-2"><FiBarChart2 className="mt-1 text-primary" /> Provide visibility with usage and download analytics.</li>
            <li className="flex items-start gap-2"><FiShield className="mt-1 text-primary" /> Enforce abuse controls, quotas, and cleanup policies.</li>
          </ul>
        </div>

        <p className="opacity-70 text-lg">
          Questions, legal requests, or support needs? Visit the{" "}
          <Link href="/contact" className="text-primary hover:underline">Contact</Link> page.
        </p>
      </div>
    </section>
  );
}
