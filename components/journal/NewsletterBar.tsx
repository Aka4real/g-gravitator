"use client";

import React, { useState } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface NewsletterBarProps {
  title?: string;
  subtitle?: string;
  source?: string;
}

export function NewsletterBar({
  title = "WEEKLY ORBITAL BRIEF",
  subtitle = "One sharp digest of AI breakthroughs, winning hackathon builds, and Lab Dispatches. Zero fluff.",
  source = "journal",
}: NewsletterBarProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"IDLE" | "LOADING" | "DONE" | "ERROR">("IDLE");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("LOADING");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      if (res.ok) {
        setStatus("DONE");
        setEmail("");
      } else {
        setStatus("ERROR");
      }
    } catch {
      setStatus("ERROR");
    }
  };

  return (
    <div className="border border-[#27272A] bg-[#09090B] p-6">
      <div className="font-mono-telemetry text-[11px] text-[#FF3B1F]">{title}</div>
      <p className="mt-1.5 text-xs text-[#A1A1AA]">{subtitle}</p>

      {status === "DONE" ? (
        <div className="mt-4 flex items-center gap-2 border border-[#10B981]/50 bg-[#111114] p-3 text-xs text-[#10B981]">
          <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          <span className="font-mono-telemetry text-[10px]">
            SUBSCRIPTION CONFIRMED // WEEKLY ORBITAL BRIEF
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="builder@domain.com"
            className="flex-1 border border-[#27272A] bg-[#111114] px-3.5 py-2.5 text-xs text-[#F3F2EE] placeholder-[#71717A] focus:border-[#FF3B1F] focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "LOADING"}
            className="font-mono-telemetry inline-flex items-center justify-center gap-1.5 bg-[#FF3B1F] px-4 py-2.5 text-xs font-semibold text-[#09090B] hover:bg-[#F3F2EE]"
          >
            <span>{status === "LOADING" ? "LOCKING..." : "SUBSCRIBE"}</span>
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        </form>
      )}
    </div>
  );
}
