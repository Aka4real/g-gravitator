"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { HEAVY_PRECISION_SPRING } from "@/components/kinetic/MagneticButton";

interface StretchedWordmarkProps {
  compact?: boolean;
}

export function StretchedWordmark({ compact = false }: StretchedWordmarkProps) {
  const prefersReducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [initialPulse, setInitialPulse] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setInitialPulse(false), 950);
    return () => clearTimeout(timer);
  }, []);

  const stretchActive = !prefersReducedMotion && (hovered || initialPulse);

  return (
    <Link
      href="/"
      id="nav-brand-wordmark"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group inline-flex items-center gap-3 focus:outline-none"
    >
      {/* The Gravity Stamp (32px x 32px precision-cut geometric GG monogram) */}
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center bg-[#FF3B1F] text-[#09090B] transition-colors duration-150 group-hover:bg-[#F3F2EE]">
        <span className="font-display text-[13px] font-extrabold tracking-[-0.06em] select-none">
          GG
        </span>
        <span className="absolute right-0.5 bottom-0.5 h-1 w-1 bg-[#09090B]" />
      </span>

      {/* The Stretched Vector Wordmark: G—GRAVITATOR */}
      <span
        className={`font-display inline-flex items-center font-extrabold tracking-[-0.03em] text-[#F3F2EE] ${
          compact ? "text-sm" : "text-[15px] sm:text-base"
        }`}
      >
        <span>G</span>
        <motion.span
          aria-hidden="true"
          animate={{
            width: stretchActive ? 28 : 12,
            backgroundColor: stretchActive ? "#FF3B1F" : "#F3F2EE",
          }}
          transition={HEAVY_PRECISION_SPRING}
          className="mx-1 inline-block h-[2px] origin-left"
        />
        <span>GRAVITATOR</span>
      </span>
    </Link>
  );
}
