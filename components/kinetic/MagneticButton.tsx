"use client";

import React, { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export const HEAVY_PRECISION_SPRING = {
  type: "spring" as const,
  stiffness: 260,
  damping: 28,
  mass: 1.2,
};

export const KINETIC_SNAP_SPRING = {
  type: "spring" as const,
  stiffness: 420,
  damping: 32,
  mass: 0.8,
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
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (prefersReducedMotion || disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = ((e.clientX - centerX) / (rect.width / 2)) * strength;
    const deltaY = ((e.clientY - centerY) / (rect.height / 2)) * strength;
    setOffset({
      x: Math.max(-strength, Math.min(strength, deltaX)),
      y: Math.max(-strength, Math.min(strength, deltaY)),
    });
  };

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={ref}
      id={id}
      title={title}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: offset.x, y: offset.y }}
      transition={KINETIC_SNAP_SPRING}
      className={`cursor-pointer select-none ${className}`}
    >
      {children}
    </motion.button>
  );
}
