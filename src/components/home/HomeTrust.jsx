export default function HomeTrust() {
  return (
    <section className="grid lg:grid-cols-2 gap-4">
      <article className="surface-card p-6 reveal">
        <h3 className="text-2xl font-bold">Security and Abuse Controls</h3>
        <ul className="mt-4 space-y-2 text-sm opacity-90">
          <li>Policy-based upload size and file-type validation.</li>
          <li>CSRF checks on state-changing endpoints.</li>
          <li>Password-protected link access with secure hashing.</li>
          <li>Security headers for browser hardening.</li>
        </ul>
      </article>

      <article className="surface-card p-6 reveal">
        <h3 className="text-2xl font-bold">Retention Policy</h3>
        <p className="mt-4 text-sm opacity-90">
          Expired and limit-reached links are cleaned automatically. Files are retained by default
          so you can re-share quickly. Optional orphan cleanup can be enabled with retention days.
        </p>
      </article>
    </section>
  );
}
