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
        scoreText: "text-[var(--accent-on-stone)]",
        borderAccent: "border-l-[var(--accent)]",
        thresholdTag: "20 to 25 threshold met",
      };
    case "B2B_CASE_STUDY_OPEN_SOURCE":
      return {
        scoreText: "text-[#B45309]",
        borderAccent: "border-l-[#D97706]",
        thresholdTag: "14 to 19 mid-band",
      };
    default:
      return {
        scoreText: "text-[var(--ink-stone-primary)]",
        borderAccent: "border-l-[#4A5260]",
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
    <div className="rounded-2xl border border-[var(--hairline-stone)] bg-white p-6 text-[var(--ink-stone-primary)] sm:p-9 lg:p-11">
      {/* Connected Preset Control Bar */}
      <div className="flex flex-col gap-5 border-b border-[var(--hairline-stone)] pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="type-subhead text-[var(--ink-stone-primary)]">
            Interactive 25-point filter
          </h3>
          <p className="mt-1 text-[14px] text-[var(--ink-stone-muted)]">
            Load a shipped OXAKALABS build or calibrate each axis from 1 to 5.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            role="tablist"
            aria-label="Load OXAKALABS build presets"
            className="inline-flex max-w-full items-center overflow-x-auto rounded-full border border-[var(--hairline-stone)] bg-[var(--bg-stone)] p-1"
          >
            {presets
              .filter((p) => p.scorecard)
              .map((proj) => {
                const isActive = activePresetCode === proj.code;
                return (
                  <button
                    key={proj.code}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleLoadPreset(proj)}
                    className={`press-tactile font-tabular shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-150 ${
                      isActive
                        ? "bg-[var(--ink-stone-primary)] text-[#F2F4F8]"
                        : "text-[var(--ink-stone-muted)] hover:text-[var(--ink-stone-primary)]"
                    }`}
                  >
                    {proj.code}
                  </button>
                );
              })}
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex cursor-pointer items-center gap-1.5 text-[14px] font-medium text-[var(--ink-stone-muted)] transition-colors duration-150 hover:text-[var(--ink-stone-primary)]"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Split: 5 Stepped Controls + Verdict Readout */}
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-6 lg:col-span-7">
          {AXES.map((axis) => {
            const val = scores[axis.key];
            return (
              <div key={axis.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[16px] font-semibold text-[var(--ink-stone-primary)]">
                      {axis.label}
                    </span>
                    <p className="mt-0.5 text-[14px] text-[var(--ink-stone-muted)]">
                      {axis.desc}
                    </p>
                  </div>
                  <span className="font-tabular shrink-0 text-[14px] font-semibold text-[var(--ink-stone-primary)]">
                    {val} / 5
                  </span>
                </div>

                {/* Connected 1-5 Stepped Segment Rail */}
                <div
                  role="group"
                  aria-label={axis.label}
                  className="mt-3 grid grid-cols-5 overflow-hidden rounded-full border border-[var(--hairline-stone)] bg-[var(--bg-stone)] p-1"
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
                        className={`press-tactile font-tabular h-9 cursor-pointer rounded-full text-[14px] font-semibold transition-colors duration-150 ${
                          isExact
                            ? "bg-[var(--accent)] text-[#07090D]"
                            : isFilled
                            ? "bg-[var(--accent)]/15 text-[var(--ink-stone-primary)] hover:bg-[var(--accent)]/25"
                            : "bg-transparent text-[var(--ink-stone-muted)] hover:text-[var(--ink-stone-primary)]"
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

        {/* Right Verdict Column (flat tonal plane, no nested card cages) */}
        <div className="flex flex-col justify-between border-t border-[var(--hairline-stone)] pt-8 lg:col-span-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
          <div>
            <p className="font-tabular text-[14px] font-medium text-[var(--ink-stone-muted)]">
              Computed score · {activePresetCode}
            </p>

            <div className="mt-3 flex items-baseline gap-2">
              <span
                className={`font-display font-tabular text-[clamp(3.25rem,5vw,4.5rem)] font-bold leading-none tracking-[-0.04em] ${theme.scoreText}`}
              >
                {verdict.total}
              </span>
              <span className="font-tabular text-[16px] text-[var(--ink-stone-muted)]">
                / {verdict.max}
              </span>
            </div>

            <p className="mt-2 text-[14px] font-medium text-[var(--ink-stone-muted)]">
              {theme.thresholdTag}
            </p>

            <div
              className={`mt-7 border-l-2 pl-5 ${theme.borderAccent}`}
            >
              <p className="text-[14px] text-[var(--ink-stone-muted)]">
                Pipeline verdict
              </p>
              <p
                className={`type-subhead mt-1 ${theme.scoreText}`}
              >
                {verdict.label}
              </p>
              <p className="mt-2 text-[16px] leading-[1.6] text-[#2D3440]">
                {verdict.actionDirective}
              </p>
            </div>
          </div>

          {/* Threshold Ledger */}
          <dl className="mt-8 divide-y divide-[var(--hairline-stone)] border-t border-[var(--hairline-stone)] text-[14px]">
            {[
              {
                code: "PROMOTE_TO_LABS" as const,
                band: "20 to 25",
                label: "Promote to Labs (G-XX)",
              },
              {
                code: "B2B_CASE_STUDY_OPEN_SOURCE" as const,
                band: "14 to 19",
                label: "B2B case study and open source",
              },
              {
                code: "DISPATCH_AND_ARCHIVE" as const,
                band: "Under 14",
                label: "Dispatch and archive",
              },
            ].map((row) => {
              const isCurrent = verdict.code === row.code;
              return (
                <div
                  key={row.code}
                  className={`flex items-center justify-between gap-3 py-3 ${
                    isCurrent
                      ? "font-semibold text-[var(--ink-stone-primary)]"
                      : "text-[var(--ink-stone-muted)]"
                  }`}
                >
                  <dt className="font-tabular">{row.band}</dt>
                  <dd className="text-right">{row.label}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </div>
  );
}
