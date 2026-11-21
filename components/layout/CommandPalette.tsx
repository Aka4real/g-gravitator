"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowUpRight, Terminal, CornerDownLeft, X } from "lucide-react";
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) {
          onClose();
        }
      } else if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setResults(Array.isArray(data.results) ? data.results : []);
        setSelectedIndex(0);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query, open]);

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
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 px-4 pt-20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl border border-[#27272A] bg-[#111114] text-[#F3F2EE]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Telemetry Bar */}
        <div className="flex items-center justify-between border-b border-[#27272A] bg-[#09090B] px-4 py-2">
          <div className="font-mono-telemetry flex items-center gap-2 text-[11px] text-[#71717A]">
            <Terminal className="h-3.5 w-3.5 text-[#FF3B1F]" strokeWidth={1.5} />
            <span>G-GRAVITATOR // GLOBAL COMMAND INDEX</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            id="cmd-palette-close"
            className="font-mono-telemetry flex items-center gap-1 border border-[#27272A] px-2 py-0.5 text-[10px] text-[#A1A1AA] hover:border-[#3F3F46] hover:text-[#F3F2EE]"
          >
            <span>ESC</span>
            <X className="h-3 w-3" strokeWidth={1.5} />
          </button>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-[#27272A] px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-[#FF3B1F]" strokeWidth={1.5} />
          <input
            ref={inputRef}
            id="cmd-palette-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search divisions, G-01..G-04 drops, live hackathons, dispatches, or actions..."
            className="w-full bg-transparent text-sm text-[#F3F2EE] placeholder-[#71717A] focus:outline-none"
          />
          {loading && (
            <span className="font-mono-telemetry text-[10px] text-[#71717A]">
              SCANNING...
            </span>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-[#27272A]/60">
          {results.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="font-mono-telemetry text-xs text-[#71717A]">
                ZERO TELEMETRY MATCHES FOR &ldquo;{query}&rdquo;
              </p>
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
                  className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors ${
                    active ? "bg-[#18181B]" : "bg-transparent"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {item.code && (
                        <span
                          className={`font-mono-telemetry px-1.5 py-0.5 text-[10px] ${
                            active
                              ? "bg-[#FF3B1F] text-[#09090B] font-semibold"
                              : "border border-[#27272A] text-[#A1A1AA]"
                          }`}
                        >
                          {item.code}
                        </span>
                      )}
                      <span className="truncate text-sm font-medium text-[#F3F2EE]">
                        {item.title}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[#A1A1AA]">
                      {item.subtitle}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {item.badge && (
                      <span className="font-mono-telemetry border border-[#27272A] bg-[#09090B] px-2 py-0.5 text-[10px] text-[#71717A]">
                        {item.badge}
                      </span>
                    )}
                    <ArrowUpRight
                      className={`h-4 w-4 ${
                        active ? "text-[#FF3B1F]" : "text-[#71717A]"
                      }`}
                      strokeWidth={1.5}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="flex items-center justify-between border-t border-[#27272A] bg-[#09090B] px-4 py-2 text-[11px] text-[#71717A]">
          <div className="font-mono-telemetry flex items-center gap-4">
            <span>↑↓ NAVIGATE</span>
            <span className="inline-flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" /> EXECUTE
            </span>
          </div>
          <span className="font-mono-telemetry text-[#A1A1AA]">
            G-GRAVITATOR // ORBITAL INDEX v1.0
          </span>
        </div>
      </div>
    </div>
  );
}
