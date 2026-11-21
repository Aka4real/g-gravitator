"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Command, Menu, X, ArrowUpRight } from "lucide-react";
import { StretchedWordmark } from "@/components/layout/StretchedWordmark";
import { MagneticButton } from "@/components/kinetic/MagneticButton";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 h-16 w-full border-b border-[#27272A] bg-[#09090B]/90 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Gravity Stamp (GG) + Stretched Vector Wordmark */}
        <StretchedWordmark />

        {/* Center Navigation (Desktop) */}
        <nav
          aria-label="Primary Navigation"
          className="hidden items-center gap-1 lg:flex"
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                id={`nav-link-${item.label.toLowerCase()}`}
                className={`relative inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium transition-colors ${
                  isActive
                    ? "text-[#F3F2EE]"
                    : "text-[#A1A1AA] hover:text-[#F3F2EE]"
                }`}
              >
                <span>{item.label}</span>
                {item.showCount && (
                  <span
                    className={`font-mono-telemetry px-1.5 py-0.5 text-[10px] leading-none ${
                      isActive
                        ? "bg-[#FF3B1F] text-[#09090B] font-semibold"
                        : "border border-[#27272A] bg-[#111114] text-[#FF3B1F]"
                    }`}
                  >
                    {activeHackathonCount}
                  </span>
                )}
                {isActive && (
                  <span className="absolute right-3 bottom-0 left-3 h-[2px] bg-[#FF3B1F]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Utilities */}
        <div className="flex items-center gap-2.5">
          {/* Live Signal Telemetry Dot */}
          <Link
            href="/admin"
            title="Curator Console & Telemetry Status"
            className="hidden items-center gap-2 border border-[#27272A] bg-[#111114] px-2.5 py-1.5 text-[10px] text-[#A1A1AA] transition-colors hover:border-[#3F3F46] hover:text-[#F3F2EE] xl:inline-flex"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
            <span className="font-mono-telemetry">SYS: NOMINAL</span>
          </Link>

          {/* Command Palette Trigger (⌘K) */}
          <button
            type="button"
            id="nav-cmd-k-trigger"
            onClick={onOpenCommandPalette}
            className="inline-flex items-center gap-2 border border-[#27272A] bg-[#111114] px-2.5 py-1.5 text-xs text-[#A1A1AA] transition-colors hover:border-[#3F3F46] hover:text-[#F3F2EE]"
          >
            <Command className="h-3.5 w-3.5 text-[#FF3B1F]" strokeWidth={1.5} />
            <span className="font-mono-telemetry text-[11px]">⌘K</span>
          </button>

          {/* Primary CTA Button: Initiate Build */}
          <MagneticButton
            id="nav-initiate-build-btn"
            strength={5}
            onClick={onOpenScopeDrawer}
            className="font-mono-telemetry hidden items-center gap-1.5 bg-[#FF3B1F] px-3.5 py-2 text-[11px] font-semibold text-[#09090B] transition-colors hover:bg-[#F3F2EE] sm:inline-flex"
          >
            <span>INITIATE BUILD</span>
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.8} />
          </MagneticButton>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            id="nav-mobile-menu-btn"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="inline-flex items-center justify-center border border-[#27272A] bg-[#111114] p-2 text-[#F3F2EE] lg:hidden"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <Menu className="h-4 w-4" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-[#27272A] bg-[#09090B] px-4 py-4 lg:hidden">
          <div className="grid grid-cols-2 gap-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between border border-[#27272A] bg-[#111114] px-3.5 py-2.5 text-xs font-medium text-[#F3F2EE]"
              >
                <span>{item.label}</span>
                {item.showCount && (
                  <span className="font-mono-telemetry bg-[#FF3B1F] px-1.5 py-0.5 text-[10px] font-bold text-[#09090B]">
                    {activeHackathonCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenScopeDrawer();
              }}
              className="font-mono-telemetry flex-1 bg-[#FF3B1F] py-2.5 text-center text-xs font-semibold text-[#09090B]"
            >
              INITIATE BUILD →
            </button>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="font-mono-telemetry border border-[#27272A] bg-[#111114] px-3 py-2.5 text-[11px] text-[#A1A1AA]"
            >
              ADMIN
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
