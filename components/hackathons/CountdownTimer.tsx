"use client";

import React, { useEffect, useState } from "react";

interface CountdownTimerProps {
  deadlineAt: string;
  compact?: boolean;
}

export function CountdownTimer({ deadlineAt, compact = false }: CountdownTimerProps) {
  const [remainingMs, setRemainingMs] = useState<number>(() => {
    return Math.max(0, new Date(deadlineAt).getTime() - Date.now());
  });

  useEffect(() => {
    const update = () => {
      setRemainingMs(Math.max(0, new Date(deadlineAt).getTime() - Date.now()));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadlineAt]);

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isUrgent = remainingMs > 0 && remainingMs < 48 * 3600 * 1000;
  const isWarning =
    remainingMs >= 48 * 3600 * 1000 && remainingMs < 72 * 3600 * 1000;

  const pad = (n: number) => String(n).padStart(2, "0");

  if (remainingMs <= 0) {
    return (
      <span className="font-mono-telemetry text-[11px] text-[#71717A]">
        WINDOW CLOSED
      </span>
    );
  }

  return (
    <span
      className={`font-mono-telemetry inline-flex items-center gap-1.5 ${
        compact ? "text-[11px]" : "text-xs"
      } font-semibold ${
        isUrgent
          ? "text-[#FF3B1F]"
          : isWarning
          ? "text-[#F59E0B]"
          : "text-[#F3F2EE]"
      }`}
    >
      {isUrgent && (
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 animate-pulse bg-[#FF3B1F]"
        />
      )}
      <span>
        {pad(days)}D : {pad(hours)}H : {pad(minutes)}M
        {!compact && ` : ${pad(seconds)}S`}
      </span>
    </span>
  );
}
