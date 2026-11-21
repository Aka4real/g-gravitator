"use client";

import React, { useEffect, useState } from "react";

interface CountdownTimerProps {
  deadlineAt: string;
  compact?: boolean;
}

const UTC_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function formatStableUtcDeadline(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--";
  const month = UTC_MONTHS[date.getUTCMonth()];
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${month} ${day} UTC`;
}

export function CountdownTimer({ deadlineAt, compact = false }: CountdownTimerProps) {
  // Always start null so SSR and initial client hydration produce identical markup.
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    const targetMs = new Date(deadlineAt).getTime();
    const update = () => {
      if (Number.isNaN(targetMs)) {
        setRemainingMs(0);
        return;
      }
      setRemainingMs(Math.max(0, targetMs - Date.now()));
    };
    const kickoff = window.setTimeout(update, 0);
    const interval = window.setInterval(update, 1000);
    return () => {
      window.clearTimeout(kickoff);
      window.clearInterval(interval);
    };
  }, [deadlineAt]);

  if (remainingMs === null) {
    return (
      <span
        className={`font-mono-telemetry inline-flex items-center font-medium text-[#A1A1AA] ${
          compact ? "text-xs" : "text-[13px]"
        }`}
      >
        {formatStableUtcDeadline(deadlineAt)}
      </span>
    );
  }

  if (remainingMs <= 0) {
    return (
      <span
        className={`font-mono-telemetry inline-flex items-center font-medium text-[#8B8B94] ${
          compact ? "text-xs" : "text-[13px]"
        }`}
      >
        Window closed
      </span>
    );
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isUrgent = remainingMs > 0 && remainingMs < 48 * 3600 * 1000;
  const isWarning =
    remainingMs >= 48 * 3600 * 1000 && remainingMs < 72 * 3600 * 1000;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <span
      className={`font-mono-telemetry inline-flex items-center gap-1.5 font-semibold whitespace-nowrap ${
        compact ? "text-xs" : "text-[13px]"
      } ${
        isUrgent
          ? "text-[#FF6B54]"
          : isWarning
          ? "text-[#FBBF24]"
          : "text-[#F4F3EF]"
      }`}
    >
      {isUrgent && (
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[#FF3B1F]"
        />
      )}
      <span>
        {pad(days)}d {pad(hours)}h {pad(minutes)}m
        {!compact && ` ${pad(seconds)}s`}
      </span>
    </span>
  );
}
