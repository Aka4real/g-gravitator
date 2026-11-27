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
  twitter: "X",
};

export function SourceBadges({ sources }: { sources: HackathonSource[] }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs font-medium text-[#A1A1AA]">
      {sources.map((src, idx) => {
        const isTwitter = src.provider === "twitter";
        return (
          <React.Fragment key={src.provider}>
            {idx > 0 && (
              <span aria-hidden="true" className="text-white/25">
                ·
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 whitespace-nowrap ${
                isTwitter ? "text-[#FF8A7A]" : "text-[#D4D4D8]"
              }`}
            >
              {isTwitter ? (
                <>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-3 w-3 shrink-0 fill-current"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span className="sr-only">X (Twitter)</span>
                </>
              ) : (
                <span>{PROVIDER_LABELS[src.provider] ?? src.provider}</span>
              )}
            </span>
          </React.Fragment>
        );
      })}
    </span>
  );
}

export function OxakalabsStatusBadge({ status }: { status: OxakalabsStatus }) {
  if (!status || status === "NONE") return null;

  const styles: Record<
    Exclude<OxakalabsStatus, "NONE">,
    { label: string; text: string; dot: string }
  > = {
    SCOUTING: {
      label: "Scouting",
      text: "text-[#FBBF24]",
      dot: "bg-[#F59E0B]",
    },
    SQUAD_DEPLOYED: {
      label: "Squad deployed",
      text: "text-[#FF8A7A]",
      dot: "bg-[#FF3B1F]",
    },
    SUBMITTED: {
      label: "Submitted",
      text: "text-[#93C5FD]",
      dot: "bg-[#3B82F6]",
    },
    WON: {
      label: "Podium win",
      text: "text-[#34D399]",
      dot: "bg-[#10B981]",
    },
  };

  const cfg = styles[status];
  return (
    <span
      title={`OXAKALABS status: ${cfg.label}`}
      className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-medium whitespace-nowrap ${cfg.text}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      <span>{cfg.label}</span>
    </span>
  );
}
