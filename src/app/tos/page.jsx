import { FaBalanceScale } from "react-icons/fa";
import {
  FiFileText,
  FiCheckCircle,
  FiSlash,
  FiAlertTriangle,
  FiSettings,
} from "react-icons/fi";

export const metadata = {
  title: "Terms of Service | DRPY",
};

export default function TosPage() {
  return (
    <section className="page-shell max-w-4xl">
      <h1 className="section-title">
        <FiFileText className="text-primary" /> Terms of Service
      </h1>
      <p className="text-sm opacity-70">Last updated: February 26, 2026</p>

      <div className="surface-card p-6 space-y-6 reveal">
        <div>
          <h2 className="text-xl font-semibold mb-3">Acceptable Use</h2>
          <ul className="space-y-2 opacity-90">
            <li className="flex items-start gap-2">
              <FiCheckCircle className="mt-1 text-primary" /> You may use DRPY
              for lawful personal or business file sharing.
            </li>
            <li className="flex items-start gap-2">
              <FiSlash className="mt-1 text-primary" /> You must not upload
              illegal, harmful, or rights-infringing content.
            </li>
            <li className="flex items-start gap-2">
              <FiAlertTriangle className="mt-1 text-primary" /> We may suspend
              access or remove content for abuse, legal risk, or policy
              violations.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Service Operation</h2>
          <ul className="space-y-2 opacity-90">
            <li className="flex items-start gap-2">
              <FiSettings className="mt-1 text-primary" /> Features, quotas,
              limits, and retention policies may change over time.
            </li>
            <li className="flex items-start gap-2">
              <FiFileText className="mt-1 text-primary" /> You are responsible
              for files you upload and links you distribute.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Liability</h2>
          <p className="opacity-90 flex items-start gap-2">
            <FaBalanceScale className="mt-1 text-primary" />
            DRPY is provided on an &quot;as is&quot; basis without guarantees of
            uninterrupted availability. Liability is limited to the maximum
            extent permitted by applicable law.
          </p>
        </div>
      </div>
    </section>
  );
}
