import { FiShield } from "react-icons/fi";

export const metadata = {
  title: "Privacy Policy | DRPY",
};

export default function PrivacyPage() {
  return (
    <section className="page-shell max-w-4xl">
      <h1 className="section-title">
        <FiShield className="text-primary" /> Privacy Policy
      </h1>
      <p className="text-sm opacity-70">Last updated: February 23, 2026</p>

      <div className="surface-card p-6 space-y-4 reveal">
        <p>
          We collect only the information needed to operate DRPY, including
          account identity, uploaded file metadata, share-link settings, and
          download analytics used for abuse prevention and service quality.
        </p>
        <p>
          File contents are stored in object storage and are accessible only
          through authorized account actions or valid share links created by
          users.
        </p>
        <p>
          We may process technical information such as hashed IP, timestamps,
          and user agent for security monitoring, fraud prevention, and platform
          analytics.
        </p>
        <p>
          You may delete files and links from your account at any time.
          Retention and cleanup policies are managed through automated jobs and
          service rules.
        </p>
      </div>
    </section>
  );
}
