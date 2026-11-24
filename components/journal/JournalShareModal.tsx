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
    () => originOverride || "https://ggravitator.com"
  );

  const canNativeShare = useSyncExternalStore(
    noopSubscribe,
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
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
      return "ggravitator.com";
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
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-xl overflow-hidden rounded-2xl border shadow-2xl ${
          isLight
            ? "border-black/[0.12] bg-[#F4F3EF] text-[#111114]"
            : "border-white/[0.1] bg-[#111114] text-[#F4F3EF]"
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between gap-3 border-b px-5 py-4 sm:px-6 ${
            isLight ? "border-black/[0.08]" : "border-white/[0.08]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="font-mono-telemetry inline-flex items-center rounded-full bg-[#FF3B1F] px-2.5 py-0.5 text-[11px] font-semibold text-[#08080A]">
              Issue {dispatch.issue_number}
            </span>
            <h2
              id="journal-share-dialog-title"
              className="font-display text-lg font-semibold tracking-[-0.02em]"
            >
              Share dispatch
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close share dialog"
            className={`press-tactile inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition-colors ${
              isLight
                ? "border-black/[0.1] bg-[#E8E6DF] text-[#27272A] hover:text-[#08080A]"
                : "border-white/[0.1] bg-[#18181D] text-[#A1A1AA] hover:text-[#F4F3EF]"
            }`}
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>

        <div className="max-h-[82vh] space-y-5 overflow-y-auto p-5 sm:p-6">
          {/* Open Graph Social Preview Card */}
          <div>
            <div className="mb-2 flex items-center justify-between gap-2 text-xs">
              <span className={isLight ? "text-[#52525B]" : "text-[#8B8B94]"}>
                Social media link preview
              </span>
              <span
                className={`inline-flex items-center gap-1 font-medium ${
                  urls.isPrivatePreview
                    ? "text-[#F59E0B]"
                    : isLight
                    ? "text-[#27272A]"
                    : "text-[#A1A1AA]"
                }`}
              >
                {urls.isPrivatePreview ? (
                  <>
                    <Lock className="h-3 w-3" strokeWidth={1.8} />
                    <span>Private preview</span>
                  </>
                ) : (
                  <>
                    <Globe className="h-3 w-3 text-[#10B981]" strokeWidth={1.8} />
                    <span>Open Graph ready</span>
                  </>
                )}
              </span>
            </div>

            <div
              className={`overflow-hidden rounded-xl border ${
                isLight
                  ? "border-black/[0.12] bg-[#E8E6DF]"
                  : "border-white/[0.1] bg-[#08080A]"
              }`}
            >
              <div className="relative aspect-[1200/630] w-full overflow-hidden bg-[#08080A]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImgSrc}
                  alt={cleanTitle}
                  onError={() => setPreviewFailed(true)}
                  className="h-full w-full object-cover"
                />
              </div>
              <div
                className={`border-t p-3.5 sm:p-4 ${
                  isLight
                    ? "border-black/[0.08] bg-[#F4F3EF]"
                    : "border-white/[0.08] bg-[#16161A]"
                }`}
              >
                <div
                  className={`font-mono-telemetry truncate text-[11px] ${
                    isLight ? "text-[#52525B]" : "text-[#8B8B94]"
                  }`}
                >
                  {hostLabel} · Issue {dispatch.issue_number} · {dispatch.reading_time_mins} min read
                </div>
                <div className="font-display mt-1 line-clamp-1 text-sm font-semibold">
                  {cleanTitle}
                </div>
                <p
                  className={`mt-1 line-clamp-2 text-xs leading-relaxed ${
                    isLight ? "text-[#3F3F46]" : "text-[#A1A1AA]"
                  }`}
                >
                  {cleanSubtitle}
                </p>
              </div>
            </div>
          </div>

          {mintError && (
            <p className="rounded-xl border border-[#FF3B1F]/35 bg-[#FF3B1F]/12 px-3.5 py-2.5 text-xs text-[#FF8A7A]">
              {mintError}
            </p>
          )}

          {/* Generated Share Link Field + Copy Button */}
          <div>
            <label
              htmlFor="journal-share-url-input"
              className={`block text-xs font-medium ${
                isLight ? "text-[#27272A]" : "text-[#D4D4D8]"
              }`}
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
                className={`font-mono-telemetry h-11 flex-1 rounded-xl border px-3.5 text-xs focus:border-[#FF3B1F] focus:outline-none ${
                  isLight
                    ? "border-black/[0.12] bg-white text-[#111114]"
                    : "border-white/[0.12] bg-[#08080A] text-[#F4F3EF]"
                }`}
              />
              <button
                type="button"
                id="journal-share-copy-btn"
                onClick={handleCopyLink}
                className={`press-tactile inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold whitespace-nowrap ${
                  copied
                    ? "bg-[#10B981] text-[#08080A]"
                    : "bg-[#FF3B1F] text-[#08080A] hover:bg-[#FF5238]"
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
                className={`mt-2 text-xs ${
                  isLight ? "text-[#52525B]" : "text-[#8B8B94]"
                }`}
              >
                Draft preview link active for 30 days. Hidden from public index and search engines.
              </p>
            )}
          </div>

          {/* Direct Social & Messaging Channels */}
          <div
            className={`border-t pt-4 ${
              isLight ? "border-black/[0.08]" : "border-white/[0.08]"
            }`}
          >
            <div
              className={`mb-2.5 text-xs font-medium ${
                isLight ? "text-[#52525B]" : "text-[#8B8B94]"
              }`}
            >
              Share directly
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={socialTargets.x}
                target="_blank"
                rel="noreferrer noopener"
                className={`press-tactile inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors ${
                  isLight
                    ? "border-black/[0.12] bg-[#E8E6DF] text-[#111114] hover:border-black/[0.25]"
                    : "border-white/[0.1] bg-[#18181D] text-[#F4F3EF] hover:border-white/[0.22]"
                }`}
              >
                <span>Post on X</span>
                <ExternalLink className="h-3 w-3 opacity-70" strokeWidth={1.7} />
              </a>

              <a
                href={socialTargets.linkedin}
                target="_blank"
                rel="noreferrer noopener"
                className={`press-tactile inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors ${
                  isLight
                    ? "border-black/[0.12] bg-[#E8E6DF] text-[#111114] hover:border-black/[0.25]"
                    : "border-white/[0.1] bg-[#18181D] text-[#F4F3EF] hover:border-white/[0.22]"
                }`}
              >
                <span>LinkedIn</span>
                <ExternalLink className="h-3 w-3 opacity-70" strokeWidth={1.7} />
              </a>

              <a
                href={socialTargets.whatsapp}
                target="_blank"
                rel="noreferrer noopener"
                className={`press-tactile inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors ${
                  isLight
                    ? "border-black/[0.12] bg-[#E8E6DF] text-[#111114] hover:border-black/[0.25]"
                    : "border-white/[0.1] bg-[#18181D] text-[#F4F3EF] hover:border-white/[0.22]"
                }`}
              >
                <MessageCircle className="h-3.5 w-3.5 text-[#10B981]" strokeWidth={1.8} />
                <span>WhatsApp</span>
              </a>

              <a
                href={socialTargets.telegram}
                target="_blank"
                rel="noreferrer noopener"
                className={`press-tactile inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors ${
                  isLight
                    ? "border-black/[0.12] bg-[#E8E6DF] text-[#111114] hover:border-black/[0.25]"
                    : "border-white/[0.1] bg-[#18181D] text-[#F4F3EF] hover:border-white/[0.22]"
                }`}
              >
                <Send className="h-3.5 w-3.5 text-[#3B82F6]" strokeWidth={1.8} />
                <span>Telegram</span>
              </a>

              <a
                href={socialTargets.email}
                className={`press-tactile inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors ${
                  isLight
                    ? "border-black/[0.12] bg-[#E8E6DF] text-[#111114] hover:border-black/[0.25]"
                    : "border-white/[0.1] bg-[#18181D] text-[#F4F3EF] hover:border-white/[0.22]"
                }`}
              >
                <Mail className="h-3.5 w-3.5 opacity-80" strokeWidth={1.8} />
                <span>Email</span>
              </a>

              {canNativeShare && (
                <button
                  type="button"
                  onClick={() => void handleNativeShare()}
                  className={`press-tactile inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors ${
                    isLight
                      ? "border-black/[0.12] bg-[#E8E6DF] text-[#111114] hover:border-black/[0.25]"
                      : "border-white/[0.1] bg-[#18181D] text-[#F4F3EF] hover:border-white/[0.22]"
                  }`}
                >
                  <Share2 className="h-3.5 w-3.5 text-[#FF3B1F]" strokeWidth={1.8} />
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
