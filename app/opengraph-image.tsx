import { OG_ALT, renderLinkCard } from "@/lib/brand/images";

export const alt = OG_ALT;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return renderLinkCard();
}

