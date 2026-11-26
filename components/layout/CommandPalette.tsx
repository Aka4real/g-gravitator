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
      setSelectedIndex((prev) =>
        results.length ? (prev + 1) % results.length : 0
      );
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
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-bar w-full max-w-2xl overflow-hidden rounded-2xl text-[var(--ink-primary)] shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[var(--hairline)] px-5 py-4">
          <Search
            className="h-4 w-4 shrink-0 text-[var(--accent)]"
            strokeWidth={1.8}
          />
          <input
            ref={inputRef}
            id="cmd-palette-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search divisions, Labs drops, hackathons, dispatches, or actions..."
            aria-label="Search G-Gravitator"
            className="w-full bg-transparent text-[16px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:outline-none"
          />
          {loading && (
            <span className="shrink-0 text-[13px] text-[var(--ink-muted)]">
              Searching...
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            id="cmd-palette-close"
            aria-label="Close command palette"
            className="press-tactile inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-[var(--hairline-strong)] bg-white/[0.04] px-2.5 py-1 text-[13px] text-[var(--ink-muted)] hover:bg-white/[0.08] hover:text-[var(--ink-primary)]"
          >
            <span>Esc</span>
            <X className="h-3.5 w-3.5" strokeWidth={1.7} />
          </button>
        </div>

        <div className="max-h-[400px] divide-y divide-[var(--hairline)] overflow-y-auto px-2 py-1">
          {results.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-[16px] text-[var(--ink-muted)]">
                {loading
                  ? "Loading index..."
                  : `No matches found for \u201C${query}\u201D.`}
              </p>
              {!loading && (
                <p className="mt-1.5 text-[14px] text-[var(--ink-muted)]">
                  Try searching for Systems, Labs, Skunkworks, Hackathons, or
                  Orbit.
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
                  className={`flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl px-4 py-3.5 text-left transition-colors duration-100 ${
                    active ? "bg-white/[0.08]" : "bg-transparent hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2.5">
                      {item.code && (
                        <span
                          className={`font-tabular shrink-0 text-[13px] font-semibold ${
                            active
                              ? "text-[var(--accent)]"
                              : "text-[var(--ink-muted)]"
                          }`}
                        >
                          {item.code}
                        </span>
                      )}
                      <span className="truncate text-[15px] font-medium text-[var(--ink-primary)]">
                        {item.title}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[14px] text-[var(--ink-muted)]">
                      {item.subtitle}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {item.badge && (
                      <span className="text-[13px] text-[var(--ink-muted)]">
                        {item.badge}
                      </span>
                    )}
                    <ArrowUpRight
                      className={`h-4 w-4 transition-colors duration-150 ${
                        active
                          ? "text-[var(--accent)]"
                          : "text-[var(--ink-muted)]"
                      }`}
                      strokeWidth={1.7}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--hairline)] px-5 py-3 text-[13px] text-[var(--ink-muted)]">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="font-tabular font-medium text-[var(--ink-primary)]">
                ↑↓
              </span>
              <span>Navigate</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CornerDownLeft className="h-3.5 w-3.5 text-[var(--ink-primary)]" />
              <span>Open</span>
            </span>
          </div>
          <span>G-Gravitator index</span>
        </div>
      </div>
    </div>
  );
}
