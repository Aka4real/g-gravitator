"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock } from "lucide-react";
import { StretchedWordmark } from "@/components/layout/StretchedWordmark";

export function Footer() {
  const [timeTelemetry, setTimeTelemetry] = useState<string>(
    "UTC // --:--:-- • WAT (UTC+1) // --:--:--"
  );
  const [email, setEmail] = useState("");
  const [subStatus, setSubStatus] = useState<"IDLE" | "LOADING" | "DONE" | "ERROR">("IDLE");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const utc = now.toISOString().slice(11, 19);
      const watDate = new Date(now.getTime() + 3600 * 1000);
      const wat = watDate.toISOString().slice(11, 19);
      setTimeTelemetry(`UTC ${utc} // WAT (UTC+1) ${wat}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubStatus("LOADING");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });
      if (res.ok) {
        setSubStatus("DONE");
        setEmail("");
      } else {
        setSubStatus("ERROR");
      }
    } catch {
      setSubStatus("ERROR");
    }
  };

  return (
    <footer className="border-t border-[#27272A] bg-[#09090B] text-[#F3F2EE]">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* 4-Column Architectural Grid */}
        <div className="grid grid-cols-1 divide-y divide-[#27272A] border-x border-[#27272A] md:grid-cols-2 md:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {/* Column 1: Masterbrand & OXAKALABS Affiliation */}
          <div className="p-6 lg:p-8">
            <StretchedWordmark compact />
            <p className="mt-4 text-xs leading-relaxed text-[#A1A1AA]">
              Software &amp; AI creativity lab where raw ideas gain enough engineering mass
              to pull markets toward them.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 border border-[#27272A] bg-[#111114] px-2.5 py-1.5">
              <span className="h-1.5 w-1.5 bg-[#FF3B1F]" />
              <span className="font-mono-telemetry text-[10px] text-[#F3F2EE]">
                OXAKALABS // SKUNKWORKS EST. 2022
              </span>
            </div>
          </div>

          {/* Column 2: Four-Unit Operating Architecture */}
          <div className="p-6 lg:p-8">
            <h3 className="font-mono-telemetry text-[11px] text-[#71717A]">
              01 // OPERATING DIVISIONS
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link
                  href="/systems"
                  className="flex items-center justify-between text-[#A1A1AA] hover:text-[#F3F2EE]"
                >
                  <span>G-Gravitator Systems (B2B Foundry)</span>
                  <span className="font-mono-telemetry text-[10px] text-[#71717A]">/systems</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/labs"
                  className="flex items-center justify-between text-[#A1A1AA] hover:text-[#F3F2EE]"
                >
                  <span>G-Gravitator Labs (G-01..G-04)</span>
                  <span className="font-mono-telemetry text-[10px] text-[#71717A]">/labs</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/skunkworks"
                  className="flex items-center justify-between text-[#A1A1AA] hover:text-[#F3F2EE]"
                >
                  <span>OXAKALABS // Skunkworks R&amp;D</span>
                  <span className="font-mono-telemetry text-[10px] text-[#71717A]">
                    /skunkworks
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/orbit"
                  className="flex items-center justify-between text-[#A1A1AA] hover:text-[#F3F2EE]"
                >
                  <span>G-Gravitator Orbit (Gravity Cycles)</span>
                  <span className="font-mono-telemetry text-[10px] text-[#71717A]">/orbit</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Live Intelligence & Foundry Links */}
          <div className="p-6 lg:p-8">
            <h3 className="font-mono-telemetry text-[11px] text-[#71717A]">
              02 // LIVE INTELLIGENCE &amp; NETWORK
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link
                  href="/hackathons"
                  className="flex items-center justify-between text-[#A1A1AA] hover:text-[#F3F2EE]"
                >
                  <span>Global + X Hackathon Radar</span>
                  <span className="font-mono-telemetry text-[10px] text-[#FF3B1F]">LIVE</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/journal"
                  className="flex items-center justify-between text-[#A1A1AA] hover:text-[#F3F2EE]"
                >
                  <span>Lab Dispatches &amp; The Orbital Wire</span>
                  <span className="font-mono-telemetry text-[10px] text-[#71717A]">/journal</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="flex items-center justify-between text-[#A1A1AA] hover:text-[#F3F2EE]"
                >
                  <span>Curator Command Console</span>
                  <span className="font-mono-telemetry text-[10px] text-[#71717A]">/admin</span>
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/Aka4real"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between text-[#A1A1AA] hover:text-[#F3F2EE]"
                >
                  <span>GitHub Foundry (Aka4real / OXAKALABS)</span>
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Weekly Orbital Brief Dispatch Capture */}
          <div className="p-6 lg:p-8">
            <h3 className="font-mono-telemetry text-[11px] text-[#71717A]">
              03 // WEEKLY ORBITAL BRIEF
            </h3>
            <p className="mt-3 text-xs text-[#A1A1AA]">
              One sharp weekly digest of AI breakthroughs, winning hackathon builds, and Lab
              Dispatches. Zero fluff.
            </p>
            {subStatus === "DONE" ? (
              <div className="mt-4 flex items-center gap-2 border border-[#10B981]/50 bg-[#111114] p-3 text-xs text-[#10B981]">
                <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span className="font-mono-telemetry text-[10px]">
                  ORBITAL DISPATCH LOCKED
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-4 flex flex-col gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="engineer@domain.com"
                  id="footer-newsletter-email"
                  className="w-full border border-[#27272A] bg-[#111114] px-3 py-2 text-xs text-[#F3F2EE] placeholder-[#71717A] focus:border-[#FF3B1F] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={subStatus === "LOADING"}
                  id="footer-newsletter-submit"
                  className="font-mono-telemetry bg-[#F3F2EE] px-3 py-2 text-[11px] font-semibold text-[#09090B] transition-colors hover:bg-[#FF3B1F]"
                >
                  {subStatus === "LOADING" ? "REGISTERING..." : "SUBSCRIBE TO DISPATCH →"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Telemetry & Legal Bar */}
        <div className="flex flex-col items-start justify-between gap-3 border-x border-t border-[#27272A] bg-[#111114]/60 px-6 py-4 text-[11px] text-[#71717A] sm:flex-row sm:items-center">
          <div className="font-mono-telemetry flex items-center gap-2">
            <span>G-GRAVITATOR LABS LTD • OPERATING OXAKALABS</span>
            <span className="text-[#3F3F46]">|</span>
            <span className="text-[#A1A1AA]">BUILD WITH WEIGHT.</span>
          </div>
          <div className="font-mono-telemetry flex items-center gap-2 text-[#A1A1AA]">
            <Clock className="h-3.5 w-3.5 text-[#FF3B1F]" strokeWidth={1.5} />
            <span>{timeTelemetry} // LAGOS-GLOBAL</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
