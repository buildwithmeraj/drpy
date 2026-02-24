import Link from "next/link";
import { FiTarget } from "react-icons/fi";

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
        DRPY is a temporary file sharing platform built around privacy-first
        defaults. You upload files, create controlled share links, and decide
        how long access remains active.
      </p>

      <div className="surface-card p-6 space-y-4 reveal">
        <h2 className="text-xl font-semibold">What We Focus On</h2>
        <ul className="list-disc pl-5 space-y-2 opacity-90">
          <li>Fast uploads and simple link sharing</li>
          <li>Security controls like passwords and expiry windows</li>
          <li>Automatic cleanup workflows and storage governance</li>
          <li>Clear ownership and account-level controls</li>
        </ul>
        <p className="opacity-70 text-lg">
          Questions or requests? Visit the{" "}
          <Link href="/contact" className="text-primary">
            Contact
          </Link>{" "}
          page.
        </p>{" "}
      </div>
    </section>
  );
}
