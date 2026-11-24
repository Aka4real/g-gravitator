import { getDispatches, getHackathons, getLabProjects } from "@/lib/db/repository";
import { cleanSeoText } from "@/lib/seo/site";
import { getSiteOrigin } from "@/lib/seo/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const [origin, dispatches, labs, { items: hackathons }] = await Promise.all([
    getSiteOrigin(),
    getDispatches(),
    getLabProjects(),
    getHackathons(),
  ]);

  const lines: string[] = [
    "# G-Gravitator",
    "",
    "> Software and AI creativity lab engineering flagship products (G-01..G-04), bespoke B2B AI systems, OXAKALABS Skunkworks 48-hour builds, and the Orbit 6-week builder cohort.",
    "",
    `Canonical domain: ${origin}`,
    `RSS Feed: ${origin}/feed.xml`,
    `Sitemap: ${origin}/sitemap.xml`,
    "",
    "## Core Sections",
    `- [Home](${origin}/): Flagship overview, flywheel metrics, live Drops, Orbital Wire, and Dispatches`,
    `- [Systems](${origin}/systems): B2B AI & Software Foundry (5-day Gravity Audit, 4-week Velocity MVP, Lab Retainer)`,
    `- [Labs](${origin}/labs): Commercial numbered software & AI drops (G-01 to G-04)`,
    `- [OXAKALABS Skunkworks](${origin}/skunkworks): 48-hour hackathon strike builds & open-source R&D`,
    `- [Hackathon Radar](${origin}/hackathons): Real-time aggregated global AI & software hackathons (${hackathons.length} active)`,
    `- [Journal & The Orbital Wire](${origin}/journal): Engineering dispatches and curated frontier AI intelligence`,
    `- [Orbit Builders Cohort](${origin}/orbit): 6-week technical builders accelerator`,
    "",
    "## Labs Flagship Products",
    ...labs
      .filter((p) => p.division === "LABS")
      .map(
        (p) =>
          `- [${p.code} ${cleanSeoText(p.name)}](${origin}/labs/${p.slug}): ${cleanSeoText(p.tagline)}`
      ),
    "",
    "## Published Journal Dispatches",
    ...dispatches.map(
      (d) =>
        `- [Issue ${d.issue_number} · ${cleanSeoText(d.title)}](${origin}/journal/${d.slug}): ${cleanSeoText(d.subtitle)} (By ${d.author_name}, ${d.category})`
    ),
    "",
  ];

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=600",
    },
  });
}
