"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Link2,
  Loader2,
  Palette,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import type { OpsMediaSummary } from "@/components/ops/ops-types";
import type {
  Dispatch,
  DispatchCategory,
  Hackathon,
  HackathonFormat,
  NewsCategory,
  NewsItem,
  OxakalabsStatus,
  PostDesignConfig,
  PostLinkRef,
} from "@/lib/supabase/types";

export type DesignerEntityType = "dispatch" | "news" | "hackathon";

interface PostDesignerModalProps {
  entity: DesignerEntityType;
  existing: Dispatch | NewsItem | Hackathon | null;
  mediaAssets: OpsMediaSummary[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  onMediaUpdated: () => Promise<void> | void;
}

const ACCENT_PRESETS = [
  { name: "Vermilion", hex: "#FF3B1F" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Electric Blue", hex: "#3B82F6" },
  { name: "Amber", hex: "#F59E0B" },
  { name: "Violet", hex: "#A855F7" },
  { name: "Rose", hex: "#F43F5E" },
  { name: "Alabaster", hex: "#F2F4F8" },
];

function parseUtcDatetimeLocal(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();
  }
  const withZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(trimmed)
    ? trimmed
    : `${trimmed}Z`;
  const parsed = new Date(withZone);
  return Number.isNaN(parsed.getTime())
    ? new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString()
    : parsed.toISOString();
}

const INPUT_CLASS =
  "mt-1.5 h-10 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3.5 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none";

const SELECT_CLASS =
  "mt-1.5 h-10 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3 text-[13px] text-[var(--ink-primary)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none";

const LABEL_CLASS = "block text-[13px] font-medium text-[var(--ink-primary)]";

export function PostDesignerModal({
  entity,
  existing,
  mediaAssets,
  onClose,
  onSaved,
  onMediaUpdated,
}: PostDesignerModalProps) {
  const isEdit = Boolean(existing);

  const initialDesign: PostDesignConfig =
    (existing as Dispatch | NewsItem | Hackathon | null)?.design ?? {};

  // Common fields
  const [title, setTitle] = useState(existing?.title || "");
  const [accentColor, setAccentColor] = useState(
    initialDesign.accent_color || "#FF3B1F"
  );
  const [surfaceTint, setSurfaceTint] = useState(
    initialDesign.surface_tint || ""
  );
  const [heroLayout, setHeroLayout] = useState<
    "editorial" | "split" | "fullbleed" | "minimal"
  >(initialDesign.hero_layout || "editorial");
  const [calloutStyle, setCalloutStyle] = useState<
    "left-bar" | "glass-card" | "tinted-banner"
  >(initialDesign.callout_style || "left-bar");

  const initialImage =
    entity === "dispatch"
      ? (existing as Dispatch | null)?.cover_image_url || ""
      : entity === "news"
      ? (existing as NewsItem | null)?.image_url || ""
      : (existing as Hackathon | null)?.image_url || "";
  const [imageUrl, setImageUrl] = useState(initialImage);

  const initialLinks: PostLinkRef[] =
    entity === "dispatch"
      ? initialDesign.featured_links || []
      : ((existing as NewsItem | Hackathon | null)?.related_links ??
          initialDesign.featured_links ??
          []);
  const [links, setLinks] = useState<PostLinkRef[]>(initialLinks);
  const [isPublished, setIsPublished] = useState(
    entity === "dispatch"
      ? (existing as Dispatch | null)?.is_published ?? true
      : (existing as NewsItem | Hackathon | null)?.is_published ?? true
  );

  // Dispatch-specific fields
  const disp = existing as Dispatch | null;
  const [subtitle, setSubtitle] = useState(disp?.subtitle || "");
  const [dispatchCat, setDispatchCat] = useState<DispatchCategory>(
    disp?.category || "AI SYSTEMS"
  );
  const [authorName, setAuthorName] = useState(
    disp?.author_name || "Enwedo Akaolisa Gift"
  );
  const [authorRole, setAuthorRole] = useState(
    disp?.author_role || "Principal Architect · G-Gravitator & OXAKALABS"
  );
  const [tagsText, setTagsText] = useState(
    disp?.tags?.join(", ") || "AI SYSTEMS, ENGINEERING"
  );
  const [mdxContent, setMdxContent] = useState(
    disp?.mdx_content ||
      `## Core Thesis\n\nWrite your technical analysis here. Use **bold**, \`inline code\`, and [clickable links](https://ggravitator.xyz).\n\n> [!ACCENT] Key architectural takeaway for builders.\n\n## System Breakdown\n\n- First concrete engineering point\n- Second concrete engineering point`
  );
  const [isFeatured, setIsFeatured] = useState(
    entity === "dispatch"
      ? disp?.is_featured ?? false
      : (existing as Hackathon | null)?.is_featured ?? false
  );

  // News-specific fields
  const news = existing as NewsItem | null;
  const [sourceName, setSourceName] = useState(news?.source_name || "");
  const [sourceUrl, setSourceUrl] = useState(news?.source_url || "");
  const [newsCat, setNewsCat] = useState<NewsCategory>(
    news?.category || "AGENTS"
  );
  const [gravityTake, setGravityTake] = useState(news?.gravity_take || "");
  const [impactScore, setImpactScore] = useState(news?.impact_score ?? 88);
  const [isPinned, setIsPinned] = useState(news?.is_pinned ?? false);

  // Hackathon-specific fields
  const hack = existing as Hackathon | null;
  const [organizer, setOrganizer] = useState(hack?.organizer || "");
  const [summary, setSummary] = useState(hack?.summary || "");
  const [prizeDisplay, setPrizeDisplay] = useState(
    hack?.prize_display || "$50,000 + Compute Credits"
  );
  const [prizeUsd, setPrizeUsd] = useState<string>(
    hack?.prize_pool_usd ? String(hack.prize_pool_usd) : ""
  );
  const [deadlineAt, setDeadlineAt] = useState(() =>
    hack?.deadline_at
      ? new Date(hack.deadline_at).toISOString().slice(0, 16)
      : new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 16)
  );
  const [format, setFormat] = useState<HackathonFormat>(
    hack?.format || "ONLINE"
  );
  const [location, setLocation] = useState(hack?.location || "Global / Remote");
  const [themesText, setThemesText] = useState(
    hack?.themes?.join(", ") || "AI, Agents"
  );
  const [primaryUrl, setPrimaryUrl] = useState(hack?.primary_url || "");
  const [tweetUrl, setTweetUrl] = useState(hack?.source_tweet_url || "");
  const [oxaStatus, setOxaStatus] = useState<OxakalabsStatus>(
    hack?.oxakalabs_status || "SCOUTING"
  );

  // Image Studio state
  const [imageTab, setImageTab] = useState<
    "generate" | "import" | "upload" | "library"
  >("generate");
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgImportUrl, setImgImportUrl] = useState("");
  const [imgBusy, setImgBusy] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);
  const [imgStatus, setImgStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mdxRef = useRef<HTMLTextAreaElement | null>(null);

  // New link row state
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkDesc, setNewLinkDesc] = useState("");

  // AI Draft Assistant inside Designer
  const [aiTopic, setAiTopic] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiStatus, setAiStatus] = useState<string | null>(null);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

  const insertSnippet = (snippet: string) => {
    const el = mdxRef.current;
    if (!el) {
      setMdxContent((prev) => `${prev}\n\n${snippet}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = mdxContent.slice(0, start) + snippet + mdxContent.slice(end);
    setMdxContent(next);
  };

  const handleGenerateImage = async () => {
    const prompt = (imgPrompt || title || summary || gravityTake).trim();
    if (!prompt) {
      setImgError("Enter a visual prompt or post title first.");
      return;
    }
    setImgError(null);
    setImgStatus(null);
    setImgBusy(true);
    try {
      const res = await fetch("/api/ops/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          prompt,
          title: title || undefined,
          subtitle: subtitle || undefined,
          accentColor,
          category:
            entity === "dispatch"
              ? dispatchCat
              : entity === "news"
              ? newsCat
              : "HACKATHON",
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.asset?.url) {
        setImgError(data?.error || "Image generation failed.");
        return;
      }
      setImageUrl(data.asset.url);
      setImgStatus(
        data.generator === "gemini"
          ? "Generated with Gemini Image AI."
          : "Generated with Studio Editorial SVG fallback."
      );
      await onMediaUpdated();
    } catch {
      setImgError("Network error generating image.");
    } finally {
      setImgBusy(false);
    }
  };

  const handleImportImageUrl = async () => {
    if (!imgImportUrl.trim()) return;
    setImgError(null);
    setImgStatus(null);
    setImgBusy(true);
    try {
      const res = await fetch("/api/ops/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "import",
          url: imgImportUrl.trim(),
          altText: title || "Imported image",
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.asset?.url) {
        setImgError(data?.error || "Image import failed.");
        return;
      }
      setImageUrl(data.asset.url);
      setImgImportUrl("");
      setImgStatus("Imported and hosted in Media Library.");
      await onMediaUpdated();
    } catch {
      setImgError("Network error importing image.");
    } finally {
      setImgBusy(false);
    }
  };

  const handleUploadFile = async (file: File) => {
    setImgError(null);
    setImgStatus(null);
    setImgBusy(true);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/ops/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload",
          filename: file.name,
          mimeType: file.type || "image/png",
          base64Data: dataUrl,
          altText: title || file.name,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.asset?.url) {
        setImgError(data?.error || "Image upload failed.");
        return;
      }
      setImageUrl(data.asset.url);
      setImgStatus(`Uploaded ${file.name} to Media Library.`);
      await onMediaUpdated();
    } catch {
      setImgError("Failed to upload file.");
    } finally {
      setImgBusy(false);
    }
  };

  const handleAddLink = () => {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;
    setLinks((prev) => [
      ...prev,
      {
        label: newLinkLabel.trim(),
        url: newLinkUrl.trim(),
        ...(newLinkDesc.trim() ? { description: newLinkDesc.trim() } : {}),
      },
    ]);
    setNewLinkLabel("");
    setNewLinkUrl("");
    setNewLinkDesc("");
  };

  const handleAiAssistDraft = async () => {
    const topic = (aiTopic || title).trim();
    if (!topic) return;
    setAiBusy(true);
    setSaveError(null);
    setAiStatus(null);
    try {
      const res = await fetch("/api/ops/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity,
          topic,
          accentColor,
          generateCover: true,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        draft?: Record<string, unknown>;
        coverImageUrl?: string | null;
        coverGenerator?: "gemini" | "editorial_svg" | null;
        researchCount?: number;
        error?: string;
      } | null;

      if (!res.ok || !data?.ok || !data?.draft) {
        setSaveError(data?.error || "AI drafting failed.");
        return;
      }

      const d = data.draft;
      if (typeof d.title === "string" && d.title.trim()) {
        setTitle(d.title.trim());
      }

      if (entity === "dispatch") {
        if (typeof d.subtitle === "string") setSubtitle(d.subtitle);
        if (
          typeof d.category === "string" &&
          [
            "ARCHITECTURE",
            "POST-MORTEM",
            "AI SYSTEMS",
            "HACKATHON LOG",
            "DESIGN ENGINEERING",
          ].includes(d.category)
        ) {
          setDispatchCat(d.category as DispatchCategory);
        }
        if (Array.isArray(d.tags) && d.tags.length > 0) {
          setTagsText(
            d.tags
              .map((t) => String(t).trim())
              .filter(Boolean)
              .join(", ")
          );
        }
        if (typeof d.mdx_content === "string" && d.mdx_content.trim()) {
          setMdxContent(d.mdx_content);
        }
        if (Array.isArray(d.featured_links)) {
          setLinks(
            d.featured_links
              .filter(
                (l): l is PostLinkRef =>
                  Boolean(l) &&
                  typeof (l as PostLinkRef).label === "string" &&
                  typeof (l as PostLinkRef).url === "string"
              )
              .slice(0, 6)
          );
        }
      } else if (entity === "news") {
        if (typeof d.source_name === "string") setSourceName(d.source_name);
        if (typeof d.source_url === "string") setSourceUrl(d.source_url);
        if (
          typeof d.category === "string" &&
          [
            "MODELS",
            "AGENTS",
            "DEVTOOLS",
            "RESEARCH",
            "BUSINESS",
            "OPEN_SOURCE",
          ].includes(d.category)
        ) {
          setNewsCat(d.category as NewsCategory);
        }
        if (typeof d.gravity_take === "string") setGravityTake(d.gravity_take);
        if (
          typeof d.impact_score === "number" &&
          Number.isFinite(d.impact_score)
        ) {
          setImpactScore(Math.min(100, Math.max(1, Math.round(d.impact_score))));
        }
        if (Array.isArray(d.related_links)) {
          setLinks(
            d.related_links
              .filter(
                (l): l is PostLinkRef =>
                  Boolean(l) &&
                  typeof (l as PostLinkRef).label === "string" &&
                  typeof (l as PostLinkRef).url === "string"
              )
              .slice(0, 6)
          );
        }
      } else {
        if (typeof d.organizer === "string") setOrganizer(d.organizer);
        if (typeof d.summary === "string") setSummary(d.summary);
        if (typeof d.prize_display === "string") setPrizeDisplay(d.prize_display);
        if (
          typeof d.prize_pool_usd === "number" &&
          Number.isFinite(d.prize_pool_usd)
        ) {
          setPrizeUsd(String(d.prize_pool_usd));
        }
        if (typeof d.deadline_at === "string") {
          const parsed = new Date(d.deadline_at);
          if (!Number.isNaN(parsed.getTime())) {
            setDeadlineAt(parsed.toISOString().slice(0, 16));
          }
        }
        if (
          typeof d.format === "string" &&
          ["ONLINE", "IN_PERSON", "HYBRID"].includes(d.format)
        ) {
          setFormat(d.format as HackathonFormat);
        }
        if (typeof d.location === "string") setLocation(d.location);
        if (Array.isArray(d.themes) && d.themes.length > 0) {
          setThemesText(
            d.themes
              .map((t) => String(t).trim())
              .filter(Boolean)
              .join(", ")
          );
        }
        if (typeof d.primary_url === "string") setPrimaryUrl(d.primary_url);
        if (Array.isArray(d.related_links)) {
          setLinks(
            d.related_links
              .filter(
                (l): l is PostLinkRef =>
                  Boolean(l) &&
                  typeof (l as PostLinkRef).label === "string" &&
                  typeof (l as PostLinkRef).url === "string"
              )
              .slice(0, 6)
          );
        }
      }

      if (data.coverImageUrl) {
        setImageUrl(data.coverImageUrl);
        await onMediaUpdated();
      }

      const sourceNote =
        typeof data.researchCount === "number" && data.researchCount > 0
          ? `${data.researchCount} live web sources analyzed`
          : "drafted from engineering brief";
      const coverNote = data.coverImageUrl
        ? data.coverGenerator === "gemini"
          ? " · Gemini AI cover ready"
          : " · Studio SVG cover ready"
        : "";
      setAiStatus(
        `Draft populated into editor (${sourceNote}${coverNote}). Review preview and save.`
      );
    } catch {
      setSaveError("Network error invoking AI draft.");
    } finally {
      setAiBusy(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);

    const effectiveLinks: PostLinkRef[] =
      newLinkLabel.trim() && newLinkUrl.trim()
        ? [
            ...links,
            {
              label: newLinkLabel.trim(),
              url: newLinkUrl.trim(),
              ...(newLinkDesc.trim() ? { description: newLinkDesc.trim() } : {}),
            },
          ]
        : links;

    const design: PostDesignConfig = {
      accent_color: accentColor,
      ...(surfaceTint ? { surface_tint: surfaceTint } : {}),
      hero_layout: heroLayout,
      callout_style: calloutStyle,
      featured_links: effectiveLinks,
    };

    try {
      let action = "";
      let args: Record<string, unknown> = {};

      if (entity === "dispatch") {
        action = isEdit ? "update_dispatch" : "create_dispatch";
        args = {
          ...(isEdit ? { id: existing!.id } : {}),
          title,
          subtitle,
          category: dispatchCat,
          author_name: authorName,
          author_role: authorRole,
          tags: tagsText
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          mdx_content: mdxContent,
          cover_image_url: imageUrl || null,
          is_featured: isFeatured,
          is_published: isPublished,
          design,
        };
      } else if (entity === "news") {
        action = isEdit ? "update_news_item" : "create_news_item";
        args = {
          ...(isEdit ? { id: existing!.id } : {}),
          title,
          source_name: sourceName,
          source_url: sourceUrl,
          category: newsCat,
          gravity_take: gravityTake,
          impact_score: Number(impactScore) || 85,
          is_pinned: isPinned,
          is_published: isPublished,
          image_url: imageUrl || null,
          related_links: effectiveLinks,
          design,
        };
      } else {
        action = isEdit ? "update_hackathon" : "create_hackathon";
        args = {
          ...(isEdit ? { id: existing!.id } : {}),
          title,
          organizer,
          summary,
          prize_pool_usd: prizeUsd ? Number(prizeUsd) : null,
          prize_display: prizeDisplay,
          deadline_at: parseUtcDatetimeLocal(deadlineAt),
          format,
          location,
          themes: themesText
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          primary_url: primaryUrl,
          source_tweet_url: tweetUrl.trim() || null,
          image_url: imageUrl || null,
          oxakalabs_status: oxaStatus,
          is_featured: isFeatured,
          is_published: isPublished,
          related_links: effectiveLinks,
          design,
        };
      }

      const res = await fetch("/api/ops/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, args }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setSaveError(data?.error || "Failed to save post.");
        return;
      }

      await onSaved();
      onClose();
    } catch {
      setSaveError("Network error saving post.");
    } finally {
      setSaving(false);
    }
  };

  const previewDownloadHref = useMemo(() => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith("/api/media/")) return `${imageUrl}?download=1`;
    return imageUrl;
  }, [imageUrl]);

  const entityLabel =
    entity === "dispatch"
      ? "Journal Dispatch"
      : entity === "news"
      ? "Orbital Wire Post"
      : "Hackathon Listing";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${isEdit ? "Edit" : "Create"} ${entity}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[var(--hairline-strong)] bg-[var(--bg-surface)] text-[var(--ink-primary)] shadow-2xl"
      >
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--hairline)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--hairline-strong)]"
              style={{
                backgroundColor: `${accentColor}1F`,
                color: accentColor,
              }}
            >
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-[18px] font-bold tracking-[-0.025em] text-[var(--ink-primary)]">
                {isEdit ? "Edit and design" : "Create and design"} {entityLabel}
              </h2>
              <p className="text-[13px] text-[var(--ink-muted)]">
                Configure copy, accent color, cover art, callouts, and attached links.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              role="tablist"
              aria-label="Mobile designer view"
              className="inline-flex rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] p-0.5 lg:hidden"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mobileView === "edit"}
                onClick={() => setMobileView("edit")}
                className={`h-8 cursor-pointer rounded-full px-3.5 text-[13px] font-medium transition-colors duration-150 ${
                  mobileView === "edit"
                    ? "bg-[var(--ink-primary)] text-[#07090D]"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mobileView === "preview"}
                onClick={() => setMobileView("preview")}
                className={`h-8 cursor-pointer rounded-full px-3.5 text-[13px] font-medium transition-colors duration-150 ${
                  mobileView === "preview"
                    ? "bg-[var(--ink-primary)] text-[#07090D]"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                }`}
              >
                Preview
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close designer"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--bg-canvas)] text-[var(--ink-muted)] transition-colors duration-150 hover:border-[var(--hairline-strong)] hover:text-[var(--ink-primary)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* AI Research & Draft Bar */}
        {!isEdit && (
          <div className="space-y-2 border-b border-[var(--hairline)] bg-[var(--bg-canvas)] px-6 py-3.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <Sparkles className="h-4 w-4 shrink-0 text-[var(--accent)]" />
              <input
                type="text"
                aria-label="AI research and draft topic"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (!aiBusy && (aiTopic || title).trim()) {
                      void handleAiAssistDraft();
                    }
                  }
                }}
                placeholder={`Enter a topic to research web sources, generate a cover, and draft this ${entity}...`}
                className="h-10 min-w-[220px] flex-1 rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-surface)] px-4 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none"
              />
              <button
                type="button"
                disabled={aiBusy || !(aiTopic || title).trim()}
                onClick={() => void handleAiAssistDraft()}
                className="press-tactile inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-[var(--accent-soft)] px-4 text-[13px] font-semibold text-[#FF8A7A] transition-colors duration-150 hover:bg-[var(--accent)] hover:text-[#07090D] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {aiBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5" />
                )}
                <span>
                  {aiBusy ? "Researching and drafting..." : "AI Research & Draft"}
                </span>
              </button>
            </div>
            {aiStatus && (
              <div className="flex items-center gap-2 text-[13px] text-[#34D399]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{aiStatus}</span>
              </div>
            )}
          </div>
        )}

        {/* Body: Left Editor + Right Live Preview */}
        <form
          onSubmit={handleSave}
          className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12"
        >
          {/* Left Editor Column */}
          <div
            className={`space-y-6 overflow-y-auto border-r border-[var(--hairline)] px-6 py-6 lg:col-span-7 ${
              mobileView === "preview" ? "hidden lg:block" : "block"
            }`}
          >
            {saveError && (
              <div
                role="alert"
                className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-4 py-3 text-[14px] text-[#FF8A7A]"
              >
                {saveError}
              </div>
            )}

            {/* Primary Content Fields */}
            <div className="space-y-4">
              <div>
                <label htmlFor="designer-title" className={LABEL_CLASS}>
                  Title *
                </label>
                <input
                  id="designer-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              {entity === "dispatch" && (
                <>
                  <div>
                    <label htmlFor="designer-subtitle" className={LABEL_CLASS}>
                      Subtitle *
                    </label>
                    <input
                      id="designer-subtitle"
                      type="text"
                      required
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="designer-disp-cat" className={LABEL_CLASS}>
                        Category
                      </label>
                      <select
                        id="designer-disp-cat"
                        value={dispatchCat}
                        onChange={(e) =>
                          setDispatchCat(e.target.value as DispatchCategory)
                        }
                        className={SELECT_CLASS}
                      >
                        <option value="AI SYSTEMS">AI Systems</option>
                        <option value="HACKATHON LOG">Hackathon Log</option>
                        <option value="DESIGN ENGINEERING">
                          Design Engineering
                        </option>
                        <option value="ARCHITECTURE">Architecture</option>
                        <option value="POST-MORTEM">Post-Mortem</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="designer-tags" className={LABEL_CLASS}>
                        Tags (comma-separated)
                      </label>
                      <input
                        id="designer-tags"
                        type="text"
                        value={tagsText}
                        onChange={(e) => setTagsText(e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="designer-author" className={LABEL_CLASS}>
                        Author name
                      </label>
                      <input
                        id="designer-author"
                        type="text"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="designer-author-role"
                        className={LABEL_CLASS}
                      >
                        Author role or byline
                      </label>
                      <input
                        id="designer-author-role"
                        type="text"
                        value={authorRole}
                        onChange={(e) => setAuthorRole(e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>
                </>
              )}

              {entity === "news" && (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label
                        htmlFor="designer-source-name"
                        className={LABEL_CLASS}
                      >
                        Source name *
                      </label>
                      <input
                        id="designer-source-name"
                        type="text"
                        required
                        value={sourceName}
                        onChange={(e) => setSourceName(e.target.value)}
                        placeholder="e.g. Google DeepMind"
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label htmlFor="designer-news-cat" className={LABEL_CLASS}>
                        Category
                      </label>
                      <select
                        id="designer-news-cat"
                        value={newsCat}
                        onChange={(e) =>
                          setNewsCat(e.target.value as NewsCategory)
                        }
                        className={SELECT_CLASS}
                      >
                        <option value="MODELS">Models</option>
                        <option value="AGENTS">Agents</option>
                        <option value="DEVTOOLS">Devtools</option>
                        <option value="RESEARCH">Research</option>
                        <option value="BUSINESS">Business</option>
                        <option value="OPEN_SOURCE">Open Source</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="designer-impact" className={LABEL_CLASS}>
                        Impact (1 to 100)
                      </label>
                      <input
                        id="designer-impact"
                        type="number"
                        min={1}
                        max={100}
                        value={impactScore}
                        onChange={(e) => setImpactScore(Number(e.target.value))}
                        className={`${INPUT_CLASS} font-tabular`}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="designer-source-url" className={LABEL_CLASS}>
                      Source URL *
                    </label>
                    <input
                      id="designer-source-url"
                      type="url"
                      required
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://..."
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="designer-gravity-take"
                      className={LABEL_CLASS}
                    >
                      Gravity Take (2-sentence builder takeaway) *
                    </label>
                    <textarea
                      id="designer-gravity-take"
                      rows={3}
                      required
                      value={gravityTake}
                      onChange={(e) => setGravityTake(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] p-3.5 text-[14px] text-[var(--ink-primary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {entity === "hackathon" && (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="designer-organizer"
                        className={LABEL_CLASS}
                      >
                        Organizer *
                      </label>
                      <input
                        id="designer-organizer"
                        type="text"
                        required
                        value={organizer}
                        onChange={(e) => setOrganizer(e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="designer-primary-url"
                        className={LABEL_CLASS}
                      >
                        Primary registration URL *
                      </label>
                      <input
                        id="designer-primary-url"
                        type="url"
                        required
                        value={primaryUrl}
                        onChange={(e) => setPrimaryUrl(e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="designer-summary" className={LABEL_CLASS}>
                      Summary *
                    </label>
                    <textarea
                      id="designer-summary"
                      rows={3}
                      required
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] p-3.5 text-[14px] text-[var(--ink-primary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <label
                        htmlFor="designer-prize-display"
                        className={LABEL_CLASS}
                      >
                        Prize display
                      </label>
                      <input
                        id="designer-prize-display"
                        type="text"
                        value={prizeDisplay}
                        onChange={(e) => setPrizeDisplay(e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="designer-prize-usd"
                        className={LABEL_CLASS}
                      >
                        Prize USD
                      </label>
                      <input
                        id="designer-prize-usd"
                        type="number"
                        value={prizeUsd}
                        onChange={(e) => setPrizeUsd(e.target.value)}
                        placeholder="50000"
                        className={`${INPUT_CLASS} font-tabular`}
                      />
                    </div>
                    <div>
                      <label htmlFor="designer-format" className={LABEL_CLASS}>
                        Format
                      </label>
                      <select
                        id="designer-format"
                        value={format}
                        onChange={(e) =>
                          setFormat(e.target.value as HackathonFormat)
                        }
                        className={SELECT_CLASS}
                      >
                        <option value="ONLINE">Online</option>
                        <option value="IN_PERSON">In-person</option>
                        <option value="HYBRID">Hybrid</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="designer-oxa" className={LABEL_CLASS}>
                        OXA status
                      </label>
                      <select
                        id="designer-oxa"
                        value={oxaStatus}
                        onChange={(e) =>
                          setOxaStatus(e.target.value as OxakalabsStatus)
                        }
                        className={SELECT_CLASS}
                      >
                        <option value="NONE">None</option>
                        <option value="SCOUTING">Scouting</option>
                        <option value="SQUAD_DEPLOYED">Squad deployed</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="WON">Won</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label htmlFor="designer-deadline" className={LABEL_CLASS}>
                        Deadline (UTC)
                      </label>
                      <input
                        id="designer-deadline"
                        type="datetime-local"
                        required
                        value={deadlineAt}
                        onChange={(e) => setDeadlineAt(e.target.value)}
                        className={`${INPUT_CLASS} font-tabular`}
                      />
                    </div>
                    <div>
                      <label htmlFor="designer-location" className={LABEL_CLASS}>
                        Location
                      </label>
                      <input
                        id="designer-location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label htmlFor="designer-themes" className={LABEL_CLASS}>
                        Themes (comma-separated)
                      </label>
                      <input
                        id="designer-themes"
                        type="text"
                        value={themesText}
                        onChange={(e) => setThemesText(e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="designer-tweet" className={LABEL_CLASS}>
                      Announcement or X post URL (optional)
                    </label>
                    <input
                      id="designer-tweet"
                      type="url"
                      value={tweetUrl}
                      onChange={(e) => setTweetUrl(e.target.value)}
                      placeholder="https://x.com/..."
                      className={INPUT_CLASS}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Color & Layout Design Controls (Hairline section, no nested box) */}
            <div className="space-y-4 border-t border-[var(--hairline)] pt-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-[15px] font-semibold text-[var(--ink-primary)]">
                  Color and layout formatting
                </h3>
                <code className="font-code text-[13px] text-[var(--ink-muted)]">
                  {accentColor}
                </code>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {ACCENT_PRESETS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setAccentColor(c.hex)}
                    title={c.name}
                    aria-label={`Select ${c.name} accent`}
                    className={`h-7 w-7 cursor-pointer rounded-full border-2 transition-transform duration-150 ${
                      accentColor.toLowerCase() === c.hex.toLowerCase()
                        ? "scale-110 border-white"
                        : "border-white/20"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
                <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3 text-[13px] text-[var(--ink-primary)]">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span>Custom</span>
                </label>
              </div>

              {entity === "dispatch" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="designer-hero-layout"
                      className={LABEL_CLASS}
                    >
                      Hero layout
                    </label>
                    <select
                      id="designer-hero-layout"
                      value={heroLayout}
                      onChange={(e) =>
                        setHeroLayout(e.target.value as typeof heroLayout)
                      }
                      className={SELECT_CLASS}
                    >
                      <option value="editorial">Editorial banner</option>
                      <option value="split">Split header and visual</option>
                      <option value="fullbleed">Full-bleed visual</option>
                      <option value="minimal">Minimal (no cover)</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="designer-callout-style"
                      className={LABEL_CLASS}
                    >
                      Callout style
                    </label>
                    <select
                      id="designer-callout-style"
                      value={calloutStyle}
                      onChange={(e) =>
                        setCalloutStyle(e.target.value as typeof calloutStyle)
                      }
                      className={SELECT_CLASS}
                    >
                      <option value="left-bar">Left accent bar</option>
                      <option value="tinted-banner">Color-tinted banner</option>
                      <option value="glass-card">Outlined card</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="designer-surface-tint"
                      className={LABEL_CLASS}
                    >
                      Backdrop glow tint
                    </label>
                    <input
                      id="designer-surface-tint"
                      type="text"
                      value={surfaceTint}
                      onChange={(e) => setSurfaceTint(e.target.value)}
                      placeholder="#FF3B1F (optional)"
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Embedded Image Studio (Hairline section) */}
            <div className="space-y-3.5 border-t border-[var(--hairline)] pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display flex items-center gap-2 text-[15px] font-semibold text-[var(--ink-primary)]">
                  <ImageIcon className="h-4 w-4 text-[var(--accent)]" />
                  <span>Cover and visual studio</span>
                </h3>

                <div
                  role="tablist"
                  aria-label="Image source mode"
                  className="inline-flex rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] p-0.5"
                >
                  {(["generate", "import", "upload", "library"] as const).map(
                    (tab) => (
                      <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={imageTab === tab}
                        onClick={() => setImageTab(tab)}
                        className={`h-8 cursor-pointer rounded-full px-3 text-[13px] font-medium capitalize transition-colors duration-150 ${
                          imageTab === tab
                            ? "bg-[var(--ink-primary)] text-[#07090D]"
                            : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                        }`}
                      >
                        {tab}
                      </button>
                    )
                  )}
                </div>
              </div>

              {imgError && (
                <div className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-3.5 py-2.5 text-[13px] text-[#FF8A7A]">
                  {imgError}
                </div>
              )}
              {imgStatus && !imgError && (
                <div className="flex items-center gap-2 rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 px-3.5 py-2.5 text-[13px] text-[#34D399]">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{imgStatus}</span>
                </div>
              )}

              {imageTab === "generate" && (
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <input
                    type="text"
                    aria-label="Cover image generation prompt"
                    value={imgPrompt}
                    onChange={(e) => setImgPrompt(e.target.value)}
                    placeholder="Describe the cover image or leave blank to use post title..."
                    className="h-10 flex-1 rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3.5 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={imgBusy}
                    onClick={() => void handleGenerateImage()}
                    className="press-tactile inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--accent)] px-4 text-[13px] font-semibold text-[#07090D] hover:bg-[var(--accent-hover)] disabled:opacity-60"
                  >
                    {imgBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    <span>Generate image</span>
                  </button>
                </div>
              )}

              {imageTab === "import" && (
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <input
                    type="url"
                    aria-label="Remote image URL to import"
                    value={imgImportUrl}
                    onChange={(e) => setImgImportUrl(e.target.value)}
                    placeholder="Paste public image URL (https://...) to download and host"
                    className="h-10 flex-1 rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3.5 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={imgBusy || !imgImportUrl.trim()}
                    onClick={() => void handleImportImageUrl()}
                    className="press-tactile inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--ink-primary)] px-4 text-[13px] font-semibold text-[#07090D] hover:bg-white disabled:opacity-50"
                  >
                    {imgBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    <span>Import and store</span>
                  </button>
                </div>
              )}

              {imageTab === "upload" && (
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) void handleUploadFile(f);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={imgBusy}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-4 text-[13px] font-medium text-[var(--ink-primary)] transition-colors duration-150 hover:border-white/35"
                  >
                    <Upload className="h-3.5 w-3.5 text-[var(--accent)]" />
                    <span>{imgBusy ? "Uploading..." : "Choose image file"}</span>
                  </button>
                  <span className="text-[13px] text-[var(--ink-muted)]">
                    Max 5 MB (PNG, JPEG, WEBP, SVG)
                  </span>
                </div>
              )}

              {imageTab === "library" && (
                <div className="grid max-h-44 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                  {mediaAssets.length === 0 ? (
                    <p className="col-span-full py-3 text-[13px] text-[var(--ink-muted)]">
                      No images stored yet. Generate, import, or upload one.
                    </p>
                  ) : (
                    mediaAssets.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setImageUrl(m.url)}
                        className={`group relative cursor-pointer overflow-hidden rounded-lg border transition-colors duration-150 ${
                          imageUrl === m.url
                            ? "border-[var(--accent)]"
                            : "border-[var(--hairline)] hover:border-[var(--hairline-strong)]"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.url}
                          alt={m.alt_text || m.filename}
                          className="h-16 w-full object-cover"
                        />
                      </button>
                    ))
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  aria-label="Active cover image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Active cover image URL (/api/media/... or https://...)"
                  className="font-code h-10 min-w-[200px] flex-1 rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3.5 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none"
                />
                {previewDownloadHref && (
                  <a
                    href={previewDownloadHref}
                    download
                    className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3.5 text-[13px] font-medium text-[var(--ink-primary)] transition-colors duration-150 hover:border-white/35"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </a>
                )}
                {entity === "dispatch" && imageUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      insertSnippet(
                        `\n\n![${title || "Visual illustration"}](${imageUrl})`
                      )
                    }
                    className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3.5 text-[13px] font-medium text-[#34D399] transition-colors duration-150 hover:border-[#34D399]/50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Insert in body</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dispatch Rich Content Editor */}
            {entity === "dispatch" && (
              <div className="space-y-2.5 border-t border-[var(--hairline)] pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="designer-mdx" className={LABEL_CLASS}>
                    Article body (Markdown, callouts, images, links) *
                  </label>
                  <div className="inline-flex flex-wrap divide-x divide-[var(--hairline)] overflow-hidden rounded-lg border border-[var(--hairline-strong)] bg-[var(--bg-canvas)]">
                    {[
                      { label: "H2", snip: "\n\n## Section Title\n\n" },
                      { label: "H3", snip: "\n\n### Subsection\n\n" },
                      { label: "Bold", snip: "**bold text**" },
                      {
                        label: "Code",
                        snip: "\n\n```typescript\n// code\n```\n\n",
                      },
                      {
                        label: "Callout",
                        snip: "\n\n> [!ACCENT] Key insight for builders.\n\n",
                      },
                      {
                        label: "Link",
                        snip: "[Resource Name](https://ggravitator.xyz)",
                      },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => insertSnippet(btn.snip)}
                        className="h-8 cursor-pointer px-2.5 text-[13px] font-medium text-[var(--ink-muted)] transition-colors duration-150 hover:bg-[var(--bg-recessed)] hover:text-[var(--ink-primary)]"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  id="designer-mdx"
                  ref={mdxRef}
                  rows={12}
                  required
                  value={mdxContent}
                  onChange={(e) => setMdxContent(e.target.value)}
                  className="font-code w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] p-4 text-[13px] leading-relaxed text-[var(--ink-primary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 focus:outline-none"
                />
              </div>
            )}

            {/* Featured / Related Links Builder */}
            <div className="space-y-3 border-t border-[var(--hairline)] pt-5">
              <h3 className="font-display flex items-center gap-2 text-[15px] font-semibold text-[var(--ink-primary)]">
                <Link2 className="h-4 w-4 text-[#34D399]" />
                <span>Attached links and references</span>
              </h3>

              {links.length > 0 && (
                <div className="divide-y divide-[var(--hairline)] rounded-xl border border-[var(--hairline)] bg-[var(--bg-canvas)]">
                  {links.map((lnk, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-[13px]"
                    >
                      <div className="min-w-0 truncate">
                        <span className="font-semibold text-[var(--ink-primary)]">
                          {lnk.label}
                        </span>
                        <span className="ml-2 text-[var(--ink-muted)]">
                          {lnk.url}
                        </span>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${lnk.label}`}
                        onClick={() =>
                          setLinks((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="cursor-pointer text-[var(--ink-muted)] transition-colors duration-150 hover:text-[#FF8A7A]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                <input
                  type="text"
                  aria-label="New link label"
                  value={newLinkLabel}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                  placeholder="Link label"
                  className="h-10 rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none sm:col-span-4"
                />
                <input
                  type="url"
                  aria-label="New link URL"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-10 rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none sm:col-span-5"
                />
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3 text-[13px] font-medium text-[var(--ink-primary)] transition-colors duration-150 hover:border-white/35 sm:col-span-3"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add link</span>
                </button>
              </div>
              <input
                type="text"
                aria-label="Optional link description"
                value={newLinkDesc}
                onChange={(e) => setNewLinkDesc(e.target.value)}
                placeholder="Optional link description"
                className="h-10 w-full rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-canvas)] px-3.5 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            {/* Publish Flags */}
            <div className="flex flex-wrap items-center gap-6 border-t border-[var(--hairline)] pt-5">
              <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-[var(--ink-primary)]">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 accent-[#10B981]"
                />
                <span>Approved and published live</span>
              </label>
              {(entity === "dispatch" || entity === "hackathon") && (
                <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-[var(--ink-primary)]">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  <span>Featured</span>
                </label>
              )}
              {entity === "news" && (
                <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-[var(--ink-primary)]">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  <span>Pinned to top</span>
                </label>
              )}
            </div>
          </div>

          {/* Right Live Visual Preview Column */}
          <div
            className={`overflow-y-auto bg-[var(--bg-canvas)] p-6 lg:col-span-5 ${
              mobileView === "edit" ? "hidden lg:block" : "block"
            }`}
          >
            <div className="mb-4 flex items-center justify-between text-[13px]">
              <span className="font-medium text-[var(--ink-muted)]">
                Live design preview
              </span>
              <span
                className="font-semibold"
                style={{ color: isPublished ? "#34D399" : accentColor }}
              >
                {isPublished ? "Published" : "Pending review"}
              </span>
            </div>

            <div
              className="rounded-xl border border-[var(--hairline)] bg-[var(--bg-surface)] p-5"
              style={
                surfaceTint
                  ? {
                      backgroundImage: `radial-gradient(circle at 85% 10%, ${surfaceTint}22, transparent 55%)`,
                    }
                  : undefined
              }
            >
              {imageUrl && (
                <div className="mb-4 overflow-hidden rounded-lg border border-[var(--hairline)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={title || "Cover preview"}
                    className="max-h-52 w-full object-cover"
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 text-[13px]">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
                <span className="font-semibold" style={{ color: accentColor }}>
                  {entity === "dispatch"
                    ? dispatchCat
                    : entity === "news"
                    ? newsCat
                    : prizeDisplay}
                </span>
                <span className="text-[var(--ink-muted)]">·</span>
                <span className="text-[var(--ink-muted)]">
                  {entity === "dispatch"
                    ? authorName
                    : entity === "news"
                    ? sourceName || "Source"
                    : organizer || "Organizer"}
                </span>
              </div>

              <h3 className="font-display mt-3 text-[21px] font-bold leading-snug tracking-[-0.02em] text-[var(--ink-primary)]">
                {title || "Post title preview"}
              </h3>

              <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-muted)]">
                {entity === "dispatch"
                  ? subtitle || "Subtitle preview..."
                  : entity === "news"
                  ? gravityTake || "Gravity Take preview..."
                  : summary || "Hackathon summary preview..."}
              </p>

              {entity === "dispatch" && (
                <div className="mt-5 space-y-3 border-t border-[var(--hairline)] pt-4 text-[13px] leading-relaxed text-[var(--ink-primary)]/90">
                  {mdxContent
                    .split(/\n\n+/)
                    .slice(0, 4)
                    .map((blk, i) => {
                      const t = blk.trim();
                      if (t.startsWith("## ")) {
                        return (
                          <div
                            key={i}
                            className="font-display pt-1 text-[16px] font-semibold text-[var(--ink-primary)]"
                          >
                            {t.replace(/^##\s+/, "")}
                          </div>
                        );
                      }
                      if (t.startsWith(">")) {
                        return (
                          <div
                            key={i}
                            style={{
                              borderColor: accentColor,
                              backgroundColor:
                                calloutStyle === "tinted-banner"
                                  ? `${accentColor}1A`
                                  : "var(--bg-canvas)",
                            }}
                            className={`rounded-lg p-3.5 ${
                              calloutStyle === "left-bar"
                                ? "border-l-2"
                                : "border"
                            }`}
                          >
                            {t.replace(/^>\s*(\[![A-Z]+\]\s*)?/, "")}
                          </div>
                        );
                      }
                      return <p key={i}>{t.slice(0, 180)}</p>;
                    })}
                </div>
              )}

              {links.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--hairline)] pt-3.5 text-[13px]">
                  {links.map((lnk, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 font-medium"
                      style={{ color: accentColor }}
                    >
                      <span>{lnk.label}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="col-span-full flex items-center justify-end gap-3 border-t border-[var(--hairline)] bg-[var(--bg-surface)] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 cursor-pointer rounded-full border border-[var(--hairline-strong)] px-5 text-[13px] font-medium text-[var(--ink-muted)] transition-colors duration-150 hover:border-white/35 hover:text-[var(--ink-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="press-tactile inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-[var(--accent)] px-6 text-[13px] font-semibold text-[#07090D] hover:bg-[var(--accent-hover)] disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isEdit ? "Save changes" : "Publish or save post"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
