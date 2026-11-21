import { notFound } from "next/navigation";
import { renderIcon } from "@/lib/brand/images";
import type { BrandMarkVariant } from "@/lib/brand/mark";

/** PNG icons referenced by the web manifest: /brand/icon-192.png etc. */
const ICONS: Record<string, { size: number; variant: BrandMarkVariant }> = {
  "icon-192.png": { size: 192, variant: "rounded" },
  "icon-512.png": { size: 512, variant: "rounded" },
  "maskable-512.png": { size: 512, variant: "maskable" },
};

export function generateStaticParams() {
  return Object.keys(ICONS).map((name) => ({ name }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const icon = ICONS[name];
  if (!icon) notFound();
  return renderIcon(icon.size, icon.variant);
}
