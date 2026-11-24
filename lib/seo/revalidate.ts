import { revalidatePath } from "next/cache";

const PUBLIC_SEO_PATHS = [
  "/",
  "/sitemap.xml",
  "/robots.txt",
  "/feed.xml",
  "/llms.txt",
  "/journal",
  "/labs",
  "/skunkworks",
  "/hackathons",
];

/**
 * Triggers on-demand Next.js route & sitemap cache revalidation when content
 * changes via Ops/MCP/Cron. Swallows Next store errors cleanly when running
 * outside a Next server request (e.g. Vitest or CLI scripts).
 */
export function revalidatePublicSeoPaths(extraPaths: string[] = []): void {
  const targets = Array.from(new Set([...PUBLIC_SEO_PATHS, ...extraPaths]));
  for (const target of targets) {
    try {
      revalidatePath(target);
    } catch {
      // Safe no-op outside Next.js server/request context (e.g. unit tests)
    }
  }
}
