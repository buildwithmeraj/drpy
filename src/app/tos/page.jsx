export const metadata = {
  title: "Terms of Service | DRPY",
};

export default function TosPage() {
  return (
    <section className="max-w-4xl mx-auto py-10 space-y-6">
      <h1>Terms of Service</h1>
      <p className="text-sm opacity-70">Last updated: February 23, 2026</p>

      <div className="space-y-4">
        <p>
          By using DRPY, you agree to use the service lawfully and responsibly. You are solely
          responsible for content you upload and share.
        </p>
        <p>
          You must not upload illegal, abusive, malicious, or rights-infringing content. We may
          suspend access or remove content to enforce safety, legal compliance, and abuse controls.
        </p>
        <p>
          Service limits, quotas, and feature availability may change over time. We may apply rate
          limits, anti-abuse protections, and automated cleanup policies.
        </p>
        <p>
          DRPY is provided on an &quot;as is&quot; basis without warranties of uninterrupted availability.
          Liability is limited to the maximum extent permitted by law.
        </p>
      </div>

      <div className="alert alert-warning">
        If you do not agree with these terms, do not use the service.
      </div>
    </section>
  );
}
