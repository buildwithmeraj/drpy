import { DEFAULT_QUOTA_BYTES, formatQuotaBytes } from "@/lib/quota";
import { CgTimelapse } from "react-icons/cg";
import { FaHdd } from "react-icons/fa";
import { GrSecure } from "react-icons/gr";
import { MdCleaningServices } from "react-icons/md";

const stats = [
  {
    label: "Free Storage",
    icon: FaHdd,
    value: formatQuotaBytes(DEFAULT_QUOTA_BYTES),
  },
  { label: "Expiry Window", icon: CgTimelapse, value: "1h - 30d" },
  {
    label: "Control Sharing with Limit + Password",
    icon: GrSecure,
    value: "Protection",
  },
  {
    label: "Cleanup",
    icon: MdCleaningServices,
    value: "Auto Scheduled",
  },
];

export default function HomeStats() {
  return (
    <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <article key={stat.label} className="surface-card p-5 reveal relative">
          <p className="text-3xl font-black text-primary">{stat.value}</p>
          <p className="text-sm opacity-80 mt-1">{stat.label}</p>
          <stat.icon className="text-7xl text-primary/40 mb-2 inline mr-2 fixed bottom-2 right-2" />
        </article>
      ))}
    </section>
  );
}
