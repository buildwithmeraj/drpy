import {
  FiShield,
  FiDatabase,
  FiFileText,
  FiBarChart2,
  FiTrash2,
  FiUserCheck,
} from "react-icons/fi";

export const metadata = {
  title: "Privacy Policy | DRPY",
};

export default function PrivacyPage() {
  return (
    <section className="page-shell max-w-4xl">
      <h1 className="section-title">
        <FiShield className="text-primary" /> Privacy Policy
      </h1>
      <p className="text-sm opacity-70">Last updated: February 26, 2026</p>

      <div className="surface-card p-6 space-y-6 reveal">
        <div>
          <h2 className="text-xl font-semibold mb-3">Data We Process</h2>
          <ul className="space-y-2 opacity-90">
            <li className="flex items-start gap-2"><FiUserCheck className="mt-1 text-primary" /> Account data: name, email, authentication metadata.</li>
            <li className="flex items-start gap-2"><FiFileText className="mt-1 text-primary" /> File metadata: name, size, type, folder, and link settings.</li>
            <li className="flex items-start gap-2"><FiBarChart2 className="mt-1 text-primary" /> Operational analytics: download counts, timestamps, and hashed IP signals.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">How Data Is Used</h2>
          <ul className="space-y-2 opacity-90">
            <li className="flex items-start gap-2"><FiDatabase className="mt-1 text-primary" /> To deliver uploads, sharing, preview, and download features.</li>
            <li className="flex items-start gap-2"><FiShield className="mt-1 text-primary" /> To detect abuse, enforce limits, and maintain service security.</li>
            <li className="flex items-start gap-2"><FiTrash2 className="mt-1 text-primary" /> To run retention and cleanup jobs for expired or orphaned data.</li>
          </ul>
        </div>

        <p className="opacity-80">
          You can remove files and links from your account at any time. For access, correction,
          or privacy-related requests, contact us through the Contact page.
        </p>
      </div>
    </section>
  );
}
