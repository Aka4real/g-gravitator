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
      "Five-day operational and technical teardown plus an interactive clickable prototype identifying high-ROI AI and software automation targets.",
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
    duration: "3 to 4 weeks",
    usdRange: "$2,500 to $6,000",
    ngnRange: "₦4.0M to ₦9.5M",
    thesis:
      "Production full-stack web application or custom multi-agent AI system architected, engineered, and deployed in 3 to 4 weeks.",
    deliverables: [
      "Production Next.js and TypeScript platform or multi-agent kernel",
      "Custom MCP servers, WhatsApp, email, and ERP tool integrations with Postgres RLS",
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
      "Next.js 16 App Router, strict TypeScript contracts, Supabase PostgreSQL with Row Level Security, multi-tenant RBAC, and sub-50ms edge caching.",
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
      "Omnichannel WhatsApp Business API, email, and ERP reconciliation agents that automate intake, quoting, invoicing, and daily executive summaries.",
  },
  {
    title: "Flagship kinetic web platforms",
    icon: Sparkles,
    description:
      "High-conversion digital headquarters engineered with sculptural editorial typography, custom Canvas physics, and instant command search.",
  },
];

const PROTOCOL_STEPS = [
  {
    cadence: "24 hours",
    title: "Fixed architecture brief",
    desc: "Within 24 hours of discovery, we lock a deterministic Statement of Work defining exact schema deliverables, acceptance criteria, and fixed pricing.",
  },
  {
    cadence: "Day 3",
    title: "Clickable staging kernel",
    desc: "No month-long wireframe limbo. By Day 3 you interact with a live deployed staging kernel backed by real database migrations and typed API routes.",
  },
  {
    cadence: "Every Friday",
    title: "Verifiable production builds",
    desc: "Every Friday we ship a tested production increment to your staging URL alongside regression checks and latency benchmarks.",
  },
  {
    cadence: "Handover",
    title: "Clean foreground IP ownership",
    desc: "Upon final milestone completion, 100% of custom foreground IP transfers to your entity, with a perpetual license to reusable background lab modules.",
  },
];

export function PricingMatrix() {
  const prefersReducedMotion = useReducedMotion();
  const [currency, setCurrency] = useState<"USD" | "NGN">("USD");
  const [selectedTier, setSelectedTier] = useState<ServiceTierKey>("VELOCITY_MVP");
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
    setTimeline(tier.duration);
    const el = document.getElementById("scope-intake");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const handleTierSelectInput = (nextKey: ServiceTierKey) => {
    setSelectedTier(nextKey);
    const active = SERVICE_TIERS.find((t) => t.key === nextKey);
    if (active) {
      setBudgetRange(currency === "USD" ? active.usdRange : active.ngnRange);
      setTimeline(active.duration);
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
        setError(data.error || "Please check all required fields and try again.");
      } else {
        setReceiptId(data.inquiry?.id || "SYS-VERIFIED");
      }
    } catch {
      setError("Unable to submit your specification right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Section 1: 3-Tier Pricing Matrix */}
      <section id="engagement-tiers" className="mt-16 border-t border-white/[0.07] pt-14 lg:mt-20 lg:pt-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F4F3EF]">
              Engagement tiers
            </h2>
            <p className="mt-3 max-w-[56ch] text-base text-[#A1A1AA]">
              Transparent commercial bands with fixed milestones and full foreground IP transfer.
            </p>
          </div>

          {/* Segmented USD / NGN Switch */}
          <div
            role="group"
            aria-label="Billing currency"
            className="inline-flex w-fit shrink-0 items-center rounded-full border border-white/[0.09] bg-[#111114] p-1"
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
                  className={`press-tactile relative z-10 cursor-pointer rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors duration-150 ${
                    isActive
                      ? "text-[#08080A]"
                      : "text-[#A1A1AA] hover:text-[#F4F3EF]"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="systems-currency-pill"
                      transition={
                        prefersReducedMotion ? { duration: 0.12 } : SPRING_UI
                      }
                      className="absolute inset-0 -z-10 rounded-full bg-[#F4F3EF]"
                    />
                  )}
                  <span className="font-mono-telemetry">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Airy 3-Tier Cards */}
        <StaggerGroup className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {SERVICE_TIERS.map((tier) => {
            const isSelected = selectedTier === tier.key;
            const isFeatured = Boolean(tier.featured);

            return (
              <StaggerItem key={tier.key} className="flex">
                <article
                  className={`flex w-full flex-col justify-between rounded-2xl p-7 transition-[background-color,border-color,transform] duration-200 lg:p-8 ${
                    isFeatured
                      ? "border border-[#FF3B1F]/40 bg-[#15151A] shadow-[inset_0_1px_0_rgba(255,59,31,0.22)]"
                      : "surface-card"
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono-telemetry rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-medium text-[#D4D4D8]">
                        {tier.duration}
                      </span>
                      {isFeatured && (
                        <span className="rounded-full border border-[#FF3B1F]/30 bg-[#FF3B1F]/14 px-3 py-1 text-xs font-medium text-[#FF8A7A]">
                          Recommended
                        </span>
                      )}
                    </div>

                    <h3 className="font-display mt-5 text-2xl font-semibold tracking-[-0.02em] text-[#F4F3EF]">
                      {tier.name}
                    </h3>

                    <div className="mt-5 border-y border-white/[0.07] py-5">
                      <div className="text-xs font-medium text-[#8B8B94]">
                        {currency === "USD" ? "Global USD band" : "Regional NGN band"}
                      </div>
                      <div className="font-mono-telemetry mt-1.5 text-2xl font-semibold tracking-tight text-[#F4F3EF] sm:text-[1.65rem]">
                        {currency === "USD" ? tier.usdRange : tier.ngnRange}
                      </div>
                    </div>

                    <p className="mt-5 text-sm leading-relaxed text-[#A1A1AA]">
                      {tier.thesis}
                    </p>

                    <ul className="mt-6 space-y-3 text-sm leading-relaxed text-[#D4D4D8]">
                      {tier.deliverables.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <Check
                            className={`mt-1 h-4 w-4 shrink-0 ${
                              isFeatured ? "text-[#FF3B1F]" : "text-[#A1A1AA]"
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
                      className={`press-tactile inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold whitespace-nowrap ${
                        isFeatured || isSelected
                          ? "bg-[#FF3B1F] text-[#08080A] hover:bg-[#FF5238]"
                          : "border border-white/[0.12] bg-[#18181D] text-[#F4F3EF] hover:border-white/[0.22] hover:bg-white/[0.08]"
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
      </section>

      {/* Section 2: Engineering Capabilities (Asymmetric Editorial 2x2 Band) */}
      <Reveal
        as="section"
        className="mt-20 border-t border-white/[0.07] pt-16 lg:mt-28 lg:pt-20"
      >
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <h2 className="font-display text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F4F3EF]">
              What we engineer
            </h2>
            <p className="mt-4 max-w-[42ch] text-base leading-relaxed text-[#A1A1AA]">
              Production architectures built on strict contracts, verifiable AI pipelines,
              and resilient operational infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:col-span-8">
            {CAPABILITIES.map((capability) => {
              const Icon = capability.icon;
              return (
                <div key={capability.title} className="min-w-0">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.09] bg-[#111114] text-[#FF3B1F]">
                    <Icon className="h-5 w-5" strokeWidth={1.6} />
                  </div>
                  <h3 className="font-display mt-4 text-xl font-semibold tracking-[-0.02em] text-[#F4F3EF]">
                    {capability.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[#A1A1AA]">
                    {capability.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>

      {/* Section 3: Engagement Protocol (Open Horizontal Cadence Strip) */}
      <Reveal
        as="section"
        className="mt-20 border-t border-white/[0.07] pt-16 lg:mt-28 lg:pt-20"
      >
        <h2 className="font-display text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F4F3EF]">
          How engagements run
        </h2>
        <p className="mt-3 max-w-[60ch] text-base text-[#A1A1AA]">
          Four predictable checkpoints from fixed scope statement to full foreground IP handover.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PROTOCOL_STEPS.map((item) => (
            <div key={item.title} className="border-t border-white/[0.1] pt-5">
              <span className="font-mono-telemetry inline-flex rounded-full border border-white/[0.08] bg-[#111114] px-3 py-1 text-xs font-medium text-[#D4D4D8]">
                {item.cadence}
              </span>
              <h3 className="font-display mt-4 text-lg font-semibold tracking-[-0.02em] text-[#F4F3EF]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Section 4: Direct Project Scoping Form (#scope-intake) */}
      <Reveal
        as="section"
        className="mt-20 border-t border-white/[0.07] pt-16 lg:mt-28 lg:pt-20"
      >
        <div id="scope-intake" className="scroll-mt-24 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Editorial Column */}
          <div className="lg:col-span-4">
            <h2 className="font-display text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F4F3EF]">
              Scope your system
            </h2>
            <p className="mt-4 max-w-[40ch] text-base leading-relaxed text-[#A1A1AA]">
              Share your target architecture, operational bottleneck, or product timeline.
              Every brief goes straight to a principal engineer.
            </p>

            <div className="mt-8 space-y-4 text-sm text-[#D4D4D8]">
              <div className="flex items-start gap-3">
                <Clock
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#34D399]"
                  strokeWidth={1.8}
                />
                <span>Under 12-hour direct response from a principal architect.</span>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#FF3B1F]"
                  strokeWidth={1.8}
                />
                <span>Full foreground IP transfer on milestone completion.</span>
              </div>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="lg:col-span-8">
            <div className="surface-card rounded-2xl p-7 sm:p-10">
              {receiptId ? (
                <div className="rounded-2xl border border-[#10B981]/30 bg-[#10B981]/[0.07] p-6 sm:p-8">
                  <div className="flex items-center gap-2 text-[#34D399]">
                    <CheckCircle2 className="h-5 w-5 shrink-0" strokeWidth={1.7} />
                    <span className="font-mono-telemetry text-xs font-semibold">
                      Reference: {receiptId.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-display mt-3 text-2xl font-semibold text-[#F4F3EF]">
                    Your technical brief is in the Systems queue
                  </h3>
                  <p className="mt-2.5 max-w-[58ch] text-sm leading-relaxed text-[#A1A1AA]">
                    We saved your project parameters ({selectedTier}) and notified our
                    principal architect. Expect a structured architectural response within
                    12 hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptId(null);
                      setProjectBrief("");
                    }}
                    className="press-tactile mt-6 inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-[#FF3B1F] px-5 text-sm font-semibold text-[#08080A] hover:bg-[#FF5238]"
                  >
                    Submit another specification
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-[#FF3B1F]/40 bg-[#FF3B1F]/12 px-4 py-3 text-sm text-[#FF8A7A]"
                    >
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="space-y-2">
                      <label
                        htmlFor="systems-form-name"
                        className="block text-sm font-medium text-[#D4D4D8]"
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
                        className="w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-4 py-3 text-sm text-[#F4F3EF] placeholder:text-[#8B8B94] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/30 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="systems-form-email"
                        className="block text-sm font-medium text-[#D4D4D8]"
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
                        className="w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-4 py-3 text-sm text-[#F4F3EF] placeholder:text-[#8B8B94] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/30 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="systems-form-company"
                        className="block text-sm font-medium text-[#D4D4D8]"
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
                        className="w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-4 py-3 text-sm text-[#F4F3EF] placeholder:text-[#8B8B94] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/30 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="space-y-2">
                      <label
                        htmlFor="systems-form-tier"
                        className="block text-sm font-medium text-[#D4D4D8]"
                      >
                        Engagement tier *
                      </label>
                      <select
                        id="systems-form-tier"
                        value={selectedTier}
                        onChange={(e) =>
                          handleTierSelectInput(e.target.value as ServiceTierKey)
                        }
                        className="w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-4 py-3 text-sm text-[#F4F3EF] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/30 focus:outline-none"
                      >
                        <option value="GRAVITY_AUDIT">Gravity Audit (5 days)</option>
                        <option value="VELOCITY_MVP">Velocity MVP (3 to 4 weeks)</option>
                        <option value="LAB_RETAINER">Lab Retainer (Monthly)</option>
                        <option value="CUSTOM">Custom Enterprise Build</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="systems-form-budget"
                        className="block text-sm font-medium text-[#D4D4D8]"
                      >
                        Budget band
                      </label>
                      <input
                        id="systems-form-budget"
                        type="text"
                        value={budgetRange}
                        onChange={(e) => setBudgetRange(e.target.value)}
                        placeholder="$2,500 to $6,000"
                        className="w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-4 py-3 text-sm text-[#F4F3EF] placeholder:text-[#8B8B94] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/30 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="systems-form-timeline"
                        className="block text-sm font-medium text-[#D4D4D8]"
                      >
                        Target timeline
                      </label>
                      <input
                        id="systems-form-timeline"
                        type="text"
                        value={timeline}
                        onChange={(e) => setTimeline(e.target.value)}
                        placeholder="3 to 4 weeks"
                        className="w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-4 py-3 text-sm text-[#F4F3EF] placeholder:text-[#8B8B94] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/30 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="systems-form-brief"
                      className="block text-sm font-medium text-[#D4D4D8]"
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
                      className="w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] p-4 text-sm text-[#F4F3EF] placeholder:text-[#8B8B94] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/30 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    id="systems-form-submit"
                    disabled={submitting}
                    className="press-tactile inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#FF3B1F] px-6 text-sm font-semibold whitespace-nowrap text-[#08080A] hover:bg-[#FF5238] disabled:cursor-not-allowed disabled:opacity-60"
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
