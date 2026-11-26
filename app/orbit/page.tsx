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
    title: "Product craft and velocity shipping",
    items: [
      "Editorial interface design, disciplined typography, and tactile spring physics",
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
      "Editorial typography, tactile motion systems, HTML5 Canvas interactions, and frontend architecture that turns utilities into memorable products.",
    outcomes: [
      "Master disciplined typographic hierarchy and responsive layout engineering",
      "Build 60fps pointer-reactive canvases and interruptible motion primitives",
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
        setError(
          data.error || "Please verify your application details and try again."
        );
      } else {
        setSubmittedId(data.application?.id || "ORB-LOCKED");
      }
    } catch {
      setError(
        "Network error submitting your Orbit application. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[var(--bg-canvas)] text-[var(--ink-primary)]">
      {/* Centered Editorial Opening + Panoramic Studio Atelier Visual */}
      <section className="mx-auto max-w-[1360px] px-5 pt-24 pb-16 sm:px-8 lg:px-12 lg:pt-28 lg:pb-20">
        <header className="mx-auto max-w-4xl text-center">
          <h1 className="font-display text-[clamp(2.5rem,5.2vw,4.5rem)] font-bold leading-[1.0] tracking-[-0.035em] text-[var(--ink-primary)]">
            Gravity Cycles. Train with builders who ship.
          </h1>

          <p className="mx-auto mt-6 max-w-[58ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
            A selective 6-week residency where emerging engineers build real
            production software alongside{" "}
            <strong className="font-semibold text-[var(--ink-primary)]">
              Systems
            </strong>{" "}
            principals and{" "}
            <strong className="font-semibold text-[var(--ink-primary)]">
              OXAKALABS
            </strong>{" "}
            strike squads. Cycle 01 applications are open.
          </p>

          <div className="mt-8">
            <a
              href="#apply"
              className="press-tactile inline-flex h-12 items-center gap-2 rounded-full bg-[var(--accent)] px-7 text-[14px] font-semibold whitespace-nowrap text-[#07090D] hover:bg-[var(--accent-hover)]"
            >
              <span>Apply for Cycle 01</span>
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </a>
          </div>
        </header>

        <div className="mt-14 aspect-[21/9] w-full overflow-hidden rounded-2xl bg-[var(--bg-surface)] ring-1 ring-inset ring-white/[0.08]">
          <Image
            src="/images/orbit-atelier.jpg"
            alt="Monolithic dark concrete and smoked glass studio interior at twilight with warm overhead light over a basalt worktable"
            width={1376}
            height={768}
            preload
            sizes="100vw"
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      {/* Cool Architectural Stone Band: 6-Week Curriculum Arc */}
      <Reveal as="section" className="surface-stone py-24 lg:py-32">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <h2 className="type-heading text-[var(--ink-stone-primary)]">
            Six weeks from architecture to Demo Day
          </h2>
          <p className="mt-3 max-w-[60ch] text-[16px] leading-[1.65] text-[var(--ink-stone-muted)]">
            Three compressed two-week sprints built around shipping live
            production work instead of classroom exercises.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-3">
            {CURRICULUM_PHASES.map((phase) => (
              <div
                key={phase.weeks}
                className="border-t border-[var(--hairline-stone)] pt-6"
              >
                <p className="font-tabular text-[14px] font-semibold text-[var(--accent-on-stone)]">
                  {phase.weeks}
                </p>
                <h3 className="type-subhead mt-3 text-[var(--ink-stone-primary)]">
                  {phase.title}
                </h3>
                <ul className="mt-4 space-y-3 text-[16px] leading-[1.6] text-[#2D3440]">
                  {phase.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check
                        className="mt-1.5 h-4 w-4 shrink-0 text-[var(--accent-on-stone)]"
                        strokeWidth={2}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Interactive Residency Tracks */}
      <section className="border-t border-[var(--hairline)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <Reveal>
            <h2 className="type-heading text-[var(--ink-primary)]">
              Choose your primary track
            </h2>
            <p className="mt-3 max-w-[60ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
              Select the engineering discipline you want to lead in Cycle 01.
              Selecting a track pre-fills your cohort application below.
            </p>
          </Reveal>

          <StaggerGroup className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {TRACKS.map((t) => {
              const active = track === t.key;
              const Icon = t.icon;

              return (
                <StaggerItem key={t.key} className="flex">
                  <article
                    className={`flex w-full flex-col justify-between rounded-xl border p-7 lg:p-8 ${
                      active
                        ? "border-t-2 border-[var(--hairline-strong)] border-t-[var(--accent)] bg-[var(--bg-surface)]"
                        : "border-[var(--hairline)] bg-[var(--bg-surface)]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <Icon
                          className="h-5 w-5 text-[var(--accent)]"
                          strokeWidth={1.8}
                        />
                        <span
                          className={`text-[14px] font-medium ${
                            active
                              ? "text-[#FF7A63]"
                              : "text-[var(--ink-muted)]"
                          }`}
                        >
                          {active ? "Selected track" : t.label}
                        </span>
                      </div>

                      <h3 className="type-heading mt-4 text-[var(--ink-primary)]">
                        {t.title}
                      </h3>

                      <p className="mt-3 text-[16px] leading-[1.65] text-[var(--ink-muted)]">
                        {t.summary}
                      </p>

                      <ul className="mt-6 space-y-3 text-[16px] leading-[1.6] text-[var(--ink-primary)]">
                        {t.outcomes.map((outcome) => (
                          <li key={outcome} className="flex items-start gap-2.5">
                            <Check
                              className="mt-1.5 h-4 w-4 shrink-0 text-[#34D399]"
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
                      className={`press-tactile mt-8 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-[14px] font-semibold whitespace-nowrap ${
                        active
                          ? "bg-[var(--accent)] text-[#07090D] hover:bg-[var(--accent-hover)]"
                          : "border border-[var(--hairline-strong)] bg-[var(--bg-recessed)] text-[var(--ink-primary)] hover:border-white/30"
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
        </div>
      </section>

      {/* Proof-of-Work Cohort Application (#apply) */}
      <Reveal
        as="section"
        className="border-t border-[var(--hairline)] bg-[var(--bg-surface)] py-24 lg:py-32"
      >
        <div
          id="apply"
          className="mx-auto grid max-w-[1360px] scroll-mt-24 grid-cols-1 gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:px-12"
        >
          <div className="lg:col-span-4">
            <h2 className="type-heading text-[var(--ink-primary)]">
              Apply for Cycle 01
            </h2>
            <p className="mt-4 max-w-[40ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
              We do not filter by credentials or GPA. Show us the hardest system
              you have built and the technical trade-offs you solved.
            </p>

            <ul className="mt-8 space-y-4 text-[16px] text-[var(--ink-primary)]">
              <li className="flex items-start gap-2.5">
                <Check
                  className="mt-1.5 h-4 w-4 shrink-0 text-[#34D399]"
                  strokeWidth={2}
                />
                <span>
                  Every proof-of-work repository is reviewed by technical leads.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check
                  className="mt-1.5 h-4 w-4 shrink-0 text-[#34D399]"
                  strokeWidth={2}
                />
                <span>
                  Direct pairing with Systems architects and OXAKALABS squads.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check
                  className="mt-1.5 h-4 w-4 shrink-0 text-[#34D399]"
                  strokeWidth={2}
                />
                <span>
                  Cohort invitations go out ahead of Cycle 01 kickoff.
                </span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-8">
            <div className="rounded-xl border border-[var(--hairline)] bg-[var(--bg-canvas)] p-7 sm:p-10">
              {submittedId ? (
                <div className="space-y-4 border-l-2 border-[#10B981] pl-6">
                  <div className="flex items-center gap-2 text-[14px] font-medium text-[#34D399]">
                    <CheckCircle2 className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                    <span className="font-tabular">
                      Reference: {submittedId.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="type-heading text-[var(--ink-primary)]">
                    You are on the Gravity Cycle 01 review queue
                  </h3>
                  <p className="max-w-[58ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
                    Our technical leads inspect every submitted proof-of-work
                    repository. Cohort invitations dispatch ahead of Cycle 01
                    kickoff.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedId(null);
                      setProofOfWork("");
                    }}
                    className="press-tactile mt-2 inline-flex h-11 cursor-pointer items-center justify-center rounded-full bg-[var(--accent)] px-6 text-[14px] font-semibold text-[#07090D] hover:bg-[var(--accent-hover)]"
                  >
                    Submit another application
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-6">
                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-4 py-3 text-[14px] text-[#FF8A7A]"
                    >
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="orbit-form-name"
                        className="block text-[14px] font-medium text-[var(--ink-primary)]"
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
                        className="h-11 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-surface)] px-4 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="orbit-form-email"
                        className="block text-[14px] font-medium text-[var(--ink-primary)]"
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
                        className="h-11 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-surface)] px-4 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="orbit-form-track"
                        className="block text-[14px] font-medium text-[var(--ink-primary)]"
                      >
                        Primary track *
                      </label>
                      <select
                        id="orbit-form-track"
                        value={track}
                        onChange={(e) => setTrack(e.target.value as OrbitTrack)}
                        className="h-11 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-surface)] px-4 text-[14px] text-[var(--ink-primary)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                      >
                        <option value="AI_ENGINEERING">
                          Applied AI Engineering
                        </option>
                        <option value="FULLSTACK_SYSTEMS">
                          Full-Stack Product Systems
                        </option>
                        <option value="KINETIC_DESIGN">
                          Kinetic Design Engineering
                        </option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="orbit-form-portfolio"
                        className="block text-[14px] font-medium text-[var(--ink-primary)]"
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
                        className="h-11 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-surface)] px-4 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="orbit-form-proof"
                      className="block text-[14px] font-medium text-[var(--ink-primary)]"
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
                      className="w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-surface)] p-4 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    id="orbit-form-submit"
                    disabled={submitting}
                    className="press-tactile inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 text-[14px] font-semibold whitespace-nowrap text-[#07090D] hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
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
