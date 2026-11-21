"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { StretchedWordmark } from "@/components/layout/StretchedWordmark";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subStatus, setSubStatus] = useState<"IDLE" | "LOADING" | "DONE" | "ERROR">("IDLE");
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
          data?.error || "Could not complete your subscription. Please check your email and try again."
        );
      }
    } catch {
      setSubStatus("ERROR");
      setErrorMessage("Network error while subscribing. Please try again.");
    }
  };

  return (
    <footer className="border-t border-white/[0.07] bg-[#08080A] text-[#F4F3EF]">
      <div className="mx-auto max-w-[1360px] px-6 pt-20 pb-12 sm:px-10 lg:px-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Brand Statement */}
          <div className="lg:col-span-4">
            <StretchedWordmark compact />
            <p className="mt-5 max-w-[34ch] text-sm leading-relaxed text-[#A1A1AA]">
              Software and AI creativity lab where raw ideas gain enough engineering
              weight to pull markets toward them.
            </p>
          </div>

          {/* Open Link Columns */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-4">
            <div>
              <h3 className="text-xs font-semibold tracking-wide text-[#F4F3EF]">
                Divisions
              </h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link
                    href="/systems"
                    className="text-[#A1A1AA] transition-colors hover:text-[#F4F3EF]"
                  >
                    Systems
                  </Link>
                </li>
                <li>
                  <Link
                    href="/labs"
                    className="text-[#A1A1AA] transition-colors hover:text-[#F4F3EF]"
                  >
                    Labs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/skunkworks"
                    className="text-[#A1A1AA] transition-colors hover:text-[#F4F3EF]"
                  >
                    Skunkworks
                  </Link>
                </li>
                <li>
                  <Link
                    href="/orbit"
                    className="text-[#A1A1AA] transition-colors hover:text-[#F4F3EF]"
                  >
                    Orbit
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold tracking-wide text-[#F4F3EF]">
                Intelligence
              </h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link
                    href="/hackathons"
                    className="inline-flex items-center gap-2 text-[#A1A1AA] transition-colors hover:text-[#F4F3EF]"
                  >
                    <span>Hackathon Radar</span>
                    <span
                      aria-label="Live"
                      className="h-1.5 w-1.5 rounded-full bg-[#10B981]"
                    />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/journal"
                    className="text-[#A1A1AA] transition-colors hover:text-[#F4F3EF]"
                  >
                    Journal &amp; Wire
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin"
                    className="text-[#A1A1AA] transition-colors hover:text-[#F4F3EF]"
                  >
                    Curator Console
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/Aka4real"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#A1A1AA] transition-colors hover:text-[#F4F3EF]"
                  >
                    <span>GitHub</span>
                    <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.6} />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Weekly Orbital Brief Capture */}
          <div className="lg:col-span-4">
            <h3 className="text-sm font-semibold text-[#F4F3EF]">
              Weekly Orbital Brief
            </h3>
            <p className="mt-2 max-w-[38ch] text-sm leading-relaxed text-[#A1A1AA]">
              One sharp weekly digest covering AI breakthroughs, winning hackathon
              builds, and lab dispatches.
            </p>

            {subStatus === "DONE" ? (
              <div
                role="status"
                className="mt-5 flex items-center gap-2.5 rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-3 text-sm text-[#34D399]"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                <span>You are subscribed to the Weekly Orbital Brief.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-5" noValidate>
                <label
                  htmlFor="footer-newsletter-email"
                  className="block text-xs font-medium text-[#D4D4D8]"
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
                    className="h-11 flex-1 rounded-xl border border-white/[0.12] bg-[#111114] px-4 text-sm text-[#F4F3EF] placeholder:text-[#8B8B94] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/30 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={subStatus === "LOADING"}
                    id="footer-newsletter-submit"
                    className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#FF3B1F] px-5 text-sm font-semibold whitespace-nowrap text-[#08080A] transition-[background-color,transform] duration-150 hover:bg-[#FF5238] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {subStatus === "LOADING" ? "Subscribing..." : "Subscribe"}
                  </button>
                </div>
                {subStatus === "ERROR" && errorMessage && (
                  <p role="alert" className="mt-2 text-xs text-[#FF8A7A]">
                    {errorMessage}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Clean Bottom Legal Line */}
        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-white/[0.07] pt-8 text-xs text-[#8B8B94] sm:flex-row sm:items-center">
          <p>
            &copy; {new Date().getFullYear()} G-Gravitator Labs Ltd. Operating OXAKALABS.
          </p>
          <p className="text-[#A1A1AA]">Build with weight.</p>
        </div>
      </div>
    </footer>
  );
}
