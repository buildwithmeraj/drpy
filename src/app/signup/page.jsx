"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { FiUserPlus, FiUser, FiMail, FiLock } from "react-icons/fi";

export default function SignupPage() {
  const router = useRouter();
  const { status } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Could not create account.");
      setIsLoading(false);
      return;
    }

    const loginResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/",
    });

    setIsLoading(false);

    if (loginResult?.error) {
      router.push("/login");
      return;
    }

    router.push("/");
    router.refresh();
  };

  const handleGoogleSignup = async () => {
    await signIn("google", { callbackUrl: "/" });
  };

  if (status === "loading" || status === "authenticated") {
    return <section className="page-shell max-w-md">Loading...</section>;
  }

  return (
    <section className="page-shell max-w-md">
      <h2 className="section-title justify-center"><FiUserPlus className="text-primary" /> Create Account</h2>

      <form onSubmit={handleSubmit} className="surface-card p-6 gap-4 reveal">
        {error && <p className="alert alert-error text-sm">{error}</p>}

        <label className="form-control w-full">
          <span className="label-text mb-1 inline-flex items-center gap-1"><FiUser /> Name</span>
          <input
            type="text"
            className="input input-bordered w-full"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>

        <label className="form-control w-full">
          <span className="label-text mb-1 inline-flex items-center gap-1"><FiMail /> Email</span>
          <input
            type="email"
            className="input input-bordered w-full"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="form-control w-full">
          <span className="label-text mb-1 inline-flex items-center gap-1"><FiLock /> Password</span>
          <input
            type="password"
            className="input input-bordered w-full"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
          />
        </label>

        <button type="submit" className="btn btn-primary w-full soft-glow" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Sign up"}
        </button>

        <button
          type="button"
          className="btn btn-outline w-full"
          onClick={handleGoogleSignup}
        >
          Continue with Google
        </button>

        <p className="text-sm text-center">
          Already have an account?{" "}
          <Link className="link link-primary" href="/login">
            Login
          </Link>
        </p>
      </form>
    </section>
  );
}
