import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  createDispatch,
  readLocalStore,
  slugifyText,
  writeLocalStore,
  type LocalStoreState,
} from "@/lib/db/repository";
import {
  buildDispatchSeoDescription,
  buildDispatchSeoTitle,
  DEFAULT_CANONICAL_ORIGIN,
  extractDispatchImageUrls,
  resolveCanonicalOrigin,
  truncateWordBoundary,
} from "@/lib/seo/site";
import { executeOpsTool } from "@/lib/ops/tools";
import type { OpsActorContext } from "@/lib/mcp/permissions";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { GET as getFeedXml } from "@/app/feed.xml/route";
import { GET as getLlmsTxt } from "@/app/llms.txt/route";
import { proxy } from "@/proxy";

describe("SEO, Canonical Domain (ggravitator.xyz), Sitemap, Robots & Feeds", () => {
  let snapshot: LocalStoreState;
  const origEnvUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeAll(() => {
    snapshot = structuredClone(readLocalStore());
  });

  afterAll(() => {
    writeLocalStore(snapshot);
    if (origEnvUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = origEnvUrl;
    }
  });

  it("resolves canonical origin to ggravitator.xyz even if NEXT_PUBLIC_SITE_URL points to vercel.app or .com", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://g-gravitator.vercel.app";

    expect(
      resolveCanonicalOrigin({
        headers: new Headers({ host: "g-gravitator.vercel.app" }),
      })
    ).toBe(DEFAULT_CANONICAL_ORIGIN);

    expect(
      resolveCanonicalOrigin({
        headers: new Headers({ "x-forwarded-host": "www.ggravitator.xyz" }),
      })
    ).toBe("https://www.ggravitator.xyz");

    expect(
      resolveCanonicalOrigin({
        headers: new Headers({ "x-forwarded-host": "ggravitator.xyz" }),
      })
    ).toBe("https://ggravitator.xyz");

    expect(
      resolveCanonicalOrigin({
        headers: new Headers({ host: "localhost:3000" }),
      })
    ).toBe("http://localhost:3000");

    process.env.NEXT_PUBLIC_SITE_URL = "https://ggravitator.xyz";
    expect(
      resolveCanonicalOrigin({
        headers: new Headers({ host: "g-gravitator.vercel.app" }),
      })
    ).toBe("https://ggravitator.xyz");
  });

  it("generates word-boundary slugs with diacritics normalized", () => {
    expect(
      slugifyText(
        "Dr. Jah-Amaka Trust Idiong (née Enwedo): University of Alberta PhD Convocation & Special Education"
      )
    ).toBe(
      "dr-jah-amaka-trust-idiong-nee-enwedo-university-of-alberta-phd"
    );
    expect(slugifyText("A".repeat(90)).length).toBeLessThanOrEqual(72);
  });

  it("formats concise SERP titles and descriptions within search engine limits", () => {
    const title = buildDispatchSeoTitle({
      issue_number: "012",
      title:
        "Dr. Jah-Amaka Trust Idiong: University of Alberta PhD Convocation, Deaf Education, and Inclusive AI Systems",
      design: null,
    });
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title.endsWith("...")).toBe(true);

    const customTitle = buildDispatchSeoTitle({
      issue_number: "012",
      title: "Long Title",
      design: { seo_title: "Dr. Jah-Amaka Trust Idiong (Enwedo) · UAlberta PhD" },
    });
    expect(customTitle).toBe("Dr. Jah-Amaka Trust Idiong (Enwedo) · UAlberta PhD");

    const desc = buildDispatchSeoDescription({
      subtitle:
        "Celebrating Dr. Jah-Amaka Trust Idiong on her November 24, 2026 PhD conferral in Special Education at the University of Alberta, profiling her CUP Equity Award and AI-in-Deaf-Education research.",
      mdx_content: "",
      design: null,
    });
    expect(desc.length).toBeLessThanOrEqual(160);
    expect(desc).not.toContain("resea...");

    expect(truncateWordBoundary("Short copy", 160)).toBe("Short copy");
  });

  it("marks .vercel.app aliases with X-Robots-Tag noindex while leaving custom domain indexable", () => {
    const vercelReq = new NextRequest("https://g-gravitator.vercel.app/journal", {
      headers: { host: "g-gravitator.vercel.app" },
    });
    const vercelRes = proxy(vercelReq);
    expect(vercelRes.headers.get("X-Robots-Tag")).toBe("noindex, follow");

    const customReq = new NextRequest("https://www.ggravitator.xyz/journal", {
      headers: { host: "www.ggravitator.xyz" },
    });
    const customRes = proxy(customReq);
    expect(customRes.headers.get("X-Robots-Tag")).toBeNull();
  });

  it("allows /api/media/ indexing in robots.txt and disallows /gg-command and /api/", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://g-gravitator.vercel.app";
    const r = await robots();
    expect(r.sitemap).toBe(`${DEFAULT_CANONICAL_ORIGIN}/sitemap.xml`);
    const rules = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rules.allow).toEqual(["/", "/api/media/"]);
    expect(rules.disallow).toContain("/api/");
    expect(rules.disallow).toContain("/gg-command");
  });

  it("includes live dispatches, image URLs, RSS feed, and llms.txt on ggravitator.xyz", async () => {
    const created = await createDispatch({
      title: "SEO Verification Dispatch For Dynamic Sitemap Testing",
      subtitle: "Ensuring newly published dispatches immediately enter sitemap.xml and feed.xml.",
      category: "AI SYSTEMS",
      mdx_content:
        "## Overview\n\nBody text with image.\n\n![Inline Diagram](/api/media/med-inline-seo)\n\n> [!ACCENT] Key takeaway for indexing.\n\n".repeat(
          15
        ),
      cover_image_url: "/api/media/med-cover-seo",
      tags: ["SEO", "Next.js"],
      is_published: true,
    });

    const urls = extractDispatchImageUrls(created, DEFAULT_CANONICAL_ORIGIN);
    expect(urls).toContain(`${DEFAULT_CANONICAL_ORIGIN}/api/media/med-cover-seo`);
    expect(urls).toContain(`${DEFAULT_CANONICAL_ORIGIN}/api/media/med-inline-seo`);

    const sm = await sitemap();
    const entry = sm.find((item) => item.url.endsWith(`/journal/${created.slug}`));
    expect(entry).toBeDefined();
    expect(entry?.url).toBe(`${DEFAULT_CANONICAL_ORIGIN}/journal/${created.slug}`);
    expect(entry?.images).toContain(
      `${DEFAULT_CANONICAL_ORIGIN}/api/media/med-cover-seo`
    );

    const feedRes = await getFeedXml();
    expect(feedRes.status).toBe(200);
    expect(feedRes.headers.get("Content-Type")).toContain("application/rss+xml");
    const feedBody = await feedRes.text();
    expect(feedBody).toContain(
      `<link>${DEFAULT_CANONICAL_ORIGIN}/journal/${created.slug}</link>`
    );

    const llmsRes = await getLlmsTxt();
    expect(llmsRes.status).toBe(200);
    const llmsBody = await llmsRes.text();
    expect(llmsBody).toContain(
      `(${DEFAULT_CANONICAL_ORIGIN}/journal/${created.slug})`
    );

    const actor: OpsActorContext = {
      actorType: "admin",
      actorLabel: "test-admin",
    };
    const audit = await executeOpsTool(
      "audit_post_readiness",
      { entity: "dispatch", id_or_slug: created.id },
      actor
    );
    expect(audit.ok).toBe(true);
    const auditData = audit.data as {
      score: number;
      seo?: { effective_seo_title: string; word_count: number };
    };
    expect(auditData.score).toBe(100);
    expect(auditData.seo?.effective_seo_title.length).toBeLessThanOrEqual(60);
    expect(auditData.seo?.word_count).toBeGreaterThan(50);
  });
});
