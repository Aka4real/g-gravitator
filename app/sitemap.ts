import type { MetadataRoute } from "next";
import { getDispatches, getLabProjects } from "@/lib/db/repository";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ggravitator.com";
  const [dispatches, labsDrops] = await Promise.all([
    getDispatches(),
    getLabProjects("LABS"),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    "",
    "/systems",
    "/labs",
    "/skunkworks",
    "/hackathons",
    "/journal",
    "/orbit",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: route === "" ? 1.0 : 0.85,
  }));

  const dropPages: MetadataRoute.Sitemap = labsDrops.map((drop) => ({
    url: `${baseUrl}/labs/${drop.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const dispatchPages: MetadataRoute.Sitemap = dispatches.map((disp) => ({
    url: `${baseUrl}/journal/${disp.slug}`,
    lastModified: new Date(disp.updated_at),
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  return [...staticPages, ...dropPages, ...dispatchPages];
}
