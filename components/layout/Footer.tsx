"use client";

import React, { useState } from "react";
import { PreloadLink } from "@/components/layout/PreloadLink";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { StretchedWordmark } from "@/components/layout/StretchedWordmark";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subStatus, setSubStatus] = useState<
    "IDLE" | "LOADING" | "DONE" | "ERROR"
  >("IDLE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubStatus("LOADING");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "footer" }),
      });
      if (res.ok) {
        setSubStatus("DONE");
        setEmail("");
      } else {
        const data = await res.json().catch(() => null);
        setSubStatus("ERROR");
        setErrorMessage(
          data?.error ||
            "Could not complete your subscription. Please check your email and try again."
        );
      }
    } catch {
      setSubStatus("ERROR");
      setErrorMessage("Network error while subscribing. Please try again.");
    }
  };

  return (
    <footer className="border-t border-[var(--hairline)] bg-[var(--bg-canvas)] text-[var(--ink-primary)]">
      <div className="mx-auto max-w-[1360px] px-5 pt-20 pb-12 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Brand */}
          <div className="lg:col-span-4">
            <StretchedWordmark compact />
            <p className="mt-5 max-w-[36ch] text-[14px] leading-relaxed text-[var(--ink-muted)]">
              Software and AI creativity lab where raw ideas gain enough
              engineering weight to pull markets toward them.
            </p>
          </div>

          {/* Directory Columns */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-4">
            <div>
              <h3 className="text-[14px] font-semibold text-[var(--ink-primary)]">
                Divisions
              </h3>
              <ul className="mt-4 space-y-3 text-[14px]">
                <li>
                  <PreloadLink
                    href="/systems"
                    className="text-[var(--ink-muted)] transition-colors duration-150 hover:text-[var(--ink-primary)]"
                  >
                    Systems
                  </PreloadLink>
                </li>
                <li>
                  <PreloadLink
                    href="/labs"
                    className="text-[var(--ink-muted)] transition-colors duration-150 hover:text-[var(--ink-primary)]"
                  >
                    Labs
                  </PreloadLink>
                </li>
                <li>
                  <PreloadLink
                    href="/skunkworks"
                    className="text-[var(--ink-muted)] transition-colors duration-150 hover:text-[var(--ink-primary)]"
                  >
                    Skunkworks
                  </PreloadLink>
                </li>
                <li>
                  <PreloadLink
                    href="/orbit"
                    className="text-[var(--ink-muted)] transition-colors duration-150 hover:text-[var(--ink-primary)]"
                  >
                    Orbit
                  </PreloadLink>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[14px] font-semibold text-[var(--ink-primary)]">
                Intelligence
              </h3>
              <ul className="mt-4 space-y-3 text-[14px]">
                <li>
                  <PreloadLink
                    href="/hackathons"
                    className="text-[var(--ink-muted)] transition-colors duration-150 hover:text-[var(--ink-primary)]"
                  >
                    Hackathon Radar
                  </PreloadLink>
                </li>
                <li>
                  <PreloadLink
                    href="/journal"
                    className="text-[var(--ink-muted)] transition-colors duration-150 hover:text-[var(--ink-primary)]"
                  >
                    Journal and Wire
                  </PreloadLink>
                </li>
                <li>
                  <a
                    href="https://github.com/Aka4real"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--ink-muted)] transition-colors duration-150 hover:text-[var(--ink-primary)]"
                  >
                    <span>GitHub</span>
                    <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.7} />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Weekly Orbital Brief */}
          <div className="lg:col-span-4">
            <h3 className="text-[14px] font-semibold text-[var(--ink-primary)]">
              Weekly Orbital Brief
            </h3>
            <p className="mt-2 max-w-[38ch] text-[14px] leading-relaxed text-[var(--ink-muted)]">
              One weekly digest covering AI breakthroughs, winning hackathon
              builds, and engineering dispatches.
            </p>

            {subStatus === "DONE" ? (
              <div
                role="status"
                className="mt-5 flex items-center gap-2.5 rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-3 text-[14px] text-[#34D399]"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                <span>You are subscribed to the Weekly Orbital Brief.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-5" noValidate>
                <label
                  htmlFor="footer-newsletter-email"
                  className="block text-[14px] font-medium text-[var(--ink-primary)]"
                >
                  Email address
                </label>
                <div className="mt-2 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                  <input
                    id="footer-newsletter-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (subStatus === "ERROR") {
                        setSubStatus("IDLE");
                        setErrorMessage(null);
                      }
                    }}
                    placeholder="engineer@company.com"
                    className="h-11 flex-1 rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-surface)] px-4 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={subStatus === "LOADING"}
                    id="footer-newsletter-submit"
                    className="press-tactile inline-flex h-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[var(--accent)] px-5 text-[14px] font-semibold whitespace-nowrap text-[#07090D] hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {subStatus === "LOADING" ? "Subscribing..." : "Subscribe"}
                  </button>
                </div>
                {subStatus === "ERROR" && errorMessage && (
                  <p role="alert" className="mt-2 text-[14px] text-[#FF8A7A]">
                    {errorMessage}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-[var(--hairline)] pt-8 text-[14px] text-[var(--ink-muted)] sm:flex-row sm:items-center">
          <p>
            &copy; {new Date().getFullYear()} G-Gravitator Labs Ltd. Operating
            OXAKALABS.
          </p>
          <p className="text-[var(--ink-primary)]">Build with weight.</p>
        </div>
      </div>
    </footer>
  );
}
