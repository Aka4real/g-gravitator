"use client";

import React, { useState } from "react";
import { PreloadLink } from "@/components/layout/PreloadLink";
import { motion, useReducedMotion } from "framer-motion";
import { SPRING_UI } from "@/lib/motion";
import { BrandMark } from "@/lib/brand/mark";

interface StretchedWordmarkProps {
  compact?: boolean;
}

export function StretchedWordmark({ compact = false }: StretchedWordmarkProps) {
  const prefersReducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  const stretchActive = !prefersReducedMotion && hovered;

  return (
    <PreloadLink
      href="/"
      id="nav-brand-wordmark"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      className="group inline-flex shrink-0 items-center gap-3 rounded-md py-1 pr-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
    >
      <BrandMark
        size={compact ? 26 : 30}
        title="G-Gravitator"
        className="shrink-0 transition-[filter,transform] duration-150 group-hover:brightness-110 group-active:scale-[0.96]"
      />
      <span
        className={`font-display inline-flex items-center font-bold tracking-[-0.035em] text-[var(--ink-primary)] ${
          compact ? "text-[16px]" : "text-[19px]"
        }`}
      >
        <span>G</span>
        <motion.span
          aria-hidden="true"
          animate={{
            width: stretchActive ? 22 : 10,
            backgroundColor: stretchActive ? "#FF3B1F" : "rgba(242, 244, 248, 0.6)",
          }}
          transition={SPRING_UI}
          className="mx-1.5 inline-block h-[2px]"
        />
        <span>Gravitator</span>
      </span>
    </PreloadLink>
  );
}
