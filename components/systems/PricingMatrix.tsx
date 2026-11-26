"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Reveal, SPRING_UI, StaggerGroup, StaggerItem } from "@/lib/motion";
import type { ServiceTierKey } from "@/lib/supabase/types";

interface TierSpec {
  key: ServiceTierKey;
  name: string;
  duration: string;
  usdRange: string;
  ngnRange: string;
  thesis: string;
  deliverables: string[];
  featured?: boolean;
}

const SERVICE_TIERS: TierSpec[] = [
  {
    key: "GRAVITY_AUDIT",
    name: "Gravity Audit",
    duration: "5-day sprint",
    usdRange: "$500 to $1,000",
    ngnRange: "₦800K to ₦1.6M",
    thesis:
      "Five-day operational and technical teardown plus a clickable prototype isolating high-ROI AI and software automation targets.",
    deliverables: [
      "Full operational bottleneck and latency audit across current tools",
      "Interactive clickable prototype demonstrating the target AI workflow",
      "Deterministic ROI model and token or compute cost projection",
      "Complete architectural SOW crediting 100% toward a Velocity MVP",
    ],
  },
  {
    key: "VELOCITY_MVP",
    name: "Velocity MVP",
    duration: "3 to 4 weeks · Recommended",
    usdRange: "$2,500 to $6,000",
    ngnRange: "₦4.0M to ₦9.5M",
    thesis:
      "Production full-stack web platform or custom multi-agent AI system architected, engineered, and deployed in 3 to 4 weeks.",
    deliverables: [
      "Production Next.js and TypeScript platform or multi-agent kernel",
      "Custom MCP servers, WhatsApp, email, and ERP integrations with Postgres RLS",
      "Weekly Friday live ship demos on staging infrastructure",
      "100% foreground IP transfer, repository handover, and deployment runbook",
    ],
    featured: true,
  },
  {
    key: "LAB_RETAINER",
    name: "Lab Retainer",
    duration: "Monthly retainer",
    usdRange: "$1,500 to $3,500 / mo",
    ngnRange: "₦2.4M to ₦5.5M / mo",
    thesis:
      "Dedicated fractional AI engineering and R&D partner for continuous shipping, model evaluation, and infrastructure scaling.",
    deliverables: [
      "Dedicated senior G-Gravitator principal architect in your Slack or Linear",
      "Continuous feature velocity, model benchmarking (OrbitBench), and evals",
      "Priority access to OXAKALABS experimental tooling and background modules",
      "Pause or cancel at any monthly cycle boundary with zero lock-in",
    ],
  },
];

const CAPABILITIES = [
  {
    title: "Full-stack web and SaaS",
    icon: Layers,
    description:
      "Next.js App Router, strict TypeScript contracts, Supabase PostgreSQL with Row Level Security, multi-tenant RBAC, and sub-50ms edge caching.",
  },
  {
    title: "Multi-agent AI and MCP servers",
    icon: Cpu,
    description:
      "Deterministic tool-calling pipelines, custom Model Context Protocol servers, Gemini and Claude structured outputs, and automated eval harnesses.",
  },
  {
    title: "Internal operations agents",
    icon: Workflow,
    description:
      "Omnichannel WhatsApp Business API, email, and ERP reconciliation agents automating intake, quoting, invoicing, and executive briefs.",
  },
  {
    title: "High-craft web platforms",
    icon: Sparkles,
    description:
      "Editorial product sites and live engineering tools built with disciplined typography, responsive canvases, and instant command search.",
  },
];

const PROTOCOL_STEPS = [
  {
    cadence: "Within 24 hours",
    title: "Fixed architecture brief",
    desc: "We lock a deterministic Statement of Work defining exact schema deliverables, acceptance criteria, and fixed pricing.",
  },
  {
    cadence: "Day 3",
    title: "Clickable staging kernel",
    desc: "No month-long wireframe limbo. By Day 3 you test a live deployed staging kernel backed by real database migrations and typed APIs.",
  },
  {
    cadence: "Every Friday",
    title: "Verifiable production builds",
    desc: "Every Friday we ship a tested production increment to your staging URL alongside regression checks and latency benchmarks.",
  },
  {
    cadence: "Final milestone",
    title: "Clean foreground IP ownership",
    desc: "Upon completion, 100% of custom foreground IP transfers to your entity with a perpetual license to reusable background lab modules.",
  },
];

export function PricingMatrix() {
  const prefersReducedMotion = useReducedMotion();
  const [currency, setCurrency] = useState<"USD" | "NGN">("USD");
  const [selectedTier, setSelectedTier] =
    useState<ServiceTierKey>("VELOCITY_MVP");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [budgetRange, setBudgetRange] = useState("$2,500 to $6,000");
  const [timeline, setTimeline] = useState("3 to 4 weeks");
  const [projectBrief, setProjectBrief] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);

  const handleSelectTier = (tier: TierSpec) => {
    setSelectedTier(tier.key);
    setBudgetRange(currency === "USD" ? tier.usdRange : tier.ngnRange);
    setTimeline(tier.duration.replace(" · Recommended", ""));
    const el = document.getElementById("scope-intake");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const handleTierSelectInput = (nextKey: ServiceTierKey) => {
    setSelectedTier(nextKey);
    const active = SERVICE_TIERS.find((t) => t.key === nextKey);
    if (active) {
      setBudgetRange(currency === "USD" ? active.usdRange : active.ngnRange);
      setTimeline(active.duration.replace(" · Recommended", ""));
    } else {
      setBudgetRange("Custom scope");
      setTimeline("Flexible schedule");
    }
  };

  const handleCurrencyChange = (next: "USD" | "NGN") => {
    setCurrency(next);
    const active = SERVICE_TIERS.find((t) => t.key === selectedTier);
    if (active) {
      setBudgetRange(next === "USD" ? active.usdRange : active.ngnRange);
    }
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
          tier: selectedTier,
          budget_range: budgetRange,
          timeline,
          project_brief: projectBrief,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error || "Please check all required fields and try again."
        );
      } else {
        setReceiptId(data.inquiry?.id || "SYS-VERIFIED");
      }
    } catch {
      setError(
        "Unable to submit your specification right now. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Section 1: 3-Tier Engagement Ledger */}
      <section
        id="engagement-tiers"
        className="border-t border-[var(--hairline)] py-20 lg:py-28"
      >
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="type-heading text-[var(--ink-primary)]">
                Engagement tiers
              </h2>
              <p className="mt-3 max-w-[56ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
                Transparent commercial bands with fixed milestones and full
                foreground IP transfer.
              </p>
            </div>

            {/* Connected Segmented USD / NGN Switch */}
            <div
              role="group"
              aria-label="Billing currency"
              className="inline-flex w-fit shrink-0 items-center rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-surface)] p-1"
            >
              {(
                [
                  { key: "USD", id: "currency-toggle-usd", label: "USD ($)" },
                  { key: "NGN", id: "currency-toggle-ngn", label: "NGN (₦)" },
                ] as const
              ).map((option) => {
                const isActive = currency === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    id={option.id}
                    aria-pressed={isActive}
                    onClick={() => handleCurrencyChange(option.key)}
                    className={`press-tactile relative z-10 cursor-pointer rounded-full px-4 py-2 text-[14px] font-semibold whitespace-nowrap transition-colors duration-150 ${
                      isActive
                        ? "text-[#07090D]"
                        : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="systems-currency-pill"
                        transition={
                          prefersReducedMotion ? { duration: 0.12 } : SPRING_UI
                        }
                        className="absolute inset-0 -z-10 rounded-full bg-[var(--ink-primary)]"
                      />
                    )}
                    <span className="font-tabular">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <StaggerGroup className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {SERVICE_TIERS.map((tier) => {
              const isSelected = selectedTier === tier.key;
              const isFeatured = Boolean(tier.featured);

              return (
                <StaggerItem key={tier.key} className="flex">
                  <article
                    className={`flex w-full flex-col justify-between rounded-xl border p-7 lg:p-8 ${
                      isFeatured
                        ? "border-t-2 border-[var(--hairline-strong)] border-t-[var(--accent)] bg-[var(--bg-surface)]"
                        : "border-[var(--hairline)] bg-[var(--bg-surface)]"
                    }`}
                  >
                    <div>
                      <p
                        className={`font-tabular text-[14px] font-medium ${
                          isFeatured
                            ? "text-[#FF7A63]"
                            : "text-[var(--ink-muted)]"
                        }`}
                      >
                        {tier.duration}
                      </p>

                      <h3 className="type-heading mt-3 text-[var(--ink-primary)]">
                        {tier.name}
                      </h3>

                      <div className="mt-6 border-y border-[var(--hairline)] py-5">
                        <div className="text-[14px] text-[var(--ink-muted)]">
                          {currency === "USD"
                            ? "Global USD band"
                            : "Regional NGN band"}
                        </div>
                        <div className="font-tabular mt-1 text-[22px] font-semibold tracking-tight text-[var(--ink-primary)]">
                          {currency === "USD" ? tier.usdRange : tier.ngnRange}
                        </div>
                      </div>

                      <p className="mt-6 text-[16px] leading-[1.65] text-[var(--ink-muted)]">
                        {tier.thesis}
                      </p>

                      <ul className="mt-6 space-y-3 text-[16px] leading-[1.6] text-[var(--ink-primary)]">
                        {tier.deliverables.map((item) => (
                          <li key={item} className="flex items-start gap-2.5">
                            <Check
                              className={`mt-1.5 h-4 w-4 shrink-0 ${
                                isFeatured
                                  ? "text-[var(--accent)]"
                                  : "text-[var(--ink-muted)]"
                              }`}
                              strokeWidth={2}
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8 pt-2">
                      <button
                        type="button"
                        id={`select-tier-${tier.key.toLowerCase()}`}
                        onClick={() => handleSelectTier(tier)}
                        className={`press-tactile inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-[14px] font-semibold whitespace-nowrap ${
                          isFeatured || isSelected
                            ? "bg-[var(--accent)] text-[#07090D] hover:bg-[var(--accent-hover)]"
                            : "border border-[var(--hairline-strong)] bg-[var(--bg-recessed)] text-[var(--ink-primary)] hover:border-white/30"
                        }`}
                      >
                        <span>Select {tier.name}</span>
                        <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2} />
                      </button>
                    </div>
                  </article>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      {/* Section 2: Cool Architectural Stone Band (Capabilities) */}
      <Reveal as="section" className="surface-stone py-24 lg:py-32">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-4">
              <h2 className="type-heading text-[var(--ink-stone-primary)]">
                What we engineer
              </h2>
              <p className="mt-4 max-w-[42ch] text-[16px] leading-[1.65] text-[var(--ink-stone-muted)]">
                Production architectures built on strict contracts, verifiable AI
                pipelines, and resilient operational infrastructure.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:col-span-8">
              {CAPABILITIES.map((capability) => {
                const Icon = capability.icon;
                return (
                  <div
                    key={capability.title}
                    className="border-t border-[var(--hairline-stone)] pt-6"
                  >
                    <Icon
                      className="h-5 w-5 text-[var(--accent-on-stone)]"
                      strokeWidth={1.8}
                    />
                    <h3 className="type-subhead mt-4 text-[var(--ink-stone-primary)]">
                      {capability.title}
                    </h3>
                    <p className="mt-2.5 text-[16px] leading-[1.65] text-[var(--ink-stone-muted)]">
                      {capability.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Reveal>

      {/* Section 3: Engagement Cadence */}
      <Reveal
        as="section"
        className="border-t border-[var(--hairline)] py-24 lg:py-32"
      >
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <h2 className="type-heading text-[var(--ink-primary)]">
            How engagements run
          </h2>
          <p className="mt-3 max-w-[60ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
            Four predictable checkpoints from fixed scope statement to full
            foreground IP handover.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PROTOCOL_STEPS.map((item) => (
              <div
                key={item.title}
                className="border-t border-[var(--hairline-strong)] pt-5"
              >
                <p className="font-tabular text-[14px] font-medium text-[#FF7A63]">
                  {item.cadence}
                </p>
                <h3 className="type-subhead mt-3 text-[var(--ink-primary)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-[16px] leading-[1.65] text-[var(--ink-muted)]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Section 4: Direct Project Scoping Form (#scope-intake) */}
      <Reveal
        as="section"
        className="border-t border-[var(--hairline)] bg-[var(--bg-surface)] py-24 lg:py-32"
      >
        <div
          id="scope-intake"
          className="mx-auto grid max-w-[1360px] scroll-mt-24 grid-cols-1 gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:px-12"
        >
          <div className="lg:col-span-4">
            <h2 className="type-heading text-[var(--ink-primary)]">
              Scope your system
            </h2>
            <p className="mt-4 max-w-[40ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
              Share your target architecture, operational bottleneck, or product
              timeline. Every brief goes straight to a principal engineer.
            </p>

            <ul className="mt-8 space-y-4 text-[16px] text-[var(--ink-primary)]">
              <li className="flex items-start gap-3">
                <Clock
                  className="mt-1 h-4 w-4 shrink-0 text-[#34D399]"
                  strokeWidth={1.9}
                />
                <span>Under 12-hour direct response from a principal architect.</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck
                  className="mt-1 h-4 w-4 shrink-0 text-[var(--accent)]"
                  strokeWidth={1.9}
                />
                <span>Full foreground IP transfer on milestone completion.</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-8">
            <div className="rounded-xl border border-[var(--hairline)] bg-[var(--bg-canvas)] p-7 sm:p-10">
              {receiptId ? (
                <div className="space-y-4 border-l-2 border-[#10B981] pl-6">
                  <div className="flex items-center gap-2 text-[14px] font-medium text-[#34D399]">
                    <CheckCircle2 className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                    <span className="font-tabular">
                      Reference: {receiptId.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="type-heading text-[var(--ink-primary)]">
                    Your technical brief is in the Systems queue
                  </h3>
                  <p className="max-w-[58ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
                    We saved your project parameters ({selectedTier}) and
                    notified our principal architect. Expect a structured
                    architectural response within 12 hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptId(null);
                      setProjectBrief("");
                    }}
                    className="press-tactile mt-2 inline-flex h-11 cursor-pointer items-center justify-center rounded-full bg-[var(--accent)] px-6 text-[14px] font-semibold text-[#07090D] hover:bg-[var(--accent-hover)]"
                  >
                    Submit another specification
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-4 py-3 text-[14px] text-[#FF8A7A]"
                    >
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="space-y-2">
                      <label
                        htmlFor="systems-form-name"
                        className="block text-[14px] font-medium text-[var(--ink-primary)]"
                      >
                        Your name *
                      </label>
                      <input
                        required
                        id="systems-form-name"
                        type="text"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Adaeze Nwosu"
                        className="h-11 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-surface)] px-4 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="systems-form-email"
                        className="block text-[14px] font-medium text-[var(--ink-primary)]"
                      >
                        Work email *
                      </label>
                      <input
                        required
                        id="systems-form-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="cto@enterprise.com"
                        className="h-11 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-surface)] px-4 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="systems-form-company"
                        className="block text-[14px] font-medium text-[var(--ink-primary)]"
                      >
                        Company or entity
                      </label>
                      <input
                        id="systems-form-company"
                        type="text"
                        autoComplete="organization"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Vanguard Logistics"
                        className="h-11 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-surface)] px-4 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="space-y-2">
                      <label
                        htmlFor="systems-form-tier"
                        className="block text-[14px] font-medium text-[var(--ink-primary)]"
                      >
                        Engagement tier *
                      </label>
                      <select
                        id="systems-form-tier"
                        value={selectedTier}
                        onChange={(e) =>
                          handleTierSelectInput(e.target.value as ServiceTierKey)
                        }
                        className="h-11 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-surface)] px-4 text-[14px] text-[var(--ink-primary)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                      >
                        <option value="GRAVITY_AUDIT">
                          Gravity Audit (5 days)
                        </option>
                        <option value="VELOCITY_MVP">
                          Velocity MVP (3 to 4 weeks)
                        </option>
                        <option value="LAB_RETAINER">
                          Lab Retainer (Monthly)
                        </option>
                        <option value="CUSTOM">Custom Enterprise Build</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="systems-form-budget"
                        className="block text-[14px] font-medium text-[var(--ink-primary)]"
                      >
                        Budget band
                      </label>
                      <input
                        id="systems-form-budget"
                        type="text"
                        value={budgetRange}
                        onChange={(e) => setBudgetRange(e.target.value)}
                        placeholder="$2,500 to $6,000"
                        className="font-tabular h-11 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-surface)] px-4 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="systems-form-timeline"
                        className="block text-[14px] font-medium text-[var(--ink-primary)]"
                      >
                        Target timeline
                      </label>
                      <input
                        id="systems-form-timeline"
                        type="text"
                        value={timeline}
                        onChange={(e) => setTimeline(e.target.value)}
                        placeholder="3 to 4 weeks"
                        className="h-11 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-surface)] px-4 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="systems-form-brief"
                      className="block text-[14px] font-medium text-[var(--ink-primary)]"
                    >
                      Architectural and operational brief *
                    </label>
                    <textarea
                      required
                      id="systems-form-brief"
                      rows={4}
                      value={projectBrief}
                      onChange={(e) => setProjectBrief(e.target.value)}
                      placeholder="Detail the target system, existing stack, data sources, and business outcome required..."
                      className="w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-surface)] p-4 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    id="systems-form-submit"
                    disabled={submitting}
                    className="press-tactile inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 text-[14px] font-semibold whitespace-nowrap text-[#07090D] hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>
                      {submitting
                        ? "Sending specification..."
                        : "Send B2B system specification"}
                    </span>
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
