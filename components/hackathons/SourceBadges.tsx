import React from "react";
import type {
  HackathonProvider,
  HackathonSource,
  OxakalabsStatus,
} from "@/lib/supabase/types";

const PROVIDER_LABELS: Record<HackathonProvider, string> = {
  devpost: "Devpost",
  dorahacks: "DoraHacks",
  lablab: "Lablab.ai",
  mlh: "MLH",
  luma: "Luma",
  devfolio: "Devfolio",
  ethglobal: "ETHGlobal",
  kaggle: "Kaggle",
  unstop: "Unstop",
  twitter: "X Signal",
};

export function SourceBadges({ sources }: { sources: HackathonSource[] }) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1.5">
      {sources.map((src) => {
        const isTwitter = src.provider === "twitter";
        return (
          <span
            key={src.provider}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${
              isTwitter
                ? "border-[#FF3B1F]/35 bg-[#FF3B1F]/12 text-[#FF8A7A]"
                : "border-white/[0.09] bg-white/[0.04] text-[#D4D4D8]"
            }`}
          >
            {isTwitter && (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-2.5 w-2.5 shrink-0 fill-current"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            )}
            <span>{PROVIDER_LABELS[src.provider] ?? src.provider}</span>
          </span>
        );
      })}
    </div>
  );
}

export function OxakalabsStatusBadge({ status }: { status: OxakalabsStatus }) {
  if (!status || status === "NONE") return null;

  const styles: Record<
    Exclude<OxakalabsStatus, "NONE">,
    { label: string; cls: string; dot: string }
  > = {
    SCOUTING: {
      label: "OXA Scouting",
      cls: "border-[#F59E0B]/30 bg-[#F59E0B]/12 text-[#FBBF24]",
      dot: "bg-[#F59E0B]",
    },
    SQUAD_DEPLOYED: {
      label: "OXA Squad deployed",
      cls: "border-[#FF3B1F]/35 bg-[#FF3B1F]/15 text-[#FF8A7A]",
      dot: "bg-[#FF3B1F]",
    },
    SUBMITTED: {
      label: "OXA Submitted",
      cls: "border-[#3B82F6]/35 bg-[#3B82F6]/15 text-[#93C5FD]",
      dot: "bg-[#3B82F6]",
    },
    WON: {
      label: "OXA Podium win",
      cls: "border-[#10B981]/35 bg-[#10B981]/15 text-[#34D399]",
      dot: "bg-[#10B981]",
    },
  };

  const cfg = styles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${cfg.cls}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      <span>{cfg.label}</span>
    </span>
  );
}
