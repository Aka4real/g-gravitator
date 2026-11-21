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
      className="group inline-flex shrink-0 items-center gap-2.5 rounded-full py-0.5 pr-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF3B1F]"
    >
      {/* Universal brand mark (same geometry as favicon and link previews) */}
      <BrandMark
        size={compact ? 28 : 32}
        title="G-Gravitator"
        className="shrink-0 transition-[filter,transform] duration-150 group-hover:brightness-110 group-active:scale-[0.95]"
      />
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
    </PreloadLink>
  );
}
