"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import {
  FiUserPlus,
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { FaGoogle } from "react-icons/fa6";
import ErrorMsg from "@/components/utilities/Error";

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function SignupPage() {
  const router = useRouter();
  const { status } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNameTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmTouched(true);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

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
    setIsGoogleLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

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

  const nameError = nameTouched && !name.trim() ? "Name is required." : "";
  const emailError =
    emailTouched && !validateEmail(email) && email.length > 0
      ? "Enter a valid email address."
      : "";
  const passwordError =
    passwordTouched && password.length > 0 && password.length < 8
      ? "Password must be at least 8 characters."
      : "";
  const confirmError =
    confirmTouched && confirmPassword.length > 0 && password !== confirmPassword
      ? "Passwords do not match."
      : "";

  return (
    <div className="min-h-[80dvh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm p-6 space-y-5">
          <div className="text-center space-y-2">
            <div className="flex justify-center gap-2 mb-6">
              <FiUserPlus size={32} className="text-primary mt-0.5" />
              <h2 className="text-3xl font-bold text-base-content">
                Create Account
              </h2>
            </div>
          </div>
          {error && <ErrorMsg message={error} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <span className="label-text font-semibold inline-flex items-center gap-2 text-base-content">
                <FiUser size={16} className="text-primary" />
                Name
              </span>
              <input
                type="text"
                placeholder="Your name"
                className={`input input-bordered w-full text-sm focus:outline-none focus:border-primary ${
                  nameError ? "input-error border-error" : ""
                }`}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setNameTouched(true);
                }}
                required
                autoComplete="name"
              />
              {nameError && (
                <span className="text-error text-xs mt-1">{nameError}</span>
              )}
            </div>

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
              <div className="flex flex-col gap-1.5 relative">
                <span className="label-text font-semibold inline-flex items-center gap-2 text-base-content">
                  <FiLock size={16} className="text-primary" />
                  Password
                </span>
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
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-[55%] text-base-content/60 hover:text-primary cursor-pointer"
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
            <div>
              <div className="flex flex-col gap-1.5 relative">
                <span className="label-text font-semibold inline-flex items-center gap-2 text-base-content">
                  <FiLock size={16} className="text-primary" />
                  Confirm Password
                </span>
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  className={`input input-bordered w-full text-sm focus:outline-none focus:border-primary ${
                    confirmError ? "input-error border-error" : ""
                  }`}
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setConfirmTouched(true);
                  }}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-[55%] text-base-content/60 hover:text-primary cursor-pointer"
                  tabIndex={-1}
                  onClick={() => setShowConfirm((v) => !v)}
                >
                  {showConfirm ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {confirmError && (
                <span className="text-error text-xs mt-1">{confirmError}</span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full text-white font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                isLoading ||
                isGoogleLoading ||
                !!nameError ||
                !!emailError ||
                !!passwordError ||
                !!confirmError
              }
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <div className="divider my-3 text-xs text-base-content/50">OR</div>

          <button
            type="button"
            className="btn btn-outline w-full text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleGoogleSignup}
            disabled={isLoading || isGoogleLoading}
          >
            <FaGoogle size={18} className="mb-0.5" />
            {isGoogleLoading ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                Redirecting...
              </>
            ) : (
              "Continue with Google"
            )}
          </button>
          <div className="text-center">
            <p className="text-sm text-base-content/70">
              Already have an account?{" "}
              <Link href="/login" className="link link-primary font-semibold">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
