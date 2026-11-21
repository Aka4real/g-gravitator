import type { Metadata } from "next";
import { Syne, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ArchitecturalShell } from "@/components/layout/ArchitecturalShell";
import { getHackathons } from "@/lib/db/repository";

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "G-Gravitator — Build With Weight | Software & AI Creativity Lab",
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
    "Kinetic Luxury",
  ],
  openGraph: {
    title: "G-Gravitator — Where Ideas Gain Mass",
    description:
      "Software & AI engineered to pull markets. Operating Systems, Labs (G-01..G-04), OXAKALABS // Skunkworks, and Orbit.",
    type: "website",
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
      className={`${syne.variable} ${inter.variable} ${jetbrainsMono.variable} dark`}
    >
      <body className="min-h-screen bg-[#09090B] text-[#F3F2EE] antialiased">
        <ArchitecturalShell activeHackathonCount={hackathons.length}>
          {children}
        </ArchitecturalShell>
      </body>
    </html>
  );
}
