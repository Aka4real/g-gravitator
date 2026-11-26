import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ArchitecturalShell } from "@/components/layout/ArchitecturalShell";
import { getHackathons } from "@/lib/db/repository";
import { BRAND } from "@/lib/brand/mark";
import {
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
} from "@/lib/seo/site";
import { getSiteOrigin } from "@/lib/seo/server";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#07090D",
  colorScheme: "dark",
};

export async function generateMetadata(): Promise<Metadata> {
  const siteOrigin = await getSiteOrigin();

  return {
    metadataBase: new URL(siteOrigin),
    applicationName: BRAND.name,
    appleWebApp: {
      title: BRAND.name,
      capable: true,
      statusBarStyle: "black-translucent",
    },
    title: {
      default: "G-Gravitator | Build With Weight",
      template: "%s | G-Gravitator",
    },
    description:
      "Software and AI creativity lab engineering flagship products (G-01..G-04), bespoke enterprise AI systems, OXAKALABS R&D builds, and the Orbit builders cohort.",
    keywords: [
      "G-Gravitator",
      "OXAKALABS",
      "AI Creativity Lab",
      "B2B AI Foundry",
      "Live Hackathon Tracker",
      "Orbital Wire",
      "Design Engineering",
    ],
    alternates: {
      types: {
        "application/rss+xml": [
          {
            url: `${siteOrigin}/feed.xml`,
            title: "G-Gravitator Journal RSS Feed",
          },
        ],
      },
    },
    openGraph: {
      title: "G-Gravitator: Where Ideas Gain Mass",
      description:
        "Software and AI engineered to pull markets. Systems, Labs (G-01..G-04), OXAKALABS Skunkworks, and Orbit.",
      type: "website",
      siteName: BRAND.name,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: "G-Gravitator: Where Ideas Gain Mass",
      description:
        "Software and AI engineered to pull markets. Systems, Labs (G-01..G-04), OXAKALABS Skunkworks, and Orbit.",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [{ items: hackathons }, siteOrigin] = await Promise.all([
    getHackathons(),
    getSiteOrigin(),
  ]);

  const orgJsonLd = buildOrganizationJsonLd(siteOrigin);
  const websiteJsonLd = buildWebsiteJsonLd(siteOrigin);

  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} dark`}
    >
      <body className="min-h-screen bg-[var(--bg-canvas)] text-[var(--ink-primary)] antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(orgJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <ArchitecturalShell activeHackathonCount={hackathons.length}>
          {children}
        </ArchitecturalShell>
        <Analytics />
      </body>
    </html>
  );
}
