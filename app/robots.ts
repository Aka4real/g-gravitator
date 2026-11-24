import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/seo/server";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = await getSiteOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/media/"],
      disallow: ["/api/", "/gg-command", "/gg-command/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
