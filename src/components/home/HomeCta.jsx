import Link from "next/link";

export default function HomeCta() {
  return (
    <section className="rounded-3xl surface-card p-8 md:p-10 text-center reveal">
      <h2 className="max-w-2xl mx-auto">Start Sharing Files Securely in Minutes</h2>
      <p className="max-w-2xl mx-auto text-sm opacity-80">
        Create your account and send temporary links with complete control over privacy,
        expiration, and downloads.
      </p>
      <div className="flex justify-center flex-wrap gap-3 mt-5">
        <Link href="/signup" className="btn btn-primary">
          Get Started
        </Link>
        <Link href="/login" className="btn btn-outline">
          Sign In
        </Link>
      </div>
    </section>
  );
}
