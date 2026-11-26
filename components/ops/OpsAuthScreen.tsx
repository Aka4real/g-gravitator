"use client";

import React, { useState } from "react";
import { AlertCircle, KeyRound } from "lucide-react";
import { BrandMark } from "@/lib/brand/mark";
import type { OpsUserInfo } from "@/components/ops/ops-types";

interface OpsAuthScreenProps {
  hasAdmins: boolean;
  requiresInviteCode: boolean;
  onAuthenticated: (user: OpsUserInfo) => Promise<void> | void;
}

export function OpsAuthScreen({
  hasAdmins,
  requiresInviteCode,
  onAuthenticated,
}: OpsAuthScreenProps) {
  const [mode, setMode] = useState<"login" | "signup">(
    hasAdmins ? "login" : "signup"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/ops/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "login"
            ? { action: "login", email, password }
            : {
                action: "signup",
                name,
                email,
                password,
                confirmPassword,
                inviteCode,
              }
        ),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok || !data?.user) {
        setError(data?.error || "Authentication failed.");
        return;
      }
      setPassword("");
      setConfirmPassword("");
      await onAuthenticated(data.user);
    } catch {
      setError("Network error during authentication.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--bg-canvas)] px-5 py-12 text-[var(--ink-primary)]">
      <div className="w-full max-w-md rounded-2xl border border-[var(--hairline)] bg-[var(--bg-surface)] p-7 sm:p-10">
        <div className="flex items-center gap-3">
          <BrandMark size={34} title="G-Gravitator" />
          <span className="font-display text-[18px] font-bold tracking-[-0.03em] text-[var(--ink-primary)]">
            G-Gravitator
          </span>
        </div>

        <h1 className="font-display mt-7 text-[28px] font-bold leading-[1.08] tracking-[-0.03em] text-[var(--ink-primary)]">
          Command Center
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-muted)]">
          {mode === "login"
            ? "Sign in with your operator credentials to access platform controls."
            : hasAdmins
            ? "Create an operator account using a single-use invite code."
            : "Initialize the primary Super Admin account for this command center."}
        </p>

        {/* Connected Login / Sign Up Switch */}
        <div
          role="tablist"
          aria-label="Authentication mode"
          className="mt-6 grid grid-cols-2 rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`h-9 cursor-pointer rounded-full text-[13px] font-semibold transition-colors duration-150 ${
              mode === "login"
                ? "bg-[var(--ink-primary)] text-[#07090D]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`h-9 cursor-pointer rounded-full text-[13px] font-semibold transition-colors duration-150 ${
              mode === "signup"
                ? "bg-[var(--ink-primary)] text-[#07090D]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            }`}
          >
            Create account
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2.5 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-4 py-3 text-[14px] text-[#FF8A7A]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
          autoComplete="off"
        >
          {mode === "signup" && (
            <div>
              <label
                htmlFor="ops-auth-name"
                className="block text-[14px] font-medium text-[var(--ink-primary)]"
              >
                Operator name
              </label>
              <input
                id="ops-auth-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="mt-1.5 h-11 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-4 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="ops-auth-email"
              className="block text-[14px] font-medium text-[var(--ink-primary)]"
            >
              Email address
            </label>
            <input
              id="ops-auth-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@domain.com"
              className="mt-1.5 h-11 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-4 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="ops-auth-password"
              className="block text-[14px] font-medium text-[var(--ink-primary)]"
            >
              Password
            </label>
            <input
              id="ops-auth-password"
              type="password"
              required
              minLength={8}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="mt-1.5 h-11 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-4 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
            />
          </div>

          {mode === "signup" && (
            <>
              <div>
                <label
                  htmlFor="ops-auth-confirm"
                  className="block text-[14px] font-medium text-[var(--ink-primary)]"
                >
                  Confirm password
                </label>
                <input
                  id="ops-auth-confirm"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="mt-1.5 h-11 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-4 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                />
              </div>

              {(hasAdmins || requiresInviteCode) && (
                <div>
                  <label
                    htmlFor="ops-auth-invite"
                    className="flex items-center gap-1.5 text-[14px] font-medium text-[var(--ink-primary)]"
                  >
                    <KeyRound className="h-4 w-4 text-[var(--accent)]" />
                    <span>Admin invite code</span>
                  </label>
                  <input
                    id="ops-auth-invite"
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter invite code from an existing admin"
                    className="mt-1.5 h-11 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-4 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                  />
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="press-tactile mt-2 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full bg-[var(--accent)] px-5 text-[14px] font-semibold text-[#07090D] hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? mode === "login"
                ? "Verifying..."
                : "Creating account..."
              : mode === "login"
              ? "Sign in"
              : "Create admin account"}
          </button>
        </form>
      </div>
    </div>
  );
}
