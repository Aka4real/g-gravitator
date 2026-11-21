"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { SPRING_MAGNETIC, SPRING_UI } from "@/lib/motion";

/** Preserved exports for backward compatibility */
export const HEAVY_PRECISION_SPRING = SPRING_UI;

export const KINETIC_SNAP_SPRING = {
  type: "spring" as const,
  duration: 0.3,
  bounce: 0,
};

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  id?: string;
  title?: string;
  "aria-label"?: string;
}

export function MagneticButton({
  children,
  className = "",
  strength = 6,
  onClick,
  type = "button",
  disabled = false,
  id,
  title,
  "aria-label": ariaLabel,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING_MAGNETIC);
  const y = useSpring(rawY, SPRING_MAGNETIC);

  const canUseFinePointer = () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (
      prefersReducedMotion ||
      disabled ||
      e.pointerType !== "mouse" ||
      !canUseFinePointer() ||
      !ref.current
    ) {
      return;
    }

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = ((e.clientX - centerX) / (rect.width / 2)) * strength;
    const deltaY = ((e.clientY - centerY) / (rect.height / 2)) * strength;

    rawX.set(Math.max(-strength, Math.min(strength, deltaX)));
    rawY.set(Math.max(-strength, Math.min(strength, deltaY)));
  };

  const handlePointerLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <motion.button
      ref={ref}
      id={id}
      title={title}
      aria-label={ariaLabel}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={prefersReducedMotion ? undefined : { x, y }}
      className={`cursor-pointer select-none transition-[background-color,border-color,color,scale] duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100 ${className}`}
    >
      {children}
    </motion.button>
  );
}
