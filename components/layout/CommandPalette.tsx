"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowUpRight, CornerDownLeft, X } from "lucide-react";
import type { GlobalSearchResult } from "@/lib/supabase/types";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onOpenScopeDrawer: () => void;
}

export function CommandPalette({
  open,
  onClose,
  onOpenScopeDrawer,
}: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null);

  const loading = open && loadedQuery !== query;

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    inputRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const currentQuery = query;
    fetch(`/api/search?q=${encodeURIComponent(currentQuery)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setResults(Array.isArray(data.results) ? data.results : []);
        setSelectedIndex(0);
        setLoadedQuery(currentQuery);
      })
      .catch(() => {
        if (active) setLoadedQuery(currentQuery);
      });
    return () => {
      active = false;
    };
  }, [query, open]);

  // Intentional zero open/close animation for keyboard-initiated command palette (Raycast rule)
  if (!open) return null;

  const executeSelection = (item: GlobalSearchResult | undefined) => {
    if (!item) return;
    onClose();
    if (item.id === "action-audit") {
      onOpenScopeDrawer();
      return;
    }
    router.push(item.href);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length ? (prev + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        results.length ? (prev - 1 + results.length) % results.length : 0
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      executeSelection(results[selectedIndex]);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/65 px-4 pt-[12vh] backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="glass-chrome w-full max-w-2xl overflow-hidden rounded-2xl text-[#F4F3EF]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-4">
          <Search className="h-4 w-4 shrink-0 text-[#FF3B1F]" strokeWidth={1.7} />
          <input
            ref={inputRef}
            id="cmd-palette-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search divisions, Labs drops, hackathons, dispatches, or actions..."
            aria-label="Search G-Gravitator"
            className="w-full bg-transparent text-[15px] text-[#F4F3EF] placeholder:text-[#8B8B94] focus:outline-none"
          />
          {loading && (
            <span className="shrink-0 text-xs text-[#8B8B94]">Searching...</span>
          )}
          <button
            type="button"
            onClick={onClose}
            id="cmd-palette-close"
            aria-label="Close command palette"
            className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-white/[0.1] bg-white/[0.05] px-2 py-1 font-mono-telemetry text-[11px] text-[#A1A1AA] transition-colors hover:bg-white/[0.1] hover:text-[#F4F3EF] active:scale-[0.97]"
          >
            <span>Esc</span>
            <X className="h-3 w-3" strokeWidth={1.6} />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] space-y-0.5 overflow-y-auto p-2.5">
          {results.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-[#A1A1AA]">
                {loading
                  ? "Loading index..."
                  : `No matches found for \u201C${query}\u201D.`}
              </p>
              {!loading && (
                <p className="mt-1 text-xs text-[#8B8B94]">
                  Try searching for Systems, Labs, Skunkworks, Hackathons, or Orbit.
                </p>
              )}
            </div>
          ) : (
            results.map((item, idx) => {
              const active = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => executeSelection(item)}
                  className={`flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl px-3.5 py-3 text-left transition-colors duration-100 ${
                    active ? "bg-white/[0.09]" : "bg-transparent hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      {item.code && (
                        <span
                          className={`font-mono-telemetry rounded-md px-2 py-0.5 text-[11px] font-medium ${
                            active
                              ? "bg-[#FF3B1F] font-semibold text-[#08080A]"
                              : "bg-white/[0.07] text-[#D4D4D8]"
                          }`}
                        >
                          {item.code}
                        </span>
                      )}
                      <span className="truncate text-sm font-medium text-[#F4F3EF]">
                        {item.title}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[#A1A1AA]">
                      {item.subtitle}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    {item.badge && (
                      <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] text-[#A1A1AA]">
                        {item.badge}
                      </span>
                    )}
                    <ArrowUpRight
                      className={`h-4 w-4 transition-colors ${
                        active ? "text-[#FF3B1F]" : "text-[#8B8B94]"
                      }`}
                      strokeWidth={1.6}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Keyboard Footer Hints */}
        <div className="flex items-center justify-between border-t border-white/[0.07] bg-white/[0.02] px-5 py-2.5 text-xs text-[#8B8B94]">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <kbd className="font-mono-telemetry rounded-md border border-white/[0.1] bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-[#D4D4D8]">
                ↑↓
              </kbd>
              <span>Navigate</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="font-mono-telemetry inline-flex items-center rounded-md border border-white/[0.1] bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-[#D4D4D8]">
                <CornerDownLeft className="h-2.5 w-2.5" />
              </kbd>
              <span>Open</span>
            </span>
          </div>
          <span className="text-[#8B8B94]">G-Gravitator Index</span>
        </div>
      </div>
    </div>
  );
}
