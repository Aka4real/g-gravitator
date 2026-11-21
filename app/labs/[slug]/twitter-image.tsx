import { getLabProjectBySlug } from "@/lib/db/repository";
import { OG_ALT, renderLinkCard, truncate } from "@/lib/brand/images";

export const alt = OG_ALT;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getLabProjectBySlug(slug);
  if (!project) return renderLinkCard();
  return renderLinkCard({
    eyebrow: `Labs / ${project.code}`,
    title: truncate(project.name.replaceAll(" // ", ": "), 90),
    description: truncate(project.tagline, 140),
  });
}
