"use client";

import React from "react";
import { motion, useReducedMotion, type Transition, type Variants } from "framer-motion";

/**
 * Apple-style critically damped spring for everyday UI transitions (no overshoot).
 */
export const SPRING_UI: Transition = {
  type: "spring",
  duration: 0.4,
  bounce: 0,
};

/**
 * Subtle momentum spring for right-anchored sheets and floating drawers.
 */
export const SPRING_SHEET: Transition = {
  type: "spring",
  duration: 0.36,
  bounce: 0.1,
};

/**
 * Physics config for Motion useSpring on pointer-driven magnetic controls.
 */
export const SPRING_MAGNETIC = {
  stiffness: 320,
  damping: 28,
  mass: 0.6,
};

/**
 * Strong exponential ease-out for entering/revealing surfaces.
 */
export const EASE_OUT_EXPO = [0.23, 1, 0.32, 1] as const;

/**
 * Smooth ease-in-out for on-screen layout/state transitions.
 */
export const EASE_IN_OUT_SMOOTH = [0.77, 0, 0.175, 1] as const;

/**
 * iOS-inspired drawer curve.
 */
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

/**
 * Shared scroll-reveal viewport configuration.
 */
export const VIEWPORT_ONCE = {
  once: true,
  margin: "-80px",
} as const;

export interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "section" | "article" | "header";
}

export function Reveal({
  children,
  className = "",
  delay = 0,
  y = 14,
  as = "div",
}: RevealProps) {
  const prefersReduced = useReducedMotion();

  const initial = prefersReduced ? { opacity: 0 } : { opacity: 0, y };
  const animateIn = prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 };
  const transition: Transition = prefersReduced
    ? { duration: 0.18, delay: 0, ease: "easeOut" }
    : { duration: 0.48, delay, ease: EASE_OUT_EXPO };

  const Component =
    as === "section"
      ? motion.section
      : as === "article"
      ? motion.article
      : as === "header"
      ? motion.header
      : motion.div;

  return React.createElement(
    Component,
    {
      initial,
      whileInView: animateIn,
      viewport: VIEWPORT_ONCE,
      transition,
      className,
    },
    children
  );
}

export interface StaggerGroupProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  delayChildren?: number;
}

export function StaggerGroup({
  children,
  className = "",
  staggerDelay = 0.055,
  delayChildren = 0.04,
}: StaggerGroupProps) {
  const prefersReduced = useReducedMotion();

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: prefersReduced
        ? { staggerChildren: 0, delayChildren: 0 }
        : { staggerChildren: staggerDelay, delayChildren },
    },
  };

  return React.createElement(
    motion.div,
    {
      variants: containerVariants,
      initial: "hidden",
      whileInView: "visible",
      viewport: VIEWPORT_ONCE,
      className,
    },
    children
  );
}

export interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  y?: number;
}

export function StaggerItem({
  children,
  className = "",
  y = 14,
}: StaggerItemProps) {
  const prefersReduced = useReducedMotion();

  const itemVariants: Variants = {
    hidden: prefersReduced ? { opacity: 0 } : { opacity: 0, y },
    visible: prefersReduced
      ? {
          opacity: 1,
          transition: { duration: 0.18, ease: "easeOut" },
        }
      : {
          opacity: 1,
          y: 0,
          transition: { duration: 0.44, ease: EASE_OUT_EXPO },
        },
  };

  return React.createElement(
    motion.div,
    {
      variants: itemVariants,
      className,
    },
    children
  );
}
