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

export function CountdownTimer({
  deadlineAt,
  compact = false,
}: CountdownTimerProps) {
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
      <span className="font-tabular inline-flex items-center text-[14px] font-medium text-[var(--ink-muted)]">
        {formatStableUtcDeadline(deadlineAt)}
      </span>
    );
  }

  if (remainingMs <= 0) {
    return (
      <span className="font-tabular inline-flex items-center text-[14px] font-medium text-[var(--ink-muted)]">
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
      className={`font-tabular inline-flex items-center text-[14px] font-semibold whitespace-nowrap ${
        isUrgent
          ? "text-[#FF6B54]"
          : isWarning
          ? "text-[#FBBF24]"
          : "text-[var(--ink-primary)]"
      }`}
    >
      {pad(days)}d {pad(hours)}h {pad(minutes)}m
      {!compact && ` ${pad(seconds)}s`}
    </span>
  );
}
