"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2, Cpu, Layers, Sparkles, Terminal } from "lucide-react";
import { CrosshairCell } from "@/components/kinetic/CrosshairCell";
import type { OrbitTrack } from "@/lib/supabase/types";

const TRACKS: {
  key: OrbitTrack;
  code: string;
  title: string;
  icon: React.ReactNode;
  summary: string;
  outcomes: string[];
}[] = [
  {
    key: "AI_ENGINEERING",
    code: "TRACK 01 // APPLIED AI",
    title: "Applied AI Engineering",
    icon: <Cpu className="h-5 w-5 text-[#FF3B1F]" strokeWidth={1.5} />,
    summary:
      "Multi-agent orchestration, deterministic tool calling, Model Context Protocol (MCP) servers, structured schema extraction, and evaluation harnesses.",
    outcomes: [
      "Architect and deploy a production multi-agent workflow kernel",
      "Build a custom MCP server + automated OrbitBench evaluation suite",
      "Compete in a live 48-hour global AI hackathon alongside OXAKALABS",
    ],
  },
  {
    key: "FULLSTACK_SYSTEMS",
    code: "TRACK 02 // PRODUCT SYSTEMS",
    title: "Full-Stack Product Systems",
    icon: <Layers className="h-5 w-5 text-[#FF3B1F]" strokeWidth={1.5} />,
    summary:
      "First-principles system design with Next.js App Router, strict TypeScript contracts, PostgreSQL/Supabase RLS, background workers, and standalone containerization.",
    outcomes: [
      "Engineer a zero-slop full-stack SaaS platform from schema to edge deploy",
      "Implement resilient ingestion workers, rate limiting, and RBAC security",
      "Ship to live production users before Week 6 Demo Day",
    ],
  },
  {
    key: "KINETIC_DESIGN",
    code: "TRACK 03 // DESIGN ENGINEERING",
    title: "Kinetic Design Engineering",
    icon: <Sparkles className="h-5 w-5 text-[#FF3B1F]" strokeWidth={1.5} />,
    summary:
      "Intersection of Swiss industrial typography, exposed 1px grids, Framer Motion spring physics, HTML5 Canvas/WebGL shaders, and micro-interaction craft.",
    outcomes: [
      "Master the 85/15 Kinetic Luxury design system specification",
      "Build 60fps cursor-reactive canvases and weighted spring primitives",
      "Convert raw engineering tools into high-mass commercial brands",
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
        setError(data.error || "Please verify your application details.");
      } else {
        setSubmittedId(data.application?.id || "ORB-LOCKED");
      }
    } catch {
      setError("Network error submitting Orbit application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
      <div className="border-x border-[#27272A]">
        {/* Hero */}
        <section className="border-b border-[#27272A] px-6 py-16 sm:px-10 lg:px-14 lg:py-24">
          <div className="font-mono-telemetry inline-flex items-center gap-2 border border-[#27272A] bg-[#111114] px-3 py-1 text-[11px] text-[#FF3B1F]">
            <span>UNIT 04 // G-GRAVITATOR ORBIT</span>
            <span className="text-[#3F3F46]">|</span>
            <span className="text-[#F3F2EE]">CYCLE 01: APPLICATIONS OPEN</span>
          </div>

          <h1 className="font-display mt-6 max-w-4xl text-[clamp(2.5rem,5.5vw,5rem)] font-extrabold tracking-[-0.035em] text-[#F3F2EE] uppercase">
            GRAVITY CYCLES. TRAIN WITH BUILDERS WHO SHIP.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#A1A1AA]">
            Bootcamps teach passive tutorials. G-Gravitator Orbit is a selective, 6-week
            technical residency where emerging engineers and design technologists build
            real production software alongside our{" "}
            <span className="text-[#F3F2EE]">Systems</span> principals and{" "}
            <span className="text-[#F3F2EE]">OXAKALABS</span> hackathon strike squads.
          </p>
        </section>

        {/* Cycle 01 6-Week Blueprint */}
        <section className="border-b border-[#27272A]">
          <div className="border-b border-[#27272A] bg-[#111114] px-6 py-6 lg:px-10">
            <span className="font-mono-telemetry text-[11px] text-[#FF3B1F]">
              CURRICULUM CADENCE // 6-WEEK INTENSIVE
            </span>
            <h2 className="font-display mt-1 text-2xl font-bold uppercase sm:text-3xl">
              CYCLE 01 ARCHITECTURAL BLUEPRINT
            </h2>
          </div>

          <div className="grid grid-cols-1 divide-y divide-[#27272A] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {[
              {
                weeks: "WEEKS 01 – 02",
                phase: "FIRST-PRINCIPLES ARCHITECTURE & AI ENGINEERING",
                items: [
                  "Strict TypeScript contracts, relational Postgres modeling & RLS",
                  "Structured LLM outputs, tool calling & deterministic verification gates",
                  "48-hour OXAKALABS internal warm-up hackathon sprint",
                ],
              },
              {
                weeks: "WEEKS 03 – 04",
                phase: "KINETIC PRODUCT CRAFT & HIGH-VELOCITY SHIPPING",
                items: [
                  "85/15 Kinetic Luxury UI architecture & Framer Motion physics",
                  "Multi-provider data ingestion, background crons & edge caching",
                  "Mid-cycle architecture teardown with G-Gravitator Systems principals",
                ],
              },
              {
                weeks: "WEEKS 05 – 06",
                phase: "DEPLOYMENT, DISTRIBUTION & LIVE DEMO DAY",
                items: [
                  "Standalone Docker/Vercel production hardening & telemetry",
                  "25-Point Graduation Scorecard evaluation for Labs promotion",
                  "Public Demo Day showcase to enterprise partners & fellows",
                ],
              },
            ].map((block) => (
              <CrosshairCell
                key={block.weeks}
                corners={["tl", "tr"]}
                className="bg-[#09090B] p-7 lg:p-9"
              >
                <span className="font-mono-telemetry bg-[#FF3B1F] px-2.5 py-1 text-xs font-bold text-[#09090B]">
                  {block.weeks}
                </span>
                <h3 className="font-display mt-4 text-xl font-bold text-[#F3F2EE]">
                  {block.phase}
                </h3>
                <ul className="mt-4 space-y-2.5 text-xs text-[#A1A1AA]">
                  {block.items.map((it) => (
                    <li key={it} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-[#FF3B1F]" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </CrosshairCell>
            ))}
          </div>
        </section>

        {/* 3 Specialized Tracks */}
        <section className="border-b border-[#27272A]">
          <div className="border-b border-[#27272A] bg-[#111114] px-6 py-6 lg:px-10">
            <span className="font-mono-telemetry text-[11px] text-[#FF3B1F]">
              SPECIALIZED RESIDENCY TRACKS // 02
            </span>
            <h2 className="font-display mt-1 text-2xl font-bold uppercase sm:text-3xl">
              CHOOSE YOUR PRIMARY VECTOR
            </h2>
          </div>

          <div className="grid grid-cols-1 divide-y divide-[#27272A] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {TRACKS.map((t) => {
              const active = track === t.key;
              return (
                <div
                  key={t.key}
                  className={`flex flex-col justify-between p-7 lg:p-9 ${
                    active ? "bg-[#111114]" : "bg-[#09090B]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono-telemetry text-xs text-[#FF3B1F]">
                        {t.code}
                      </span>
                      {t.icon}
                    </div>
                    <h3 className="font-display mt-4 text-2xl font-bold text-[#F3F2EE]">
                      {t.title}
                    </h3>
                    <p className="mt-3 text-xs leading-relaxed text-[#A1A1AA]">
                      {t.summary}
                    </p>
                    <ul className="mt-5 space-y-2 text-xs text-[#F3F2EE]">
                      {t.outcomes.map((o) => (
                        <li key={o} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-[#10B981]" />
                          <span className="text-[#A1A1AA]">{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setTrack(t.key);
                      document.getElementById("apply")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`font-mono-telemetry mt-8 w-full py-3 text-xs font-semibold transition-colors ${
                      active
                        ? "bg-[#FF3B1F] text-[#09090B]"
                        : "border border-[#27272A] bg-[#09090B] text-[#F3F2EE] hover:border-[#FF3B1F]"
                    }`}
                  >
                    SELECT {t.title.toUpperCase()}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Builder Waitlist & Proof-of-Work Application Form (#apply) */}
        <section id="apply" className="px-6 py-16 lg:px-14 lg:py-20">
          <div className="mx-auto max-w-3xl border border-[#27272A] bg-[#111114] p-7 sm:p-10">
            <div className="flex items-center gap-2 text-xs text-[#FF3B1F]">
              <Terminal className="h-4 w-4" strokeWidth={1.5} />
              <span className="font-mono-telemetry">
                ORBIT CYCLE 01 // PROOF-OF-WORK APPLICATION
              </span>
            </div>
            <h2 className="font-display mt-2 text-2xl font-extrabold uppercase sm:text-3xl">
              APPLY FOR GRAVITY CYCLE 01
            </h2>
            <p className="mt-2 text-xs text-[#A1A1AA]">
              We do not filter by credentials or GPA. Show us the hardest system you have
              built.
            </p>

            {submittedId ? (
              <div className="mt-8 border border-[#10B981] bg-[#09090B] p-6">
                <div className="flex items-center gap-2 text-[#10B981]">
                  <CheckCircle2 className="h-5 w-5" strokeWidth={1.5} />
                  <span className="font-mono-telemetry text-xs font-bold">
                    ORBIT APPLICATION LOCKED // REF: {submittedId.toUpperCase()}
                  </span>
                </div>
                <h3 className="font-display mt-3 text-xl font-bold text-[#F3F2EE]">
                  You Are on the Gravity Cycle 01 Roster Review Queue.
                </h3>
                <p className="mt-2 text-xs text-[#A1A1AA]">
                  Our technical leads inspect every submitted proof-of-work repository.
                  Cohort invitations dispatch ahead of Cycle 01 kickoff.
                </p>
              </div>
            ) : (
              <form onSubmit={handleApply} className="mt-8 space-y-5">
                {error && (
                  <div className="border border-[#FF3B1F] bg-[#FF3B1F]/10 p-3 text-xs text-[#FF3B1F]">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="font-mono-telemetry block text-[11px] text-[#A1A1AA]">
                      FULL NAME *
                    </label>
                    <input
                      required
                      id="orbit-form-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Chidera Okafor"
                      className="mt-1.5 w-full border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F3F2EE] focus:border-[#FF3B1F] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-mono-telemetry block text-[11px] text-[#A1A1AA]">
                      EMAIL ADDRESS *
                    </label>
                    <input
                      required
                      id="orbit-form-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="builder@domain.com"
                      className="mt-1.5 w-full border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F3F2EE] focus:border-[#FF3B1F] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="font-mono-telemetry block text-[11px] text-[#A1A1AA]">
                      PRIMARY TRACK *
                    </label>
                    <select
                      id="orbit-form-track"
                      value={track}
                      onChange={(e) => setTrack(e.target.value as OrbitTrack)}
                      className="mt-1.5 w-full border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F3F2EE] focus:border-[#FF3B1F] focus:outline-none"
                    >
                      <option value="AI_ENGINEERING">Applied AI Engineering</option>
                      <option value="FULLSTACK_SYSTEMS">Full-Stack Product Systems</option>
                      <option value="KINETIC_DESIGN">Kinetic Design Engineering</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-mono-telemetry block text-[11px] text-[#A1A1AA]">
                      GITHUB / PORTFOLIO URL
                    </label>
                    <input
                      id="orbit-form-portfolio"
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://github.com/username"
                      className="mt-1.5 w-full border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F3F2EE] focus:border-[#FF3B1F] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-mono-telemetry block text-[11px] text-[#A1A1AA]">
                    LINK TO &amp; DESCRIBE THE HARDEST THING YOU&apos;VE BUILT *
                  </label>
                  <textarea
                    required
                    id="orbit-form-proof"
                    rows={4}
                    value={proofOfWork}
                    onChange={(e) => setProofOfWork(e.target.value)}
                    placeholder="Share a repo link, deployment URL, and the hardest technical trade-off you solved..."
                    className="mt-1.5 w-full border border-[#27272A] bg-[#09090B] p-3.5 text-sm text-[#F3F2EE] focus:border-[#FF3B1F] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  id="orbit-form-submit"
                  disabled={submitting}
                  className="font-mono-telemetry flex w-full items-center justify-center gap-2 bg-[#FF3B1F] px-6 py-4 text-xs font-semibold text-[#09090B] transition-colors hover:bg-[#F3F2EE]"
                >
                  <span>
                    {submitting
                      ? "TRANSMITTING PROOF OF WORK..."
                      : "SUBMIT ORBIT CYCLE 01 APPLICATION"}
                  </span>
                  <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
