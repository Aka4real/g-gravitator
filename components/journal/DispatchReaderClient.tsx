"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sun, Moon, Clock, BookOpen } from "lucide-react";
import { NewsletterBar } from "@/components/journal/NewsletterBar";
import type { Dispatch } from "@/lib/supabase/types";

interface DispatchReaderClientProps {
  dispatch: Dispatch;
  otherDispatches: Dispatch[];
}

interface ParsedBlock {
  type: "h2" | "code" | "ul" | "p";
  id?: string;
  lang?: string;
  content: string;
  items?: string[];
}

function parseMdxBlocks(mdx: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const rawChunks = mdx.split(/\n\n+/);

  for (const chunk of rawChunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("## ")) {
      const title = trimmed.replace(/^##\s+/, "").trim();
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      blocks.push({ type: "h2", id, content: title });
    } else if (trimmed.startsWith("```")) {
      const lines = trimmed.split("\n");
      const lang = lines[0].replace("```", "").trim() || "text";
      const code = lines.slice(1, -1).join("\n");
      blocks.push({ type: "code", lang, content: code });
    } else if (
      trimmed
        .split("\n")
        .every((line) => /^(-|\d+\.)\s+/.test(line.trim()))
    ) {
      const items = trimmed
        .split("\n")
        .map((line) => line.replace(/^(-|\d+\.)\s+/, "").trim());
      blocks.push({ type: "ul", content: "", items });
    } else {
      blocks.push({ type: "p", content: trimmed });
    }
  }

  return blocks;
}

export function DispatchReaderClient({
  dispatch,
  otherDispatches,
}: DispatchReaderClientProps) {
  // Event Horizon Dark (#09090B) vs Alabaster Editorial Light (#F3F2EE) reading mode
  const [readingMode, setReadingMode] = useState<"DARK" | "LIGHT">("DARK");
  const blocks = useMemo(
    () => parseMdxBlocks(dispatch.mdx_content),
    [dispatch.mdx_content]
  );

  const headings = useMemo(
    () => blocks.filter((b) => b.type === "h2"),
    [blocks]
  );

  const isLight = readingMode === "LIGHT";

  return (
    <div
      data-reading-theme={isLight ? "light" : "dark"}
      className={`transition-colors duration-200 ${
        isLight
          ? "bg-[#F3F2EE] text-[#09090B]"
          : "bg-[#09090B] text-[#F3F2EE]"
      }`}
    >
      {/* Top Reader Utility Bar with Dark/Light Mode Switch */}
      <div
        className={`sticky top-16 z-30 flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3.5 lg:px-10 ${
          isLight
            ? "border-[#C8C5BA] bg-[#E7E5DE]/95 text-[#09090B]"
            : "border-[#27272A] bg-[#111114]/95 text-[#F3F2EE]"
        }`}
      >
        <Link
          href="/journal"
          className="font-mono-telemetry inline-flex items-center gap-2 text-xs hover:text-[#FF3B1F]"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-[#FF3B1F]" strokeWidth={1.8} />
          <span>BACK TO JOURNAL &amp; ORBITAL WIRE</span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="font-mono-telemetry hidden items-center gap-1.5 text-[11px] opacity-75 sm:inline-flex">
            <Clock className="h-3.5 w-3.5 text-[#FF3B1F]" strokeWidth={1.5} />
            <span>
              DISPATCH // {dispatch.issue_number} • {dispatch.reading_time_mins} MIN READ
            </span>
          </span>

          {/* Event Horizon Dark (#09090B) <-> Alabaster Bone Light (#F3F2EE) Toggle */}
          <div
            className={`inline-flex items-center border p-0.5 ${
              isLight
                ? "border-[#C8C5BA] bg-[#F3F2EE]"
                : "border-[#27272A] bg-[#09090B]"
            }`}
          >
            <button
              type="button"
              id="reader-mode-dark"
              onClick={() => setReadingMode("DARK")}
              className={`font-mono-telemetry inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                !isLight
                  ? "bg-[#FF3B1F] text-[#09090B]"
                  : "text-[#52525B] hover:text-[#09090B]"
              }`}
            >
              <Moon className="h-3 w-3" strokeWidth={1.5} />
              <span>EVENT HORIZON</span>
            </button>
            <button
              type="button"
              id="reader-mode-light"
              onClick={() => setReadingMode("LIGHT")}
              className={`font-mono-telemetry inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                isLight
                  ? "bg-[#09090B] text-[#F3F2EE]"
                  : "text-[#A1A1AA] hover:text-[#F3F2EE]"
              }`}
            >
              <Sun className="h-3 w-3" strokeWidth={1.5} />
              <span>ALABASTER BONE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Article Header */}
      <header
        className={`border-b px-6 py-14 sm:px-10 lg:px-14 lg:py-20 ${
          isLight ? "border-[#C8C5BA]" : "border-[#27272A]"
        }`}
      >
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono-telemetry bg-[#FF3B1F] px-2.5 py-1 text-xs font-bold text-[#09090B]">
              LAB DISPATCH // {dispatch.issue_number}
            </span>
            <span
              className={`font-mono-telemetry border px-2.5 py-1 text-xs ${
                isLight
                  ? "border-[#C8C5BA] bg-[#E7E5DE] text-[#09090B]"
                  : "border-[#27272A] bg-[#111114] text-[#F3F2EE]"
              }`}
            >
              {dispatch.category}
            </span>
          </div>

          <h1 className="font-display mt-6 text-3xl leading-[1.08] font-extrabold tracking-tight sm:text-5xl">
            {dispatch.title}
          </h1>

          <p
            className={`mt-5 text-base leading-relaxed sm:text-lg ${
              isLight ? "text-[#27272A]" : "text-[#A1A1AA]"
            }`}
          >
            {dispatch.subtitle}
          </p>

          <div
            className={`mt-8 flex flex-wrap items-center justify-between gap-4 border-t pt-5 text-xs ${
              isLight ? "border-[#C8C5BA]" : "border-[#27272A]"
            }`}
          >
            <div>
              <div className="font-bold">{dispatch.author_name}</div>
              <div
                className={`font-mono-telemetry text-[10px] ${
                  isLight ? "text-[#52525B]" : "text-[#71717A]"
                }`}
              >
                {dispatch.author_role}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {dispatch.tags.map((t) => (
                <span
                  key={t}
                  className={`font-mono-telemetry border px-2 py-0.5 text-[10px] ${
                    isLight
                      ? "border-[#C8C5BA] bg-[#E7E5DE] text-[#27272A]"
                      : "border-[#27272A] bg-[#111114] text-[#A1A1AA]"
                  }`}
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content + Table of Contents Sidebar */}
      <div
        className={`grid grid-cols-1 divide-y lg:grid-cols-12 lg:divide-x lg:divide-y-0 ${
          isLight ? "divide-[#C8C5BA]" : "divide-[#27272A]"
        }`}
      >
        {/* Left 3 Cols: Sticky Table of Contents */}
        <aside className="p-6 lg:col-span-3 lg:p-8">
          <div className="sticky top-32">
            <div className="font-mono-telemetry flex items-center gap-2 text-xs text-[#FF3B1F]">
              <BookOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>INDEX // SECTIONS</span>
            </div>
            <ul className="mt-4 space-y-2.5 text-xs">
              {headings.map((h) => (
                <li key={h.id}>
                  <a
                    href={`#${h.id}`}
                    className={`block border-l-2 border-transparent pl-2.5 transition-colors hover:border-[#FF3B1F] ${
                      isLight
                        ? "text-[#27272A] hover:text-[#09090B]"
                        : "text-[#A1A1AA] hover:text-[#F3F2EE]"
                    }`}
                  >
                    {h.content}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Right 9 Cols: Editorial Essay Body */}
        <article className="p-6 sm:p-10 lg:col-span-9 lg:p-14">
          <div className="mx-auto max-w-3xl space-y-6">
            {blocks.map((block, idx) => {
              if (block.type === "h2") {
                return (
                  <h2
                    key={idx}
                    id={block.id}
                    className="font-display pt-6 text-2xl font-extrabold tracking-tight sm:text-3xl"
                  >
                    {block.content}
                  </h2>
                );
              }
              if (block.type === "code") {
                return (
                  <div
                    key={idx}
                    className="overflow-x-auto border border-[#27272A] bg-[#09090B] text-[#F3F2EE]"
                  >
                    <div className="flex items-center justify-between border-b border-[#27272A] bg-[#111114] px-4 py-1.5">
                      <span className="font-mono-telemetry text-[10px] text-[#FF3B1F]">
                        CODE // {block.lang?.toUpperCase()}
                      </span>
                      <span className="font-mono-telemetry text-[10px] text-[#71717A]">
                        G-GRAVITATOR SPEC
                      </span>
                    </div>
                    <pre className="p-4 font-mono text-xs leading-relaxed text-[#F3F2EE]">
                      <code>{block.content}</code>
                    </pre>
                  </div>
                );
              }
              if (block.type === "ul") {
                return (
                  <ul key={idx} className="space-y-2.5 pl-1 text-base leading-relaxed">
                    {block.items?.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-[#FF3B1F]" />
                        <span
                          className={
                            isLight ? "text-[#18181B]" : "text-[#D4D4D8]"
                          }
                        >
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                );
              }
              return (
                <p
                  key={idx}
                  className={`text-base leading-[1.75] ${
                    isLight ? "text-[#18181B]" : "text-[#D4D4D8]"
                  }`}
                >
                  {block.content}
                </p>
              );
            })}

            {/* Newsletter Capture */}
            <div className="pt-10">
              <NewsletterBar source={`dispatch-${dispatch.issue_number}`} />
            </div>
          </div>
        </article>
      </div>

      {/* Next / Other Dispatches Strip */}
      <section
        className={`border-t px-6 py-10 lg:px-10 ${
          isLight ? "border-[#C8C5BA] bg-[#E7E5DE]" : "border-[#27272A] bg-[#111114]"
        }`}
      >
        <div className="font-mono-telemetry text-xs text-[#FF3B1F]">
          CONTINUE READING // MORE LAB DISPATCHES
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {otherDispatches.map((other) => (
            <Link
              key={other.id}
              href={`/journal/${other.slug}`}
              className={`border p-5 transition-colors hover:border-[#FF3B1F] ${
                isLight
                  ? "border-[#C8C5BA] bg-[#F3F2EE] text-[#09090B]"
                  : "border-[#27272A] bg-[#09090B] text-[#F3F2EE]"
              }`}
            >
              <div className="font-mono-telemetry text-[10px] text-[#FF3B1F]">
                DISPATCH // {other.issue_number} • {other.category}
              </div>
              <div className="font-display mt-2 text-lg font-bold">
                {other.title}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
