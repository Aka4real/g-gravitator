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
        setError(
          data.error || "Please verify all required fields and try again."
        );
      } else {
        setReceiptId(data.inquiry?.id || "INQ-VERIFIED");
      }
    } catch {
      setError(
        "Network error while sending your project brief. Please try again."
      );
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            initial={
              prefersReducedMotion ? { opacity: 0 } : { x: "100%", opacity: 0.9 }
            }
            animate={
              prefersReducedMotion ? { opacity: 1 } : { x: 0, opacity: 1 }
            }
            exit={
              prefersReducedMotion ? { opacity: 0 } : { x: "100%", opacity: 0.9 }
            }
            transition={
              prefersReducedMotion ? { duration: 0.16 } : SPRING_SHEET
            }
            onClick={(e) => e.stopPropagation()}
            className="glass-bar relative z-10 flex h-full w-full max-w-xl flex-col overflow-hidden text-[var(--ink-primary)] shadow-[0_24px_80px_rgba(0,0,0,0.7)] sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] px-6 py-5 sm:px-7">
              <div>
                <h2
                  id="scope-drawer-title"
                  className="font-display text-[22px] font-semibold tracking-[-0.03em] text-[var(--ink-primary)]"
                >
                  Initiate a build
                </h2>
                <p className="mt-1 text-[14px] text-[var(--ink-muted)]">
                  Scope an enterprise system, technical audit, or custom lab
                  engagement.
                </p>
              </div>
              <button
                type="button"
                id="scope-drawer-close"
                onClick={onClose}
                aria-label="Close build scope drawer"
                className="press-tactile inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[var(--hairline-strong)] bg-white/[0.04] text-[var(--ink-muted)] hover:bg-white/[0.1] hover:text-[var(--ink-primary)]"
              >
                <X className="h-4 w-4" strokeWidth={1.7} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-7">
              {receiptId ? (
                <div className="space-y-4 border-l-2 border-[#10B981] pl-5">
                  <div className="flex items-center gap-2 text-[14px] font-medium text-[#34D399]">
                    <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                    <span className="font-tabular">
                      Reference: {receiptId.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-display text-[22px] font-semibold text-[var(--ink-primary)]">
                    Scope brief received
                  </h3>
                  <p className="text-[16px] leading-relaxed text-[var(--ink-muted)]">
                    Our principal architect reviews every specification
                    directly. Expect a structured technical response and
                    scheduling link within 12 hours.
                  </p>
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptId(null);
                        setProjectBrief("");
                        onClose();
                      }}
                      className="press-tactile inline-flex h-11 cursor-pointer items-center justify-center rounded-full bg-[var(--accent)] px-6 text-[14px] font-semibold text-[#07090D] hover:bg-[var(--accent-hover)]"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="flex items-start gap-3 border-b border-[var(--hairline)] pb-5 text-[14px] leading-relaxed text-[var(--ink-muted)]">
                    <ShieldCheck
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]"
                      strokeWidth={1.8}
                    />
                    <span>
                      Full foreground IP transfer on milestone completion.
                      Direct principal engineering with zero junior handoffs.
                    </span>
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-4 py-3 text-[14px] text-[#FF8A7A]"
                    >
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="scope-name"
                        className="block text-[14px] font-medium text-[var(--ink-primary)]"
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
                        className="h-11 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-4 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="scope-email"
                        className="block text-[14px] font-medium text-[var(--ink-primary)]"
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
                        className="h-11 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-4 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="scope-company"
                        className="block text-[14px] font-medium text-[var(--ink-primary)]"
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
                        className="h-11 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-4 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="scope-tier"
                        className="block text-[14px] font-medium text-[var(--ink-primary)]"
                      >
                        Engagement tier *
                      </label>
                      <select
                        id="scope-tier"
                        value={tier}
                        onChange={(e) =>
                          handleTierChange(e.target.value as ServiceTierKey)
                        }
                        className="h-11 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-4 text-[14px] text-[var(--ink-primary)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                      >
                        <option value="GRAVITY_AUDIT">
                          Gravity Audit (5 days)
                        </option>
                        <option value="VELOCITY_MVP">
                          Velocity MVP (3 to 4 weeks)
                        </option>
                        <option value="LAB_RETAINER">
                          Fractional Lab Retainer
                        </option>
                        <option value="CUSTOM">
                          Custom Enterprise Architecture
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="scope-budget"
                        className="block text-[14px] font-medium text-[var(--ink-primary)]"
                      >
                        Budget range (USD / NGN)
                      </label>
                      <input
                        id="scope-budget"
                        type="text"
                        value={budgetRange}
                        onChange={(e) => handleBudgetChange(e.target.value)}
                        placeholder="$2,500 to $6,000"
                        className="font-tabular h-11 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-4 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="scope-timeline"
                        className="block text-[14px] font-medium text-[var(--ink-primary)]"
                      >
                        Target timeline
                      </label>
                      <input
                        id="scope-timeline"
                        type="text"
                        value={timeline}
                        onChange={(e) => handleTimelineChange(e.target.value)}
                        placeholder="3 to 4 weeks"
                        className="h-11 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-4 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="scope-brief"
                      className="block text-[14px] font-medium text-[var(--ink-primary)]"
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
                      className="w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] p-4 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    id="scope-drawer-submit"
                    className="press-tactile inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 text-[14px] font-semibold text-[#07090D] hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>
                      {submitting
                        ? "Sending brief..."
                        : "Send scope specification"}
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
