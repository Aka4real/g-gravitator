import { getDispatches } from "@/lib/db/repository";
import {
  buildDispatchSeoDescription,
  cleanSeoText,
  escapeXml,
  toAbsoluteSiteUrl,
} from "@/lib/seo/site";
import { getSiteOrigin } from "@/lib/seo/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const [origin, dispatches] = await Promise.all([
    getSiteOrigin(),
    getDispatches(),
  ]);

  const feedUrl = `${origin}/feed.xml`;
  const lastBuildDate = dispatches[0]
    ? new Date(dispatches[0].updated_at || dispatches[0].published_at).toUTCString()
    : new Date().toUTCString();

  const itemsXml = dispatches
    .map((d) => {
      const link = `${origin}/journal/${d.slug}`;
      const title = cleanSeoText(d.title);
      const summary = buildDispatchSeoDescription({
        subtitle: d.subtitle,
        mdx_content: d.mdx_content,
        design: d.design,
      });
      const pubDate = new Date(d.published_at || d.created_at).toUTCString();
      const imageUrl =
        toAbsoluteSiteUrl(d.cover_image_url, origin) || `${origin}/journal/${d.slug}/og`;
      const categories = [d.category, ...(d.tags || [])]
        .filter(Boolean)
        .map((c) => `      <category>${escapeXml(c)}</category>`)
        .join("\n");

      return [
        "    <item>",
        `      <title>${escapeXml(title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${escapeXml(pubDate)}</pubDate>`,
        `      <dc:creator>${escapeXml(d.author_name)}</dc:creator>`,
        categories,
        `      <description>${escapeXml(summary)}</description>`,
        `      <enclosure url="${escapeXml(imageUrl)}" type="${d.cover_image_url ? "image/jpeg" : "image/png"}" length="0" />`,
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>G-Gravitator Journal · Engineering Dispatches &amp; AI Systems</title>
    <link>${escapeXml(`${origin}/journal`)}</link>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <description>Architectural teardowns, applied AI systems research, and OXAKALABS build dispatches from G-Gravitator.</description>
    <language>en-us</language>
    <lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>
${itemsXml}
  </channel>
</rss>
`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=600",
    },
  });
}
