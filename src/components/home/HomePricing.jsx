import Link from "next/link";

export default function HomePricing() {
  return (
    <section className="space-y-3">
      <h2>Simple Starting Tier</h2>
      <article className="card bg-base-200 p-7 border border-primary/20">
        <p className="text-sm uppercase tracking-wide opacity-70">Current Plan</p>
        <div className="flex items-end gap-2 mt-2">
          <p className="text-5xl font-black">Free</p>
          <p className="opacity-70 mb-1">for personal use</p>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          <li>5GB storage quota with enforcement</li>
          <li>Temporary links with expiry, password, and limits</li>
          <li>File manager, folders, search, bulk actions</li>
          <li>Dashboard analytics and bandwidth tracking</li>
        </ul>
        <div className="mt-5">
          <Link href="/signup" className="btn btn-primary">
            Create Account
          </Link>
        </div>
      </article>
    </section>
  );
}
