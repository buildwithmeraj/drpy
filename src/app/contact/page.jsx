"use client";

import ErrorMsg from "@/components/utilities/Error";
import SuccessMsg from "@/components/utilities/Success";
import { useState } from "react";
import { FiMail } from "react-icons/fi";

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
    <div className="page-shell max-w-4xl">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <FiMail className="text-primary text-2xl" />
          </div>
          <h1 className="section-title m-0">Get in Touch</h1>
        </div>
        <p className="text-lg opacity-75 max-w-2xl">
          Have a question or feedback? We&apos;d love to hear from you. Send us
          a message and we&apos;ll respond as soon as possible.
        </p>
      </div>

      <form
        className="surface-card p-8 rounded-xl shadow-sm reveal space-y-6 max-w-2xl"
        onSubmit={onSubmit}
      >
        {error && <ErrorMsg message={error} />}
        {success && <SuccessMsg message={success} />}
        <div className="form-control">
          <label className="label-text font-semibold mb-2">Name *</label>
          <input
            className="input input-bordered focus:input-primary transition-colors w-full"
            placeholder="Your name"
            name="name"
            value={form.name}
            onChange={onChange}
            maxLength={120}
            required
          />
        </div>

        <div className="form-control">
          <label className="label-text font-semibold mb-2">Email *</label>
          <input
            className="input input-bordered focus:input-primary transition-colors w-full"
            type="email"
            placeholder="your@email.com"
            name="email"
            value={form.email}
            onChange={onChange}
            maxLength={180}
            required
          />
        </div>

        <div className="form-control">
          <label className="label-text font-semibold mb-2">Subject *</label>
          <input
            className="input input-bordered focus:input-primary transition-colors w-full"
            placeholder="What is this about?"
            name="subject"
            value={form.subject}
            onChange={onChange}
            maxLength={180}
            required
          />
        </div>

        <div className="form-control">
          <label className="label-text font-semibold mb-2">
            Message *{" "}
            <span className="text-xs opacity-50 mt-1 text-right">
              ({form.message.length}/5000)
            </span>
          </label>
          <textarea
            className="textarea textarea-bordered focus:textarea-primary transition-colors min-h-40 resize-none w-full"
            placeholder="Tell us more about your inquiry..."
            name="message"
            value={form.message}
            onChange={onChange}
            maxLength={5000}
            required
          />
        </div>

        <button
          className="btn btn-primary btn-lg w-full font-semibold"
          type="submit"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Sending...
            </>
          ) : (
            <>
              <FiMail /> Send Message
            </>
          )}
        </button>
      </form>
    </div>
  );
}
