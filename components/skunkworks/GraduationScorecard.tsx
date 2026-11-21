"use client";

import React, { useState } from "react";
import { Sliders, RotateCcw } from "lucide-react";
import { evaluateGraduationScorecard } from "@/lib/scorecard";
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
    label: "01. Pain Intensity",
    desc: "Acute recurring operational bleed vs. one-off novelty prompt.",
  },
  {
    key: "willingness_to_pay",
    label: "02. Willingness to Pay",
    desc: "Clear enterprise or prosumer ROI anchor and budget ownership.",
  },
  {
    key: "technical_moat",
    label: "03. Technical Moat & Polish",
    desc: "Non-trivial architecture, verification harness, or kinetic UI craft.",
  },
  {
    key: "distribution_hook",
    label: "04. Distribution Hook",
    desc: "Artifact inherently markets itself when shared or embedded.",
  },
  {
    key: "lean_maintainability",
    label: "05. Solo / Lean Maintainability",
    desc: "Operable by a 1-to-3 engineer cell without crushing support debt.",
  },
];

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

  const handleLoadPreset = (project: LabProject) => {
    if (!project.scorecard) return;
    setScores(project.scorecard);
    setActivePresetCode(project.code);
  };

  return (
    <div className="border border-[#27272A] bg-[#111114]">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#27272A] bg-[#09090B] px-6 py-4">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-[#FF3B1F]" strokeWidth={1.5} />
          <span className="font-mono-telemetry text-xs font-bold text-[#F3F2EE]">
            INTERACTIVE 25-POINT GRADUATION SCORECARD // THE SKUNKWORKS FILTER
          </span>
        </div>

        {/* Preset Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono-telemetry mr-1 text-[10px] text-[#71717A]">
            LOAD BUILD:
          </span>
          {presets
            .filter((p) => p.scorecard)
            .map((proj) => (
              <button
                key={proj.code}
                type="button"
                onClick={() => handleLoadPreset(proj)}
                className={`font-mono-telemetry border px-2 py-1 text-[10px] transition-colors ${
                  activePresetCode === proj.code
                    ? "border-[#FF3B1F] bg-[#FF3B1F] font-bold text-[#09090B]"
                    : "border-[#27272A] bg-[#111114] text-[#A1A1AA] hover:border-[#3F3F46] hover:text-[#F3F2EE]"
                }`}
              >
                {proj.code}
              </button>
            ))}
          <button
            type="button"
            onClick={() => {
              setActivePresetCode("CUSTOM");
              setScores({
                pain_intensity: 3,
                willingness_to_pay: 3,
                technical_moat: 3,
                distribution_hook: 3,
                lean_maintainability: 3,
              });
            }}
            className="font-mono-telemetry inline-flex items-center gap-1 border border-[#27272A] bg-[#111114] px-2 py-1 text-[10px] text-[#A1A1AA] hover:text-[#F3F2EE]"
          >
            <RotateCcw className="h-2.5 w-2.5" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 divide-y divide-[#27272A] lg:grid-cols-12 lg:divide-x lg:divide-y-0">
        {/* Left 7 Columns: 5 Interactive Metric Sliders */}
        <div className="space-y-6 p-6 sm:p-8 lg:col-span-7">
          {AXES.map((axis) => {
            const val = scores[axis.key];
            return (
              <div key={axis.key}>
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <span className="font-mono-telemetry text-xs font-semibold text-[#F3F2EE]">
                      {axis.label}
                    </span>
                    <p className="mt-0.5 text-xs text-[#71717A]">{axis.desc}</p>
                  </div>
                  <span className="font-mono-telemetry text-sm font-bold text-[#FF3B1F]">
                    {val} / 5
                  </span>
                </div>

                {/* 1-to-5 Segmented Precision Selector + Range */}
                <div className="mt-2.5 flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <button
                      key={step}
                      type="button"
                      id={`scorecard-${axis.key}-${step}`}
                      onClick={() => {
                        setActivePresetCode("CUSTOM");
                        setScores((prev) => ({ ...prev, [axis.key]: step }));
                      }}
                      className={`font-mono-telemetry h-8 flex-1 border text-xs font-semibold transition-colors ${
                        step <= val
                          ? "border-[#FF3B1F] bg-[#FF3B1F]/20 text-[#F3F2EE]"
                          : "border-[#27272A] bg-[#09090B] text-[#71717A] hover:border-[#3F3F46]"
                      }`}
                    >
                      {step}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 5 Columns: Dynamic Verdict Telemetry Console */}
        <div className="flex flex-col justify-between bg-[#09090B] p-6 sm:p-8 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono-telemetry text-[11px] text-[#71717A]">
                COMPUTED MASS SCORE
              </span>
              <span className="font-mono-telemetry border border-[#27272A] px-2 py-0.5 text-[10px] text-[#A1A1AA]">
                PRESET: {activePresetCode}
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span
                className="font-display text-6xl font-extrabold"
                style={{ color: verdict.accentColor }}
              >
                {verdict.total}
              </span>
              <span className="font-mono-telemetry text-lg text-[#71717A]">
                / {verdict.max} PTS
              </span>
            </div>

            <div
              className="mt-6 border p-4"
              style={{
                borderColor: verdict.accentColor,
                backgroundColor: `${verdict.accentColor}12`,
              }}
            >
              <div className="font-mono-telemetry text-[10px] text-[#A1A1AA]">
                DYNAMIC PIPELINE VERDICT
              </div>
              <div
                className="font-display mt-1 text-xl font-extrabold"
                style={{ color: verdict.accentColor }}
              >
                {verdict.label}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#F3F2EE]">
                {verdict.actionDirective}
              </p>
            </div>
          </div>

          {/* Threshold Legend */}
          <div className="mt-8 space-y-2 border-t border-[#27272A] pt-5 text-[11px]">
            <div className="font-mono-telemetry flex items-center justify-between text-[#FF3B1F]">
              <span>20–25 PTS</span>
              <span>→ PROMOTE TO LABS (G-XX)</span>
            </div>
            <div className="font-mono-telemetry flex items-center justify-between text-[#F59E0B]">
              <span>14–19 PTS</span>
              <span>→ B2B CASE STUDY &amp; OPEN SOURCE</span>
            </div>
            <div className="font-mono-telemetry flex items-center justify-between text-[#71717A]">
              <span>&lt; 14 PTS</span>
              <span>→ DISPATCH &amp; ARCHIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
