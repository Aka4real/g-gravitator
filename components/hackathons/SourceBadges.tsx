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
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] font-medium">
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
              className={`inline-flex items-center gap-1.5 whitespace-nowrap ${
                isTwitter
                  ? "text-[#FF7A63]"
                  : "text-[var(--ink-muted)]"
              }`}
            >
              {isTwitter && (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-3 w-3 shrink-0 fill-current"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              )}
              <span>{PROVIDER_LABELS[src.provider] ?? src.provider}</span>
            </span>
          </React.Fragment>
        );
      })}
    </span>
  );
}

export function OxakalabsStatusBadge({
  status,
  variant = "inline",
}: {
  status: OxakalabsStatus;
  variant?: "inline" | "table";
}) {
  if (!status || status === "NONE") return null;

  const styles: Record<
    Exclude<OxakalabsStatus, "NONE">,
    { label: string; textCls: string; cellCls: string }
  > = {
    SCOUTING: {
      label: "OXA Scouting",
      textCls: "text-[#FBBF24]",
      cellCls: "border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#FBBF24]",
    },
    SQUAD_DEPLOYED: {
      label: "OXA Squad deployed",
      textCls: "text-[#FF7A63]",
      cellCls: "border-[#FF3B1F]/35 bg-[#FF3B1F]/12 text-[#FF8A7A]",
    },
    SUBMITTED: {
      label: "OXA Submitted",
      textCls: "text-[#93C5FD]",
      cellCls: "border-[#3B82F6]/35 bg-[#3B82F6]/12 text-[#93C5FD]",
    },
    WON: {
      label: "OXA Podium win",
      textCls: "text-[#34D399]",
      cellCls: "border-[#10B981]/35 bg-[#10B981]/12 text-[#34D399]",
    },
  };

  const cfg = styles[status];

  if (variant === "table") {
    return (
      <span
        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[13px] font-medium whitespace-nowrap ${cfg.cellCls}`}
      >
        {cfg.label}
      </span>
    );
  }

  return (
    <span className={`text-[14px] font-medium whitespace-nowrap ${cfg.textCls}`}>
      {cfg.label}
    </span>
  );
}
