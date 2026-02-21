import { FiClock, FiFolder, FiLock, FiShare2, FiSmartphone, FiTrendingUp } from "react-icons/fi";

const features = [
  {
    title: "Temporary by default",
    description: "Every shared link has expiry controls to keep your files from living forever.",
    icon: FiClock,
  },
  {
    title: "Secure sharing",
    description: "Protect links with passwords and optional delete-after-download thresholds.",
    icon: FiLock,
  },
  {
    title: "Clean file manager",
    description: "Search, sort, filter by folder, bulk move, and bulk delete from one place.",
    icon: FiFolder,
  },
  {
    title: "Instant links",
    description: "Create short share links in seconds and regenerate or revoke whenever needed.",
    icon: FiShare2,
  },
  {
    title: "Mobile ready",
    description: "Generate QR codes for each share link so downloads are one scan away.",
    icon: FiSmartphone,
  },
  {
    title: "Built-in analytics",
    description: "Track downloads, top links, top files, and daily bandwidth usage trends.",
    icon: FiTrendingUp,
  },
];

export default function HomeFeatures() {
  return (
    <section className="space-y-3">
      <h2>Everything Needed for Controlled Sharing</h2>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {features.map((feature) => (
          <article key={feature.title} className="card bg-base-200 p-5 border border-base-300">
            <feature.icon className="text-2xl text-primary mb-3" />
            <h3 className="font-semibold text-lg">{feature.title}</h3>
            <p className="text-sm opacity-80 mt-2">{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
