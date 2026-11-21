"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CrosshairCell } from "@/components/kinetic/CrosshairCell";

interface UnitNode {
  id: "systems" | "labs" | "skunkworks" | "orbit";
  unitCode: string;
  unitRole: string;
  displayName: string;
  audience: string;
  purpose: string;
  href: string;
  secondaryHref?: { label: string; href: string };
  flywheelVector: string;
  connectedTo: ("systems" | "labs" | "skunkworks" | "orbit")[];
}

const FLYWHEEL_UNITS: UnitNode[] = [
  {
    id: "systems",
    unitCode: "UNIT 01 // B2B FOUNDRY",
    unitRole: "CAPITAL & ENTERPRISE ENGINE",
    displayName: "G-Gravitator Systems",
    audience: "Enterprise & High-Ticket B2B",
    purpose:
      "Bespoke AI engineering, 5-day Gravity Audits, 4-week Velocity MVPs, custom workflow automation, and fractional R&D retainers.",
    href: "/systems",
    flywheelVector:
      "FLOW: Non-dilutive B2B contract cashflow + front-line enterprise problem discovery directly funds G-Gravitator Labs commercial drops.",
    connectedTo: ["labs", "skunkworks"],
  },
  {
    id: "labs",
    unitCode: "UNIT 02 // PRODUCT LAB",
    unitRole: "PROPRIETARY SOFTWARE DROPS",
    displayName: "G-Gravitator Labs",
    audience: "Everyday Consumers & Prosumers",
    purpose:
      "Ships proprietary commercial software and AI tools as numbered industrial drops (G-01 Gravity Deck, G-02 OpsPilot, G-03 Kinetic Studio, G-04 OrbitBench).",
    href: "/labs",
    flywheelVector:
      "FLOW: Commercializes high-scoring prototypes (20–25/25) graduated from OXAKALABS // Skunkworks into recurring SaaS & license revenue.",
    connectedTo: ["skunkworks", "orbit"],
  },
  {
    id: "skunkworks",
    unitCode: "UNIT 03 // EXPERIMENTAL R&D",
    unitRole: "48-HOUR STRIKE FOUNDRY (EST. 2022)",
    displayName: "OXAKALABS // Skunkworks",
    audience: "Builders, Judges & Open-Source Devs",
    purpose:
      "The fast-moving experimental R&D foundry and hackathon strike arm of G-Gravitator. Runs 48-hour builds, operates the Live Hackathon Radar, and graduates prototypes into Labs.",
    href: "/skunkworks",
    secondaryHref: { label: "Live Hackathon Radar →", href: "/hackathons" },
    flywheelVector:
      "FLOW: Stress-tests frontier models under 48-hour hackathon compression; top builds graduate to Labs (G-XX) or become B2B Systems capability proofs.",
    connectedTo: ["labs", "systems"],
  },
  {
    id: "orbit",
    unitCode: "UNIT 04 // BUILDER ACCELERATOR",
    unitRole: "TALENT & GRAVITY CYCLES",
    displayName: "G-Gravitator Orbit",
    audience: "Engineers, Designers & Technical Students",
    purpose:
      "Selective, time-boxed 6-week training cohorts (Gravity Cycles), technical residencies, and Demo Days across AI Engineering, Full-Stack Systems, and Kinetic Design.",
    href: "/orbit",
    flywheelVector:
      "FLOW: Pulls the sharpest emerging engineers into OXAKALABS hackathon squads and G-Gravitator Systems delivery cells.",
    connectedTo: ["skunkworks", "systems"],
  },
];

export function FlywheelMatrix() {
  const [activeId, setActiveId] = useState<UnitNode["id"]>("systems");
  const activeUnit = FLYWHEEL_UNITS.find((u) => u.id === activeId) ?? FLYWHEEL_UNITS[0];

  return (
    <div>
      {/* Telemetry Vector Flow Readout Bar */}
      <div className="flex flex-col justify-between gap-3 border-b border-[#27272A] bg-[#111114] px-6 py-3.5 sm:flex-row sm:items-center">
        <div className="font-mono-telemetry flex items-center gap-2 text-[11px] text-[#F3F2EE]">
          <span className="h-2 w-2 bg-[#FF3B1F]" />
          <span>ACTIVE VECTOR // {activeUnit.displayName.toUpperCase()}</span>
        </div>
        <p className="font-mono-telemetry text-[11px] text-[#A1A1AA]">
          {activeUnit.flywheelVector}
        </p>
      </div>

      {/* 2x2 Architectural Grid */}
      <div className="grid grid-cols-1 divide-y divide-[#27272A] md:grid-cols-2 md:divide-y-0">
        {FLYWHEEL_UNITS.map((unit, idx) => {
          const isHovered = activeId === unit.id;
          const isConnected = activeUnit.connectedTo.includes(unit.id);
          const borderClasses =
            idx === 0
              ? "md:border-r md:border-b border-[#27272A]"
              : idx === 1
              ? "md:border-b border-[#27272A]"
              : idx === 2
              ? "md:border-r border-[#27272A]"
              : "";

          return (
            <CrosshairCell
              key={unit.id}
              corners={["tl", "br"]}
              className={`p-7 lg:p-9 transition-colors ${borderClasses} ${
                isHovered
                  ? "bg-[#111114]"
                  : isConnected
                  ? "bg-[#09090B]"
                  : "bg-[#09090B] opacity-85"
              }`}
            >
              <div
                onMouseEnter={() => setActiveId(unit.id)}
                className="flex h-full flex-col justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`font-mono-telemetry text-[11px] ${
                        isHovered ? "text-[#FF3B1F]" : "text-[#71717A]"
                      }`}
                    >
                      {unit.unitCode}
                    </span>
                    <span
                      className={`font-mono-telemetry border px-2 py-0.5 text-[10px] ${
                        isHovered
                          ? "border-[#FF3B1F] bg-[#FF3B1F]/15 text-[#FF3B1F]"
                          : isConnected
                          ? "border-[#3F3F46] bg-[#18181B] text-[#F3F2EE]"
                          : "border-[#27272A] text-[#71717A]"
                      }`}
                    >
                      {isHovered
                        ? "SOURCE NODE"
                        : isConnected
                        ? "FLYWHEEL COUPLED ↗"
                        : unit.unitRole}
                    </span>
                  </div>

                  <h3 className="font-display mt-4 text-2xl font-bold tracking-tight text-[#F3F2EE] sm:text-3xl">
                    {unit.displayName}
                  </h3>

                  <div className="font-mono-telemetry mt-2 text-[11px] text-[#71717A]">
                    AUDIENCE: <span className="text-[#A1A1AA]">{unit.audience}</span>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-[#A1A1AA]">
                    {unit.purpose}
                  </p>
                </div>

                <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[#27272A] pt-4">
                  <Link
                    href={unit.href}
                    className="font-mono-telemetry inline-flex items-center gap-1.5 text-xs font-semibold text-[#F3F2EE] hover:text-[#FF3B1F]"
                  >
                    <span>ENTER {unit.href.toUpperCase()}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#FF3B1F]" strokeWidth={1.8} />
                  </Link>
                  {unit.secondaryHref && (
                    <Link
                      href={unit.secondaryHref.href}
                      className="font-mono-telemetry border border-[#27272A] bg-[#09090B] px-2.5 py-1 text-[10px] text-[#A1A1AA] hover:border-[#FF3B1F] hover:text-[#F3F2EE]"
                    >
                      {unit.secondaryHref.label}
                    </Link>
                  )}
                </div>
              </div>
            </CrosshairCell>
          );
        })}
      </div>
    </div>
  );
}
