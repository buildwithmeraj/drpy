import { DEFAULT_QUOTA_BYTES, formatQuotaBytes } from "@/lib/quota";

const stats = [
  { label: "Free Storage", value: formatQuotaBytes(DEFAULT_QUOTA_BYTES) },
  { label: "Expiry Window", value: "1h - 30d" },
  { label: "Share Controls", value: "Password + Limits" },
  { label: "Cleanup", value: "Auto Scheduled" },
];

export default function HomeStats() {
  return (
    <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <article key={stat.label} className="surface-card p-5 reveal">
          <p className="text-3xl font-black text-primary">{stat.value}</p>
          <p className="text-sm opacity-80 mt-1">{stat.label}</p>
        </article>
      ))}
    </section>
  );
}
