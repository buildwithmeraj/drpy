const faqs = [
  {
    q: "Can I protect a share link with a password?",
    a: "Yes. You can enable password protection when creating each link.",
  },
  {
    q: "Can I limit downloads?",
    a: "Yes. Enable delete-after-downloads and set a maximum count.",
  },
  {
    q: "What happens after expiry?",
    a: "Expired links are cleaned automatically by scheduled jobs.",
  },
  {
    q: "Do you support file previews?",
    a: "Yes. Image, PDF, and text-based files can be previewed from share pages.",
  },
];

export default function HomeFaq() {
  return (
    <section className="space-y-3">
      <h2>FAQ</h2>
      <div className="space-y-2">
        {faqs.map((item) => (
          <details key={item.q} className="collapse collapse-plus surface-card reveal">
            <summary className="collapse-title font-semibold">{item.q}</summary>
            <div className="collapse-content text-sm opacity-80">{item.a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
