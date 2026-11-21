import React from "react";
import Image from "next/image";
import { PreloadLink } from "@/components/layout/PreloadLink";
import { ArrowUpRight } from "lucide-react";
import { GravityFieldCanvas } from "@/components/kinetic/GravityFieldCanvas";
import { FlywheelMatrix } from "@/components/kinetic/FlywheelMatrix";
import { CountdownTimer } from "@/components/hackathons/CountdownTimer";
import {
  SourceBadges,
  OxakalabsStatusBadge,
} from "@/components/hackathons/SourceBadges";
import { Reveal, StaggerGroup, StaggerItem } from "@/lib/motion";
import {
  getDispatches,
  getHackathons,
  getLabProjects,
  getNewsItems,
} from "@/lib/db/repository";
import type { LabProjectStatus } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const DROP_DISPLAY_NAMES: Record<string, string> = {
  "GRAVITY DECK": "Gravity Deck",
  OPSPILOT: "OpsPilot",
  "KINETIC STUDIO": "Kinetic Studio",
  ORBITBENCH: "OrbitBench",
};

const DROP_STATUS_META: Record<
  LabProjectStatus,
  { label: string; badgeClass: string }
> = {
  PROTOTYPING: {
    label: "Prototyping",
    badgeClass: "border-[#FF3B1F]/25 bg-[#FF3B1F]/15 text-[#FF8A7A]",
  },
  "R&D": {
    label: "R&D",
    badgeClass: "border-[#10B981]/25 bg-[#10B981]/12 text-[#34D399]",
  },
  LIVE: {
    label: "Live",
    badgeClass: "border-[#10B981]/25 bg-[#10B981]/12 text-[#34D399]",
  },
  BETA: {
    label: "Beta",
    badgeClass: "border-[#10B981]/25 bg-[#10B981]/12 text-[#34D399]",
  },
  CONCEPT: {
    label: "Concept",
    badgeClass: "border-white/[0.1] bg-white/[0.05] text-[#D4D4D8]",
  },
  "SKUNKWORKS CANDIDATE": {
    label: "Skunkworks",
    badgeClass: "border-[#F59E0B]/25 bg-[#F59E0B]/12 text-[#FBBF24]",
  },
  ARCHIVED: {
    label: "Archived",
    badgeClass: "border-white/[0.08] bg-white/[0.04] text-[#8B8B94]",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  MODELS: "Models",
  AGENTS: "Agents",
  DEVTOOLS: "Devtools",
  RESEARCH: "Research",
  BUSINESS: "Business",
  OPEN_SOURCE: "Open Source",
  ARCHITECTURE: "Architecture",
  "POST-MORTEM": "Post-Mortem",
  "AI SYSTEMS": "AI Systems",
  "HACKATHON LOG": "Hackathon Log",
  "DESIGN ENGINEERING": "Design Engineering",
};

function cleanCopy(text: string): string {
  return text.replace(/\s+\u2014\s+/g, ": ").replace(/\u2014/g, ", ");
}

function cleanOrigin(origin: string): string {
  return cleanCopy(origin).replace(/\s*\/\/\s*/g, " · ");
}

function formatDropName(name: string): string {
  const trimmed = name.trim();
  const mapped = DROP_DISPLAY_NAMES[trimmed.toUpperCase()];
  if (mapped) return mapped;
  if (trimmed === trimmed.toUpperCase()) {
    return trimmed.toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase());
  }
  return trimmed;
}

function formatCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category.toUpperCase()] ?? category;
}

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
  const featuredDispatch =
    dispatches.find((d) => d.is_featured) ?? dispatches[0] ?? null;

  return (
    <div className="relative overflow-x-clip bg-[#08080A] text-[#F4F3EF]">
      {/* ===================================================================
          SECTION 1: HERO (ASYMMETRIC SCULPTURAL VISUAL COMPOSITION)
         =================================================================== */}
      <section className="relative flex min-h-[calc(100dvh-76px)] items-center overflow-hidden pt-8 pb-16 lg:min-h-[min(calc(100dvh-76px),860px)] lg:pt-12 lg:pb-20">
        {/* Subtle cursor-reactive orbital backdrop */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-75">
          <GravityFieldCanvas />
        </div>

        {/* Seamless right-anchored studio photograph blended into #08080A */}
        <div className="relative z-10 mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <div className="relative flex flex-col lg:min-h-[580px] lg:justify-center">
            {/* Editorial Stack: strictly 3 text groups (H1, subtext, CTA row) */}
            <div className="relative z-20 max-w-[580px] xl:max-w-[650px]">
              <h1 className="font-display text-[clamp(2.5rem,5vw,4.65rem)] font-bold leading-[1.04] tracking-[-0.03em] text-[#F4F3EF]">
                Build with weight.
                <span className="mt-2.5 block text-[clamp(1.45rem,2.45vw,2.3rem)] font-semibold leading-[1.14] tracking-[-0.025em] text-[#A1A1AA]">
                  Software engineered to pull markets.
                </span>
              </h1>

              <p className="mt-6 max-w-[44ch] text-base leading-relaxed text-[#A1A1AA] sm:text-lg">
                A software and AI lab engineering enterprise systems, commercial
                drops, and 48-hour prototypes through{" "}
                <PreloadLink
                  href="/skunkworks"
                  className="font-medium text-[#F4F3EF] underline decoration-[#FF3B1F]/70 underline-offset-4 transition-colors hover:decoration-[#FF3B1F]"
                >
                  OXAKALABS
                </PreloadLink>
                .
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3.5">
                <PreloadLink
                  href="/systems"
                  id="hero-cta-commission-system"
                  className="press-tactile inline-flex h-12 items-center gap-2 rounded-full bg-[#FF3B1F] px-6 text-sm font-semibold whitespace-nowrap text-[#08080A] hover:bg-[#FF5238]"
                >
                  <span>Commission a system</span>
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </PreloadLink>

                <PreloadLink
                  href="/labs"
                  id="hero-cta-explore-lab"
                  className="press-tactile inline-flex h-12 items-center gap-2 rounded-full border border-white/[0.14] bg-[#18181D]/85 px-6 text-sm font-medium whitespace-nowrap text-[#F4F3EF] hover:border-white/[0.24] hover:bg-white/[0.1]"
                >
                  <span>Explore Labs</span>
                  <ArrowUpRight
                    className="h-4 w-4 text-[#A1A1AA]"
                    strokeWidth={1.8}
                  />
                </PreloadLink>
              </div>
            </div>

            {/* Right-anchored studio sphere (stacks cleanly below on mobile) */}
            <div className="relative mt-10 w-full lg:pointer-events-none lg:absolute lg:inset-y-0 lg:-right-8 lg:z-10 lg:mt-0 lg:flex lg:w-[74%] lg:max-w-[1040px] lg:items-center lg:justify-end xl:-right-12">
              <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-video lg:aspect-video">
                <Image
                  src="/images/hero-gravity-mass.jpg"
                  alt="Anodized matte titanium and smoked optical glass gravitational sphere suspended in dark obsidian space"
                  fill
                  preload
                  sizes="(max-width: 1024px) 100vw, 74vw"
                  className="object-cover object-[76%_50%] lg:object-right"
                />
                {/* Soft CSS edge masks melting photography seamlessly into #08080A */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#08080A]/80 via-transparent via-18% to-transparent lg:from-[#08080A] lg:via-[#08080A]/65 lg:via-38% lg:to-transparent"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-l from-[#08080A]/85 via-transparent via-14% to-transparent"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#08080A] via-transparent via-22% to-transparent"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#08080A]/90 via-transparent via-18% to-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECTION 2: OPERATING ARCHITECTURE (INTERACTIVE FLYWHEEL STAGE)
         =================================================================== */}
      <section className="border-t border-white/[0.06] py-24 lg:py-32">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <Reveal>
            <h2 className="font-display text-[clamp(1.875rem,3.2vw,3rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F4F3EF]">
              One lab, four interlocking engines.
            </h2>
            <p className="mt-4 max-w-[58ch] text-base leading-relaxed text-[#A1A1AA]">
              Select a division to trace how B2B Systems contracts and OXAKALABS
              48-hour sprints fund commercial Labs drops and pull Orbit builders.
            </p>
          </Reveal>

          <Reveal delay={0.08} className="mt-12 lg:mt-14">
            <FlywheelMatrix />
          </Reveal>
        </div>
      </section>

      {/* ===================================================================
          SECTION 3: FEATURED LABS DROPS (VISUAL ANCHOR + ASYMMETRIC SHOWCASE)
         =================================================================== */}
      <section className="border-t border-white/[0.06] py-24 lg:py-32">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-display text-[clamp(1.875rem,3.2vw,3rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F4F3EF]">
                Proprietary software and AI drops.
              </h2>
              <p className="mt-4 max-w-[54ch] text-base leading-relaxed text-[#A1A1AA]">
                Commercial releases graduated from our internal sprints into
                focused software for founders, operators, and engineering teams.
              </p>
            </div>

            <PreloadLink
              href="/labs"
              className="press-tactile inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-white/[0.12] bg-[#18181D] px-5 text-sm font-medium whitespace-nowrap text-[#F4F3EF] hover:border-white/[0.22] hover:bg-white/[0.1]"
            >
              <span>View full catalog</span>
              <ArrowUpRight
                className="h-4 w-4 text-[#A1A1AA]"
                strokeWidth={1.8}
              />
            </PreloadLink>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:mt-14 lg:grid-cols-12 lg:items-start">
            {/* Sculpted Visual Showcase Anchor (ZERO overlaid text or pills) */}
            <Reveal className="min-w-0 lg:sticky lg:top-28 lg:col-span-5">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#111114] ring-1 ring-inset ring-white/[0.08]">
                <Image
                  src="/images/labs-prism.jpg"
                  alt="Stacked smoked optical glass and bead-blasted matte obsidian monoliths with a hairline vermilion refraction"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                />
              </div>

              <div className="mt-6">
                <h3 className="font-display text-lg font-semibold tracking-[-0.02em] text-[#F4F3EF]">
                  Built inside the lab, shipped for real workflows
                </h3>
                <p className="mt-2 max-w-[44ch] text-sm leading-relaxed text-[#8B8B94]">
                  Prototypes that score 20 to 25 on our Graduation Filter move
                  from OXAKALABS experiments into numbered G-Gravitator Labs
                  releases.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#8B8B94]">
                  <span>
                    <span className="font-mono-telemetry text-[#D4D4D8]">
                      {labsDrops.length}
                    </span>{" "}
                    numbered drops
                  </span>
                  <span aria-hidden="true" className="text-white/[0.24]">
                    ·
                  </span>
                  <span className="font-mono-telemetry text-[#D4D4D8]">
                    G-01 to G-04
                  </span>
                </div>
              </div>
            </Reveal>

            {/* Asymmetric 2x2 Interactive Drops Cluster */}
            <div className="min-w-0 lg:col-span-7">
              {labsDrops.length === 0 ? (
                <div className="surface-card rounded-2xl p-8 text-sm text-[#A1A1AA]">
                  Labs catalog releases are currently syncing.{" "}
                  <PreloadLink
                    href="/labs"
                    className="font-medium text-[#F4F3EF] underline underline-offset-4"
                  >
                    Open Labs catalog
                  </PreloadLink>
                </div>
              ) : (
                <StaggerGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {labsDrops.map((drop) => {
                    const statusMeta =
                      DROP_STATUS_META[drop.status] ?? DROP_STATUS_META.CONCEPT;

                    return (
                      <StaggerItem key={drop.id} className="min-w-0">
                        <PreloadLink
                          href={`/labs/${drop.slug}`}
                          className="surface-card surface-card-interactive group flex h-full flex-col justify-between rounded-2xl p-6 lg:p-7"
                        >
                          <div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-mono-telemetry rounded-full bg-white/[0.08] px-2.5 py-1 text-xs font-semibold text-[#F4F3EF]">
                                {drop.code}
                              </span>
                              <span
                                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusMeta.badgeClass}`}
                              >
                                {statusMeta.label}
                              </span>
                            </div>

                            <h3 className="font-display mt-5 text-xl font-semibold tracking-[-0.02em] text-[#F4F3EF]">
                              {formatDropName(drop.name)}
                            </h3>

                            <p className="mt-2.5 text-sm leading-relaxed text-[#A1A1AA]">
                              {cleanCopy(drop.tagline)}
                            </p>

                            {drop.hackathon_origin && (
                              <p className="mt-4 text-xs leading-relaxed text-[#8B8B94]">
                                {cleanOrigin(drop.hackathon_origin)}
                              </p>
                            )}
                          </div>

                          <div className="mt-6 border-t border-white/[0.06] pt-4">
                            <div className="flex flex-wrap gap-1.5">
                              {drop.tech_stack.slice(0, 3).map((tech) => (
                                <span
                                  key={tech}
                                  className="rounded-full bg-[#18181D] px-2.5 py-1 text-[11px] font-medium text-[#A1A1AA]"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>

                            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#F4F3EF] transition-colors group-hover:text-[#FF8A7A]">
                              <span>Open {drop.code} spec</span>
                              <ArrowUpRight
                                className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0"
                                strokeWidth={1.8}
                              />
                            </span>
                          </div>
                        </PreloadLink>
                      </StaggerItem>
                    );
                  })}
                </StaggerGroup>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECTION 4: LIVE INTELLIGENCE (EDITORIAL STREAM + FLOATING RADAR)
         =================================================================== */}
      <section className="border-t border-white/[0.06] py-24 lg:py-32">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <Reveal>
            <h2 className="font-display text-[clamp(1.875rem,3.2vw,3rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F4F3EF]">
              Live intelligence from the frontier.
            </h2>
            <p className="mt-4 max-w-[58ch] text-base leading-relaxed text-[#A1A1AA]">
              Original lab dispatches, daily AI wire signals with concrete
              engineering takes, and active global hackathons tracked across ten
              sources.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-10 lg:mt-14 lg:grid-cols-12 lg:items-start lg:gap-12">
            {/* LEFT 7 COLS: Editorial Intelligence Stream (Featured Dispatch + Open Hairline Wire) */}
            <div className="min-w-0 lg:col-span-7">
              {featuredDispatch && (
                <Reveal>
                  <article className="surface-card surface-card-interactive group rounded-2xl p-6 sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-mono-telemetry rounded-full bg-[#FF3B1F] px-3 py-1 text-[11px] font-semibold text-[#08080A]">
                        Dispatch {featuredDispatch.issue_number}
                      </span>
                      <span className="text-xs text-[#8B8B94] tabular-nums">
                        {formatCategoryLabel(featuredDispatch.category)} ·{" "}
                        {featuredDispatch.reading_time_mins} min read
                      </span>
                    </div>

                    <h3 className="font-display mt-5 text-2xl font-semibold leading-[1.16] tracking-[-0.02em] text-[#F4F3EF] sm:text-[1.75rem]">
                      <PreloadLink
                        href={`/journal/${featuredDispatch.slug}`}
                        className="transition-colors hover:text-[#FF8A7A]"
                      >
                        {cleanCopy(featuredDispatch.title)}
                      </PreloadLink>
                    </h3>

                    <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-[#A1A1AA]">
                      {cleanCopy(featuredDispatch.subtitle)}
                    </p>

                    <div className="mt-6">
                      <PreloadLink
                        href={`/journal/${featuredDispatch.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#F4F3EF] transition-colors hover:text-[#FF8A7A]"
                      >
                        <span>Read featured dispatch</span>
                        <ArrowUpRight
                          className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0"
                          strokeWidth={1.8}
                        />
                      </PreloadLink>
                    </div>
                  </article>
                </Reveal>
              )}

              {/* Open Editorial Reading List for The Orbital Wire */}
              <div className={featuredDispatch ? "mt-10" : ""}>
                <Reveal className="flex flex-wrap items-baseline justify-between gap-3 pb-4">
                  <h3 className="font-display text-lg font-semibold tracking-[-0.015em] text-[#F4F3EF]">
                    The Orbital Wire
                  </h3>
                  <PreloadLink
                    href="/journal"
                    className="inline-flex items-center gap-1 text-sm font-medium text-[#A1A1AA] transition-colors hover:text-[#F4F3EF]"
                  >
                    <span>
                      All {dispatches.length} dispatches &amp; {newsItems.length}{" "}
                      signals
                    </span>
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
                  </PreloadLink>
                </Reveal>

                {topNews.length === 0 ? (
                  <p className="border-t border-white/[0.06] py-6 text-sm text-[#8B8B94]">
                    Fresh Orbital Wire signals are syncing now.
                  </p>
                ) : (
                  <StaggerGroup>
                    {topNews.map((item) => (
                      <StaggerItem key={item.id}>
                        <article className="border-t border-white/[0.06] py-6">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-[#D4D4D8]">
                                {formatCategoryLabel(item.category)}
                              </span>
                              <span className="text-xs text-[#8B8B94]">
                                {item.source_name}
                              </span>
                            </div>

                            <span className="font-mono-telemetry text-xs font-medium text-[#34D399]">
                              Impact {item.impact_score}/100
                            </span>
                          </div>

                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2.5 block text-base font-semibold leading-snug text-[#F4F3EF] transition-colors hover:text-[#FF8A7A]"
                          >
                            {cleanCopy(item.title)}
                          </a>

                          <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
                            <span className="font-medium text-[#F4F3EF]">
                              Gravity Take:{" "}
                            </span>
                            {cleanCopy(item.gravity_take)}
                          </p>
                        </article>
                      </StaggerItem>
                    ))}
                  </StaggerGroup>
                )}

                <div className="border-t border-white/[0.06] pt-6">
                  <PreloadLink
                    href="/journal"
                    className="press-tactile inline-flex h-11 items-center gap-2 rounded-full border border-white/[0.12] bg-[#18181D] px-5 text-sm font-medium whitespace-nowrap text-[#F4F3EF] hover:border-white/[0.22] hover:bg-white/[0.1]"
                  >
                    <span>Explore Journal &amp; Wire</span>
                    <ArrowUpRight
                      className="h-4 w-4 text-[#A1A1AA]"
                      strokeWidth={1.8}
                    />
                  </PreloadLink>
                </div>
              </div>
            </div>

            {/* RIGHT 5 COLS: Elevated Live Hackathon Radar Panel */}
            <Reveal delay={0.08} className="min-w-0 lg:col-span-5">
              <div className="surface-card rounded-2xl p-6 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 shrink-0 rounded-full bg-[#10B981]"
                      />
                      <h3 className="font-display text-xl font-semibold tracking-[-0.02em] text-[#F4F3EF]">
                        Live Hackathon Radar
                      </h3>
                    </div>
                    <p className="mt-1 text-xs text-[#8B8B94] tabular-nums">
                      {hackathons.length} active events across Devpost,
                      DoraHacks, X, and Luma
                    </p>
                  </div>

                  <PreloadLink
                    href="/hackathons"
                    className="press-tactile inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 text-xs font-medium whitespace-nowrap text-[#F4F3EF] hover:border-white/[0.2] hover:bg-white/[0.09]"
                  >
                    <span>Full radar</span>
                    <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </PreloadLink>
                </div>

                {topHackathons.length === 0 ? (
                  <p className="mt-6 border-t border-white/[0.06] pt-6 text-sm text-[#8B8B94]">
                    No active hackathon windows are listed right now.
                  </p>
                ) : (
                  <div className="mt-5">
                    {topHackathons.map((hack) => (
                      <article
                        key={hack.id}
                        className="border-t border-white/[0.06] py-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <SourceBadges sources={hack.sources} />
                          <OxakalabsStatusBadge
                            status={hack.oxakalabs_status}
                          />
                        </div>

                        <h4 className="font-display mt-3 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-[#F4F3EF]">
                          <PreloadLink
                            href={`/hackathons?q=${encodeURIComponent(hack.title)}`}
                            className="transition-colors hover:text-[#FF8A7A]"
                          >
                            {cleanCopy(hack.title)}
                          </PreloadLink>
                        </h4>

                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#A1A1AA]">
                          {cleanCopy(hack.summary)}
                        </p>

                        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                          <span className="font-mono-telemetry text-xs font-semibold text-[#34D399]">
                            {cleanCopy(hack.prize_display)}
                          </span>

                          <div className="flex flex-wrap items-center gap-3">
                            <CountdownTimer
                              deadlineAt={hack.deadline_at}
                              compact
                            />
                            <a
                              href={hack.primary_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#D4D4D8] transition-colors hover:text-[#F4F3EF]"
                            >
                              <span>Source</span>
                              <ArrowUpRight
                                className="h-3.5 w-3.5"
                                strokeWidth={1.8}
                              />
                            </a>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                <div className="border-t border-white/[0.08] pt-5">
                  <PreloadLink
                    href="/hackathons"
                    id="hero-cta-hackathon-radar"
                    className="press-tactile flex h-11 w-full items-center justify-between gap-3 rounded-full border border-white/[0.12] bg-[#18181D] px-5 text-sm font-medium text-[#F4F3EF] hover:border-white/[0.22] hover:bg-white/[0.1]"
                  >
                    <span className="truncate">
                      View all {hackathons.length} tracked hackathons
                    </span>
                    <ArrowUpRight
                      className="h-4 w-4 shrink-0 text-[#FF8A7A]"
                      strokeWidth={1.8}
                    />
                  </PreloadLink>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECTION 5: MANIFESTO & VISUAL STUDIO PATHWAYS (BENTO DIVERSITY)
         =================================================================== */}
      <section className="border-t border-white/[0.06] py-24 lg:py-32">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
          {/* Editorial Display Manifesto */}
          <Reveal className="mx-auto max-w-4xl text-center">
            <blockquote className="font-display text-[clamp(1.625rem,3vw,2.625rem)] font-semibold leading-[1.18] tracking-[-0.025em] text-[#F4F3EF]">
              &ldquo;Most labs chase aesthetics without an engine underneath, or
              ship raw engineering nobody wants to touch. G-Gravitator operates
              at the center of mass: where software craft, applied AI, and
              48-hour OXAKALABS velocity pull sharp minds and ambitious markets
              into orbit.&rdquo;
            </blockquote>
            <p className="mt-6 text-sm text-[#8B8B94]">
              G-Gravitator Labs Ltd · Operating OXAKALABS since 2022
            </p>
          </Reveal>

          {/* 3-Column Bento Pathways with Material & Photography Diversity */}
          <StaggerGroup className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3 lg:mt-20">
            {/* Pathway 1: Sculpted Obsidian Architectural Card with Warm Specular Rim */}
            <StaggerItem className="min-w-0">
              <PreloadLink
                href="/systems"
                className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[#FF3B1F]/25 bg-gradient-to-b from-[#161417] via-[#111114] to-[#0E0E11] p-7 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[#FF3B1F]/50 motion-reduce:hover:translate-y-0"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF3B1F]/60 to-transparent"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-20 -right-20 h-52 w-52 rounded-full bg-[#FF3B1F]/[0.09] blur-3xl"
                />

                <div className="relative z-10">
                  <h3 className="font-display text-2xl font-semibold leading-[1.15] tracking-[-0.02em] text-[#F4F3EF]">
                    G-Gravitator Systems
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-[#A1A1AA]">
                    Book a 5-day Gravity Audit or 4-week Velocity MVP for
                    production AI workflows and full-stack software with clean
                    IP handover.
                  </p>

                  <dl className="mt-7 space-y-3 border-t border-white/[0.08] pt-5 text-xs">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-[#8B8B94]">Gravity Audit</dt>
                      <dd className="font-mono-telemetry font-medium text-[#F4F3EF]">
                        5 days
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-[#8B8B94]">Velocity MVP</dt>
                      <dd className="font-mono-telemetry font-medium text-[#F4F3EF]">
                        4 weeks
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-[#8B8B94]">Lab Retainer</dt>
                      <dd className="font-mono-telemetry font-medium text-[#F4F3EF]">
                        Monthly
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="relative z-10 mt-8">
                  <span className="press-tactile inline-flex h-11 items-center gap-2 rounded-full bg-[#FF3B1F] px-5 text-sm font-semibold whitespace-nowrap text-[#08080A] transition-colors group-hover:bg-[#FF5238]">
                    <span>Scope your build</span>
                    <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                  </span>
                </div>
              </PreloadLink>
            </StaggerItem>

            {/* Pathway 2: Clean Photographic Media Header (Skunkworks Forge) */}
            <StaggerItem className="min-w-0">
              <PreloadLink
                href="/skunkworks"
                className="surface-card surface-card-interactive group flex h-full flex-col overflow-hidden rounded-2xl"
              >
                <div className="relative aspect-video w-full overflow-hidden border-b border-white/[0.06] bg-[#0B0B0E]">
                  <Image
                    src="/images/skunkworks-forge.jpg"
                    alt="CNC-milled dark aerospace alloy mechanism and frosted glass aperture representing OXAKALABS Skunkworks"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
                  />
                </div>

                <div className="flex flex-1 flex-col justify-between p-7">
                  <div>
                    <h3 className="font-display text-2xl font-semibold leading-[1.15] tracking-[-0.02em] text-[#F4F3EF]">
                      OXAKALABS Skunkworks
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-[#A1A1AA]">
                      Explore {skunkworksBuilds.length} shipped 48-hour GitHub
                      prototypes and score product viability on the 25-point
                      Graduation Filter.
                    </p>
                  </div>

                  <span className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-[#F4F3EF] transition-colors group-hover:text-[#FF8A7A]">
                    <span>Enter Skunkworks</span>
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0"
                      strokeWidth={1.8}
                    />
                  </span>
                </div>
              </PreloadLink>
            </StaggerItem>

            {/* Pathway 3: Clean Photographic Media Header (Orbit Atelier) */}
            <StaggerItem className="min-w-0">
              <PreloadLink
                href="/orbit"
                className="surface-card surface-card-interactive group flex h-full flex-col overflow-hidden rounded-2xl"
              >
                <div className="relative aspect-video w-full overflow-hidden border-b border-white/[0.06] bg-[#0B0B0E]">
                  <Image
                    src="/images/orbit-atelier.jpg"
                    alt="Twilight monolithic dark board-formed concrete and smoked glass studio interior representing G-Gravitator Orbit"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
                  />
                </div>

                <div className="flex flex-1 flex-col justify-between p-7">
                  <div>
                    <h3 className="font-display text-2xl font-semibold leading-[1.15] tracking-[-0.02em] text-[#F4F3EF]">
                      G-Gravitator Orbit
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-[#A1A1AA]">
                      Apply for Orbit Cycle 01, a selective 6-week residency in
                      AI engineering, full-stack product systems, and kinetic
                      craft.
                    </p>
                  </div>

                  <span className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-[#F4F3EF] transition-colors group-hover:text-[#FF8A7A]">
                    <span>Join waitlist</span>
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0"
                      strokeWidth={1.8}
                    />
                  </span>
                </div>
              </PreloadLink>
            </StaggerItem>
          </StaggerGroup>
        </div>
      </section>
    </div>
  );
}
