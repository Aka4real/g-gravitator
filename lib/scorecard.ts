import type { GraduationScorecardData } from "@/lib/supabase/types";

export type GraduationVerdictCode =
  | "PROMOTE_TO_LABS"
  | "B2B_CASE_STUDY_OPEN_SOURCE"
  | "DISPATCH_AND_ARCHIVE";

export interface GraduationVerdict {
  total: number;
  max: 25;
  code: GraduationVerdictCode;
  label: string;
  actionDirective: string;
  accentColor: string;
}

export function evaluateGraduationScorecard(
  scores: GraduationScorecardData
): GraduationVerdict {
  const clamp = (n: number) => Math.max(1, Math.min(5, Math.round(n)));
  const total =
    clamp(scores.pain_intensity) +
    clamp(scores.willingness_to_pay) +
    clamp(scores.technical_moat) +
    clamp(scores.distribution_hook) +
    clamp(scores.lean_maintainability);

  if (total >= 20) {
    return {
      total,
      max: 25,
      code: "PROMOTE_TO_LABS",
      label: "PROMOTE TO LABS (G-XX)",
      actionDirective:
        "High engineering mass & commercial pull confirmed. Assign a G-XX product designation, allocate dedicated Labs sprint cycle, and deploy waitlist micro-site.",
      accentColor: "#FF3B1F",
    };
  }

  if (total >= 14) {
    return {
      total,
      max: 25,
      code: "B2B_CASE_STUDY_OPEN_SOURCE",
      label: "B2B CASE STUDY & OPEN SOURCE",
      actionDirective:
        "Strong technical reference architecture, moderate standalone SaaS pull. Package repository under OXAKALABS open-source and leverage as a B2B Systems capability proof.",
      accentColor: "#F59E0B",
    };
  }

  return {
    total,
    max: 25,
    code: "DISPATCH_AND_ARCHIVE",
    label: "DISPATCH & ARCHIVE",
    actionDirective:
      "Insufficient market pull or excessive solo maintenance burden. Extract architectural lessons into a Journal Lab Dispatch and archive cleanly.",
    accentColor: "#71717A",
  };
}
