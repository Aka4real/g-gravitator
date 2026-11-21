import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ArchitecturalShell } from "@/components/layout/ArchitecturalShell";
import { getHackathons } from "@/lib/db/repository";
import { BRAND } from "@/lib/brand/mark";

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ggravitator.com";

export const viewport: Viewport = {
  themeColor: BRAND.obsidian,
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: BRAND.name,
  appleWebApp: { title: BRAND.name, capable: true, statusBarStyle: "black-translucent" },
  title: {
    default: "G-Gravitator | Build With Weight",
    template: "%s | G-Gravitator",
  },
  description:
    "G-Gravitator is a software and AI creativity lab that engineers flagship products (G-01..G-04), architects bespoke enterprise systems, competes in global hackathons via OXAKALABS, and trains technical builders in Orbit.",
  keywords: [
    "G-Gravitator",
    "OXAKALABS",
    "AI Creativity Lab",
    "B2B AI Foundry",
    "Live Hackathon Tracker",
    "Orbital Wire",
    "Design Engineering",
  ],
  openGraph: {
    title: "G-Gravitator: Where Ideas Gain Mass",
    description:
      "Software and AI engineered to pull markets. Operating Systems, Labs (G-01..G-04), OXAKALABS Skunkworks, and Orbit.",
    type: "website",
    siteName: BRAND.name,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "G-Gravitator: Where Ideas Gain Mass",
    description:
      "Software and AI engineered to pull markets. Operating Systems, Labs (G-01..G-04), OXAKALABS Skunkworks, and Orbit.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { items: hackathons } = await getHackathons();

  return (
    <html
      lang="en"
      className={`${bricolageGrotesque.variable} ${geist.variable} ${geistMono.variable} dark`}
    >
      <body className="min-h-screen bg-[#08080A] text-[#F4F3EF] antialiased">
        <ArchitecturalShell activeHackathonCount={hackathons.length}>
          {children}
        </ArchitecturalShell>
        <Analytics />
      </body>
    </html>
  );
}
