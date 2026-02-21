const stats = [
  { label: "Free Storage", value: "5GB" },
  { label: "Expiry Window", value: "1h - 30d" },
  { label: "Share Controls", value: "Password + Limits" },
  { label: "Cleanup", value: "Auto Scheduled" },
];

export default function HomeStats() {
  return (
    <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <article key={stat.label} className="card bg-base-200 p-5">
          <p className="text-3xl font-black text-primary">{stat.value}</p>
          <p className="text-sm opacity-80 mt-1">{stat.label}</p>
        </article>
      ))}
    </section>
  );
}
