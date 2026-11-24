import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orbit · 6-Week Technical Builders Cohort",
  description:
    "Apply for Orbit, G-Gravitator and OXAKALABS's 6-week accelerator turning builders into production AI and systems engineers with a live Demo Day.",
  alternates: {
    canonical: "/orbit",
  },
  openGraph: {
    title: "Orbit 6-Week Builders Cohort | G-Gravitator",
    description:
      "6-week technical builders accelerator covering TypeScript/Postgres architecture, applied AI systems, 48-hour OXAKALABS sprints, and live Demo Day.",
    type: "website",
    siteName: "G-Gravitator",
    url: "/orbit",
  },
  twitter: {
    card: "summary_large_image",
    title: "Orbit 6-Week Builders Cohort | G-Gravitator",
    description:
      "6-week technical builders accelerator by G-Gravitator and OXAKALABS.",
  },
};

export default function OrbitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
