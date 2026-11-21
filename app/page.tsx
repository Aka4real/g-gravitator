import React from "react";
import Link from "next/link";
import { ArrowUpRight, Radio, Radar, Layers, Terminal } from "lucide-react";
import { GravityFieldCanvas } from "@/components/kinetic/GravityFieldCanvas";
import { CrosshairCell } from "@/components/kinetic/CrosshairCell";
import { FlywheelMatrix } from "@/components/kinetic/FlywheelMatrix";
import { CountdownTimer } from "@/components/hackathons/CountdownTimer";
import {
  SourceBadges,
  OxakalabsStatusBadge,
} from "@/components/hackathons/SourceBadges";
import {
  getDispatches,
  getHackathons,
  getLabProjects,
  getNewsItems,
} from "@/lib/db/repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [
    { items: hackathons },
    { items: newsItems },
    dispatches,
    labsDrops,
    skunkworksBuilds,
  ] = await Promise.all([
    getHackathons({ sort: "closing_soon" }),
    getNewsItems(),
    getDispatches(),
    getLabProjects("LABS"),
    getLabProjects("SKUNKWORKS"),
  ]);

  const topHackathons = hackathons.slice(0, 4);
  const topNews = newsItems.slice(0, 4);
  const featuredDispatch = dispatches.find((d) => d.is_featured) ?? dispatches[0];
  const totalPrizePool = hackathons.reduce(
    (acc, h) => acc + (h.prize_pool_usd ?? 0),
    0
  );

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
      {/* Outer Exposed 1px Architectural Frame */}
      <div className="border-x border-[#27272A]">
        {/* ===================================================================
            SECTION 1: HERO — FULL-VIEWPORT ARCHITECTURAL CANVAS
           =================================================================== */}
        <section className="relative overflow-hidden border-b border-[#27272A]">
          {/* Top Telemetry Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#27272A] bg-[#111114]/90 px-6 py-2.5">
            <div className="font-mono-telemetry flex items-center gap-2 text-[11px] text-[#F3F2EE]">
              <span className="h-2 w-2 bg-[#FF3B1F]" />
              <span>G-GRAVITATOR // SOFTWARE &amp; AI CREATIVITY LAB</span>
            </div>
            <div className="font-mono-telemetry flex flex-wrap items-center gap-4 text-[11px] text-[#A1A1AA]">
              <span>
                HACKATHONS TRACKED:{" "}
                <strong className="text-[#F3F2EE]">{hackathons.length}</strong>
              </span>
              <span className="text-[#3F3F46]">•</span>
              <span>
                ACTIVE BOUNTIES:{" "}
                <strong className="text-[#10B981]">
                  ${(totalPrizePool / 1000).toFixed(0)}K+
                </strong>
              </span>
              <span className="text-[#3F3F46]">•</span>
              <span>
                LATEST DROP: <strong className="text-[#FF3B1F]">G-01</strong>
              </span>
              <span className="text-[#3F3F46]">•</span>
              <span>
                ORBIT CYCLE 01: <strong className="text-[#F3F2EE]">WAITLIST</strong>
              </span>
            </div>
          </div>

          {/* Gravitational Grid Canvas + Hero Typography */}
          <div className="relative min-h-[580px] px-6 py-16 sm:px-10 sm:py-24 lg:px-14 lg:py-28">
            <GravityFieldCanvas />

            <div className="relative z-10 max-w-5xl">
              <div className="font-mono-telemetry inline-flex items-center gap-2 border border-[#27272A] bg-[#111114] px-3 py-1 text-[11px] text-[#A1A1AA]">
                <span>TAGLINE // WHERE IDEAS GAIN MASS</span>
                <span className="text-[#3F3F46]">|</span>
                <span className="text-[#FF3B1F]">OXAKALABS FOUNDRY INSIDE</span>
              </div>

              <h1 className="font-display mt-6 text-[clamp(2.75rem,6.5vw,6.25rem)] font-extrabold tracking-[-0.035em] text-[#F3F2EE] uppercase">
                BUILD WITH WEIGHT.
                <span className="mt-1 block text-[#A1A1AA]">
                  SOFTWARE &amp; AI ENGINEERED TO PULL MARKETS.
                </span>
              </h1>

              <p className="mt-7 max-w-3xl text-base leading-relaxed text-[#A1A1AA] sm:text-lg">
                G-Gravitator is a software and AI creativity lab that engineers flagship
                products, architects bespoke enterprise systems, competes in global
                hackathons via{" "}
                <Link
                  href="/skunkworks"
                  className="text-[#F3F2EE] underline decoration-[#FF3B1F] underline-offset-4"
                >
                  OXAKALABS
                </Link>
                , and trains the next wave of technical builders.
              </p>

              {/* Dual Primary CTAs */}
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/systems"
                  id="hero-cta-commission-system"
                  className="font-mono-telemetry inline-flex items-center gap-2.5 bg-[#FF3B1F] px-6 py-4 text-xs font-semibold text-[#09090B] transition-colors hover:bg-[#F3F2EE]"
                >
                  <span>COMMISSION A SYSTEM</span>
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
                </Link>
                <Link
                  href="/labs"
                  id="hero-cta-explore-lab"
                  className="font-mono-telemetry inline-flex items-center gap-2.5 border border-[#F3F2EE] bg-[#09090B]/80 px-6 py-4 text-xs font-semibold text-[#F3F2EE] transition-colors hover:border-[#FF3B1F] hover:bg-[#111114]"
                >
                  <span>EXPLORE THE LAB (G-01..G-04)</span>
                  <ArrowUpRight className="h-4 w-4 text-[#FF3B1F]" strokeWidth={1.8} />
                </Link>
                <Link
                  href="/hackathons"
                  id="hero-cta-hackathon-radar"
                  className="font-mono-telemetry inline-flex items-center gap-2 border border-[#27272A] bg-[#111114] px-5 py-4 text-xs text-[#A1A1AA] transition-colors hover:border-[#3F3F46] hover:text-[#F3F2EE]"
                >
                  <Radar className="h-4 w-4 text-[#FF3B1F]" strokeWidth={1.5} />
                  <span>LIVE HACKATHON RADAR ({hackathons.length})</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Hero Structural Metrics Bar */}
          <div className="grid grid-cols-2 divide-x divide-y divide-[#27272A] border-t border-[#27272A] bg-[#09090B] sm:grid-cols-4 sm:divide-y-0">
            <div className="px-6 py-4">
              <div className="font-mono-telemetry text-[10px] text-[#71717A]">
                01 // B2B VELOCITY
              </div>
              <div className="font-display mt-1 text-xl font-bold text-[#F3F2EE]">
                5-DAY AUDIT → 4-WK MVP
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="font-mono-telemetry text-[10px] text-[#71717A]">
                02 // PROPRIETARY DROPS
              </div>
              <div className="font-display mt-1 text-xl font-bold text-[#F3F2EE]">
                {labsDrops.length} NUMBERED RELEASES
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="font-mono-telemetry text-[10px] text-[#71717A]">
                03 // OXAKALABS SKUNKWORKS
              </div>
              <div className="font-display mt-1 text-xl font-bold text-[#F3F2EE]">
                {skunkworksBuilds.length} SHIPPED ARCHIVES
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="font-mono-telemetry text-[10px] text-[#71717A]">
                04 // GRADUATION THRESHOLD
              </div>
              <div className="font-display mt-1 text-xl font-bold text-[#FF3B1F]">
                20–25 / 25 SCORE FILTER
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 2: THE FOUR-UNIT FLYWHEEL MATRIX
           =================================================================== */}
        <section className="border-b border-[#27272A]">
          <div className="flex flex-col justify-between gap-4 border-b border-[#27272A] px-6 py-8 sm:flex-row sm:items-end lg:px-10">
            <div>
              <span className="font-mono-telemetry text-[11px] text-[#FF3B1F]">
                ARCHITECTURAL TOPOLOGY // 01
              </span>
              <h2 className="font-display mt-2 text-3xl font-extrabold tracking-tight uppercase sm:text-4xl">
                ONE MASTERBRAND. FOUR INTERLOCKING UNITS.
              </h2>
            </div>
            <p className="max-w-md text-xs text-[#A1A1AA]">
              Hover any division cell below to trace how B2B Systems contracts and
              OXAKALABS 48-hour hackathon R&amp;D fund commercial Labs drops and pull Orbit
              talent.
            </p>
          </div>

          <FlywheelMatrix />
        </section>

        {/* ===================================================================
            SECTION 3: FEATURED DROPS (G-01 – G-04 PREVIEW STRIP)
           =================================================================== */}
        <section className="border-b border-[#27272A]">
          <div className="flex flex-col justify-between gap-4 border-b border-[#27272A] px-6 py-8 sm:flex-row sm:items-end lg:px-10">
            <div>
              <span className="font-mono-telemetry text-[11px] text-[#FF3B1F]">
                G-GRAVITATOR LABS // NUMBERED CATALOG
              </span>
              <h2 className="font-display mt-2 text-3xl font-extrabold tracking-tight uppercase sm:text-4xl">
                INDUSTRIAL SOFTWARE &amp; AI DROPS (G-01 — G-04)
              </h2>
            </div>
            <Link
              href="/labs"
              className="font-mono-telemetry inline-flex items-center gap-2 border border-[#27272A] bg-[#111114] px-4 py-2.5 text-xs text-[#F3F2EE] hover:border-[#FF3B1F]"
            >
              <span>INSPECT FULL CATALOG</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#FF3B1F]" strokeWidth={1.8} />
            </Link>
          </div>

          <div className="grid grid-cols-1 divide-y divide-[#27272A] md:grid-cols-2 md:divide-y-0 lg:grid-cols-4 lg:divide-x">
            {labsDrops.map((drop) => (
              <CrosshairCell
                key={drop.id}
                corners={["tl", "tr"]}
                className="flex flex-col justify-between bg-[#09090B] p-6 transition-colors hover:bg-[#111114] lg:p-7"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-telemetry bg-[#F3F2EE] px-2 py-0.5 text-xs font-bold text-[#09090B]">
                      {drop.code}
                    </span>
                    <span
                      className={`font-mono-telemetry border px-2 py-0.5 text-[10px] ${
                        drop.status === "PROTOTYPING"
                          ? "border-[#FF3B1F]/60 bg-[#FF3B1F]/15 text-[#FF3B1F]"
                          : drop.status === "R&D"
                          ? "border-[#10B981]/50 bg-[#10B981]/10 text-[#10B981]"
                          : "border-[#27272A] bg-[#18181B] text-[#A1A1AA]"
                      }`}
                    >
                      {drop.status}
                    </span>
                  </div>

                  <h3 className="font-display mt-5 text-xl font-bold tracking-tight text-[#F3F2EE]">
                    {drop.name}
                  </h3>

                  <p className="mt-2.5 text-xs leading-relaxed text-[#A1A1AA]">
                    {drop.tagline}
                  </p>

                  {drop.hackathon_origin && (
                    <div className="font-mono-telemetry mt-4 border-l-2 border-[#FF3B1F] pl-2.5 text-[10px] text-[#71717A]">
                      {drop.hackathon_origin}
                    </div>
                  )}
                </div>

                <div className="mt-6 border-t border-[#27272A] pt-4">
                  <div className="flex flex-wrap gap-1.5">
                    {drop.tech_stack.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="font-mono-telemetry border border-[#27272A] bg-[#09090B] px-1.5 py-0.5 text-[9px] text-[#71717A]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/labs/${drop.slug}`}
                    className="font-mono-telemetry mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#F3F2EE] hover:text-[#FF3B1F]"
                  >
                    <span>OPEN {drop.code} SPEC</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#FF3B1F]" strokeWidth={1.8} />
                  </Link>
                </div>
              </CrosshairCell>
            ))}
          </div>
        </section>

        {/* ===================================================================
            SECTION 4: LIVE INTELLIGENCE SPLIT-PREVIEW (HACKATHONS + WIRE)
           =================================================================== */}
        <section className="border-b border-[#27272A]">
          <div className="grid grid-cols-1 divide-y divide-[#27272A] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            {/* LEFT COLUMN: LIVE HACKATHON RADAR */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#27272A] bg-[#111114] px-6 py-5 lg:px-8">
                  <div>
                    <div className="font-mono-telemetry flex items-center gap-2 text-[10px] text-[#FF3B1F]">
                      <Radar className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <span>MODULE 01 // MULTI-PROVIDER + X SIGNAL</span>
                    </div>
                    <h2 className="font-display mt-1 text-2xl font-bold uppercase">
                      LIVE HACKATHON RADAR
                    </h2>
                  </div>
                  <Link
                    href="/hackathons"
                    className="font-mono-telemetry inline-flex items-center gap-1 border border-[#27272A] bg-[#09090B] px-3 py-2 text-[11px] text-[#F3F2EE] hover:border-[#FF3B1F]"
                  >
                    <span>OPEN FULL TRACKER</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#FF3B1F]" strokeWidth={1.8} />
                  </Link>
                </div>

                <div className="divide-y divide-[#27272A]">
                  {topHackathons.map((hack) => (
                    <div
                      key={hack.id}
                      className="p-6 transition-colors hover:bg-[#111114]/70 lg:px-8"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <SourceBadges sources={hack.sources} />
                        <OxakalabsStatusBadge status={hack.oxakalabs_status} />
                      </div>

                      <div className="mt-3 flex items-baseline justify-between gap-4">
                        <Link
                          href={`/hackathons?q=${encodeURIComponent(hack.title)}`}
                          className="font-display text-lg font-bold text-[#F3F2EE] hover:text-[#FF3B1F]"
                        >
                          {hack.title}
                        </Link>
                      </div>

                      <p className="mt-1.5 line-clamp-2 text-xs text-[#A1A1AA]">
                        {hack.summary}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#27272A]/80 pt-3">
                        <div className="font-mono-telemetry text-xs font-semibold text-[#10B981]">
                          PRIZE: {hack.prize_display}
                        </div>
                        <div className="flex items-center gap-3">
                          <CountdownTimer deadlineAt={hack.deadline_at} compact />
                          <a
                            href={hack.primary_url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono-telemetry inline-flex items-center gap-1 text-[11px] text-[#F3F2EE] hover:text-[#FF3B1F]"
                          >
                            <span>SOURCE</span>
                            <ArrowUpRight className="h-3 w-3" strokeWidth={1.8} />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#27272A] bg-[#111114] px-6 py-4 lg:px-8">
                <Link
                  href="/hackathons"
                  className="font-mono-telemetry flex items-center justify-between text-xs font-semibold text-[#F3F2EE] hover:text-[#FF3B1F]"
                >
                  <span>
                    VIEW ALL {hackathons.length} TRACKED HACKATHONS (DEVPOST, DORAHACKS, X,
                    LUMA, KAGGLE)
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-[#FF3B1F]" strokeWidth={1.8} />
                </Link>
              </div>
            </div>

            {/* RIGHT COLUMN: THE ORBITAL WIRE & LAB DISPATCHES */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#27272A] bg-[#111114] px-6 py-5 lg:px-8">
                  <div>
                    <div className="font-mono-telemetry flex items-center gap-2 text-[10px] text-[#10B981]">
                      <Radio className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <span>MODULE 02 // AI &amp; TECH INTELLIGENCE</span>
                    </div>
                    <h2 className="font-display mt-1 text-2xl font-bold uppercase">
                      ORBITAL WIRE &amp; DISPATCHES
                    </h2>
                  </div>
                  <Link
                    href="/journal"
                    className="font-mono-telemetry inline-flex items-center gap-1 border border-[#27272A] bg-[#09090B] px-3 py-2 text-[11px] text-[#F3F2EE] hover:border-[#FF3B1F]"
                  >
                    <span>READ ALL INTELLIGENCE</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#FF3B1F]" strokeWidth={1.8} />
                  </Link>
                </div>

                {/* Featured Lab Dispatch Banner */}
                {featuredDispatch && (
                  <div className="border-b border-[#27272A] bg-[#111114]/60 p-6 lg:px-8">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-telemetry bg-[#FF3B1F] px-2 py-0.5 text-[10px] font-bold text-[#09090B]">
                        FEATURED DISPATCH // {featuredDispatch.issue_number}
                      </span>
                      <span className="font-mono-telemetry text-[10px] text-[#A1A1AA]">
                        {featuredDispatch.category} • {featuredDispatch.reading_time_mins}{" "}
                        MIN READ
                      </span>
                    </div>
                    <Link
                      href={`/journal/${featuredDispatch.slug}`}
                      className="font-display mt-3 block text-xl font-bold text-[#F3F2EE] hover:text-[#FF3B1F]"
                    >
                      {featuredDispatch.title}
                    </Link>
                    <p className="mt-2 line-clamp-2 text-xs text-[#A1A1AA]">
                      {featuredDispatch.subtitle}
                    </p>
                  </div>
                )}

                {/* Top 4 Orbital Wire Items */}
                <div className="divide-y divide-[#27272A]">
                  {topNews.map((item) => (
                    <div
                      key={item.id}
                      className="p-6 transition-colors hover:bg-[#111114]/70 lg:px-8"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-telemetry border border-[#27272A] bg-[#09090B] px-2 py-0.5 text-[10px] text-[#A1A1AA]">
                            {item.category}
                          </span>
                          <span className="font-mono-telemetry text-[10px] text-[#71717A]">
                            {item.source_name}
                          </span>
                        </div>
                        <span className="font-mono-telemetry text-[10px] text-[#10B981]">
                          IMPACT: {item.impact_score}/100
                        </span>
                      </div>

                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2.5 block text-sm font-semibold text-[#F3F2EE] hover:text-[#FF3B1F]"
                      >
                        {item.title}
                      </a>

                      <p className="mt-1.5 text-xs leading-relaxed text-[#A1A1AA]">
                        <strong className="font-mono-telemetry text-[10px] text-[#FF3B1F]">
                          GRAVITY TAKE:{" "}
                        </strong>
                        {item.gravity_take}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#27272A] bg-[#111114] px-6 py-4 lg:px-8">
                <Link
                  href="/journal"
                  className="font-mono-telemetry flex items-center justify-between text-xs font-semibold text-[#F3F2EE] hover:text-[#FF3B1F]"
                >
                  <span>
                    ENTER JOURNAL &amp; THE ORBITAL WIRE ({dispatches.length} DISPATCHES •{" "}
                    {newsItems.length} WIRE SIGNALS)
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-[#FF3B1F]" strokeWidth={1.8} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 5: MANIFESTO & KINETIC CTA BAND
           =================================================================== */}
        <section className="bg-[#09090B] px-6 py-16 sm:px-10 lg:px-14 lg:py-24">
          <div className="mx-auto max-w-5xl">
            <div className="font-mono-telemetry flex items-center gap-2 text-xs text-[#FF3B1F]">
              <Terminal className="h-4 w-4" strokeWidth={1.5} />
              <span>G-GRAVITATOR MANIFESTO // CENTER OF MASS</span>
            </div>

            <blockquote className="font-display mt-6 text-2xl leading-[1.2] font-bold tracking-tight text-[#F3F2EE] sm:text-3xl lg:text-4xl">
              &ldquo;Most labs either chase aesthetics with no engine underneath, or ship
              raw engineering nobody wants to touch. G-Gravitator exists at the center of
              mass—where software craftsmanship, applied AI, and radical creativity
              collide. We build products for the world, architect high-velocity systems
              for ambitious companies, stress-test frontier ideas in 48-hour hackathons
              through OXAKALABS, and pull sharp minds into orbit to build what comes
              next.&rdquo;
            </blockquote>

            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Link
                href="/systems"
                className="group flex flex-col justify-between border border-[#27272A] bg-[#111114] p-6 transition-colors hover:border-[#FF3B1F]"
              >
                <div>
                  <span className="font-mono-telemetry text-[10px] text-[#FF3B1F]">
                    PATHWAY 01 // ENTERPRISE &amp; B2B
                  </span>
                  <h3 className="font-display mt-2 text-lg font-bold text-[#F3F2EE]">
                    Book a Gravity Audit or Velocity MVP
                  </h3>
                  <p className="mt-1.5 text-xs text-[#A1A1AA]">
                    5-day technical teardown or 4-week full-stack AI system delivery.
                  </p>
                </div>
                <span className="font-mono-telemetry mt-6 inline-flex items-center gap-1 text-xs font-semibold text-[#F3F2EE] group-hover:text-[#FF3B1F]">
                  <span>SCOPE YOUR BUILD</span>
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                </span>
              </Link>

              <Link
                href="/skunkworks"
                className="group flex flex-col justify-between border border-[#27272A] bg-[#111114] p-6 transition-colors hover:border-[#FF3B1F]"
              >
                <div>
                  <span className="font-mono-telemetry text-[10px] text-[#10B981]">
                    PATHWAY 02 // R&amp;D &amp; HACKATHONS
                  </span>
                  <h3 className="font-display mt-2 text-lg font-bold text-[#F3F2EE]">
                    Inspect OXAKALABS // Skunkworks
                  </h3>
                  <p className="mt-1.5 text-xs text-[#A1A1AA]">
                    Explore 48-hour builds and run the interactive 25-Point Graduation
                    Scorecard.
                  </p>
                </div>
                <span className="font-mono-telemetry mt-6 inline-flex items-center gap-1 text-xs font-semibold text-[#F3F2EE] group-hover:text-[#FF3B1F]">
                  <span>ENTER SKUNKWORKS</span>
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                </span>
              </Link>

              <Link
                href="/orbit"
                className="group flex flex-col justify-between border border-[#27272A] bg-[#111114] p-6 transition-colors hover:border-[#FF3B1F]"
              >
                <div>
                  <span className="font-mono-telemetry text-[10px] text-[#3B82F6]">
                    PATHWAY 03 // INCOMING BUILDERS
                  </span>
                  <h3 className="font-display mt-2 text-lg font-bold text-[#F3F2EE]">
                    Apply for Orbit Cycle 01
                  </h3>
                  <p className="mt-1.5 text-xs text-[#A1A1AA]">
                    6-week intensive technical cohort across AI Engineering &amp; Kinetic
                    Craft.
                  </p>
                </div>
                <span className="font-mono-telemetry mt-6 inline-flex items-center gap-1 text-xs font-semibold text-[#F3F2EE] group-hover:text-[#FF3B1F]">
                  <span>JOIN WAITLIST</span>
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                </span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
