"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { SPRING_UI } from "@/lib/motion";

interface StretchedWordmarkProps {
  compact?: boolean;
}

export function StretchedWordmark({ compact = false }: StretchedWordmarkProps) {
  const prefersReducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  const stretchActive = !prefersReducedMotion && hovered;

  return (
    <Link
      href="/"
      id="nav-brand-wordmark"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      className="group inline-flex shrink-0 items-center gap-2.5 rounded-full py-0.5 pr-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF3B1F]"
    >
      {/* Sculpted Gravity Monogram */}
      <span
        className={`relative flex shrink-0 items-center justify-center rounded-lg bg-[#FF3B1F] text-[#08080A] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition-[background-color,transform] duration-150 group-hover:bg-[#FF5238] group-active:scale-[0.95] ${
          compact ? "h-7 w-7" : "h-8 w-8"
        }`}
      >
        <span
          className={`font-display font-extrabold tracking-[-0.04em] select-none ${
            compact ? "text-[11px]" : "text-[12.5px]"
          }`}
        >
          GG
        </span>
      </span>

      {/* Sculpted Wordmark */}
      <span
        className={`font-display inline-flex items-center font-bold tracking-[-0.03em] text-[#F4F3EF] ${
          compact ? "text-[14px]" : "text-[15.5px]"
        }`}
      >
        <span>G</span>
        <motion.span
          aria-hidden="true"
          animate={{
            width: stretchActive ? 20 : 10,
            backgroundColor: stretchActive ? "#FF3B1F" : "rgba(244, 243, 239, 0.55)",
          }}
          transition={SPRING_UI}
          className="mx-1.5 inline-block h-[2px] rounded-full"
        />
        <span>Gravitator</span>
      </span>
    </Link>
  );
}
