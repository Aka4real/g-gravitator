import React from "react";
import type { HackathonProvider, HackathonSource, OxakalabsStatus } from "@/lib/supabase/types";

const PROVIDER_LABELS: Record<HackathonProvider, string> = {
  devpost: "DEVPOST",
  dorahacks: "DORAHACKS",
  lablab: "LABLAB.AI",
  mlh: "MLH",
  luma: "LUMA // CV",
  devfolio: "DEVFOLIO",
  ethglobal: "ETHGLOBAL",
  kaggle: "KAGGLE",
  unstop: "UNSTOP",
  twitter: "X // SIGNAL",
};

export function SourceBadges({ sources }: { sources: HackathonSource[] }) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1.5">
      {sources.map((src) => {
        const isTwitter = src.provider === "twitter";
        return (
          <span
            key={src.provider}
            className={`font-mono-telemetry inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium ${
              isTwitter
                ? "border border-[#FF3B1F]/60 bg-[#FF3B1F]/15 text-[#FF3B1F]"
                : "border border-[#27272A] bg-[#09090B] text-[#A1A1AA]"
            }`}
          >
            {isTwitter && (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-2.5 w-2.5 fill-current"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            )}
            <span>{PROVIDER_LABELS[src.provider] ?? src.provider.toUpperCase()}</span>
          </span>
        );
      })}
    </div>
  );
}

export function OxakalabsStatusBadge({ status }: { status: OxakalabsStatus }) {
  if (!status || status === "NONE") return null;

  const styles: Record<Exclude<OxakalabsStatus, "NONE">, { label: string; cls: string }> = {
    SCOUTING: {
      label: "OXA // SCOUTING",
      cls: "border-[#F59E0B]/50 bg-[#F59E0B]/10 text-[#F59E0B]",
    },
    SQUAD_DEPLOYED: {
      label: "OXA // SQUAD DEPLOYED",
      cls: "border-[#FF3B1F]/60 bg-[#FF3B1F]/15 text-[#FF3B1F]",
    },
    SUBMITTED: {
      label: "OXA // SUBMITTED",
      cls: "border-[#3B82F6]/50 bg-[#3B82F6]/10 text-[#3B82F6]",
    },
    WON: {
      label: "OXA // PODIUM WIN",
      cls: "border-[#10B981]/60 bg-[#10B981]/15 text-[#10B981]",
    },
  };

  const cfg = styles[status];
  return (
    <span
      className={`font-mono-telemetry inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] font-semibold ${cfg.cls}`}
    >
      <span className="h-1.5 w-1.5 bg-current" />
      <span>{cfg.label}</span>
    </span>
  );
}
