"use client";

import React, { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  Lock,
  Mail,
  MessageCircle,
  Send,
  Share2,
  X,
} from "lucide-react";
import {
  buildJournalShareUrls,
  buildSocialShareTargets,
  copyTextToClipboard,
  sanitizeShareText,
} from "@/lib/journal/share";
import {
  DEFAULT_CANONICAL_ORIGIN,
  PRIMARY_BRAND_DOMAIN,
} from "@/lib/seo/site";
import type { Dispatch } from "@/lib/supabase/types";

interface JournalShareModalProps {
  dispatch: Dispatch | null;
  open: boolean;
  onClose: () => void;
  shareToken?: string | null;
  originOverride?: string;
  isLight?: boolean;
}

const noopSubscribe = () => () => {};

function JournalShareDialogBody({
  dispatch,
  onClose,
  shareToken = null,
  originOverride,
  isLight = false,
}: {
  dispatch: Dispatch;
  onClose: () => void;
  shareToken?: string | null;
  originOverride?: string;
  isLight?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [mintedToken, setMintedToken] = useState<string | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);

  const runtimeOrigin = useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => originOverride || DEFAULT_CANONICAL_ORIGIN
  );

  const canNativeShare = useSyncExternalStore(
    noopSubscribe,
    () =>
      typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    if (dispatch.is_published !== false || shareToken) return;

    let active = true;
    fetch("/api/journal/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: dispatch.id }),
    })
      .then(async (res) => {
        const json = (await res.json().catch(() => null)) as {
          ok?: boolean;
          shareUrl?: string;
          error?: string;
        } | null;
        if (!active) return;
        if (!res.ok || !json?.ok || !json.shareUrl) {
          setMintError(json?.error || "Unable to generate draft share link.");
          return;
        }
        try {
          const parsed = new URL(json.shareUrl);
          const tok = parsed.searchParams.get("share");
          if (tok) setMintedToken(tok);
        } catch {
          // ignore URL parse error
        }
      })
      .catch(() => {
        if (active) setMintError("Network error generating private share link.");
      });

    return () => {
      active = false;
    };
  }, [dispatch.id, dispatch.is_published, shareToken]);

  const effectiveToken = shareToken || mintedToken;

  const urls = useMemo(
    () =>
      buildJournalShareUrls({
        dispatch,
        origin: runtimeOrigin,
        shareToken: effectiveToken,
      }),
    [dispatch, runtimeOrigin, effectiveToken]
  );

  const socialTargets = useMemo(
    () =>
      buildSocialShareTargets({
        url: urls.shareUrl,
        title: dispatch.title,
        subtitle: dispatch.subtitle,
        issueNumber: dispatch.issue_number,
      }),
    [dispatch.title, dispatch.subtitle, dispatch.issue_number, urls.shareUrl]
  );

  const cleanTitle = sanitizeShareText(dispatch.title);
  const cleanSubtitle = sanitizeShareText(dispatch.subtitle);
  const hostLabel = (() => {
    try {
      return new URL(urls.shareUrl).host;
    } catch {
      return PRIMARY_BRAND_DOMAIN;
    }
  })();

  const handleCopyLink = () => {
    void copyTextToClipboard(urls.shareUrl).then((ok) => {
      if (ok) {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
      }
    });
  };

  const handleNativeShare = async () => {
    if (
      typeof navigator === "undefined" ||
      typeof navigator.share !== "function"
    ) {
      return;
    }
    try {
      await navigator.share({
        title: `Issue ${dispatch.issue_number}: ${cleanTitle}`,
        text: cleanSubtitle,
        url: urls.shareUrl,
      });
    } catch {
      // User canceled native share sheet
    }
  };

  const previewImgSrc =
    previewFailed && dispatch.cover_image_url
      ? dispatch.cover_image_url
      : urls.ogImagePath;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="journal-share-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-xl overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.7)] ${
          isLight
            ? "border-[var(--hairline-stone)] bg-[var(--bg-stone)] text-[var(--ink-stone-primary)]"
            : "border-[var(--hairline-strong)] bg-[var(--bg-surface)] text-[var(--ink-primary)]"
        }`}
      >
        <div
          className={`flex items-center justify-between gap-3 border-b px-6 py-4 ${
            isLight
              ? "border-[var(--hairline-stone)]"
              : "border-[var(--hairline)]"
          }`}
        >
          <div>
            <p className="font-tabular text-[13px] font-medium text-[var(--accent)]">
              Issue {dispatch.issue_number}
            </p>
            <h2
              id="journal-share-dialog-title"
              className="font-display text-[20px] font-semibold tracking-[-0.02em]"
            >
              Share dispatch
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close share dialog"
            className={`press-tactile inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition-colors duration-150 ${
              isLight
                ? "border-[var(--hairline-stone)] bg-white text-[var(--ink-stone-muted)] hover:text-[var(--ink-stone-primary)]"
                : "border-[var(--hairline-strong)] bg-[var(--bg-recessed)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            }`}
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>

        <div className="max-h-[82vh] space-y-5 overflow-y-auto p-6">
          <div>
            <div className="mb-2 flex items-center justify-between gap-2 text-[14px]">
              <span
                className={
                  isLight
                    ? "text-[var(--ink-stone-muted)]"
                    : "text-[var(--ink-muted)]"
                }
              >
                Social link preview
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${
                  urls.isPrivatePreview
                    ? "text-[#F59E0B]"
                    : isLight
                    ? "text-[var(--ink-stone-muted)]"
                    : "text-[var(--ink-muted)]"
                }`}
              >
                {urls.isPrivatePreview ? (
                  <>
                    <Lock className="h-3.5 w-3.5" strokeWidth={1.8} />
                    <span>Private preview</span>
                  </>
                ) : (
                  <>
                    <Globe
                      className="h-3.5 w-3.5 text-[#10B981]"
                      strokeWidth={1.8}
                    />
                    <span>Open Graph ready</span>
                  </>
                )}
              </span>
            </div>

            <div
              className={`overflow-hidden rounded-xl border ${
                isLight
                  ? "border-[var(--hairline-stone)] bg-white"
                  : "border-[var(--hairline)] bg-[var(--bg-canvas)]"
              }`}
            >
              <div className="relative aspect-[1200/630] w-full overflow-hidden bg-[#07090D]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImgSrc}
                  alt={cleanTitle}
                  onError={() => setPreviewFailed(true)}
                  className="h-full w-full object-cover"
                />
              </div>
              <div
                className={`border-t p-4 ${
                  isLight
                    ? "border-[var(--hairline-stone)]"
                    : "border-[var(--hairline)]"
                }`}
              >
                <div
                  className={`font-tabular truncate text-[13px] ${
                    isLight
                      ? "text-[var(--ink-stone-muted)]"
                      : "text-[var(--ink-muted)]"
                  }`}
                >
                  {hostLabel} · Issue {dispatch.issue_number} ·{" "}
                  {dispatch.reading_time_mins} min read
                </div>
                <div className="type-subhead mt-1 line-clamp-1">
                  {cleanTitle}
                </div>
                <p
                  className={`mt-1 line-clamp-2 text-[14px] ${
                    isLight
                      ? "text-[var(--ink-stone-muted)]"
                      : "text-[var(--ink-muted)]"
                  }`}
                >
                  {cleanSubtitle}
                </p>
              </div>
            </div>
          </div>

          {mintError && (
            <p className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-4 py-3 text-[14px] text-[#FF8A7A]">
              {mintError}
            </p>
          )}

          <div>
            <label
              htmlFor="journal-share-url-input"
              className="block text-[14px] font-medium"
            >
              Shareable link
            </label>
            <div className="mt-2 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <input
                id="journal-share-url-input"
                type="text"
                readOnly
                value={urls.shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                onClick={(e) => e.currentTarget.select()}
                aria-label="Shareable journal link"
                className={`h-11 flex-1 rounded-xl border px-3.5 text-[13px] focus:border-[var(--accent)] focus:outline-none ${
                  isLight
                    ? "border-[var(--hairline-stone)] bg-white text-[var(--ink-stone-primary)]"
                    : "border-[var(--hairline-strong)] bg-[var(--bg-canvas)] text-[var(--ink-primary)]"
                }`}
              />
              <button
                type="button"
                id="journal-share-copy-btn"
                onClick={handleCopyLink}
                className={`press-tactile inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-[14px] font-semibold whitespace-nowrap ${
                  copied
                    ? "bg-[#10B981] text-[#07090D]"
                    : "bg-[var(--accent)] text-[#07090D] hover:bg-[var(--accent-hover)]"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" strokeWidth={2.1} />
                    <span>Copied link</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" strokeWidth={1.9} />
                    <span>Copy link</span>
                  </>
                )}
              </button>
            </div>
            {urls.isPrivatePreview && (
              <p
                className={`mt-2 text-[13px] ${
                  isLight
                    ? "text-[var(--ink-stone-muted)]"
                    : "text-[var(--ink-muted)]"
                }`}
              >
                Draft preview link active for 30 days. Hidden from public index
                and search engines.
              </p>
            )}
          </div>

          <div
            className={`border-t pt-4 ${
              isLight
                ? "border-[var(--hairline-stone)]"
                : "border-[var(--hairline)]"
            }`}
          >
            <div
              className={`mb-3 text-[14px] font-medium ${
                isLight
                  ? "text-[var(--ink-stone-muted)]"
                  : "text-[var(--ink-muted)]"
              }`}
            >
              Share directly
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[14px] font-medium">
              <a
                href={socialTargets.x}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 underline underline-offset-4 transition-opacity duration-150 hover:opacity-80"
              >
                <span>Post on X</span>
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.7} />
              </a>
              <a
                href={socialTargets.linkedin}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 underline underline-offset-4 transition-opacity duration-150 hover:opacity-80"
              >
                <span>LinkedIn</span>
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.7} />
              </a>
              <a
                href={socialTargets.whatsapp}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 underline underline-offset-4 transition-opacity duration-150 hover:opacity-80"
              >
                <MessageCircle
                  className="h-3.5 w-3.5 text-[#10B981]"
                  strokeWidth={1.8}
                />
                <span>WhatsApp</span>
              </a>
              <a
                href={socialTargets.telegram}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 underline underline-offset-4 transition-opacity duration-150 hover:opacity-80"
              >
                <Send className="h-3.5 w-3.5 text-[#3B82F6]" strokeWidth={1.8} />
                <span>Telegram</span>
              </a>
              <a
                href={socialTargets.email}
                className="inline-flex items-center gap-1.5 underline underline-offset-4 transition-opacity duration-150 hover:opacity-80"
              >
                <Mail className="h-3.5 w-3.5" strokeWidth={1.8} />
                <span>Email</span>
              </a>
              {canNativeShare && (
                <button
                  type="button"
                  onClick={() => void handleNativeShare()}
                  className="inline-flex cursor-pointer items-center gap-1.5 underline underline-offset-4 transition-opacity duration-150 hover:opacity-80"
                >
                  <Share2
                    className="h-3.5 w-3.5 text-[var(--accent)]"
                    strokeWidth={1.8}
                  />
                  <span>More options</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function JournalShareModal({
  dispatch,
  open,
  onClose,
  shareToken = null,
  originOverride,
  isLight = false,
}: JournalShareModalProps) {
  if (!open || !dispatch) {
    return null;
  }

  return (
    <JournalShareDialogBody
      key={`${dispatch.id}:${shareToken ?? ""}:${dispatch.updated_at}`}
      dispatch={dispatch}
      onClose={onClose}
      shareToken={shareToken}
      originOverride={originOverride}
      isLight={isLight}
    />
  );
}
