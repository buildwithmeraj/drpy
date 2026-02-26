import Link from "next/link";
import { FiInfo } from "react-icons/fi";
import { VscDebugStart } from "react-icons/vsc";

export default function HomeCta() {
  return (
    <section className="rounded-5xl surface-card p-8 md:p-10 text-center reveal">
      <h2 className="max-w-2xl mx-auto">
        Start Sharing Files Securely in Minutes
      </h2>
      <p className="max-w-2xl mx-auto text-sm opacity-80">
        Create your account and send temporary links with complete control over
        privacy, expiration, and downloads.
      </p>
      <div className="flex justify-center flex-wrap gap-3 mt-5">
        <Link href="/upload" className="btn btn-primary">
          <VscDebugStart />
          Get Started
        </Link>
        <Link href="/about" className="btn btn-outline">
          <FiInfo />
          About {process.env.NEXT_PUBLIC_SITE_NAME}
        </Link>
      </div>
    </section>
  );
}
