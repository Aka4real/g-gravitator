"use client";

import React, { useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  evaluateGraduationScorecard,
  type GraduationVerdictCode,
} from "@/lib/scorecard";
import type { GraduationScorecardData, LabProject } from "@/lib/supabase/types";

interface GraduationScorecardProps {
  presets: LabProject[];
}

const AXES: {
  key: keyof GraduationScorecardData;
  label: string;
  desc: string;
}[] = [
  {
    key: "pain_intensity",
    label: "Pain intensity",
    desc: "Acute recurring operational bleed versus a one-off novelty prompt.",
  },
  {
    key: "willingness_to_pay",
    label: "Willingness to pay",
    desc: "Clear enterprise or prosumer ROI anchor with direct budget ownership.",
  },
  {
    key: "technical_moat",
    label: "Technical moat and polish",
    desc: "Non-trivial architecture, verification harness, or interaction craft.",
  },
  {
    key: "distribution_hook",
    label: "Distribution hook",
    desc: "Artifact naturally markets itself whenever shared or embedded.",
  },
  {
    key: "lean_maintainability",
    label: "Lean maintainability",
    desc: "Operable by a 1-to-3 engineer cell without heavy support drag.",
  },
];

function getVerdictTheme(code: GraduationVerdictCode) {
  switch (code) {
    case "PROMOTE_TO_LABS":
      return {
        scoreText: "text-[#FF5238]",
        badgeBg: "border-[#FF3B1F]/35 bg-[#FF3B1F]/12",
        labelText: "text-[#FF8A7A]",
        thresholdTag: "20 to 25 threshold met",
      };
    case "B2B_CASE_STUDY_OPEN_SOURCE":
      return {
        scoreText: "text-[#FBBF24]",
        badgeBg: "border-[#F59E0B]/35 bg-[#F59E0B]/12",
        labelText: "text-[#FBBF24]",
        thresholdTag: "14 to 19 mid-band",
      };
    default:
      return {
        scoreText: "text-[#D4D4D8]",
        badgeBg: "border-white/[0.14] bg-white/[0.05]",
        labelText: "text-[#D4D4D8]",
        thresholdTag: "Under 14 archive band",
      };
  }
}

export function GraduationScorecard({ presets }: GraduationScorecardProps) {
  const [scores, setScores] = useState<GraduationScorecardData>({
    pain_intensity: 5,
    willingness_to_pay: 5,
    technical_moat: 4,
    distribution_hook: 5,
    lean_maintainability: 4,
  });
  const [activePresetCode, setActivePresetCode] = useState<string>("OXA-01");

  const verdict = evaluateGraduationScorecard(scores);
  const theme = getVerdictTheme(verdict.code);

  const handleLoadPreset = (project: LabProject) => {
    if (!project.scorecard) return;
    setScores(project.scorecard);
    setActivePresetCode(project.code);
  };

  const handleReset = () => {
    setActivePresetCode("Custom");
    setScores({
      pain_intensity: 3,
      willingness_to_pay: 3,
      technical_moat: 3,
      distribution_hook: 3,
      lean_maintainability: 3,
    });
  };

  return (
    <div className="surface-card rounded-2xl p-6 sm:p-8 lg:p-10">
      {/* Top Instrument Control Bar */}
      <div className="flex flex-col gap-5 border-b border-white/[0.07] pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="font-display text-xl font-semibold tracking-[-0.02em] text-[#F4F3EF]">
            Interactive 25-point filter
          </h3>
          <p className="mt-1 text-sm text-[#8B8B94]">
            Load an OXAKALABS preset or calibrate each axis from 1 to 5.
          </p>
        </div>

        {/* Preset Pills & Reset */}
        <div
          role="group"
          aria-label="Load OXAKALABS build presets"
          className="flex flex-wrap items-center gap-2"
        >
          {presets
            .filter((p) => p.scorecard)
            .map((proj) => {
              const isActive = activePresetCode === proj.code;
              return (
                <button
                  key={proj.code}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleLoadPreset(proj)}
                  className={`press-tactile font-mono-telemetry cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? "border-[#F4F3EF] bg-[#F4F3EF] text-[#08080A]"
                      : "border-white/[0.1] bg-[#18181D] text-[#A1A1AA] hover:border-white/[0.2] hover:text-[#F4F3EF]"
                  }`}
                >
                  {proj.code}
                </button>
              );
            })}

          <button
            type="button"
            onClick={handleReset}
            className="press-tactile inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[#D4D4D8] transition-colors hover:border-white/[0.2] hover:bg-white/[0.08] hover:text-[#F4F3EF]"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.7} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Split: 5 Tactile Stepped Controls + Live Verdict Panel */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
        {/* Left 7 Cols: Stepped 1-5 Axes */}
        <div className="space-y-6 lg:col-span-7">
          {AXES.map((axis) => {
            const val = scores[axis.key];
            return (
              <div key={axis.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-[#F4F3EF]">
                      {axis.label}
                    </span>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#8B8B94]">
                      {axis.desc}
                    </p>
                  </div>
                  <span className="font-mono-telemetry shrink-0 text-sm font-semibold text-[#F4F3EF]">
                    {val} / 5
                  </span>
                </div>

                {/* Recessed 1-5 Stepped Pill Rail */}
                <div
                  role="group"
                  aria-label={axis.label}
                  className="mt-3 grid grid-cols-5 gap-1.5 rounded-full border border-white/[0.07] bg-[#0B0B0E] p-1"
                >
                  {[1, 2, 3, 4, 5].map((step) => {
                    const isExact = step === val;
                    const isFilled = step < val;
                    return (
                      <button
                        key={step}
                        type="button"
                        id={`scorecard-${axis.key}-${step}`}
                        aria-pressed={isExact}
                        aria-label={`${axis.label}: ${step} out of 5`}
                        onClick={() => {
                          setActivePresetCode("Custom");
                          setScores((prev) => ({ ...prev, [axis.key]: step }));
                        }}
                        className={`press-tactile font-mono-telemetry h-9 cursor-pointer rounded-full text-xs font-semibold transition-colors ${
                          isExact
                            ? "bg-[#FF3B1F] text-[#08080A]"
                            : isFilled
                            ? "bg-[#FF3B1F]/20 text-[#F4F3EF] hover:bg-[#FF3B1F]/30"
                            : "bg-transparent text-[#8B8B94] hover:bg-white/[0.06] hover:text-[#F4F3EF]"
                        }`}
                      >
                        {step}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 5 Cols: Live Verdict Console */}
        <div className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0B0B0E] p-6 sm:p-7 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-[#8B8B94]">
                Computed score
              </span>
              <span className="font-mono-telemetry rounded-full border border-white/[0.1] bg-white/[0.05] px-2.5 py-0.5 text-xs font-medium text-[#D4D4D8]">
                {activePresetCode}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <span
                  className={`font-display tabular-nums text-6xl font-bold leading-none tracking-[-0.03em] ${theme.scoreText}`}
                >
                  {verdict.total}
                </span>
                <span className="font-mono-telemetry text-lg text-[#8B8B94]">
                  / {verdict.max}
                </span>
              </div>
              <span
                className={`font-mono-telemetry rounded-full border px-3 py-1 text-xs font-medium ${theme.badgeBg} ${theme.labelText}`}
              >
                {theme.thresholdTag}
              </span>
            </div>

            {/* Verdict Callout */}
            <div className={`mt-6 rounded-xl border p-4 sm:p-5 ${theme.badgeBg}`}>
              <div className="text-xs font-medium text-[#A1A1AA]">
                Pipeline verdict
              </div>
              <div
                className={`font-display mt-1 text-lg font-semibold tracking-[-0.015em] ${theme.labelText}`}
              >
                {verdict.label}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#D4D4D8]">
                {verdict.actionDirective}
              </p>
            </div>
          </div>

          {/* Threshold Indicators */}
          <div className="mt-7 space-y-2.5 border-t border-white/[0.07] pt-5 text-xs">
            {[
              {
                code: "PROMOTE_TO_LABS" as const,
                band: "20 to 25",
                label: "Promote to Labs (G-XX)",
                activeClass: "text-[#FF8A7A]",
                dotClass: "bg-[#FF3B1F]",
              },
              {
                code: "B2B_CASE_STUDY_OPEN_SOURCE" as const,
                band: "14 to 19",
                label: "B2B case study and open source",
                activeClass: "text-[#FBBF24]",
                dotClass: "bg-[#F59E0B]",
              },
              {
                code: "DISPATCH_AND_ARCHIVE" as const,
                band: "Under 14",
                label: "Dispatch and archive",
                activeClass: "text-[#F4F3EF]",
                dotClass: "bg-[#A1A1AA]",
              },
            ].map((row) => {
              const isCurrent = verdict.code === row.code;
              return (
                <div
                  key={row.code}
                  className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition-colors ${
                    isCurrent
                      ? "bg-white/[0.05] font-medium"
                      : "text-[#8B8B94]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        isCurrent ? row.dotClass : "bg-white/[0.16]"
                      }`}
                    />
                    <span
                      className={`font-mono-telemetry ${
                        isCurrent ? row.activeClass : "text-[#8B8B94]"
                      }`}
                    >
                      {row.band}
                    </span>
                  </div>
                  <span
                    className={`text-right ${
                      isCurrent ? "text-[#F4F3EF]" : "text-[#8B8B94]"
                    }`}
                  >
                    {row.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
