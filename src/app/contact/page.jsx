"use client";

import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await response.json().catch(() => ({}));
    setSubmitting(false);

    if (!response.ok) {
      const detail = data?.details ? ` (${data.details})` : "";
      setError((data.error || "Could not send your message.") + detail);
      return;
    }

    setSuccess("Message sent successfully. We will get back to you soon.");
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <section className="max-w-3xl mx-auto py-10 space-y-6">
      <h1>Contact</h1>
      <p className="opacity-85">
        Send us your questions, feedback, or policy requests.
      </p>

      <form className="card bg-base-200 border border-base-300 p-6 space-y-4" onSubmit={onSubmit}>
        {error && <p className="alert alert-error py-2">{error}</p>}
        {success && <p className="alert alert-success py-2">{success}</p>}

        <label className="form-control">
          <span className="label-text mb-1">Name</span>
          <input
            className="input input-bordered"
            name="name"
            value={form.name}
            onChange={onChange}
            maxLength={120}
            required
          />
        </label>

        <label className="form-control">
          <span className="label-text mb-1">Email</span>
          <input
            className="input input-bordered"
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            maxLength={180}
            required
          />
        </label>

        <label className="form-control">
          <span className="label-text mb-1">Subject</span>
          <input
            className="input input-bordered"
            name="subject"
            value={form.subject}
            onChange={onChange}
            maxLength={180}
            required
          />
        </label>

        <label className="form-control">
          <span className="label-text mb-1">Message</span>
          <textarea
            className="textarea textarea-bordered min-h-36"
            name="message"
            value={form.message}
            onChange={onChange}
            maxLength={5000}
            required
          />
        </label>

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Send Message"}
        </button>
      </form>
    </section>
  );
}
