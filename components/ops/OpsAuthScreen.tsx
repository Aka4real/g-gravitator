"use client";

import React, { useState } from "react";
import { AlertCircle, KeyRound, Lock, ShieldCheck, UserPlus } from "lucide-react";
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
    <div className="flex min-h-screen items-center justify-center bg-[#08080A] px-4 py-12 text-[#F4F3EF]">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#111114] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:p-9">
        <div className="flex items-center justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#FF3B1F]/35 bg-[#FF3B1F]/12 text-[#FF6B54]">
            {mode === "login" ? (
              <Lock className="h-5 w-5" strokeWidth={1.7} />
            ) : (
              <UserPlus className="h-5 w-5" strokeWidth={1.7} />
            )}
          </div>
          <span className="font-mono inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-[#18181D] px-3 py-1 text-[11px] font-medium text-[#A1A1AA]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#34D399]" />
            Isolated Ops Portal
          </span>
        </div>

        <h1 className="font-display mt-5 text-2xl font-bold tracking-[-0.025em] text-[#F4F3EF]">
          G-Gravitator Command
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-[#A1A1AA]">
          {mode === "login"
            ? "Sign in with your operator credentials to access system controls."
            : hasAdmins
            ? "Create a new operator account using a valid invite code."
            : "Initialize the primary Super Admin account for this command center."}
        </p>

        {/* Login / Sign Up Switcher */}
        <div
          role="tablist"
          aria-label="Authentication mode"
          className="mt-6 grid grid-cols-2 gap-1.5 rounded-full border border-white/[0.08] bg-[#0B0B0E] p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`h-9 cursor-pointer rounded-full text-xs font-semibold transition-colors ${
              mode === "login"
                ? "bg-[#F4F3EF] text-[#08080A]"
                : "text-[#A1A1AA] hover:text-[#F4F3EF]"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`h-9 cursor-pointer rounded-full text-xs font-semibold transition-colors ${
              mode === "signup"
                ? "bg-[#F4F3EF] text-[#08080A]"
                : "text-[#A1A1AA] hover:text-[#F4F3EF]"
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#FF3B1F]/35 bg-[#FF3B1F]/12 px-4 py-3 text-sm text-[#FF8A7A]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" autoComplete="off">
          {mode === "signup" && (
            <div>
              <label
                htmlFor="ops-auth-name"
                className="block text-xs font-medium text-[#D4D4D8]"
              >
                Operator Name
              </label>
              <input
                id="ops-auth-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="mt-1.5 h-11 w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-4 text-sm text-[#F4F3EF] placeholder:text-[#71717A] focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/25 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="ops-auth-email"
              className="block text-xs font-medium text-[#D4D4D8]"
            >
              Email Address
            </label>
            <input
              id="ops-auth-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@domain.com"
              className="mt-1.5 h-11 w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-4 text-sm text-[#F4F3EF] placeholder:text-[#71717A] focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/25 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="ops-auth-password"
              className="block text-xs font-medium text-[#D4D4D8]"
            >
              Password
            </label>
            <input
              id="ops-auth-password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="mt-1.5 h-11 w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-4 text-sm text-[#F4F3EF] placeholder:text-[#71717A] focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/25 focus:outline-none"
            />
          </div>

          {mode === "signup" && (
            <>
              <div>
                <label
                  htmlFor="ops-auth-confirm"
                  className="block text-xs font-medium text-[#D4D4D8]"
                >
                  Confirm Password
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
                  className="mt-1.5 h-11 w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-4 text-sm text-[#F4F3EF] placeholder:text-[#71717A] focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/25 focus:outline-none"
                />
              </div>

              {(hasAdmins || requiresInviteCode) && (
                <div>
                  <label
                    htmlFor="ops-auth-invite"
                    className="flex items-center gap-1.5 text-xs font-medium text-[#D4D4D8]"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-[#FF6B54]" />
                    <span>Admin Invite Code</span>
                  </label>
                  <input
                    id="ops-auth-invite"
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter invite code from an existing admin"
                    className="mt-1.5 h-11 w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-4 font-mono text-sm text-[#F4F3EF] placeholder:font-sans placeholder:text-[#71717A] focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/25 focus:outline-none"
                  />
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full bg-[#FF3B1F] px-5 text-sm font-semibold text-[#08080A] transition-colors hover:bg-[#FF5238] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? mode === "login"
                ? "Verifying..."
                : "Creating account..."
              : mode === "login"
              ? "Sign In"
              : "Create Admin Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
