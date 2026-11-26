"use client";

import React, { useState } from "react";
import { PreloadLink } from "@/components/layout/PreloadLink";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
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
    role: "Enterprise AI foundry",
    displayName: "G-Gravitator Systems",
    audience: "Enterprise and B2B teams",
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
    role: "Proprietary software drops",
    displayName: "G-Gravitator Labs",
    audience: "Builders and operators",
    purpose:
      "Ships proprietary commercial software and AI tools as numbered drops including Gravity Deck, OpsPilot, Kinetic Studio, and OrbitBench.",
    href: "/labs",
    ctaLabel: "Explore Labs",
    flywheelFlow:
      "Commercializes high-scoring prototypes (20 to 25 out of 25) graduated from OXAKALABS Skunkworks into recurring SaaS and licensed products.",
    connectedTo: ["skunkworks", "orbit"],
  },
  {
    id: "skunkworks",
    shortLabel: "Skunkworks",
    role: "48-hour experimental R&D",
    displayName: "OXAKALABS Skunkworks",
    audience: "Hackathon squads and engineers",
    purpose:
      "Our fast-moving experimental R&D foundry and hackathon strike arm. Runs 48-hour builds, operates the Hackathon Radar, and graduates prototypes into Labs.",
    href: "/skunkworks",
    ctaLabel: "Explore Skunkworks",
    secondaryHref: { label: "Open Hackathon Radar", href: "/hackathons" },
    flywheelFlow:
      "Stress-tests frontier models under 48-hour competition pressure. Top builds graduate into Labs or become Systems capability proofs.",
    connectedTo: ["labs", "systems"],
  },
  {
    id: "orbit",
    shortLabel: "Orbit",
    role: "Builder residency",
    displayName: "G-Gravitator Orbit",
    audience: "Engineers and design technologists",
    purpose:
      "Selective 6-week Gravity Cycles, technical residencies, and Demo Days across Applied AI Engineering, Full-Stack Systems, and Kinetic Design.",
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
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-14">
      {/* Left: Hairline Architectural Tablist */}
      <div
        role="tablist"
        aria-label="G-Gravitator Operating Divisions"
        className="divide-y divide-[var(--hairline-stone)] border-y border-[var(--hairline-stone)] lg:col-span-5"
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
              className={`group relative flex w-full cursor-pointer items-baseline justify-between gap-4 py-5 pl-5 text-left transition-colors duration-150 ${
                isActive
                  ? "text-[var(--ink-stone-primary)]"
                  : "text-[var(--ink-stone-muted)] hover:text-[var(--ink-stone-primary)]"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="flywheel-active-bar"
                  transition={SPRING_UI}
                  className="absolute top-3 bottom-3 left-0 w-[3px] rounded-full bg-[var(--accent)]"
                />
              )}

              <div className="min-w-0">
                <span className="font-display block text-[16px] font-semibold tracking-[-0.02em] text-current">
                  {unit.displayName}
                </span>
                <span className="mt-1 block text-[14px] text-[var(--ink-stone-muted)]">
                  {unit.role}
                </span>
              </div>

              <span
                className={`shrink-0 text-[14px] font-medium transition-colors duration-150 ${
                  isActive
                    ? "text-[var(--accent-on-stone)]"
                    : isCoupled
                    ? "text-[var(--ink-stone-primary)]"
                    : "text-transparent"
                }`}
              >
                {isActive ? "Selected" : isCoupled ? "Coupled" : ""}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right: Clean Architectural Detail Stage */}
      <div
        id="flywheel-stage-panel"
        role="tabpanel"
        aria-labelledby={`flywheel-tab-${activeUnit.id}`}
        className="rounded-2xl border border-[var(--hairline-stone)] bg-white p-7 sm:p-10 lg:col-span-7 lg:p-12"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeUnit.id}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
            className="flex flex-col justify-between"
          >
            <div>
              <p className="text-[14px] font-medium text-[var(--ink-stone-muted)]">
                {activeUnit.audience} · {activeUnit.role}
              </p>

              <h3 className="type-heading mt-3 text-[var(--ink-stone-primary)]">
                {activeUnit.displayName}
              </h3>

              <p className="mt-5 max-w-[56ch] text-[16px] leading-[1.65] text-[#2D3440]">
                {activeUnit.purpose}
              </p>

              <div className="mt-8 border-t border-[var(--hairline-stone)] pt-6">
                <p className="text-[14px] font-semibold text-[var(--ink-stone-primary)]">
                  How it powers the flywheel
                </p>
                <p className="mt-2 max-w-[56ch] text-[16px] leading-[1.65] text-[var(--ink-stone-muted)]">
                  {activeUnit.flywheelFlow}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
                  {activeUnit.connectedTo.map((targetId) => {
                    const target = UNIT_BY_ID[targetId];
                    return (
                      <button
                        key={targetId}
                        type="button"
                        onClick={() => setActiveId(targetId)}
                        className="inline-flex cursor-pointer items-center gap-1.5 text-[14px] font-medium text-[var(--accent-on-stone)] underline decoration-[var(--accent-on-stone)]/35 underline-offset-4 transition-colors duration-150 hover:text-[var(--ink-stone-primary)] hover:decoration-[var(--ink-stone-primary)]"
                      >
                        <span>Trace into {target.shortLabel}</span>
                        <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.9} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-5">
              <PreloadLink
                href={activeUnit.href}
                className="press-tactile inline-flex h-11 items-center gap-2 rounded-full bg-[var(--ink-stone-primary)] px-6 text-[14px] font-semibold whitespace-nowrap text-[#F2F4F8] hover:bg-[var(--accent)] hover:text-[#07090D]"
              >
                <span>{activeUnit.ctaLabel}</span>
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </PreloadLink>

              {activeUnit.secondaryHref && (
                <PreloadLink
                  href={activeUnit.secondaryHref.href}
                  className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--ink-stone-primary)] underline decoration-[var(--ink-stone-primary)]/30 underline-offset-4 transition-colors duration-150 hover:text-[var(--accent-on-stone)] hover:decoration-[var(--accent-on-stone)]"
                >
                  <span>{activeUnit.secondaryHref.label}</span>
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
                </PreloadLink>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
