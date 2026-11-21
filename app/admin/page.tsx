import React from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminConsoleClient } from "@/components/admin/AdminConsoleClient";
import {
  getClientInquiries,
  getHackathons,
  getNewsItems,
  getNewsletterSubscribers,
  getOrbitApplications,
} from "@/lib/db/repository";

export const metadata: Metadata = {
  title: "Curator Console | G-Gravitator",
  description:
    "Founder curation console for approving X hackathon signals, deploying OXAKALABS squads, pinning Orbital Wire news, and triaging B2B inquiries.",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get("gg_admin_session")?.value === "authenticated";

  const [
    { items: hackathons },
    { items: news },
    inquiries,
    orbitApps,
    subscribers,
  ] = await Promise.all([
    getHackathons({ includeUnpublished: true, includeExpired: true }),
    getNewsItems({ includeUnpublished: true }),
    getClientInquiries(),
    getOrbitApplications(),
    getNewsletterSubscribers(),
  ]);

  return (
    <div className="mx-auto max-w-[1360px] px-5 pt-10 pb-24 sm:px-8 lg:px-12 lg:pt-14 lg:pb-32">
      <AdminConsoleClient
        initialAuthenticated={isAuthed}
        initialHackathons={hackathons}
        initialNews={news}
        initialInquiries={inquiries}
        initialOrbit={orbitApps}
        initialSubscribers={subscribers}
      />
    </div>
  );
}
