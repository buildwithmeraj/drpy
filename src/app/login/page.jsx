"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { FiLogIn, FiMail, FiLock } from "react-icons/fi";

const errorMessages = {
  AccessDenied: "Access denied. Please try again.",
  OAuthAccountNotLinked:
    "This email is linked to a different sign-in method. Try your original provider.",
  Configuration: "Authentication is not configured correctly.",
  Verification: "Verification failed. Please sign in again.",
  Default: "Authentication failed. Please try again.",
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const authError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const handleCredentialsLogin = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setIsLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(result?.url || callbackUrl);
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    await signIn("google", { callbackUrl });
  };

  const queryErrorMessage = authError
    ? errorMessages[authError] || errorMessages.Default
    : "";

  if (status === "loading" || status === "authenticated") {
    return <section className="page-shell max-w-md">Loading...</section>;
  }

  return (
    <section className="page-shell max-w-md">
      <h2 className="section-title justify-center">
        <FiLogIn className="text-primary" /> Login
      </h2>

      <form
        onSubmit={handleCredentialsLogin}
        className="surface-card p-6 gap-4 reveal"
      >
        {(error || queryErrorMessage) && (
          <p className="alert alert-error text-sm">
            {error || queryErrorMessage}
          </p>
        )}

        <label className="form-control w-full">
          <span className="label-text mb-1 inline-flex items-center gap-1">
            <FiMail /> Email
          </span>
          <input
            type="email"
            className="input input-bordered w-full"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="form-control w-full">
          <span className="label-text mb-1 inline-flex items-center gap-1">
            <FiLock /> Password
          </span>
          <input
            type="password"
            className="input input-bordered w-full"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
          />
        </label>

        <button
          type="submit"
          className="btn btn-primary w-full soft-glow"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>

        <button
          type="button"
          className="btn btn-outline w-full"
          onClick={handleGoogleLogin}
        >
          Continue with Google
        </button>

        <p className="text-sm text-center">
          No account yet?{" "}
          <Link className="link link-primary" href="/signup">
            Sign up
          </Link>
        </p>
      </form>
    </section>
  );
}
