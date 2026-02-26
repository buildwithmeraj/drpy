const steps = [
  {
    step: "01",
    title: "Upload",
    text: "Drop files into your account and organize them in folders.",
  },
  {
    step: "02",
    title: "Configure",
    text: "Choose expiry, add optional password, and set download limits.",
  },
  {
    step: "03",
    title: "Share",
    text: "Send the short URL or QR code to recipients.",
  },
  {
    step: "04",
    title: "Monitor",
    text: "Track downloads and bandwidth from your dashboard.",
  },
];

export default function HomeHowItWorks() {
  return (
    <section className="space-y-3">
      <h2>How Drpy Works</h2>
      <div className="grid md:grid-cols-4 gap-3">
        {steps.map((item) => (
          <article key={item.step} className="surface-card p-5 reveal relative">
            <p className="text-4xl font-semibold text-primary fixed top-2 right-2 opacity-60">
              {item.step}
            </p>
            <h3 className="text-xl font-bold mt-2">{item.title}</h3>
            <p className="text-sm opacity-80 mt-2">{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
