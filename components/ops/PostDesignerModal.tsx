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
  Share2,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import type { OpsMediaSummary } from "@/components/ops/ops-types";
import { getDispatchOgVersion, sanitizeShareText } from "@/lib/journal/share";
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
  { name: "Alabaster", hex: "#F4F3EF" },
];

function parseUtcDatetimeLocal(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();
  }
  const withZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(trimmed) ? trimmed : `${trimmed}Z`;
  const parsed = new Date(withZone);
  return Number.isNaN(parsed.getTime())
    ? new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString()
    : parsed.toISOString();
}

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
  const [newsCat, setNewsCat] = useState<NewsCategory>(news?.category || "AGENTS");
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
  const [format, setFormat] = useState<HackathonFormat>(hack?.format || "ONLINE");
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
  const [previewMode, setPreviewMode] = useState<"article" | "share">("article");
  const [coverMeta, setCoverMeta] = useState<{
    url: string;
    width: number;
    height: number;
  } | null>(null);

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
    const next =
      mdxContent.slice(0, start) + snippet + mdxContent.slice(end);
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
          ? "Generated with Gemini Image AI"
          : "Generated with Studio Editorial SVG (Gemini image fallback)"
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
          setTagsText(d.tags.map((t) => String(t).trim()).filter(Boolean).join(", "));
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
        if (typeof d.impact_score === "number" && Number.isFinite(d.impact_score)) {
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
        if (typeof d.prize_pool_usd === "number" && Number.isFinite(d.prize_pool_usd)) {
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
          setThemesText(d.themes.map((t) => String(t).trim()).filter(Boolean).join(", "));
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
      setAiStatus(`Draft populated into editor (${sourceNote}${coverNote}). Review preview and click Publish / Save.`);
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

    // Preserve a pending unsaved link row if the user filled both label and URL
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

  const activeCoverMeta =
    coverMeta && coverMeta.url === imageUrl ? coverMeta : null;
  const coverAspectRatio =
    activeCoverMeta && activeCoverMeta.height > 0
      ? activeCoverMeta.width / activeCoverMeta.height
      : null;
  const isPortraitCover =
    coverAspectRatio !== null && coverAspectRatio < 1.25;

  const shareTitle = sanitizeShareText(title || "Journal Dispatch Title Preview");
  const shareDescription = sanitizeShareText(
    initialDesign.seo_description ||
      subtitle ||
      "Concise summary shown beneath the cover header on WhatsApp, X, and LinkedIn."
  );
  const shareSlug = useMemo(() => {
    if (entity === "dispatch" && disp?.slug) return disp.slug;
    const base = (title || "new-journal-dispatch")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64);
    return base || "new-journal-dispatch";
  }, [entity, disp?.slug, title]);

  const liveOgUrl = useMemo(() => {
    if (entity !== "dispatch" || !disp?.slug || disp.is_published === false) {
      return null;
    }
    return `/journal/${disp.slug}/og?v=${getDispatchOgVersion(disp)}`;
  }, [entity, disp]);

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
        className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0B0B0E] text-[#F4F3EF] shadow-2xl"
      >
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.12]"
              style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
            >
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-[#F4F3EF]">
                {isEdit ? "Edit & Design" : "Create & Design"}{" "}
                {entity === "dispatch"
                  ? "Journal Dispatch"
                  : entity === "news"
                  ? "Orbital Wire Post"
                  : "Hackathon Listing"}
              </h2>
              <p className="text-xs text-[#8B8B94]">
                Customize colors, AI-generated/imported images, callouts, and links
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full border border-white/[0.1] bg-[#141418] p-1 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileView("edit")}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  mobileView === "edit"
                    ? "bg-[#F4F3EF] text-[#08080A]"
                    : "text-[#A1A1AA]"
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setMobileView("preview")}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  mobileView === "preview"
                    ? "bg-[#F4F3EF] text-[#08080A]"
                    : "text-[#A1A1AA]"
                }`}
              >
                Preview
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Designer"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/[0.1] bg-[#18181D] text-[#A1A1AA] hover:text-[#F4F3EF]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* AI Research & Draft Bar (populates live editor for review) */}
        {!isEdit && (
          <div className="space-y-2 border-b border-white/[0.06] bg-[#111114] px-5 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-[#FF6B54]" />
              <input
                type="text"
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
                placeholder={`Enter a topic to research live web sources, generate a cover visual & draft this ${entity} into the editor...`}
                className="h-9 min-w-[220px] flex-1 rounded-full border border-white/[0.1] bg-[#0B0B0E] px-4 text-xs text-[#F4F3EF] placeholder:text-[#71717A] focus:border-[#FF3B1F] focus:outline-none"
              />
              <button
                type="button"
                disabled={aiBusy || !(aiTopic || title).trim()}
                onClick={() => void handleAiAssistDraft()}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-[#FF3B1F]/15 px-4 text-xs font-semibold text-[#FF8A7A] hover:bg-[#FF3B1F] hover:text-[#08080A] disabled:opacity-50"
              >
                {aiBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5" />
                )}
                <span>{aiBusy ? "Researching & drafting..." : "AI Research & Draft"}</span>
              </button>
            </div>
            {aiStatus && (
              <div className="flex items-center gap-1.5 text-xs text-[#34D399]">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
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
            className={`space-y-5 overflow-y-auto border-r border-white/[0.08] p-5 lg:col-span-7 ${
              mobileView === "preview" ? "hidden lg:block" : "block"
            }`}
          >
            {saveError && (
              <div className="rounded-xl border border-[#FF3B1F]/40 bg-[#FF3B1F]/12 px-4 py-3 text-sm text-[#FF8A7A]">
                {saveError}
              </div>
            )}

            {/* Title + Publish state */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#D4D4D8]">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.12] bg-[#141418] px-3.5 text-sm text-[#F4F3EF] focus:border-[#FF3B1F] focus:outline-none"
                />
              </div>

              {entity === "dispatch" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[#D4D4D8]">
                      Subtitle *
                    </label>
                    <input
                      type="text"
                      required
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.12] bg-[#141418] px-3.5 text-sm text-[#F4F3EF] focus:border-[#FF3B1F] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-[#D4D4D8]">
                        Category
                      </label>
                      <select
                        value={dispatchCat}
                        onChange={(e) =>
                          setDispatchCat(e.target.value as DispatchCategory)
                        }
                        className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.12] bg-[#141418] px-3 text-xs text-[#F4F3EF]"
                      >
                        <option value="AI SYSTEMS">AI Systems</option>
                        <option value="HACKATHON LOG">Hackathon Log</option>
                        <option value="DESIGN ENGINEERING">Design Engineering</option>
                        <option value="ARCHITECTURE">Architecture</option>
                        <option value="POST-MORTEM">Post-Mortem</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#D4D4D8]">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={tagsText}
                        onChange={(e) => setTagsText(e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.12] bg-[#141418] px-3 text-xs text-[#F4F3EF]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-[#D4D4D8]">
                        Author Name
                      </label>
                      <input
                        type="text"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.12] bg-[#141418] px-3 text-xs text-[#F4F3EF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#D4D4D8]">
                        Author Role / Byline
                      </label>
                      <input
                        type="text"
                        value={authorRole}
                        onChange={(e) => setAuthorRole(e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.12] bg-[#141418] px-3 text-xs text-[#F4F3EF]"
                      />
                    </div>
                  </div>
                </>
              )}

              {entity === "news" && (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-medium text-[#D4D4D8]">
                        Source Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={sourceName}
                        onChange={(e) => setSourceName(e.target.value)}
                        placeholder="e.g. Google DeepMind"
                        className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.12] bg-[#141418] px-3 text-xs text-[#F4F3EF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#D4D4D8]">
                        Category
                      </label>
                      <select
                        value={newsCat}
                        onChange={(e) => setNewsCat(e.target.value as NewsCategory)}
                        className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.12] bg-[#141418] px-3 text-xs text-[#F4F3EF]"
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
                      <label className="block text-xs font-medium text-[#D4D4D8]">
                        Impact (1-100)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={impactScore}
                        onChange={(e) => setImpactScore(Number(e.target.value))}
                        className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.12] bg-[#141418] px-3 text-xs text-[#F4F3EF]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#D4D4D8]">
                      Source URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://..."
                      className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.12] bg-[#141418] px-3 text-xs text-[#F4F3EF]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#D4D4D8]">
                      Gravity Take (2-sentence builder takeaway) *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={gravityTake}
                      onChange={(e) => setGravityTake(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-white/[0.12] bg-[#141418] p-3 text-sm text-[#F4F3EF]"
                    />
                  </div>
                </>
              )}

              {entity === "hackathon" && (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-[#D4D4D8]">
                        Organizer *
                      </label>
                      <input
                        type="text"
                        required
                        value={organizer}
                        onChange={(e) => setOrganizer(e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.12] bg-[#141418] px-3 text-xs text-[#F4F3EF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#D4D4D8]">
                        Primary Registration URL *
                      </label>
                      <input
                        type="url"
                        required
                        value={primaryUrl}
                        onChange={(e) => setPrimaryUrl(e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.12] bg-[#141418] px-3 text-xs text-[#F4F3EF]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#D4D4D8]">
                      Summary *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-white/[0.12] bg-[#141418] p-3 text-sm text-[#F4F3EF]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <label className="block text-xs font-medium text-[#D4D4D8]">
                        Prize Display
                      </label>
                      <input
                        type="text"
                        value={prizeDisplay}
                        onChange={(e) => setPrizeDisplay(e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.12] bg-[#141418] px-3 text-xs text-[#F4F3EF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#D4D4D8]">
                        Prize USD
                      </label>
                      <input
                        type="number"
                        value={prizeUsd}
                        onChange={(e) => setPrizeUsd(e.target.value)}
                        placeholder="50000"
                        className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.12] bg-[#141418] px-3 text-xs text-[#F4F3EF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#D4D4D8]">
                        Format
                      </label>
                      <select
                        value={format}
                        onChange={(e) =>
                          setFormat(e.target.value as HackathonFormat)
                        }
                        className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.12] bg-[#141418] px-3 text-xs text-[#F4F3EF]"
                      >
                        <option value="ONLINE">Online</option>
                        <option value="IN_PERSON">In-Person</option>
                        <option value="HYBRID">Hybrid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#D4D4D8]">
                        OXA Status
                      </label>
                      <select
                        value={oxaStatus}
                        onChange={(e) =>
                          setOxaStatus(e.target.value as OxakalabsStatus)
                        }
                        className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.12] bg-[#141418] px-3 text-xs text-[#F4F3EF]"
                      >
                        <option value="NONE">None</option>
                        <option value="SCOUTING">Scouting</option>
                        <option value="SQUAD_DEPLOYED">Squad Deployed</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="WON">Won</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-medium text-[#D4D4D8]">
                        Deadline (UTC)
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={deadlineAt}
                        onChange={(e) => setDeadlineAt(e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.12] bg-[#141418] px-3 text-xs text-[#F4F3EF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#D4D4D8]">
                        Location
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.12] bg-[#141418] px-3 text-xs text-[#F4F3EF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#D4D4D8]">
                        Themes (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={themesText}
                        onChange={(e) => setThemesText(e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.12] bg-[#141418] px-3 text-xs text-[#F4F3EF]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#D4D4D8]">
                      Announcement / X Post URL (optional)
                    </label>
                    <input
                      type="url"
                      value={tweetUrl}
                      onChange={(e) => setTweetUrl(e.target.value)}
                      placeholder="https://x.com/..."
                      className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.12] bg-[#141418] px-3 text-xs text-[#F4F3EF]"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Color & Layout Design Controls */}
            <div className="rounded-2xl border border-white/[0.09] bg-[#111114] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#D4D4D8]">
                  Color &amp; Layout Formatting
                </span>
                <span className="font-mono text-xs text-[#8B8B94]">{accentColor}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {ACCENT_PRESETS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setAccentColor(c.hex)}
                    title={c.name}
                    className={`h-7 w-7 cursor-pointer rounded-full border-2 transition-transform ${
                      accentColor.toLowerCase() === c.hex.toLowerCase()
                        ? "scale-110 border-white"
                        : "border-white/20"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/[0.12] bg-[#18181D] px-3 py-1 text-xs text-[#D4D4D8]">
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
                    <label className="block text-[11px] font-medium text-[#A1A1AA]">
                      Hero Layout
                    </label>
                    <select
                      value={heroLayout}
                      onChange={(e) =>
                        setHeroLayout(e.target.value as typeof heroLayout)
                      }
                      className="mt-1 h-9 w-full rounded-xl border border-white/[0.1] bg-[#18181D] px-3 text-xs text-[#F4F3EF]"
                    >
                      <option value="editorial">Editorial Banner</option>
                      <option value="split">Split Header + Visual</option>
                      <option value="fullbleed">Full-Bleed Visual</option>
                      <option value="minimal">Minimal (No Cover)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#A1A1AA]">
                      Callout Style
                    </label>
                    <select
                      value={calloutStyle}
                      onChange={(e) =>
                        setCalloutStyle(e.target.value as typeof calloutStyle)
                      }
                      className="mt-1 h-9 w-full rounded-xl border border-white/[0.1] bg-[#18181D] px-3 text-xs text-[#F4F3EF]"
                    >
                      <option value="left-bar">Left Accent Bar</option>
                      <option value="tinted-banner">Color-Tinted Banner</option>
                      <option value="glass-card">Outlined Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#A1A1AA]">
                      Backdrop Glow Tint
                    </label>
                    <input
                      type="text"
                      value={surfaceTint}
                      onChange={(e) => setSurfaceTint(e.target.value)}
                      placeholder="#FF3B1F (optional)"
                      className="mt-1 h-9 w-full rounded-xl border border-white/[0.1] bg-[#18181D] px-3 text-xs text-[#F4F3EF]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Embedded Image Studio */}
            <div className="rounded-2xl border border-white/[0.09] bg-[#111114] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4D4D8]">
                  <ImageIcon className="h-3.5 w-3.5 text-[#FF6B54]" />
                  <span>Post Cover &amp; Visual Studio</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {(["generate", "import", "upload", "library"] as const).map(
                    (tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setImageTab(tab)}
                        className={`cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${
                          imageTab === tab
                            ? "bg-[#F4F3EF] text-[#08080A]"
                            : "bg-[#18181D] text-[#A1A1AA] hover:text-[#F4F3EF]"
                        }`}
                      >
                        {tab}
                      </button>
                    )
                  )}
                </div>
              </div>

              {imgError && (
                <div className="rounded-lg border border-[#FF3B1F]/35 bg-[#FF3B1F]/12 px-3 py-2 text-xs text-[#FF8A7A]">
                  {imgError}
                </div>
              )}
              {imgStatus && !imgError && (
                <div className="flex items-center gap-1.5 rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 px-3 py-2 text-xs text-[#34D399]">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>{imgStatus}</span>
                </div>
              )}

              {imageTab === "generate" && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={imgPrompt}
                    onChange={(e) => setImgPrompt(e.target.value)}
                    placeholder="Describe the cover image or leave blank to use post title..."
                    className="h-9 flex-1 rounded-xl border border-white/[0.1] bg-[#0B0B0E] px-3 text-xs text-[#F4F3EF]"
                  />
                  <button
                    type="button"
                    disabled={imgBusy}
                    onClick={() => void handleGenerateImage()}
                    className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#FF3B1F] px-4 text-xs font-semibold text-[#08080A] hover:bg-[#FF5238] disabled:opacity-60"
                  >
                    {imgBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    <span>Generate Image</span>
                  </button>
                </div>
              )}

              {imageTab === "import" && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="url"
                    value={imgImportUrl}
                    onChange={(e) => setImgImportUrl(e.target.value)}
                    placeholder="Paste public image URL (https://...) to download & host"
                    className="h-9 flex-1 rounded-xl border border-white/[0.1] bg-[#0B0B0E] px-3 text-xs text-[#F4F3EF]"
                  />
                  <button
                    type="button"
                    disabled={imgBusy || !imgImportUrl.trim()}
                    onClick={() => void handleImportImageUrl()}
                    className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#F4F3EF] px-4 text-xs font-semibold text-[#08080A] disabled:opacity-50"
                  >
                    {imgBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    <span>Import &amp; Store</span>
                  </button>
                </div>
              )}

              {imageTab === "upload" && (
                <div className="flex items-center gap-3">
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
                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-white/[0.14] bg-[#18181D] px-4 text-xs font-medium text-[#F4F3EF] hover:border-white/[0.28]"
                  >
                    <Upload className="h-3.5 w-3.5 text-[#FF6B54]" />
                    <span>{imgBusy ? "Uploading..." : "Choose Image File"}</span>
                  </button>
                  <span className="text-[11px] text-[#8B8B94]">
                    Max 5 MB (PNG, JPEG, WEBP, SVG)
                  </span>
                </div>
              )}

              {imageTab === "library" && (
                <div className="grid max-h-40 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                  {mediaAssets.length === 0 ? (
                    <p className="col-span-full py-3 text-xs text-[#8B8B94]">
                      No images stored yet. Generate, import, or upload one.
                    </p>
                  ) : (
                    mediaAssets.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setImageUrl(m.url)}
                        className={`group relative overflow-hidden rounded-lg border ${
                          imageUrl === m.url
                            ? "border-[#FF3B1F]"
                            : "border-white/[0.1]"
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
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Active cover image URL (/api/media/... or https://...)"
                  className="h-9 min-w-[200px] flex-1 rounded-xl border border-white/[0.1] bg-[#0B0B0E] px-3 font-mono text-xs text-[#D4D4D8]"
                />
                {previewDownloadHref && (
                  <a
                    href={previewDownloadHref}
                    download
                    className="inline-flex h-9 items-center gap-1 rounded-xl border border-white/[0.1] bg-[#18181D] px-3 text-xs font-medium text-[#D4D4D8] hover:text-[#F4F3EF]"
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
                    className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-xl border border-white/[0.1] bg-[#18181D] px-3 text-xs font-medium text-[#34D399]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Insert in body</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dispatch Rich Content Editor */}
            {entity === "dispatch" && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-medium text-[#D4D4D8]">
                    Article Body (Markdown + Callouts + Images + Links) *
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { label: "H2", snip: "\n\n## Section Title\n\n" },
                      { label: "H3", snip: "\n\n### Subsection\n\n" },
                      { label: "Bold", snip: "**bold text**" },
                      { label: "Code", snip: "\n\n```typescript\n// code\n```\n\n" },
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
                        className="cursor-pointer rounded-lg border border-white/[0.1] bg-[#18181D] px-2 py-1 text-[11px] font-medium text-[#D4D4D8] hover:border-white/[0.25]"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  ref={mdxRef}
                  rows={12}
                  required
                  value={mdxContent}
                  onChange={(e) => setMdxContent(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.12] bg-[#141418] p-4 font-mono text-xs leading-relaxed text-[#F4F3EF] focus:border-[#FF3B1F] focus:outline-none"
                />
              </div>
            )}

            {/* Featured / Related Links Builder */}
            <div className="rounded-2xl border border-white/[0.09] bg-[#111114] p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4D4D8]">
                <Link2 className="h-3.5 w-3.5 text-[#34D399]" />
                <span>Attached Links &amp; References</span>
              </div>

              {links.length > 0 && (
                <div className="space-y-1.5">
                  {links.map((lnk, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-[#18181D] px-3 py-2 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-[#F4F3EF]">
                          {lnk.label}
                        </span>
                        <span className="ml-2 truncate text-[#8B8B94]">
                          {lnk.url}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setLinks((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="text-[#8B8B94] hover:text-[#FF8A7A]"
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
                  value={newLinkLabel}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                  placeholder="Link label"
                  className="h-9 rounded-xl border border-white/[0.1] bg-[#0B0B0E] px-3 text-xs text-[#F4F3EF] sm:col-span-4"
                />
                <input
                  type="url"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-9 rounded-xl border border-white/[0.1] bg-[#0B0B0E] px-3 text-xs text-[#F4F3EF] sm:col-span-5"
                />
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="inline-flex h-9 cursor-pointer items-center justify-center gap-1 rounded-xl border border-white/[0.12] bg-[#18181D] px-3 text-xs font-medium text-[#F4F3EF] hover:border-white/[0.25] sm:col-span-3"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add link</span>
                </button>
              </div>
              <input
                type="text"
                value={newLinkDesc}
                onChange={(e) => setNewLinkDesc(e.target.value)}
                placeholder="Optional link description"
                className="h-9 w-full rounded-xl border border-white/[0.1] bg-[#0B0B0E] px-3 text-xs text-[#F4F3EF]"
              />
            </div>

            {/* Flags */}
            <div className="flex flex-wrap items-center gap-5 pt-1">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#D4D4D8]">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 accent-[#10B981]"
                />
                <span>Approved &amp; Published Live</span>
              </label>
              {(entity === "dispatch" || entity === "hackathon") && (
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#D4D4D8]">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="h-4 w-4 accent-[#FF3B1F]"
                  />
                  <span>Featured</span>
                </label>
              )}
              {entity === "news" && (
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#D4D4D8]">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="h-4 w-4 accent-[#FF3B1F]"
                  />
                  <span>Pinned to top</span>
                </label>
              )}
            </div>
          </div>

          {/* Right Live Visual Preview Column */}
          <div
            className={`overflow-y-auto bg-[#08080A] p-5 lg:col-span-5 ${
              mobileView === "edit" ? "hidden lg:block" : "block"
            }`}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              {entity === "dispatch" ? (
                <div className="inline-flex rounded-full border border-white/[0.1] bg-[#141418] p-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("article")}
                    className={`cursor-pointer rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                      previewMode === "article"
                        ? "bg-[#F4F3EF] text-[#08080A]"
                        : "text-[#A1A1AA] hover:text-[#F4F3EF]"
                    }`}
                  >
                    Article
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("share")}
                    className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                      previewMode === "share"
                        ? "bg-[#F4F3EF] text-[#08080A]"
                        : "text-[#A1A1AA] hover:text-[#F4F3EF]"
                    }`}
                  >
                    <Share2 className="h-3 w-3" />
                    <span>Share Card</span>
                  </button>
                </div>
              ) : (
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#8B8B94]">
                  Live Design Preview
                </span>
              )}

              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-[#08080A]"
                style={{ backgroundColor: accentColor }}
              >
                {isPublished ? "Published" : "Pending Review"}
              </span>
            </div>

            {entity === "dispatch" && previewMode === "share" ? (
              <div className="space-y-4">
                {/* Master vs. Share Copy Telemetry */}
                <div className="rounded-xl border border-white/[0.08] bg-[#111114] p-3 text-[11px] text-[#A1A1AA]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-medium text-[#D4D4D8]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                      Master cover untouched (full-res)
                    </span>
                    <span className="rounded-full border border-white/[0.1] bg-[#18181D] px-2 py-0.5 font-mono text-[10px] text-[#D4D4D8]">
                      {!imageUrl
                        ? "Editorial Fallback"
                        : isPortraitCover
                        ? "Smart Framed Portrait"
                        : "Full-Bleed 16:9"}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#8B8B94]">
                    <span>
                      Share copy: 1200×630 baseline JPEG · q90 adaptive ≤ 265 KB
                    </span>
                    {activeCoverMeta && (
                      <span className="font-mono">
                        {activeCoverMeta.width}×{activeCoverMeta.height}
                      </span>
                    )}
                  </div>
                  {liveOgUrl && imageUrl === initialImage && (
                    <a
                      href={liveOgUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[#38BDF8] hover:underline"
                    >
                      <span>Open live server /og JPEG</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* WhatsApp Dark Link Preview Mockup */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#8B8B94]">
                      WhatsApp Share Preview
                    </span>
                    <span className="text-[10px] text-[#34D399]">
                      Rich Header Card
                    </span>
                  </div>
                  <div className="rounded-2xl rounded-tr-sm bg-[#005C4B] p-2 shadow-lg">
                    <div className="overflow-hidden rounded-xl bg-[#025144]">
                      <div className="relative aspect-[1200/630] w-full overflow-hidden bg-[#08080A]">
                        {imageUrl ? (
                          isPortraitCover ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imageUrl}
                                alt=""
                                aria-hidden="true"
                                className="absolute inset-0 h-full w-full scale-110 object-cover brightness-[0.42] blur-md"
                              />
                              <div className="absolute inset-0 bg-[#08080A]/25" />
                              <div className="relative flex h-full w-full items-center justify-center p-2.5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={imageUrl}
                                  alt={shareTitle}
                                  onLoad={(e) => {
                                    const img = e.currentTarget;
                                    if (img.naturalWidth && img.naturalHeight) {
                                      setCoverMeta({
                                        url: imageUrl,
                                        width: img.naturalWidth,
                                        height: img.naturalHeight,
                                      });
                                    }
                                  }}
                                  className="h-full max-w-full border border-white/20 object-contain shadow-lg"
                                />
                              </div>
                            </>
                          ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={imageUrl}
                              alt={shareTitle}
                              onLoad={(e) => {
                                const img = e.currentTarget;
                                if (img.naturalWidth && img.naturalHeight) {
                                  setCoverMeta({
                                    url: imageUrl,
                                    width: img.naturalWidth,
                                    height: img.naturalHeight,
                                  });
                                }
                              }}
                              className="h-full w-full object-cover"
                            />
                          )
                        ) : (
                          <div
                            className="flex h-full w-full flex-col justify-between p-4"
                            style={{
                              backgroundImage: `radial-gradient(circle at 86% 12%, ${accentColor}40 0%, transparent 55%)`,
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-display text-xs font-bold text-[#F4F3EF]">
                                G-Gravitator
                              </span>
                              <span
                                className="rounded-full px-2 py-0.5 text-[9px] font-bold text-[#08080A]"
                                style={{ backgroundColor: accentColor }}
                              >
                                {disp?.issue_number
                                  ? `Issue ${disp.issue_number}`
                                  : "Journal"}
                              </span>
                            </div>
                            <div className="font-display line-clamp-2 text-sm font-bold leading-tight text-[#F4F3EF]">
                              {shareTitle}
                            </div>
                            <div className="flex items-center justify-between text-[9px] text-[#A1A1AA]">
                              <span>{authorName}</span>
                              <span>ggravitator.xyz/journal</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 p-2.5">
                        <div className="line-clamp-2 text-xs font-semibold leading-snug text-[#E9EDEF]">
                          {shareTitle}
                        </div>
                        <div className="line-clamp-2 text-[11px] leading-snug text-[#AEBAC1]">
                          {shareDescription}
                        </div>
                        <div className="pt-0.5 text-[10px] text-[#8696A0]">
                          ggravitator.xyz
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1 px-1 pb-0.5 text-[11px] leading-snug text-[#E9EDEF]">
                      <p className="line-clamp-2 font-medium">{shareTitle}</p>
                      <p className="truncate text-[#53BDEB] underline">
                        {`https://www.ggravitator.xyz/journal/${shareSlug}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* X / LinkedIn Large Summary Card Mockup */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#8B8B94]">
                      X / LinkedIn Large Card
                    </span>
                    <span className="font-mono text-[10px] text-[#8B8B94]">
                      summary_large_image
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-white/[0.12] bg-[#111114]">
                    <div className="relative aspect-[1200/630] w-full overflow-hidden bg-[#08080A]">
                      {imageUrl ? (
                        isPortraitCover ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imageUrl}
                              alt=""
                              aria-hidden="true"
                              className="absolute inset-0 h-full w-full scale-110 object-cover brightness-[0.42] blur-md"
                            />
                            <div className="absolute inset-0 bg-[#08080A]/25" />
                            <div className="relative flex h-full w-full items-center justify-center p-2.5">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imageUrl}
                                alt={shareTitle}
                                className="h-full max-w-full border border-white/20 object-contain shadow-lg"
                              />
                            </div>
                          </>
                        ) : (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={imageUrl}
                            alt={shareTitle}
                            className="h-full w-full object-cover"
                          />
                        )
                      ) : (
                        <div
                          className="flex h-full w-full flex-col justify-between p-4"
                          style={{
                            backgroundImage: `radial-gradient(circle at 86% 12%, ${accentColor}40 0%, transparent 55%)`,
                          }}
                        >
                          <span className="font-display text-xs font-bold text-[#F4F3EF]">
                            G-Gravitator Journal
                          </span>
                          <div className="font-display line-clamp-2 text-sm font-bold text-[#F4F3EF]">
                            {shareTitle}
                          </div>
                        </div>
                      )}
                      <span className="absolute bottom-2.5 left-2.5 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-medium text-[#F4F3EF] backdrop-blur-sm">
                        ggravitator.xyz
                      </span>
                    </div>
                    <div className="space-y-1 border-t border-white/[0.08] p-3">
                      <div className="line-clamp-2 text-xs font-semibold text-[#F4F3EF]">
                        {shareTitle}
                      </div>
                      <div className="line-clamp-2 text-[11px] text-[#8B8B94]">
                        {shareDescription}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="rounded-2xl border border-white/[0.1] bg-[#111114] p-5"
                style={
                  surfaceTint
                    ? {
                        backgroundImage: `radial-gradient(circle at 85% 10%, ${surfaceTint}25, transparent 55%)`,
                      }
                    : undefined
                }
              >
                {imageUrl && (
                  <div className="mb-4 overflow-hidden rounded-xl border border-white/[0.1]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={title || "Cover preview"}
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        if (img.naturalWidth && img.naturalHeight) {
                          setCoverMeta({
                            url: imageUrl,
                            width: img.naturalWidth,
                            height: img.naturalHeight,
                          });
                        }
                      }}
                      className="max-h-52 w-full object-cover"
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-[#08080A]"
                    style={{ backgroundColor: accentColor }}
                  >
                    {entity === "dispatch"
                      ? dispatchCat
                      : entity === "news"
                      ? newsCat
                      : prizeDisplay}
                  </span>
                  <span className="text-xs text-[#8B8B94]">
                    {entity === "dispatch"
                      ? authorName
                      : entity === "news"
                      ? sourceName || "Source"
                      : organizer || "Organizer"}
                  </span>
                </div>

                <h3 className="font-display mt-3 text-xl font-bold leading-snug text-[#F4F3EF]">
                  {title || "Post Title Preview"}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
                  {entity === "dispatch"
                    ? subtitle || "Subtitle preview..."
                    : entity === "news"
                    ? gravityTake || "Gravity Take preview..."
                    : summary || "Hackathon summary preview..."}
                </p>

                {entity === "dispatch" && (
                  <div className="mt-4 space-y-2 border-t border-white/[0.08] pt-4 text-xs leading-relaxed text-[#D4D4D8]">
                    {mdxContent
                      .split(/\n\n+/)
                      .slice(0, 4)
                      .map((blk, i) => {
                        const t = blk.trim();
                        if (t.startsWith("## ")) {
                          return (
                            <div
                              key={i}
                              className="font-display pt-1 text-sm font-semibold text-[#F4F3EF]"
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
                                    : "#18181D",
                              }}
                              className={`rounded-lg p-3 ${
                                calloutStyle === "left-bar"
                                  ? "border-l-4"
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
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.08] pt-3">
                    {links.map((lnk, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-full border border-white/[0.1] bg-[#18181D] px-2.5 py-1 text-[11px] font-medium"
                        style={{ color: accentColor }}
                      >
                        <span>{lnk.label}</span>
                        <ExternalLink className="h-3 w-3" />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="col-span-full flex items-center justify-end gap-3 border-t border-white/[0.08] bg-[#0B0B0E] px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 cursor-pointer rounded-full border border-white/[0.1] px-5 text-xs font-medium text-[#A1A1AA] hover:text-[#F4F3EF]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-[#FF3B1F] px-6 text-xs font-semibold text-[#08080A] hover:bg-[#FF5238] disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isEdit ? "Save Changes" : "Publish / Save Post"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
