"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import type { ServiceTierKey } from "@/lib/supabase/types";
import { SPRING_SHEET } from "@/lib/motion";

interface ScopeDrawerProps {
  open: boolean;
  initialTier?: ServiceTierKey;
  onClose: () => void;
}

function getTierDefaults(tier: ServiceTierKey) {
  if (tier === "GRAVITY_AUDIT") {
    return {
      budget: "$500 to $1,000 (or ₦800K to ₦1.6M)",
      timeline: "5-day sprint",
    };
  }
  if (tier === "VELOCITY_MVP") {
    return {
      budget: "$2,500 to $6,000 (or ₦4.0M to ₦9.5M)",
      timeline: "3 to 4 weeks",
    };
  }
  if (tier === "LAB_RETAINER") {
    return {
      budget: "$1,500 to $3,500 / mo (or ₦2.4M to ₦5.5M / mo)",
      timeline: "Ongoing monthly retainer",
    };
  }
  return {
    budget: "Custom scope",
    timeline: "Flexible schedule",
  };
}

export function ScopeDrawer({
  open,
  initialTier = "VELOCITY_MVP",
  onClose,
}: ScopeDrawerProps) {
  const prefersReducedMotion = useReducedMotion();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [tierDraft, setTierDraft] = useState<{
    baseTier: ServiceTierKey;
    tier: ServiceTierKey;
    budget: string;
    timeline: string;
  } | null>(null);
  const [projectBrief, setProjectBrief] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);

  const activeDraft =
    tierDraft && tierDraft.baseTier === initialTier ? tierDraft : null;
  const tier = activeDraft ? activeDraft.tier : initialTier;
  const baseDefaults = getTierDefaults(initialTier);
  const budgetRange = activeDraft ? activeDraft.budget : baseDefaults.budget;
  const timeline = activeDraft ? activeDraft.timeline : baseDefaults.timeline;

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const handleTierChange = (nextTier: ServiceTierKey) => {
    const defaults = getTierDefaults(nextTier);
    setTierDraft({
      baseTier: initialTier,
      tier: nextTier,
      budget: defaults.budget,
      timeline: defaults.timeline,
    });
  };

  const handleBudgetChange = (nextBudget: string) => {
    setTierDraft({
      baseTier: initialTier,
      tier,
      budget: nextBudget,
      timeline,
    });
  };

  const handleTimelineChange = (nextTimeline: string) => {
    setTierDraft({
      baseTier: initialTier,
      tier,
      budget: budgetRange,
      timeline: nextTimeline,
    });
  };

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
        setError(data.error || "Please verify all required fields and try again.");
      } else {
        setReceiptId(data.inquiry?.id || "INQ-VERIFIED");
      }
    } catch {
      setError("Network error while sending your project brief. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="scope-drawer-title"
          className="fixed inset-0 z-50 flex justify-end sm:p-3"
        >
          {/* Dimming Backdrop Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={onClose}
            className="fixed inset-0 bg-black/65 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Right-Anchored Floating Sheet */}
          <motion.div
            initial={
              prefersReducedMotion ? { opacity: 0 } : { x: "100%", opacity: 0.9 }
            }
            animate={prefersReducedMotion ? { opacity: 1 } : { x: 0, opacity: 1 }}
            exit={
              prefersReducedMotion ? { opacity: 0 } : { x: "100%", opacity: 0.9 }
            }
            transition={
              prefersReducedMotion ? { duration: 0.16 } : SPRING_SHEET
            }
            onClick={(e) => e.stopPropagation()}
            className="glass-chrome relative z-10 flex h-full w-full max-w-xl flex-col overflow-hidden text-[#F4F3EF] sm:rounded-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-6 py-5 sm:px-7">
              <div>
                <h2
                  id="scope-drawer-title"
                  className="font-display text-xl font-bold tracking-[-0.03em] text-[#F4F3EF] sm:text-2xl"
                >
                  Initiate a build
                </h2>
                <p className="mt-1 text-sm text-[#A1A1AA]">
                  Scope an enterprise system, technical audit, or custom lab engagement.
                </p>
              </div>
              <button
                type="button"
                id="scope-drawer-close"
                onClick={onClose}
                aria-label="Close build scope drawer"
                className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.05] text-[#A1A1AA] transition-[background-color,color,transform] duration-150 hover:bg-white/[0.12] hover:text-[#F4F3EF] active:scale-[0.95]"
              >
                <X className="h-4 w-4" strokeWidth={1.6} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-7">
              {receiptId ? (
                <div className="rounded-2xl border border-[#10B981]/30 bg-[#10B981]/[0.07] p-6">
                  <div className="flex items-center gap-2 text-[#34D399]">
                    <CheckCircle2 className="h-5 w-5 shrink-0" strokeWidth={1.7} />
                    <span className="font-mono-telemetry text-xs font-semibold">
                      Reference: {receiptId.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-display mt-3 text-xl font-bold text-[#F4F3EF]">
                    Scope brief received
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
                    Our principal architect reviews every specification directly. Expect a
                    structured technical response and scheduling link within 12 hours.
                  </p>
                  <div className="mt-6 border-t border-white/[0.08] pt-5">
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptId(null);
                        setProjectBrief("");
                        onClose();
                      }}
                      className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[#FF3B1F] px-5 py-2.5 text-sm font-semibold text-[#08080A] transition-[background-color,transform] duration-150 hover:bg-[#FF5238] active:scale-[0.97]"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-xs leading-relaxed text-[#D4D4D8]">
                    <ShieldCheck
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#FF3B1F]"
                      strokeWidth={1.7}
                    />
                    <span>
                      Full foreground IP transfer on milestone completion. Direct principal
                      engineering with zero junior handoffs.
                    </span>
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-[#FF3B1F]/40 bg-[#FF3B1F]/12 px-4 py-3 text-sm text-[#FF8A7A]"
                    >
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="scope-name"
                        className="block text-xs font-medium text-[#D4D4D8]"
                      >
                        Your name *
                      </label>
                      <input
                        id="scope-name"
                        required
                        type="text"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Marcus Vance"
                        className="w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-3.5 py-2.5 text-sm text-[#F4F3EF] placeholder:text-[#8B8B94] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/30 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="scope-email"
                        className="block text-xs font-medium text-[#D4D4D8]"
                      >
                        Work email *
                      </label>
                      <input
                        id="scope-email"
                        required
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="founder@company.com"
                        className="w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-3.5 py-2.5 text-sm text-[#F4F3EF] placeholder:text-[#8B8B94] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/30 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="scope-company"
                        className="block text-xs font-medium text-[#D4D4D8]"
                      >
                        Company or organization
                      </label>
                      <input
                        id="scope-company"
                        type="text"
                        autoComplete="organization"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Acme Systems Ltd"
                        className="w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-3.5 py-2.5 text-sm text-[#F4F3EF] placeholder:text-[#8B8B94] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/30 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="scope-tier"
                        className="block text-xs font-medium text-[#D4D4D8]"
                      >
                        Engagement tier *
                      </label>
                      <select
                        id="scope-tier"
                        value={tier}
                        onChange={(e) =>
                          handleTierChange(e.target.value as ServiceTierKey)
                        }
                        className="w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-3.5 py-2.5 text-sm text-[#F4F3EF] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/30 focus:outline-none"
                      >
                        <option value="GRAVITY_AUDIT">Gravity Audit (5 days)</option>
                        <option value="VELOCITY_MVP">Velocity MVP (3 to 4 weeks)</option>
                        <option value="LAB_RETAINER">Fractional Lab Retainer</option>
                        <option value="CUSTOM">Custom Enterprise Architecture</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="scope-budget"
                        className="block text-xs font-medium text-[#D4D4D8]"
                      >
                        Budget range (USD / NGN)
                      </label>
                      <input
                        id="scope-budget"
                        type="text"
                        value={budgetRange}
                        onChange={(e) => handleBudgetChange(e.target.value)}
                        placeholder="$2,500 to $6,000"
                        className="w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-3.5 py-2.5 text-sm text-[#F4F3EF] placeholder:text-[#8B8B94] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/30 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="scope-timeline"
                        className="block text-xs font-medium text-[#D4D4D8]"
                      >
                        Target timeline
                      </label>
                      <input
                        id="scope-timeline"
                        type="text"
                        value={timeline}
                        onChange={(e) => handleTimelineChange(e.target.value)}
                        placeholder="3 to 4 weeks"
                        className="w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-3.5 py-2.5 text-sm text-[#F4F3EF] placeholder:text-[#8B8B94] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/30 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="scope-brief"
                      className="block text-xs font-medium text-[#D4D4D8]"
                    >
                      Project brief *
                    </label>
                    <textarea
                      id="scope-brief"
                      required
                      rows={4}
                      value={projectBrief}
                      onChange={(e) => setProjectBrief(e.target.value)}
                      placeholder="Describe the workflow bottleneck, AI agent architecture, or product MVP you need engineered..."
                      className="w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] p-3.5 text-sm text-[#F4F3EF] placeholder:text-[#8B8B94] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/30 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    id="scope-drawer-submit"
                    className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#FF3B1F] px-6 text-sm font-semibold text-[#08080A] transition-[background-color,transform] duration-150 hover:bg-[#FF5238] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>
                      {submitting ? "Sending brief..." : "Send scope specification"}
                    </span>
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
