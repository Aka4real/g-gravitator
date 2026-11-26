"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";
import { Reveal, StaggerGroup, StaggerItem } from "@/lib/motion";
import type { OrbitTrack } from "@/lib/supabase/types";

const CURRICULUM_PHASES = [
  {
    weeks: "Weeks 1 to 2",
    title: "First-principles architecture and AI systems",
    items: [
      "Strict TypeScript contracts, relational Postgres modeling, and Row Level Security",
      "Structured LLM outputs, tool calling, and deterministic verification gates",
      "48-hour OXAKALABS internal warm-up hackathon sprint",
    ],
  },
  {
    weeks: "Weeks 3 to 4",
    title: "Kinetic product craft and velocity shipping",
    items: [
      "Kinetic Obsidian interface design and critically damped spring physics",
      "Multi-provider data ingestion, background workers, and edge caching",
      "Mid-cycle architecture teardown with G-Gravitator Systems principals",
    ],
  },
  {
    weeks: "Weeks 5 to 6",
    title: "Production hardening and live Demo Day",
    items: [
      "Standalone Docker and edge production deployment with live telemetry",
      "25-point Graduation Scorecard evaluation for potential Labs promotion",
      "Public Demo Day showcase with enterprise partners and technical fellows",
    ],
  },
];

const TRACKS: {
  key: OrbitTrack;
  label: string;
  title: string;
  icon: typeof Cpu;
  summary: string;
  outcomes: string[];
}[] = [
  {
    key: "AI_ENGINEERING",
    label: "Applied AI",
    title: "Applied AI Engineering",
    icon: Cpu,
    summary:
      "Multi-agent orchestration, deterministic tool calling, Model Context Protocol servers, structured schema extraction, and evaluation harnesses.",
    outcomes: [
      "Architect and deploy a production multi-agent workflow kernel",
      "Build a custom MCP server with an automated OrbitBench eval suite",
      "Compete in a live 48-hour global AI hackathon alongside OXAKALABS",
    ],
  },
  {
    key: "FULLSTACK_SYSTEMS",
    label: "Product Systems",
    title: "Full-Stack Product Systems",
    icon: Layers,
    summary:
      "First-principles system design with Next.js App Router, strict TypeScript contracts, PostgreSQL and Supabase RLS, background workers, and standalone containerization.",
    outcomes: [
      "Engineer a full-stack SaaS platform from database schema to edge deploy",
      "Implement resilient ingestion workers, rate limiting, and RBAC security",
      "Ship to live production users before Week 6 Demo Day",
    ],
  },
  {
    key: "KINETIC_DESIGN",
    label: "Design Engineering",
    title: "Kinetic Design Engineering",
    icon: Sparkles,
    summary:
      "Sculptural editorial typography, translucent floating surfaces, Framer Motion spring physics, HTML5 Canvas interactions, and tactile micro-interaction craft.",
    outcomes: [
      "Master G-Gravitator's Kinetic Obsidian design system and fluid interaction craft",
      "Build 60fps pointer-reactive canvases and interruptible spring primitives",
      "Transform raw engineering utilities into unmistakable commercial products",
    ],
  },
];

export default function OrbitPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [track, setTrack] = useState<OrbitTrack>("AI_ENGINEERING");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [proofOfWork, setProofOfWork] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/orbit/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          track,
          portfolio_url: portfolioUrl,
          proof_of_work: proofOfWork,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Please verify your application details and try again.");
      } else {
        setSubmittedId(data.application?.id || "ORB-LOCKED");
      }
    } catch {
      setError("Network error submitting your Orbit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-8 pb-20 sm:px-6 sm:pt-10 md:px-8 lg:px-12 lg:pt-12 lg:pb-28">
      {/* Editorial Cohort Hero + Studio Photography */}
      <header className="grid grid-cols-1 items-center gap-8 sm:gap-10 md:grid-cols-12 md:gap-8 lg:gap-12">
        <div className="md:col-span-6">
          <h1 className="font-display text-[clamp(2.1rem,3.8vw,3.65rem)] font-bold leading-[1.05] tracking-[-0.03em] text-[#F4F3EF]">
            Gravity Cycles. Train with builders who ship.
          </h1>

          <p className="mt-5 max-w-[56ch] text-[15px] leading-relaxed text-[#A1A1AA] sm:mt-6 sm:text-lg">
            Bootcamps teach passive tutorials. G-Gravitator Orbit is a selective, 6-week
            technical residency where emerging engineers and design technologists build
            real production software alongside our{" "}
            <span className="font-medium text-[#F4F3EF]">Systems</span> principals and{" "}
            <span className="font-medium text-[#F4F3EF]">OXAKALABS</span> strike squads.
          </p>

          <div className="mt-7 flex flex-col gap-3 min-[430px]:flex-row min-[430px]:flex-wrap min-[430px]:items-center sm:mt-8">
            <a
              href="#apply"
              className="press-tactile inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#FF3B1F] px-6 text-sm font-semibold whitespace-nowrap text-[#08080A] hover:bg-[#FF5238] min-[430px]:w-auto"
            >
              <span>Apply for Cycle 01</span>
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </a>
            <span className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-4 text-xs font-medium text-[#34D399] min-[430px]:w-auto">
              Cycle 01 applications open
            </span>
          </div>
        </div>

        <div className="md:col-span-6">
          <div className="aspect-video overflow-hidden rounded-2xl bg-[#111114] ring-1 ring-inset ring-white/[0.08]">
            <Image
              src="/images/orbit-atelier.jpg"
              alt="Monolithic dark board-formed concrete and smoked glass studio interior at twilight with warm overhead light over a basalt worktable"
              width={1376}
              height={768}
              preload
              sizes="(max-width: 767px) 100vw, 50vw"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </header>

      {/* Section 1: 6-Week Curriculum Arc (Open Horizontal Cadence) */}
      <Reveal
        as="section"
        className="mt-20 border-t border-white/[0.07] pt-16 lg:mt-28 lg:pt-20"
      >
        <h2 className="font-display text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F4F3EF]">
          Six weeks from architecture to Demo Day
        </h2>
        <p className="mt-3 max-w-[60ch] text-base text-[#A1A1AA]">
          Three compressed two-week sprints built around shipping live production work
          instead of classroom exercises.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {CURRICULUM_PHASES.map((phase) => (
            <div key={phase.weeks} className="border-t border-white/[0.1] pt-6">
              <span className="font-mono-telemetry inline-flex rounded-full border border-white/[0.1] bg-[#111114] px-3 py-1 text-xs font-semibold text-[#F4F3EF]">
                {phase.weeks}
              </span>
              <h3 className="font-display mt-4 text-xl font-semibold tracking-[-0.02em] text-[#F4F3EF]">
                {phase.title}
              </h3>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[#A1A1AA]">
                {phase.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check
                      className="mt-1 h-4 w-4 shrink-0 text-[#FF3B1F]"
                      strokeWidth={2}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Section 2: Interactive Residency Tracks */}
      <section className="mt-20 border-t border-white/[0.07] pt-16 lg:mt-28 lg:pt-20">
        <Reveal>
          <h2 className="font-display text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F4F3EF]">
            Choose your primary track
          </h2>
          <p className="mt-3 max-w-[60ch] text-base text-[#A1A1AA]">
            Select the engineering discipline you want to lead in Cycle 01. Selecting a
            track pre-fills your cohort application below.
          </p>
        </Reveal>

        <StaggerGroup className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TRACKS.map((t) => {
            const active = track === t.key;
            const Icon = t.icon;

            return (
              <StaggerItem key={t.key} className="flex">
                <article
                  className={`flex w-full flex-col justify-between rounded-2xl p-7 transition-[background-color,border-color,transform] duration-200 lg:p-8 ${
                    active
                      ? "border border-[#FF3B1F]/40 bg-[#15151A] shadow-[inset_0_1px_0_rgba(255,59,31,0.2)]"
                      : "surface-card"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.09] bg-[#0B0B0E] text-[#FF3B1F]">
                        <Icon className="h-5 w-5" strokeWidth={1.6} />
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${
                          active
                            ? "border-[#FF3B1F]/30 bg-[#FF3B1F]/14 text-[#FF8A7A]"
                            : "border-white/[0.08] bg-white/[0.04] text-[#A1A1AA]"
                        }`}
                      >
                        {active ? "Selected" : t.label}
                      </span>
                    </div>

                    <h3 className="font-display mt-5 text-2xl font-semibold tracking-[-0.02em] text-[#F4F3EF]">
                      {t.title}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-[#A1A1AA]">
                      {t.summary}
                    </p>

                    <ul className="mt-6 space-y-3 text-sm leading-relaxed text-[#D4D4D8]">
                      {t.outcomes.map((outcome) => (
                        <li key={outcome} className="flex items-start gap-2.5">
                          <Check
                            className="mt-1 h-4 w-4 shrink-0 text-[#34D399]"
                            strokeWidth={2}
                          />
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setTrack(t.key);
                      document
                        .getElementById("apply")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`press-tactile mt-8 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold whitespace-nowrap ${
                      active
                        ? "bg-[#FF3B1F] text-[#08080A] hover:bg-[#FF5238]"
                        : "border border-white/[0.12] bg-[#18181D] text-[#F4F3EF] hover:border-white/[0.22] hover:bg-white/[0.08]"
                    }`}
                  >
                    <span>Select {t.label}</span>
                    <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2} />
                  </button>
                </article>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </section>

      {/* Section 3: Proof-of-Work Cohort Application (#apply) */}
      <Reveal
        as="section"
        className="mt-20 border-t border-white/[0.07] pt-16 lg:mt-28 lg:pt-20"
      >
        <div
          id="apply"
          className="scroll-mt-24 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12"
        >
          {/* Left Editorial Prompt */}
          <div className="lg:col-span-4">
            <h2 className="font-display text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F4F3EF]">
              Apply for Cycle 01
            </h2>
            <p className="mt-4 max-w-[40ch] text-base leading-relaxed text-[#A1A1AA]">
              We do not filter by credentials or GPA. Show us the hardest system you have
              built and the technical trade-offs you solved.
            </p>

            <ul className="mt-8 space-y-3 text-sm text-[#D4D4D8]">
              <li className="flex items-start gap-2.5">
                <Check
                  className="mt-1 h-4 w-4 shrink-0 text-[#34D399]"
                  strokeWidth={2}
                />
                <span>Every proof-of-work repository is reviewed by technical leads.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check
                  className="mt-1 h-4 w-4 shrink-0 text-[#34D399]"
                  strokeWidth={2}
                />
                <span>Direct pairing with Systems architects and OXAKALABS squads.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check
                  className="mt-1 h-4 w-4 shrink-0 text-[#34D399]"
                  strokeWidth={2}
                />
                <span>Cohort invitations go out ahead of Cycle 01 kickoff.</span>
              </li>
            </ul>
          </div>

          {/* Right Spacious Application Card */}
          <div className="lg:col-span-8">
            <div className="surface-card rounded-2xl p-7 sm:p-10">
              {submittedId ? (
                <div className="rounded-2xl border border-[#10B981]/30 bg-[#10B981]/[0.07] p-6 sm:p-8">
                  <div className="flex items-center gap-2 text-[#34D399]">
                    <CheckCircle2 className="h-5 w-5 shrink-0" strokeWidth={1.7} />
                    <span className="font-mono-telemetry text-xs font-semibold">
                      Reference: {submittedId.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-display mt-3 text-2xl font-semibold text-[#F4F3EF]">
                    You are on the Gravity Cycle 01 review queue
                  </h3>
                  <p className="mt-2.5 max-w-[58ch] text-sm leading-relaxed text-[#A1A1AA]">
                    Our technical leads inspect every submitted proof-of-work repository.
                    Cohort invitations dispatch ahead of Cycle 01 kickoff.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedId(null);
                      setProofOfWork("");
                    }}
                    className="press-tactile mt-6 inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-[#FF3B1F] px-5 text-sm font-semibold text-[#08080A] hover:bg-[#FF5238]"
                  >
                    Submit another application
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-6">
                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-[#FF3B1F]/40 bg-[#FF3B1F]/12 px-4 py-3 text-sm text-[#FF8A7A]"
                    >
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="orbit-form-name"
                        className="block text-sm font-medium text-[#D4D4D8]"
                      >
                        Full name *
                      </label>
                      <input
                        required
                        id="orbit-form-name"
                        type="text"
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Chidera Okafor"
                        className="w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-4 py-3 text-sm text-[#F4F3EF] placeholder:text-[#8B8B94] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/30 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="orbit-form-email"
                        className="block text-sm font-medium text-[#D4D4D8]"
                      >
                        Email address *
                      </label>
                      <input
                        required
                        id="orbit-form-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="builder@domain.com"
                        className="w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-4 py-3 text-sm text-[#F4F3EF] placeholder:text-[#8B8B94] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/30 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="orbit-form-track"
                        className="block text-sm font-medium text-[#D4D4D8]"
                      >
                        Primary track *
                      </label>
                      <select
                        id="orbit-form-track"
                        value={track}
                        onChange={(e) => setTrack(e.target.value as OrbitTrack)}
                        className="w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-4 py-3 text-sm text-[#F4F3EF] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/30 focus:outline-none"
                      >
                        <option value="AI_ENGINEERING">Applied AI Engineering</option>
                        <option value="FULLSTACK_SYSTEMS">Full-Stack Product Systems</option>
                        <option value="KINETIC_DESIGN">Kinetic Design Engineering</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="orbit-form-portfolio"
                        className="block text-sm font-medium text-[#D4D4D8]"
                      >
                        GitHub or portfolio URL
                      </label>
                      <input
                        id="orbit-form-portfolio"
                        type="url"
                        autoComplete="url"
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        placeholder="https://github.com/username"
                        className="w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] px-4 py-3 text-sm text-[#F4F3EF] placeholder:text-[#8B8B94] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/30 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="orbit-form-proof"
                      className="block text-sm font-medium text-[#D4D4D8]"
                    >
                      Link and describe the hardest thing you have built *
                    </label>
                    <textarea
                      required
                      id="orbit-form-proof"
                      rows={4}
                      value={proofOfWork}
                      onChange={(e) => setProofOfWork(e.target.value)}
                      placeholder="Share a repository link, deployment URL, and the hardest technical trade-off you solved..."
                      className="w-full rounded-xl border border-white/[0.12] bg-[#0B0B0E] p-4 text-sm text-[#F4F3EF] placeholder:text-[#8B8B94] transition-colors focus:border-[#FF3B1F] focus:ring-2 focus:ring-[#FF3B1F]/30 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    id="orbit-form-submit"
                    disabled={submitting}
                    className="press-tactile inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#FF3B1F] px-6 text-sm font-semibold whitespace-nowrap text-[#08080A] hover:bg-[#FF5238] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>
                      {submitting
                        ? "Submitting proof of work..."
                        : "Submit Orbit Cycle 01 application"}
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
