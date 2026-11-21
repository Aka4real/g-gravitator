"use client";

import React, { useId, useState } from "react";
import { CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";

interface NewsletterBarProps {
  title?: string;
  subtitle?: string;
  source?: string;
}

export function NewsletterBar({
  title = "Weekly Orbital Brief",
  subtitle = "One sharp digest of AI breakthroughs, winning hackathon builds, and Lab Dispatches. Zero filler.",
  source = "journal",
}: NewsletterBarProps) {
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"IDLE" | "LOADING" | "DONE" | "ERROR">("IDLE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("LOADING");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source }),
      });
      if (res.ok) {
        setStatus("DONE");
        setEmail("");
      } else {
        const data = await res.json().catch(() => null);
        setStatus("ERROR");
        setErrorMessage(
          data?.error || "Could not subscribe. Please check your email address and try again."
        );
      }
    } catch {
      setStatus("ERROR");
      setErrorMessage("Network error while subscribing. Please try again.");
    }
  };

  return (
    <section
      aria-label={title}
      className="rounded-2xl border border-[var(--reading-border,rgba(255,255,255,0.08))] bg-[var(--reading-elevated,var(--bg-elevated))] p-6 transition-colors duration-200 sm:p-8"
    >
      <h3 className="font-display text-xl font-semibold tracking-[-0.02em] text-[var(--reading-text,var(--text-primary))]">
        {title}
      </h3>
      <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-[var(--reading-secondary,var(--text-secondary))]">
        {subtitle}
      </p>

      {status === "DONE" ? (
        <div
          role="status"
          className="mt-5 flex items-center gap-2.5 rounded-xl border border-[#10B981]/35 bg-[#10B981]/12 px-4 py-3 text-sm font-medium text-[var(--reading-text,#34D399)]"
        >
          <CheckCircle2
            className="h-4 w-4 shrink-0 text-[#10B981]"
            strokeWidth={1.8}
          />
          <span>Subscribed to the Weekly Orbital Brief.</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5" noValidate>
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--reading-text,var(--text-primary))]"
          >
            Email address
          </label>
          <div className="mt-2 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <input
              id={inputId}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "ERROR") {
                  setStatus("IDLE");
                  setErrorMessage(null);
                }
              }}
              placeholder="builder@domain.com"
              className="h-11 flex-1 rounded-xl border border-[var(--reading-border,rgba(255,255,255,0.12))] bg-[var(--reading-bg,#0B0B0E)] px-4 text-sm text-[var(--reading-text,var(--text-primary))] placeholder:text-[var(--reading-tertiary,#8B8B94)] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/25 focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === "LOADING"}
              className="press-tactile inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#FF3B1F] px-5 text-sm font-semibold whitespace-nowrap text-[#08080A] hover:bg-[#FF5238] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{status === "LOADING" ? "Subscribing..." : "Subscribe"}</span>
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
          {status === "ERROR" && errorMessage && (
            <p
              role="alert"
              className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-[var(--reading-text,#FF8A7A)]"
            >
              <AlertCircle
                className="h-3.5 w-3.5 shrink-0 text-[#FF3B1F]"
                strokeWidth={1.8}
              />
              <span>{errorMessage}</span>
            </p>
          )}
        </form>
      )}
    </section>
  );
}
