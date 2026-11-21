"use client";

import React, { useEffect, useState } from "react";
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
    <div className="flex min-h-screen flex-col bg-[#09090B] text-[#F3F2EE]">
      <Navbar
        activeHackathonCount={activeHackathonCount}
        onOpenCommandPalette={() => setCommandOpen(true)}
        onOpenScopeDrawer={() => setScopeOpen(true)}
      />
      <main className="flex-1">{children}</main>
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
  );
}
