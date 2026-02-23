export const metadata = {
  title: "About | DRPY",
};

export default function AboutPage() {
  return (
    <section className="max-w-4xl mx-auto py-10 space-y-6">
      <h1>About DRPY</h1>
      <p className="opacity-85">
        DRPY is a temporary file sharing platform built around privacy-first defaults.
        You upload files, create controlled share links, and decide how long access remains active.
      </p>

      <div className="card bg-base-200 border border-base-300 p-6 space-y-4">
        <h2 className="text-xl font-semibold">What We Focus On</h2>
        <ul className="list-disc pl-5 space-y-2 opacity-90">
          <li>Fast uploads and simple link sharing</li>
          <li>Security controls like passwords and expiry windows</li>
          <li>Automatic cleanup workflows and storage governance</li>
          <li>Clear ownership and account-level controls</li>
        </ul>
      </div>

      <p className="opacity-70 text-sm">
        Questions or requests? Visit the Contact page.
      </p>
    </section>
  );
}
