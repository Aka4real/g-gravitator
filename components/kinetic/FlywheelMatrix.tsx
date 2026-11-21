"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { EASE_OUT_EXPO, SPRING_UI } from "@/lib/motion";

type UnitId = "systems" | "labs" | "skunkworks" | "orbit";

interface UnitNode {
  id: UnitId;
  shortLabel: string;
  role: string;
  displayName: string;
  audience: string;
  purpose: string;
  href: string;
  ctaLabel: string;
  secondaryHref?: { label: string; href: string };
  flywheelFlow: string;
  connectedTo: UnitId[];
}

const FLYWHEEL_UNITS: UnitNode[] = [
  {
    id: "systems",
    shortLabel: "Systems",
    role: "Enterprise AI Foundry",
    displayName: "G-Gravitator Systems",
    audience: "Enterprise & B2B teams",
    purpose:
      "Bespoke AI engineering, 5-day Gravity Audits, 4-week Velocity MVPs, custom workflow automation, and fractional R&D retainers.",
    href: "/systems",
    ctaLabel: "Explore Systems",
    flywheelFlow:
      "Non-dilutive B2B contract cashflow and real enterprise bottlenecks directly fund G-Gravitator Labs commercial releases.",
    connectedTo: ["labs", "skunkworks"],
  },
  {
    id: "labs",
    shortLabel: "Labs",
    role: "Proprietary Product Drops",
    displayName: "G-Gravitator Labs",
    audience: "Builders & prosumers",
    purpose:
      "Ships proprietary commercial software and AI tools as numbered drops including G-01 Gravity Deck, G-02 OpsPilot, G-03 Kinetic Studio, and G-04 OrbitBench.",
    href: "/labs",
    ctaLabel: "Explore Labs",
    flywheelFlow:
      "Commercializes high-scoring prototypes (20 to 25 out of 25) graduated from OXAKALABS Skunkworks into recurring SaaS and licensed products.",
    connectedTo: ["skunkworks", "orbit"],
  },
  {
    id: "skunkworks",
    shortLabel: "Skunkworks",
    role: "48-Hour Experimental R&D",
    displayName: "OXAKALABS Skunkworks",
    audience: "Hackathon squads & open-source devs",
    purpose:
      "Our fast-moving experimental R&D foundry and hackathon strike arm. Runs 48-hour builds, operates the Live Hackathon Radar, and graduates prototypes into Labs.",
    href: "/skunkworks",
    ctaLabel: "Explore Skunkworks",
    secondaryHref: { label: "Live Hackathon Radar", href: "/hackathons" },
    flywheelFlow:
      "Stress-tests frontier models under 48-hour competition pressure. Top builds graduate into Labs or become Systems capability proofs.",
    connectedTo: ["labs", "systems"],
  },
  {
    id: "orbit",
    shortLabel: "Orbit",
    role: "Builder Accelerator",
    displayName: "G-Gravitator Orbit",
    audience: "Engineers, designers & technical students",
    purpose:
      "Selective 6-week Gravity Cycles, technical residencies, and Demo Days across AI Engineering, Full-Stack Systems, and Kinetic Design.",
    href: "/orbit",
    ctaLabel: "Explore Orbit",
    flywheelFlow:
      "Pulls standout emerging engineers directly into OXAKALABS hackathon squads and G-Gravitator Systems delivery cells.",
    connectedTo: ["skunkworks", "systems"],
  },
];

const UNIT_BY_ID: Record<UnitId, UnitNode> = {
  systems: FLYWHEEL_UNITS[0],
  labs: FLYWHEEL_UNITS[1],
  skunkworks: FLYWHEEL_UNITS[2],
  orbit: FLYWHEEL_UNITS[3],
};

export function FlywheelMatrix() {
  const prefersReducedMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<UnitId>("systems");
  const activeUnit = UNIT_BY_ID[activeId];

  return (
    <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12 lg:gap-8">
      {/* Left: Open 4-Unit Architectural Selector */}
      <div
        role="tablist"
        aria-label="G-Gravitator Operating Divisions"
        className="flex flex-col gap-2 lg:col-span-5"
      >
        {FLYWHEEL_UNITS.map((unit) => {
          const isActive = activeId === unit.id;
          const isCoupled = activeUnit.connectedTo.includes(unit.id);

          return (
            <button
              key={unit.id}
              type="button"
              role="tab"
              id={`flywheel-tab-${unit.id}`}
              aria-selected={isActive}
              aria-controls="flywheel-stage-panel"
              onClick={() => setActiveId(unit.id)}
              className={`group relative flex w-full cursor-pointer items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left transition-colors duration-150 active:scale-[0.99] sm:px-6 sm:py-5 ${
                isActive ? "text-[#F4F3EF]" : "text-[#A1A1AA] hover:text-[#F4F3EF]"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="flywheel-active-unit"
                  transition={SPRING_UI}
                  className="absolute inset-0 -z-10 rounded-2xl border border-white/[0.12] bg-[#141418]"
                />
              )}

              {!isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 rounded-2xl border border-transparent bg-transparent transition-colors duration-150 group-hover:border-white/[0.06] group-hover:bg-white/[0.02]"
                />
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full transition-colors ${
                      isActive
                        ? "bg-[#FF3B1F]"
                        : isCoupled
                        ? "bg-[#F4F3EF]/60"
                        : "bg-white/[0.16]"
                    }`}
                  />
                  <span className="font-display text-lg font-bold tracking-[-0.025em] text-current sm:text-xl">
                    {unit.displayName}
                  </span>
                </div>
                <p className="mt-1 pl-[18px] text-sm text-[#8B8B94] group-hover:text-[#A1A1AA]">
                  {unit.role}
                </p>
              </div>

              <div className="shrink-0">
                {isActive ? (
                  <span className="rounded-full bg-[#FF3B1F]/15 px-2.5 py-1 text-xs font-medium text-[#FF6B57]">
                    Active
                  </span>
                ) : isCoupled ? (
                  <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-[#D4D4D8]">
                    Coupled
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {/* Right: Sculptural Detail Stage */}
      <div
        id="flywheel-stage-panel"
        role="tabpanel"
        aria-labelledby={`flywheel-tab-${activeUnit.id}`}
        className="surface-card relative flex flex-col justify-between overflow-hidden rounded-2xl p-7 sm:p-10 lg:col-span-7 lg:p-11"
      >
        {/* Soft ambient depth highlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-24 h-72 w-72 rounded-full bg-[#FF3B1F]/[0.07] blur-3xl"
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeUnit.id}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
            className="relative z-10 flex h-full flex-col justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/[0.07] px-3 py-1 text-xs font-medium text-[#D4D4D8]">
                  {activeUnit.audience}
                </span>
                <span className="rounded-full border border-white/[0.08] px-3 py-1 text-xs text-[#A1A1AA]">
                  {activeUnit.role}
                </span>
              </div>

              <h3 className="font-display mt-6 text-3xl font-bold tracking-[-0.03em] text-[#F4F3EF] sm:text-4xl">
                {activeUnit.displayName}
              </h3>

              <p className="mt-4 max-w-[54ch] text-base leading-relaxed text-[#A1A1AA]">
                {activeUnit.purpose}
              </p>

              {/* Flywheel Contribution & Interactive Coupling Pills */}
              <div className="mt-8 border-t border-white/[0.07] pt-6">
                <p className="text-xs font-medium text-[#8B8B94]">
                  How it powers the flywheel
                </p>
                <p className="mt-2 max-w-[54ch] text-sm leading-relaxed text-[#D4D4D8]">
                  {activeUnit.flywheelFlow}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {activeUnit.connectedTo.map((targetId) => {
                    const target = UNIT_BY_ID[targetId];
                    return (
                      <button
                        key={targetId}
                        type="button"
                        onClick={() => setActiveId(targetId)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-[#F4F3EF] transition-[background-color,border-color,transform] duration-150 hover:border-[#FF3B1F]/50 hover:bg-[#FF3B1F]/10 active:scale-[0.97]"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-[#FF3B1F]" />
                        <span>Feeds into {target.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Direct Division CTAs */}
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href={activeUnit.href}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#FF3B1F] px-5 text-sm font-semibold whitespace-nowrap text-[#08080A] transition-[background-color,transform] duration-150 hover:bg-[#FF5238] active:scale-[0.97]"
              >
                <span>{activeUnit.ctaLabel}</span>
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </Link>

              {activeUnit.secondaryHref && (
                <Link
                  href={activeUnit.secondaryHref.href}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-5 text-sm font-medium whitespace-nowrap text-[#F4F3EF] transition-[background-color,border-color,transform] duration-150 hover:border-white/[0.22] hover:bg-white/[0.09] active:scale-[0.97]"
                >
                  <span>{activeUnit.secondaryHref.label}</span>
                  <ArrowUpRight className="h-4 w-4 text-[#A1A1AA]" strokeWidth={1.8} />
                </Link>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
