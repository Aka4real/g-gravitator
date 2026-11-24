import { OG_ALT, renderLinkCard } from "@/lib/brand/images";

export const alt = OG_ALT;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function JournalOpenGraphImage() {
  return renderLinkCard({
    eyebrow: "Journal & The Orbital Wire",
    title: "Engineering dispatches and live AI intelligence",
    description:
      "Long-form systems architecture from G-Gravitator and OXAKALABS paired with real-time Orbital Wire frontier AI signals.",
  });
}
