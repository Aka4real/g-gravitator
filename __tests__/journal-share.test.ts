import zlib from "node:zlib";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ImageResponse } from "next/og";
import React from "react";
import sharp from "sharp";
import {
  createDispatch,
  createMediaAsset,
  readLocalStore,
  writeLocalStore,
  type LocalStoreState,
} from "@/lib/db/repository";
import { generateProceduralEditorialSvg } from "@/lib/ops/media";
import {
  MAX_SOCIAL_OG_BYTES,
  renderJournalOgImage,
  renderJournalOgPngBuffer,
  resolveDispatchCoverAsset,
} from "@/lib/brand/journal-og";
import {
  buildJournalShareUrls,
  buildSocialShareTargets,
  getDispatchOgVersion,
} from "@/lib/journal/share";
import {
  signDispatchShareToken,
  verifyDispatchShareToken,
} from "@/lib/journal/share-token";
import {
  GET as getJournalOgRoute,
  HEAD as headJournalOgRoute,
} from "@/app/journal/[slug]/og/route";
import { POST as postJournalShareRoute } from "@/app/api/journal/share/route";

async function inspectJpegImage(buf: Buffer): Promise<{
  width: number;
  height: number;
  isProgressive: boolean;
  centerRgb: [number, number, number];
}> {
  expect(buf.subarray(0, 3).toString("hex")).toBe("ffd8ff");
  const meta = await sharp(buf).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const { data } = await sharp(buf)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const cy = Math.floor(height / 2);
  const cx = Math.floor(width / 2);
  const offset = (cy * width + cx) * 3;
  return {
    width,
    height,
    isProgressive: Boolean(meta.isProgressive),
    centerRgb: [data[offset], data[offset + 1], data[offset + 2]],
  };
}

function parsePngDimensions(buf: Buffer): { width: number; height: number } {
  expect(buf.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

function getPngCenterPixelRgb(buf: Buffer): [number, number, number] {
  const { width, height } = parsePngDimensions(buf);
  let pos = 8;
  const idatChunks: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.subarray(pos + 4, pos + 8).toString("ascii");
    if (type === "IDAT") {
      idatChunks.push(buf.subarray(pos + 8, pos + 8 + len));
    }
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const stride = 1 + width * 4;
  const cy = Math.floor(height / 2);
  const cx = Math.floor(width / 2);
  const offset = cy * stride + 1 + cx * 4;
  return [raw[offset], raw[offset + 1], raw[offset + 2]];
}

describe("Sharable Journals, Share Links & Matching Cover Open Graph Preload", () => {
  let snapshot: LocalStoreState;

  beforeAll(() => {
    snapshot = structuredClone(readLocalStore());
  });

  afterAll(() => {
    writeLocalStore(snapshot);
  });

  it("signs and verifies HMAC private share tokens scoped to dispatch id and slug", () => {
    const dispatchRef = {
      id: "disp-share-test-1",
      slug: "private-draft-architecture-note",
    };

    const token = signDispatchShareToken(dispatchRef);
    expect(verifyDispatchShareToken(token, dispatchRef)).toBe(true);
    expect(verifyDispatchShareToken(`${token}tampered`, dispatchRef)).toBe(false);
    expect(
      verifyDispatchShareToken(token, { id: "other-id", slug: dispatchRef.slug })
    ).toBe(false);
    expect(
      verifyDispatchShareToken(token, { id: dispatchRef.id, slug: "wrong-slug" })
    ).toBe(false);

    const expiredToken = signDispatchShareToken(dispatchRef, -5000);
    expect(verifyDispatchShareToken(expiredToken, dispatchRef)).toBe(false);
  });

  it("builds canonical share links, cache-busted OG URLs, and social share targets", () => {
    const baseDispatch = {
      slug: "kinetic-telemetry-architecture",
      is_published: true,
      updated_at: "2026-11-24T10:00:00.000Z",
      cover_image_url: "/api/media/med-001",
      title: "Kinetic Telemetry Architecture",
      subtitle: "Engineering zero-latency dashboards with physical precision.",
      category: "ARCHITECTURE" as const,
      issue_number: "009",
      design: { accent_color: "#10B981" },
    };

    const v1 = getDispatchOgVersion(baseDispatch);
    const v2 = getDispatchOgVersion({
      ...baseDispatch,
      cover_image_url: "/api/media/med-002",
    });
    expect(v1).not.toBe(v2);

    const pubUrls = buildJournalShareUrls({
      dispatch: baseDispatch,
      origin: "https://www.ggravitator.xyz/",
    });
    expect(pubUrls.canonicalUrl).toBe(
      "https://www.ggravitator.xyz/journal/kinetic-telemetry-architecture"
    );
    expect(pubUrls.shareUrl).toBe(pubUrls.canonicalUrl);
    expect(pubUrls.ogImageUrl).toBe(
      `https://www.ggravitator.xyz/journal/kinetic-telemetry-architecture/og?v=${v1}`
    );
    expect(pubUrls.isPrivatePreview).toBe(false);

    const draftUrls = buildJournalShareUrls({
      dispatch: { ...baseDispatch, is_published: false },
      origin: "https://ggravitator.xyz",
      shareToken: "tok.sig",
    });
    expect(draftUrls.shareUrl).toBe(
      "https://ggravitator.xyz/journal/kinetic-telemetry-architecture?share=tok.sig"
    );
    expect(draftUrls.ogImageUrl).toContain("&share=tok.sig");
    expect(draftUrls.isPrivatePreview).toBe(true);

    const social = buildSocialShareTargets({
      url: pubUrls.shareUrl,
      title: baseDispatch.title,
      subtitle: baseDispatch.subtitle,
      issueNumber: baseDispatch.issue_number,
    });
    expect(social.x).toContain("https://twitter.com/intent/tweet");
    expect(social.linkedin).toContain("https://www.linkedin.com/sharing/share-offsite");
    expect(social.whatsapp).toContain("https://wa.me/");
    expect(social.telegram).toContain("https://t.me/share/url");
    expect(social.email).toContain("mailto:");
  });

  it("blocks path traversal and private localhost SSRF URLs in cover resolution", async () => {
    expect(await resolveDispatchCoverAsset("/../package.json")).toBeNull();
    expect(
      await resolveDispatchCoverAsset("http://127.0.0.1:3000/api/media/secret")
    ).toBeNull();
    expect(
      await resolveDispatchCoverAsset("http://localhost:8080/internal.png")
    ).toBeNull();

    const staticCover = await resolveDispatchCoverAsset("/images/labs-prism.jpg");
    expect(staticCover).not.toBeNull();
    expect(staticCover?.mimeType).toBe("image/jpeg");
  });

  it("renders a 1200x630 OG PNG matching the journal's actual cover picture (Media Library PNG & Studio SVG)", async () => {
    // Generate a solid emerald (#10B981 = RGB 16, 185, 129) cover PNG in the Media Library
    const emeraldSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="420" viewBox="0 0 800 420"><rect width="800" height="420" fill="#10B981"/></svg>`;
    const solidCoverResp = new ImageResponse(
      React.createElement(
        "div",
        { style: { display: "flex", width: 800, height: 420 } },
        React.createElement("img", {
          src: `data:image/svg+xml;base64,${Buffer.from(emeraldSvg).toString("base64")}`,
          width: 800,
          height: 420,
        })
      ),
      { width: 800, height: 420 }
    );
    const solidCoverPng = Buffer.from(await solidCoverResp.arrayBuffer());

    const mediaAsset = await createMediaAsset({
      filename: "emerald-cover.png",
      mime_type: "image/png",
      data_url: `data:image/png;base64,${solidCoverPng.toString("base64")}`,
      source_type: "uploaded",
      created_by: "admin",
    });

    const publishedWithCover = await createDispatch({
      title: "Shared Dispatch With Custom Cover Art",
      subtitle: "Verifying that the Open Graph image reproduces the attached cover picture.",
      category: "AI SYSTEMS",
      mdx_content: "## Architecture\n\nBody copy.",
      cover_image_url: mediaAsset.url,
      is_published: true,
    });

    const ogImage = await renderJournalOgImage(publishedWithCover);
    expect(ogImage.contentType).toBe("image/jpeg");
    expect(ogImage.buffer.byteLength).toBeLessThanOrEqual(MAX_SOCIAL_OG_BYTES);
    const ogInfo = await inspectJpegImage(ogImage.buffer);
    expect({ width: ogInfo.width, height: ogInfo.height }).toEqual({
      width: 1200,
      height: 630,
    });
    expect(ogInfo.isProgressive).toBe(false);
    const [r, g, b] = ogInfo.centerRgb;
    expect(r).toBeLessThan(35);
    expect(g).toBeGreaterThan(165);
    expect(b).toBeGreaterThan(110);

    // Verify legacy PNG helper remains functional too
    const ogBuffer = await renderJournalOgPngBuffer(publishedWithCover);
    expect(parsePngDimensions(ogBuffer)).toEqual({ width: 1200, height: 630 });
    const [pr, pg, pb] = getPngCenterPixelRgb(ogBuffer);
    expect(pr).toBeLessThan(35);
    expect(pg).toBeGreaterThan(165);
    expect(pb).toBeGreaterThan(110);

    // Verify photographic static cover compresses strictly under WhatsApp's 240 KB budget
    const photoDispatch = await createDispatch({
      title: "Photographic Cover WhatsApp Budget Check",
      subtitle: "Ensuring photographic covers never exceed 240 KB baseline JPEG.",
      category: "ARCHITECTURE",
      mdx_content: "## Visuals\n\nPhotographic cover test.",
      cover_image_url: "/images/labs-prism.jpg",
      is_published: true,
    });
    const photoOg = await renderJournalOgImage(photoDispatch);
    expect(photoOg.contentType).toBe("image/jpeg");
    expect(photoOg.buffer.byteLength).toBeLessThanOrEqual(MAX_SOCIAL_OG_BYTES);
    const photoInfo = await inspectJpegImage(photoOg.buffer);
    expect({ width: photoInfo.width, height: photoInfo.height }).toEqual({
      width: 1200,
      height: 630,
    });
    expect(photoInfo.isProgressive).toBe(false);

    // Also verify Studio Editorial SVG cover rendering
    const studioSvgDataUrl = generateProceduralEditorialSvg({
      title: "Studio Editorial SVG Dispatch",
      subtitle: "Procedural fallback artwork",
      prompt: "Editorial cover",
      accentColor: "#3B82F6",
      category: "DESIGN ENGINEERING",
    });
    const svgMedia = await createMediaAsset({
      filename: "studio-cover.svg",
      mime_type: "image/svg+xml",
      data_url: studioSvgDataUrl,
      source_type: "generated",
      created_by: "admin",
    });
    const svgDispatch = await createDispatch({
      title: "Shared Dispatch With Studio SVG Cover",
      subtitle: "Checking crisp Satori rasterization of Studio SVG covers.",
      category: "DESIGN ENGINEERING",
      mdx_content: "## Design\n\nBody.",
      cover_image_url: svgMedia.url,
      is_published: true,
      design: { accent_color: "#3B82F6" },
    });

    const svgOg = await renderJournalOgImage(svgDispatch);
    expect(svgOg.contentType).toBe("image/jpeg");
    expect(svgOg.buffer.byteLength).toBeLessThanOrEqual(MAX_SOCIAL_OG_BYTES);
    const svgInfo = await inspectJpegImage(svgOg.buffer);
    expect({ width: svgInfo.width, height: svgInfo.height }).toEqual({
      width: 1200,
      height: 630,
    });
  });

  it("serves /journal/[slug]/og (GET & HEAD) with baseline JPEG, Content-Length, and draft token safety", async () => {
    const draftAsset = await createMediaAsset({
      filename: "amber-draft-cover.png",
      mime_type: "image/png",
      data_url: `data:image/png;base64,${Buffer.from(
        await new ImageResponse(
          React.createElement("div", {
            style: { width: 400, height: 210, display: "flex", background: "#F59E0B" },
          }),
          { width: 400, height: 210 }
        ).arrayBuffer()
      ).toString("base64")}`,
      source_type: "uploaded",
      created_by: "admin",
    });

    const draftDispatch = await createDispatch({
      title: "Unpublished Draft With Amber Cover",
      subtitle: "Only accessible with a valid HMAC share token.",
      category: "POST-MORTEM",
      mdx_content: "## Incident Timeline\n\nDetails.",
      cover_image_url: draftAsset.url,
      is_published: false,
      approval_status: "PENDING_REVIEW",
    });

    // Without token: POST /api/journal/share returns 404 (no draft leak)
    const unauthShareRes = await postJournalShareRoute(
      new Request("https://www.ggravitator.xyz/api/journal/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: draftDispatch.slug }),
      })
    );
    expect(unauthShareRes.status).toBe(404);

    // Without token: GET /journal/[slug]/og returns non-cacheable brand fallback (center pixel is obsidian #08080A, NOT amber #F59E0B)
    const unauthOgRes = await getJournalOgRoute(
      new Request(`https://www.ggravitator.xyz/journal/${draftDispatch.slug}/og`),
      { params: Promise.resolve({ slug: draftDispatch.slug }) }
    );
    expect(unauthOgRes.status).toBe(200);
    expect(unauthOgRes.headers.get("content-type")).toBe("image/jpeg");
    expect(unauthOgRes.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    const unauthBuf = Buffer.from(await unauthOgRes.arrayBuffer());
    expect(unauthOgRes.headers.get("content-length")).toBe(String(unauthBuf.byteLength));
    expect(unauthBuf.byteLength).toBeLessThanOrEqual(MAX_SOCIAL_OG_BYTES);
    const unauthInfo = await inspectJpegImage(unauthBuf);
    expect(unauthInfo.centerRgb[0]).toBeLessThan(30);

    // With valid token: GET /journal/[slug]/og renders the draft's actual amber (#F59E0B) cover picture!
    const validToken = signDispatchShareToken(draftDispatch);
    const authUrl = `https://www.ggravitator.xyz/journal/${draftDispatch.slug}/og?share=${encodeURIComponent(validToken)}`;
    const authOgRes = await getJournalOgRoute(
      new Request(authUrl),
      { params: Promise.resolve({ slug: draftDispatch.slug }) }
    );
    expect(authOgRes.status).toBe(200);
    expect(authOgRes.headers.get("content-type")).toBe("image/jpeg");
    expect(authOgRes.headers.get("cache-control")).toContain("no-store");
    const authBuf = Buffer.from(await authOgRes.arrayBuffer());
    expect(authOgRes.headers.get("content-length")).toBe(String(authBuf.byteLength));
    expect(authBuf.byteLength).toBeLessThanOrEqual(MAX_SOCIAL_OG_BYTES);
    const authInfo = await inspectJpegImage(authBuf);
    expect({ width: authInfo.width, height: authInfo.height }).toEqual({
      width: 1200,
      height: 630,
    });
    expect(authInfo.isProgressive).toBe(false);
    const [ar, ag, ab] = authInfo.centerRgb;
    expect(ar).toBeGreaterThan(220);
    expect(ag).toBeGreaterThan(130);
    expect(ab).toBeLessThan(30);

    // HEAD /journal/[slug]/og returns matching Content-Type and Content-Length with empty body
    const headOgRes = await headJournalOgRoute(
      new Request(authUrl, { method: "HEAD" }),
      { params: Promise.resolve({ slug: draftDispatch.slug }) }
    );
    expect(headOgRes.status).toBe(200);
    expect(headOgRes.headers.get("content-type")).toBe("image/jpeg");
    expect(headOgRes.headers.get("content-length")).toBe(String(authBuf.byteLength));
    expect((await headOgRes.arrayBuffer()).byteLength).toBe(0);

    // Published dispatch works publicly via POST /api/journal/share
    const pubShareRes = await postJournalShareRoute(
      new Request("https://www.ggravitator.xyz/api/journal/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "multi-provider-signal-extraction-x-hackathon-radar",
        }),
      })
    );
    expect(pubShareRes.status).toBe(200);
    const pubJson = (await pubShareRes.json()) as {
      ok: boolean;
      shareUrl: string;
      ogImageUrl: string;
    };
    expect(pubJson.ok).toBe(true);
    expect(pubJson.shareUrl).toBe(
      "https://www.ggravitator.xyz/journal/multi-provider-signal-extraction-x-hackathon-radar"
    );
    expect(pubJson.ogImageUrl).toContain(
      "/journal/multi-provider-signal-extraction-x-hackathon-radar/og?v="
    );
  });
});
