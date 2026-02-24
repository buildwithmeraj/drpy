import Link from "next/link";

export default function HomeHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-accent text-white p-8 md:p-12 soft-glow reveal">
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-primary/20 blur-2xl" />

      <div className="relative max-w-3xl space-y-5">
        <p className="uppercase tracking-widest text-xs md:text-sm text-white/80">
          Drop it. Share it. Drpy it.
        </p>
        <h1 className="text-4xl md:text-6xl font-black leading-tight">
          Temporary File Sharing Built for Privacy
        </h1>
        <p className="text-base md:text-lg text-white/85 max-w-2xl">
          Upload once, share instantly, and keep control with expiry windows, passwords, download
          limits, and automatic cleanup.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/signup" className="btn btn-primary">
            Start Free
          </Link>
          <Link href="/upload" className="btn btn-outline text-white border-white/60 hover:bg-white/10">
            Upload a File
          </Link>
        </div>
      </div>
    </section>
  );
}
