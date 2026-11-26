"use client";

import React, { useEffect, useState } from "react";
import { PreloadLink } from "@/components/layout/PreloadLink";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, Menu, X, ArrowUpRight } from "lucide-react";
import { StretchedWordmark } from "@/components/layout/StretchedWordmark";
import { MagneticButton } from "@/components/kinetic/MagneticButton";
import { SPRING_UI } from "@/lib/motion";

interface NavbarProps {
  activeHackathonCount: number;
  onOpenCommandPalette: () => void;
  onOpenScopeDrawer: () => void;
}

const NAV_ITEMS = [
  { label: "Systems", href: "/systems" },
  { label: "Labs", href: "/labs" },
  { label: "Skunkworks", href: "/skunkworks" },
  { label: "Hackathons", href: "/hackathons", showCount: true },
  { label: "Journal", href: "/journal" },
  { label: "Orbit", href: "/orbit" },
];

export function Navbar({
  activeHackathonCount,
  onOpenCommandPalette,
  onOpenScopeDrawer,
}: NavbarProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const [openedAtPath, setOpenedAtPath] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const mobileMenuOpen = openedAtPath !== null && openedAtPath === pathname;
  const isHeroLedRoute = pathname === "/";
  const showSurface = scrolled || mobileMenuOpen || !isHeroLedRoute;

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenedAtPath(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color] duration-200 ${
        showSurface
          ? "border-b border-[var(--hairline)] bg-[#07090D]/88 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        {/* Brand Wordmark (stronger visual presence than menu links) */}
        <StretchedWordmark />

        {/* Single-Line Desktop Navigation */}
        <nav
          aria-label="Primary Navigation"
          className="hidden items-center gap-6 lg:flex"
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href));

            return (
              <PreloadLink
                key={item.href}
                href={item.href}
                id={`nav-link-${item.label.toLowerCase()}`}
                className={`relative inline-flex h-16 items-center gap-1.5 text-[14px] font-medium whitespace-nowrap transition-colors duration-150 ${
                  isActive
                    ? "text-[var(--ink-primary)]"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                }`}
              >
                <span>{item.label}</span>
                {item.showCount && (
                  <span
                    className={`font-tabular text-[13px] ${
                      isActive ? "text-[var(--accent)]" : "text-[var(--ink-muted)]"
                    }`}
                  >
                    {activeHackathonCount}
                  </span>
                )}
                {isActive && (
                  <motion.span
                    layoutId="nav-active-line"
                    transition={SPRING_UI}
                    className="absolute inset-x-0 bottom-0 h-[2px] bg-[var(--accent)]"
                  />
                )}
              </PreloadLink>
            );
          })}
        </nav>

        {/* Right Utility & Single Action */}
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            id="nav-cmd-k-trigger"
            onClick={onOpenCommandPalette}
            aria-label="Open command palette"
            className="press-tactile inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-[var(--hairline-strong)] bg-white/[0.03] px-3.5 text-[13px] font-medium text-[var(--ink-muted)] hover:border-white/30 hover:text-[var(--ink-primary)]"
          >
            <Search className="h-3.5 w-3.5" strokeWidth={1.7} />
            <span className="font-tabular">⌘K</span>
          </button>

          <MagneticButton
            id="nav-initiate-build-btn"
            strength={3}
            onClick={onOpenScopeDrawer}
            className="hidden h-9 items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 text-[14px] font-semibold whitespace-nowrap text-[#07090D] hover:bg-[var(--accent-hover)] sm:inline-flex"
          >
            <span>Initiate build</span>
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </MagneticButton>

          <button
            type="button"
            id="nav-mobile-menu-btn"
            onClick={() =>
              setOpenedAtPath((prev) => (prev === pathname ? null : pathname))
            }
            aria-expanded={mobileMenuOpen}
            aria-controls="nav-mobile-drawer"
            aria-label="Toggle Menu"
            className="press-tactile inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--hairline-strong)] bg-white/[0.04] text-[var(--ink-primary)] hover:bg-white/[0.08] lg:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" strokeWidth={1.7} />
            ) : (
              <Menu className="h-4 w-4" strokeWidth={1.7} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="nav-mobile-drawer"
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -8 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 1, y: 0 }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -6 }
            }
            transition={prefersReducedMotion ? { duration: 0.14 } : SPRING_UI}
            className="border-t border-[var(--hairline)] bg-[#0B0E14]/96 px-5 py-4 backdrop-blur-xl sm:px-8 lg:hidden"
          >
            <nav aria-label="Mobile Navigation" className="divide-y divide-[var(--hairline)]">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href));

                return (
                  <PreloadLink
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpenedAtPath(null)}
                    className={`flex min-h-[48px] items-center justify-between text-[16px] font-medium transition-colors duration-150 ${
                      isActive
                        ? "text-[var(--ink-primary)]"
                        : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.showCount && (
                      <span
                        className={`font-tabular text-[14px] ${
                          isActive ? "text-[var(--accent)]" : "text-[var(--ink-muted)]"
                        }`}
                      >
                        {activeHackathonCount}
                      </span>
                    )}
                  </PreloadLink>
                );
              })}
            </nav>

            <div className="mt-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  setOpenedAtPath(null);
                  onOpenScopeDrawer();
                }}
                className="press-tactile inline-flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--accent)] px-5 text-[14px] font-semibold text-[#07090D] hover:bg-[var(--accent-hover)]"
              >
                <span>Initiate build</span>
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
