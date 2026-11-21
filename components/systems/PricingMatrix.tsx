"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2, ShieldCheck, Cpu, Layers, Workflow, Sparkles } from "lucide-react";
import { CrosshairCell } from "@/components/kinetic/CrosshairCell";
import type { ServiceTierKey } from "@/lib/supabase/types";

interface TierSpec {
  key: ServiceTierKey;
  number: string;
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
    number: "TIER 01",
    name: "Gravity Audit",
    duration: "5-DAY SPRINT",
    usdRange: "$500 – $1,000",
    ngnRange: "₦800K – ₦1.6M",
    thesis:
      "5-day operational & technical teardown + interactive clickable prototype identifying high-ROI AI and software automation targets.",
    deliverables: [
      "Full operational bottleneck & latency audit across current tools",
      "Interactive clickable prototype demonstrating target AI workflow",
      "Deterministic ROI model & token/compute cost projection",
      "Complete architectural SOW crediting 100% toward a Velocity MVP",
    ],
  },
  {
    key: "VELOCITY_MVP",
    number: "TIER 02",
    name: "Velocity MVP",
    duration: "3–4 WEEKS DELIVERY",
    usdRange: "$2,500 – $6,000",
    ngnRange: "₦4.0M – ₦9.5M",
    thesis:
      "Production full-stack web application or custom multi-agent AI system architected, engineered, and deployed in 3–4 weeks.",
    deliverables: [
      "Production Next.js / TypeScript application or multi-agent kernel",
      "Custom MCP servers, WhatsApp/Email/ERP tool integrations & Postgres RLS",
      "Weekly Friday live ship demos on staging infrastructure",
      "100% Foreground IP transfer, repository handover & deployment runbook",
    ],
    featured: true,
  },
  {
    key: "LAB_RETAINER",
    number: "TIER 03",
    name: "Lab Retainer",
    duration: "MONTHLY FRACTIONAL R&D",
    usdRange: "$1,500 – $3,500 / mo",
    ngnRange: "₦2.4M – ₦5.5M / mo",
    thesis:
      "Dedicated fractional AI engineering & R&D partner for continuous shipping, model evaluation, and infrastructure scaling.",
    deliverables: [
      "Dedicated senior G-Gravitator principal architect in your Slack/Linear",
      "Continuous feature velocity, model benchmarking (OrbitBench), & evals",
      "Priority access to OXAKALABS experimental tooling & background modules",
      "Pause or cancel at any monthly cycle boundary with zero lock-in",
    ],
  },
];

export function PricingMatrix() {
  const [currency, setCurrency] = useState<"USD" | "NGN">("USD");
  const [selectedTier, setSelectedTier] = useState<ServiceTierKey>("VELOCITY_MVP");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [budgetRange, setBudgetRange] = useState("$2,500 – $6,000");
  const [timeline, setTimeline] = useState("3–4 Weeks (Immediate Start)");
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
        setError(data.error || "Please check all required fields.");
      } else {
        setReceiptId(data.inquiry?.id || "SYS-VERIFIED");
      }
    } catch {
      setError("Failed to submit inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Section Header + Currency Toggle */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#27272A] bg-[#111114] px-6 py-6 sm:flex-row sm:items-center lg:px-10">
        <div>
          <span className="font-mono-telemetry text-[11px] text-[#FF3B1F]">
            PRODUCTIZED B2B FOUNDRY // TRANSPARENT TERMS
          </span>
          <h2 className="font-display mt-1 text-2xl font-bold uppercase sm:text-3xl">
            3-TIER PRECISION ENGAGEMENT MATRIX
          </h2>
        </div>

        {/* USD ($) / NGN (₦) Currency Switcher */}
        <div className="inline-flex items-center border border-[#27272A] bg-[#09090B] p-1">
          <button
            type="button"
            id="currency-toggle-usd"
            onClick={() => handleCurrencyChange("USD")}
            className={`font-mono-telemetry px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              currency === "USD"
                ? "bg-[#FF3B1F] text-[#09090B]"
                : "text-[#A1A1AA] hover:text-[#F3F2EE]"
            }`}
          >
            USD ($) GLOBAL
          </button>
          <button
            type="button"
            id="currency-toggle-ngn"
            onClick={() => handleCurrencyChange("NGN")}
            className={`font-mono-telemetry px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              currency === "NGN"
                ? "bg-[#FF3B1F] text-[#09090B]"
                : "text-[#A1A1AA] hover:text-[#F3F2EE]"
            }`}
          >
            NGN (₦) REGIONAL
          </button>
        </div>
      </div>

      {/* 3-Column Comparison Matrix */}
      <div className="grid grid-cols-1 divide-y divide-[#27272A] border-b border-[#27272A] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {SERVICE_TIERS.map((tier) => {
          const isSelected = selectedTier === tier.key;
          return (
            <CrosshairCell
              key={tier.key}
              corners={["tl", "tr", "bl", "br"]}
              className={`flex flex-col justify-between p-7 lg:p-9 ${
                tier.featured ? "bg-[#111114]" : "bg-[#09090B]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-telemetry text-xs font-semibold text-[#FF3B1F]">
                    {tier.number}
                  </span>
                  <span
                    className={`font-mono-telemetry border px-2 py-0.5 text-[10px] ${
                      tier.featured
                        ? "border-[#FF3B1F] bg-[#FF3B1F]/15 text-[#FF3B1F]"
                        : "border-[#27272A] text-[#A1A1AA]"
                    }`}
                  >
                    {tier.duration}
                  </span>
                </div>

                <h3 className="font-display mt-4 text-3xl font-extrabold text-[#F3F2EE]">
                  {tier.name}
                </h3>

                <div className="mt-4 border-y border-[#27272A] py-4">
                  <div className="font-mono-telemetry text-[10px] text-[#71717A]">
                    INVESTMENT BAND ({currency})
                  </div>
                  <div className="font-display mt-1 text-3xl font-extrabold text-[#F3F2EE]">
                    {currency === "USD" ? tier.usdRange : tier.ngnRange}
                  </div>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-[#A1A1AA]">
                  {tier.thesis}
                </p>

                <ul className="mt-6 space-y-3 text-xs text-[#F3F2EE]">
                  {tier.deliverables.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-[#FF3B1F]" />
                      <span className="text-[#A1A1AA]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4">
                <button
                  type="button"
                  id={`select-tier-${tier.key.toLowerCase()}`}
                  onClick={() => handleSelectTier(tier)}
                  className={`font-mono-telemetry flex w-full items-center justify-center gap-2 px-5 py-3.5 text-xs font-semibold transition-colors ${
                    tier.featured || isSelected
                      ? "bg-[#FF3B1F] text-[#09090B] hover:bg-[#F3F2EE]"
                      : "border border-[#F3F2EE] text-[#F3F2EE] hover:border-[#FF3B1F] hover:bg-[#18181B]"
                  }`}
                >
                  <span>COMMISSION {tier.name.toUpperCase()}</span>
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                </button>
              </div>
            </CrosshairCell>
          );
        })}
      </div>

      {/* Engineering Capabilities Grid */}
      <div className="border-b border-[#27272A]">
        <div className="border-b border-[#27272A] px-6 py-6 lg:px-10">
          <span className="font-mono-telemetry text-[11px] text-[#FF3B1F]">
            TECHNICAL ARSENAL // 02
          </span>
          <h2 className="font-display mt-1 text-2xl font-bold uppercase sm:text-3xl">
            ENGINEERING CAPABILITIES
          </h2>
        </div>

        <div className="grid grid-cols-1 divide-y divide-[#27272A] md:grid-cols-2 md:divide-y-0 lg:grid-cols-4 lg:divide-x">
          <div className="p-6 lg:p-8">
            <Layers className="h-5 w-5 text-[#FF3B1F]" strokeWidth={1.5} />
            <h3 className="font-display mt-4 text-lg font-bold text-[#F3F2EE]">
              Full-Stack Web &amp; SaaS
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#A1A1AA]">
              Next.js 15 App Router, TypeScript strict contracts, Supabase PostgreSQL with
              Row Level Security, multi-tenant RBAC, and sub-50ms edge caching.
            </p>
          </div>
          <div className="p-6 lg:p-8">
            <Cpu className="h-5 w-5 text-[#FF3B1F]" strokeWidth={1.5} />
            <h3 className="font-display mt-4 text-lg font-bold text-[#F3F2EE]">
              Multi-Agent AI &amp; MCP Servers
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#A1A1AA]">
              Deterministic tool-calling pipelines, custom Model Context Protocol (MCP)
              servers, Gemini/Claude structured outputs, and automated eval harnesses.
            </p>
          </div>
          <div className="p-6 lg:p-8">
            <Workflow className="h-5 w-5 text-[#FF3B1F]" strokeWidth={1.5} />
            <h3 className="font-display mt-4 text-lg font-bold text-[#F3F2EE]">
              Internal Operations Agents
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#A1A1AA]">
              Omnichannel WhatsApp Business API, email, and ERP reconciliation agents that
              automate intake, quoting, invoicing, and daily executive telemetry.
            </p>
          </div>
          <div className="p-6 lg:p-8">
            <Sparkles className="h-5 w-5 text-[#FF3B1F]" strokeWidth={1.5} />
            <h3 className="font-display mt-4 text-lg font-bold text-[#F3F2EE]">
              Kinetic Luxury Brand Platforms
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#A1A1AA]">
              High-conversion flagship web headquarters engineered with Porsche Design
              structural precision, custom WebGL/Canvas physics, and instant command search.
            </p>
          </div>
        </div>
      </div>

      {/* 4-Step Engagement Protocol */}
      <div className="border-b border-[#27272A]">
        <div className="border-b border-[#27272A] px-6 py-6 lg:px-10">
          <span className="font-mono-telemetry text-[11px] text-[#FF3B1F]">
            EXECUTION CADENCE // 03
          </span>
          <h2 className="font-display mt-1 text-2xl font-bold uppercase sm:text-3xl">
            4-STEP ENGAGEMENT PROTOCOL &amp; IP GUARANTEE
          </h2>
        </div>

        <div className="grid grid-cols-1 divide-y divide-[#27272A] md:grid-cols-4 md:divide-x md:divide-y-0">
          {[
            {
              step: "01. SCOPE & SOW",
              title: "Fixed Architecture Brief",
              desc: "Within 24 hours of discovery, we lock a deterministic Statement of Work defining exact schema deliverables, milestone acceptance criteria, and fixed pricing.",
            },
            {
              step: "02. RAPID ARCHITECTURE",
              title: "Day-3 Clickable Kernel",
              desc: "No month-long wireframe limbo. By Day 3 you interact with a live deployed staging kernel backed by real database migrations and typed API routes.",
            },
            {
              step: "03. WEEKLY SHIP DEMOS",
              title: "Friday Production Builds",
              desc: "Every Friday we ship a verifiable production increment to your staging URL alongside automated regression checks and latency telemetry.",
            },
            {
              step: "04. HANDOVER & IP TRANSFER",
              title: "Clean Foreground IP Ownership",
              desc: "Upon final payment, 100% of custom Foreground IP transfers to your entity, while G-Gravitator grants a perpetual license to any reusable Background Lab modules.",
            },
          ].map((item) => (
            <div key={item.step} className="bg-[#09090B] p-6 lg:p-8">
              <span className="font-mono-telemetry text-xs font-bold text-[#FF3B1F]">
                {item.step}
              </span>
              <h3 className="font-display mt-3 text-lg font-bold text-[#F3F2EE]">
                {item.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#A1A1AA]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Project Scoping Form (#scope-intake) */}
      <section id="scope-intake" className="bg-[#09090B] px-6 py-14 lg:px-14 lg:py-20">
        <div className="mx-auto max-w-4xl border border-[#27272A] bg-[#111114] p-7 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#27272A] pb-6">
            <div>
              <span className="font-mono-telemetry text-[11px] text-[#FF3B1F]">
                DIRECT FOUNDRY INTAKE // SUPABASE PERSISTED
              </span>
              <h2 className="font-display mt-1 text-2xl font-extrabold uppercase sm:text-3xl">
                INITIATE PROJECT SCOPING
              </h2>
            </div>
            <div className="font-mono-telemetry flex items-center gap-2 border border-[#27272A] bg-[#09090B] px-3 py-1.5 text-[10px] text-[#10B981]">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>SLA: &lt; 12H PRINCIPAL RESPONSE</span>
            </div>
          </div>

          {receiptId ? (
            <div className="mt-8 border border-[#10B981] bg-[#09090B] p-6">
              <div className="flex items-center gap-2 text-[#10B981]">
                <CheckCircle2 className="h-5 w-5" strokeWidth={1.5} />
                <span className="font-mono-telemetry text-xs font-bold">
                  INQUIRY LOGGED // ID: {receiptId.toUpperCase()}
                </span>
              </div>
              <h3 className="font-display mt-3 text-xl font-bold text-[#F3F2EE]">
                Your Technical Brief Is in the G-Gravitator Systems Queue.
              </h3>
              <p className="mt-2 text-xs text-[#A1A1AA]">
                We have persisted your project parameters (`{selectedTier}`) and notified
                our founder console. You can also inspect this record live in `/admin`.
              </p>
              <button
                type="button"
                onClick={() => {
                  setReceiptId(null);
                  setProjectBrief("");
                }}
                className="font-mono-telemetry mt-5 bg-[#FF3B1F] px-4 py-2.5 text-xs font-semibold text-[#09090B]"
              >
                SUBMIT ANOTHER SPECIFICATION
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {error && (
                <div className="border border-[#FF3B1F] bg-[#FF3B1F]/10 p-3.5 text-xs text-[#FF3B1F]">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div>
                  <label className="font-mono-telemetry block text-[11px] text-[#A1A1AA]">
                    YOUR NAME *
                  </label>
                  <input
                    required
                    id="systems-form-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Adaeze Nwosu"
                    className="mt-1.5 w-full border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F3F2EE] focus:border-[#FF3B1F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-mono-telemetry block text-[11px] text-[#A1A1AA]">
                    WORK EMAIL *
                  </label>
                  <input
                    required
                    id="systems-form-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cto@enterprise.com"
                    className="mt-1.5 w-full border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F3F2EE] focus:border-[#FF3B1F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-mono-telemetry block text-[11px] text-[#A1A1AA]">
                    COMPANY / ENTITY
                  </label>
                  <input
                    id="systems-form-company"
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Vanguard Logistics"
                    className="mt-1.5 w-full border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F3F2EE] focus:border-[#FF3B1F] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div>
                  <label className="font-mono-telemetry block text-[11px] text-[#A1A1AA]">
                    SELECTED TIER *
                  </label>
                  <select
                    id="systems-form-tier"
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value as ServiceTierKey)}
                    className="mt-1.5 w-full border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F3F2EE] focus:border-[#FF3B1F] focus:outline-none"
                  >
                    <option value="GRAVITY_AUDIT">Tier 01 — Gravity Audit</option>
                    <option value="VELOCITY_MVP">Tier 02 — Velocity MVP</option>
                    <option value="LAB_RETAINER">Tier 03 — Lab Retainer</option>
                    <option value="CUSTOM">Custom Enterprise Build</option>
                  </select>
                </div>
                <div>
                  <label className="font-mono-telemetry block text-[11px] text-[#A1A1AA]">
                    BUDGET BAND
                  </label>
                  <input
                    id="systems-form-budget"
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
                    id="systems-form-timeline"
                    type="text"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="mt-1.5 w-full border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F3F2EE] focus:border-[#FF3B1F] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono-telemetry block text-[11px] text-[#A1A1AA]">
                  ARCHITECTURAL &amp; OPERATIONAL BRIEF *
                </label>
                <textarea
                  required
                  id="systems-form-brief"
                  rows={4}
                  value={projectBrief}
                  onChange={(e) => setProjectBrief(e.target.value)}
                  placeholder="Detail the target system, existing stack, data sources, and business outcome required..."
                  className="mt-1.5 w-full border border-[#27272A] bg-[#09090B] p-3.5 text-sm text-[#F3F2EE] focus:border-[#FF3B1F] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                id="systems-form-submit"
                disabled={submitting}
                className="font-mono-telemetry flex w-full items-center justify-center gap-2 bg-[#FF3B1F] px-6 py-4 text-xs font-semibold text-[#09090B] transition-colors hover:bg-[#F3F2EE]"
              >
                <span>
                  {submitting
                    ? "TRANSMITTING SPECIFICATION..."
                    : "TRANSMIT B2B SYSTEM SPECIFICATION"}
                </span>
                <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
