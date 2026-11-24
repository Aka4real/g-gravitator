import type { MetadataRoute } from "next";
import {
  getDispatches,
  getHackathons,
  getLabProjects,
  getNewsItems,
} from "@/lib/db/repository";
import { extractDispatchImageUrls } from "@/lib/seo/site";
import { getSiteOrigin } from "@/lib/seo/server";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [baseUrl, dispatches, labsDrops, { items: hackathons }, { items: news }] =
    await Promise.all([
      getSiteOrigin(),
      getDispatches(),
      getLabProjects("LABS"),
      getHackathons(),
      getNewsItems(),
    ]);

  const latestDispatchDate = dispatches[0]
    ? new Date(dispatches[0].updated_at || dispatches[0].published_at)
    : new Date();
  const latestHackathonDate = hackathons[0]
    ? new Date(hackathons[0].updated_at || hackathons[0].created_at)
    : new Date();
  const latestNewsDate = news[0]
    ? new Date(news[0].published_at || news[0].created_at)
    : new Date();
  const latestOverallDate = new Date(
    Math.max(
      latestDispatchDate.getTime(),
      latestHackathonDate.getTime(),
      latestNewsDate.getTime()
    )
  );

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: latestOverallDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/systems`,
      lastModified: latestOverallDate,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/labs`,
      lastModified: latestOverallDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/skunkworks`,
      lastModified: latestOverallDate,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/hackathons`,
      lastModified: latestHackathonDate,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/journal`,
      lastModified: new Date(
        Math.max(latestDispatchDate.getTime(), latestNewsDate.getTime())
      ),
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/orbit`,
      lastModified: latestOverallDate,
      changeFrequency: "weekly",
      priority: 0.85,
    },
  ];

  const dropPages: MetadataRoute.Sitemap = labsDrops.map((drop) => ({
    url: `${baseUrl}/labs/${drop.slug}`,
    lastModified: new Date(drop.created_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const dispatchPages: MetadataRoute.Sitemap = dispatches.map((disp) => {
    const images = extractDispatchImageUrls(disp, baseUrl);
    return {
      url: `${baseUrl}/journal/${disp.slug}`,
      lastModified: new Date(disp.updated_at || disp.published_at),
      changeFrequency: "weekly",
      priority: 0.85,
      ...(images.length > 0 ? { images } : {}),
    };
  });

  return [...staticPages, ...dropPages, ...dispatchPages];
}
