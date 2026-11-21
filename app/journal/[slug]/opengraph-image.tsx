import { getDispatchBySlug } from "@/lib/db/repository";
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
  const dispatch = await getDispatchBySlug(slug);
  if (!dispatch) return renderLinkCard();
  return renderLinkCard({
    eyebrow: `Journal / Issue ${dispatch.issue_number}`,
    title: truncate(dispatch.title, 90),
    description: truncate(dispatch.subtitle, 140),
  });
}
