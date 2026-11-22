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
  const mobileMenuOpen = openedAtPath !== null && openedAtPath === pathname;

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenedAtPath(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-40 px-4 sm:px-6">
      <div className="mx-auto max-w-[1360px]">
        <div className="glass-chrome pointer-events-auto flex h-14 items-center justify-between gap-2 rounded-full px-3 sm:px-4 lg:px-5">
          {/* Brand Wordmark */}
          <StretchedWordmark />

          {/* Center Single-Line Desktop Navigation */}
          <nav
            aria-label="Primary Navigation"
            className="hidden items-center gap-0.5 lg:flex"
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
                  className={`relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13.5px] font-medium whitespace-nowrap transition-colors duration-150 ${
                    isActive
                      ? "text-[#F4F3EF]"
                      : "text-[#A1A1AA] hover:text-[#F4F3EF]"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      transition={SPRING_UI}
                      className="absolute inset-0 -z-10 rounded-full bg-white/[0.1] ring-1 ring-inset ring-white/[0.1]"
                    />
                  )}
                  <span>{item.label}</span>
                  {item.showCount && (
                    <span
                      className={`font-mono-telemetry rounded-full px-1.5 py-0.5 text-[11px] leading-none font-medium ${
                        isActive
                          ? "bg-[#FF3B1F] text-[#08080A] font-semibold"
                          : "bg-white/[0.08] text-[#D4D4D8]"
                      }`}
                    >
                      {activeHackathonCount}
                    </span>
                  )}
                </PreloadLink>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Command Palette Trigger */}
            <button
              type="button"
              id="nav-cmd-k-trigger"
              onClick={onOpenCommandPalette}
              aria-label="Open command palette"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/[0.09] bg-white/[0.04] px-3 text-xs font-medium text-[#A1A1AA] transition-[background-color,border-color,color,transform] duration-150 hover:border-white/[0.16] hover:bg-white/[0.09] hover:text-[#F4F3EF] active:scale-[0.97]"
            >
              <Search className="h-3.5 w-3.5 text-[#A1A1AA]" strokeWidth={1.6} />
              <kbd className="font-mono-telemetry text-[11px] text-current">⌘K</kbd>
            </button>

            {/* Primary CTA: Initiate build */}
            <MagneticButton
              id="nav-initiate-build-btn"
              strength={4}
              onClick={onOpenScopeDrawer}
              className="hidden h-9 items-center gap-1.5 rounded-full bg-[#FF3B1F] px-4 text-[13px] font-semibold whitespace-nowrap text-[#08080A] hover:bg-[#FF5238] sm:inline-flex"
            >
              <span>Initiate build</span>
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
            </MagneticButton>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              id="nav-mobile-menu-btn"
              onClick={() =>
                setOpenedAtPath((prev) => (prev === pathname ? null : pathname))
              }
              aria-expanded={mobileMenuOpen}
              aria-controls="nav-mobile-drawer"
              aria-label="Toggle Menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.05] text-[#F4F3EF] transition-[background-color,transform] duration-150 hover:bg-white/[0.1] active:scale-[0.95] lg:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" strokeWidth={1.6} />
              ) : (
                <Menu className="h-4 w-4" strokeWidth={1.6} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Floating Translucent Panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="nav-mobile-drawer"
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -8, scale: 0.98 }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 1, y: 0, scale: 1 }
              }
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -6, scale: 0.98 }
              }
              transition={
                prefersReducedMotion ? { duration: 0.14 } : SPRING_UI
              }
              style={{ transformOrigin: "top center" }}
              className="glass-chrome pointer-events-auto mt-2.5 overflow-hidden rounded-2xl p-2.5 lg:hidden"
            >
              <nav aria-label="Mobile Navigation" className="flex flex-col gap-0.5">
                {NAV_ITEMS.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname?.startsWith(item.href));

                  return (
                    <PreloadLink
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpenedAtPath(null)}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 text-[15px] font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.98] ${
                        isActive
                          ? "bg-white/[0.1] text-[#F4F3EF]"
                          : "text-[#A1A1AA] hover:bg-white/[0.05] hover:text-[#F4F3EF]"
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.showCount && (
                        <span
                          className={`font-mono-telemetry rounded-full px-2 py-0.5 text-xs font-semibold ${
                            isActive
                              ? "bg-[#FF3B1F] text-[#08080A]"
                              : "bg-white/[0.08] text-[#D4D4D8]"
                          }`}
                        >
                          {activeHackathonCount}
                        </span>
                      )}
                    </PreloadLink>
                  );
                })}
              </nav>

              <div className="mt-2.5 flex items-center gap-2 border-t border-white/[0.08] pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setOpenedAtPath(null);
                    onOpenScopeDrawer();
                  }}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#FF3B1F] px-5 text-sm font-semibold text-[#08080A] transition-[background-color,transform] duration-150 hover:bg-[#FF5238] active:scale-[0.98]"
                >
                  <span>Initiate build</span>
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
