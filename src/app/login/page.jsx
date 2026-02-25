"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { FiLogIn, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { FaGoogle } from "react-icons/fa6";
import { FaSignInAlt } from "react-icons/fa";
import ErrorMsg from "@/components/utilities/Error";

const errorMessages = {
  AccessDenied: "Access denied. Please try again.",
  OAuthAccountNotLinked:
    "This email is linked to a different sign-in method. Try your original provider.",
  Configuration: "Authentication is not configured correctly.",
  Verification: "Verification failed. Please sign in again.",
  Default: "Authentication failed. Please try again.",
};

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const handleCredentialsLogin = async (event) => {
    event.preventDefault();
    setError("");
    setEmailTouched(true);
    setPasswordTouched(true);

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

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
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary mb-4" />
          <p className="text-base-content/70">Loading...</p>
        </div>
      </div>
    );
  }

  const emailError =
    emailTouched && !validateEmail(email) && email.length > 0
      ? "Enter a valid email address."
      : "";
  const passwordError =
    passwordTouched && password.length > 0 && password.length < 8
      ? "Password must be at least 8 characters."
      : "";

  return (
    <div className="min-h-[80dvh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm p-6 space-y-5">
          <div className="text-center space-y-2">
            <div className="flex justify-center gap-2 mb-6">
              <FiLogIn size={32} className="text-primary mt-0.5" />
              <h2 className="text-3xl font-bold text-base-content">Login</h2>
            </div>
          </div>
          {(error || queryErrorMessage) && (
            <ErrorMsg message={error || queryErrorMessage} />
          )}
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <span className="label-text font-semibold inline-flex items-center gap-2 text-base-content">
                <FiMail size={16} className="text-primary" />
                Email Address
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                className={`input input-bordered w-full text-sm focus:outline-none focus:border-primary ${
                  emailError ? "input-error border-error" : ""
                }`}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailTouched(true);
                }}
                required
                autoComplete="email"
              />
              {emailError && (
                <span className="text-error text-xs mt-1">{emailError}</span>
              )}
            </div>

            <div>
              <div className="form-control w-full relative">
                <label className="label pb-2">
                  <span className="label-text font-semibold inline-flex items-center gap-2 text-base-content">
                    <FiLock size={16} className="text-primary" />
                    Password
                  </span>
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`input input-bordered w-full text-sm focus:outline-none focus:border-primary ${
                    passwordError ? "input-error border-error" : ""
                  }`}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setPasswordTouched(true);
                  }}
                  required
                  minLength={8}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-[56%] text-base-content/60 hover:text-primary cursor-pointer"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {passwordError && (
                <span className="text-error text-xs mt-1">{passwordError}</span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full text-white font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !!emailError || !!passwordError}
            >
              <FaSignInAlt />
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="divider my-3 text-xs text-base-content/50">OR</div>

          <button
            type="button"
            className="btn btn-outline w-full text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <FaGoogle size={18} className="mb-0.5" />
            Continue with Google
          </button>
          <div className="text-center">
            <p className="text-sm text-base-content/70">
              Don&#39;t have an account?{" "}
              <Link href="/signup" className="link link-primary font-semibold">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
