"use client";

import React, { useState } from "react";
import { X, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import type { ServiceTierKey } from "@/lib/supabase/types";

interface ScopeDrawerProps {
  open: boolean;
  initialTier?: ServiceTierKey;
  onClose: () => void;
}

export function ScopeDrawer({
  open,
  initialTier = "VELOCITY_MVP",
  onClose,
}: ScopeDrawerProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [tier, setTier] = useState<ServiceTierKey>(initialTier);
  const [budgetRange, setBudgetRange] = useState("$2,500 – $6,000");
  const [timeline, setTimeline] = useState("3–4 Weeks (Immediate)");
  const [projectBrief, setProjectBrief] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);

  React.useEffect(() => {
    setTier(initialTier);
    if (initialTier === "GRAVITY_AUDIT") {
      setBudgetRange("$500 – $1,000 (or ₦800K – ₦1.6M)");
      setTimeline("5-Day Sprint");
    } else if (initialTier === "VELOCITY_MVP") {
      setBudgetRange("$2,500 – $6,000 (or ₦4.0M – ₦9.5M)");
      setTimeline("3–4 Weeks");
    } else if (initialTier === "LAB_RETAINER") {
      setBudgetRange("$1,500 – $3,500 / mo (or ₦2.4M – ₦5.5M / mo)");
      setTimeline("Ongoing Monthly Retainer");
    }
  }, [initialTier]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company: company || null,
          tier,
          budget_range: budgetRange,
          timeline,
          project_brief: projectBrief,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Validation error. Please verify all fields.");
      } else {
        setReceiptId(data.inquiry?.id || "INQ-VERIFIED");
      }
    } catch {
      setError("Network error transmitting scope brief.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-xl flex-col border-l border-[#27272A] bg-[#111114] text-[#F3F2EE]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#27272A] bg-[#09090B] px-6 py-4">
          <div>
            <span className="font-mono-telemetry text-[10px] text-[#FF3B1F]">
              G-GRAVITATOR SYSTEMS // DIRECT INTAKE
            </span>
            <h2 className="font-display mt-1 text-lg font-bold tracking-tight">
              INITIATE B2B SYSTEM OR LAB BUILD
            </h2>
          </div>
          <button
            type="button"
            id="scope-drawer-close"
            onClick={onClose}
            className="border border-[#27272A] p-2 text-[#A1A1AA] hover:border-[#3F3F46] hover:text-[#F3F2EE]"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {receiptId ? (
            <div className="border border-[#10B981]/50 bg-[#09090B] p-6">
              <div className="flex items-center gap-2 text-[#10B981]">
                <CheckCircle2 className="h-5 w-5" strokeWidth={1.5} />
                <span className="font-mono-telemetry text-xs font-semibold">
                  TRANSMISSION LOCKED // REF: {receiptId.toUpperCase()}
                </span>
              </div>
              <h3 className="font-display mt-3 text-xl font-bold">
                Scope Brief Received by G-Gravitator Systems.
              </h3>
              <p className="mt-2 text-sm text-[#A1A1AA]">
                Our principal architect reviews every B2B specification directly. Expect a
                structured technical response and calendar link within 12 operational hours.
              </p>
              <div className="mt-6 border-t border-[#27272A] pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setReceiptId(null);
                    setProjectBrief("");
                    onClose();
                  }}
                  className="font-mono-telemetry bg-[#FF3B1F] px-4 py-2.5 text-xs font-semibold text-[#09090B]"
                >
                  RETURN TO MISSION CONTROL
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="border border-[#27272A] bg-[#09090B] p-3.5">
                <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                  <ShieldCheck className="h-4 w-4 text-[#FF3B1F]" strokeWidth={1.5} />
                  <span>
                    100% Foreground IP transfer upon milestone completion. Direct principal
                    engineering—zero junior handoffs.
                  </span>
                </div>
              </div>

              {error && (
                <div className="border border-[#FF3B1F] bg-[#FF3B1F]/10 p-3 text-xs text-[#FF3B1F]">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="font-mono-telemetry block text-[11px] text-[#A1A1AA]">
                    YOUR NAME *
                  </label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Marcus Vance"
                    className="mt-1.5 w-full border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F3F2EE] focus:border-[#FF3B1F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-mono-telemetry block text-[11px] text-[#A1A1AA]">
                    WORK EMAIL *
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="founder@company.com"
                    className="mt-1.5 w-full border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F3F2EE] focus:border-[#FF3B1F] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="font-mono-telemetry block text-[11px] text-[#A1A1AA]">
                    COMPANY / ORGANIZATION
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Systems Ltd"
                    className="mt-1.5 w-full border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F3F2EE] focus:border-[#FF3B1F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-mono-telemetry block text-[11px] text-[#A1A1AA]">
                    ENGAGEMENT TIER *
                  </label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as ServiceTierKey)}
                    className="mt-1.5 w-full border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F3F2EE] focus:border-[#FF3B1F] focus:outline-none"
                  >
                    <option value="GRAVITY_AUDIT">Tier 01 — Gravity Audit (5 Days)</option>
                    <option value="VELOCITY_MVP">Tier 02 — Velocity MVP (3–4 Weeks)</option>
                    <option value="LAB_RETAINER">Tier 03 — Fractional Lab Retainer</option>
                    <option value="CUSTOM">Custom Enterprise Architecture</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="font-mono-telemetry block text-[11px] text-[#A1A1AA]">
                    BUDGET BAND (USD / NGN)
                  </label>
                  <input
                    type="text"
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="mt-1.5 w-full border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F3F2EE] focus:border-[#FF3B1F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-mono-telemetry block text-[11px] text-[#A1A1AA]">
                    TARGET TIMELINE
                  </label>
                  <input
                    type="text"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="mt-1.5 w-full border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F3F2EE] focus:border-[#FF3B1F] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono-telemetry block text-[11px] text-[#A1A1AA]">
                  ARCHITECTURAL & OPERATIONAL BRIEF *
                </label>
                <textarea
                  required
                  rows={4}
                  value={projectBrief}
                  onChange={(e) => setProjectBrief(e.target.value)}
                  placeholder="Describe the workflow bottleneck, AI agent architecture, or product MVP you need engineered..."
                  className="mt-1.5 w-full border border-[#27272A] bg-[#09090B] p-3.5 text-sm text-[#F3F2EE] focus:border-[#FF3B1F] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                id="scope-drawer-submit"
                className="font-mono-telemetry flex w-full items-center justify-center gap-2 bg-[#FF3B1F] px-5 py-3.5 text-xs font-semibold text-[#09090B] transition-colors hover:bg-[#F3F2EE]"
              >
                <span>{submitting ? "TRANSMITTING BRIEF..." : "TRANSMIT SCOPE SPECIFICATION"}</span>
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
