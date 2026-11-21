"use client";

import React, { useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { ScopeDrawer } from "@/components/systems/ScopeDrawer";
import type { ServiceTierKey } from "@/lib/supabase/types";

interface ArchitecturalShellProps {
  children: React.ReactNode;
  activeHackathonCount: number;
}

export function ArchitecturalShell({
  children,
  activeHackathonCount,
}: ArchitecturalShellProps) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [scopeTier, setScopeTier] = useState<ServiceTierKey>("VELOCITY_MVP");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    const handleCustomScope = (e: Event) => {
      const custom = e as CustomEvent<{ tier?: ServiceTierKey }>;
      if (custom.detail?.tier) {
        setScopeTier(custom.detail.tier);
      }
      setScopeOpen(true);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("gg:open-scope-drawer", handleCustomScope);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("gg:open-scope-drawer", handleCustomScope);
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex min-h-screen flex-col bg-[#08080A] text-[#F4F3EF]">
        {/* Soft scroll-edge top vignette so scrolling content glides cleanly under floating nav */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-30 h-24 bg-gradient-to-b from-[#08080A]/90 via-[#08080A]/45 to-transparent"
        />

        <Navbar
          activeHackathonCount={activeHackathonCount}
          onOpenCommandPalette={() => setCommandOpen(true)}
          onOpenScopeDrawer={() => setScopeOpen(true)}
        />

        <main className="flex-1 pt-[76px]">{children}</main>

        <Footer />

        <CommandPalette
          open={commandOpen}
          onClose={() => setCommandOpen(false)}
          onOpenScopeDrawer={() => setScopeOpen(true)}
        />

        <ScopeDrawer
          open={scopeOpen}
          initialTier={scopeTier}
          onClose={() => setScopeOpen(false)}
        />
      </div>
    </MotionConfig>
  );
}
