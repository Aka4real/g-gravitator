import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type {
  ClientInquiry,
  Dispatch,
  DispatchCategory,
  GlobalSearchResult,
  Hackathon,
  HackathonFormat,
  HackathonProvider,
  HackathonSource,
  InquiryStatus,
  LabDivision,
  LabProject,
  NewsCategory,
  NewsItem,
  NewsletterSubscriber,
  OrbitApplication,
  OxakalabsStatus,
} from "@/lib/supabase/types";
import {
  SEED_CLIENT_INQUIRIES,
  SEED_DISPATCHES,
  SEED_HACKATHONS,
  SEED_LAB_PROJECTS,
  SEED_NEWS_ITEMS,
  SEED_NEWSLETTER_SUBSCRIBERS,
  SEED_ORBIT_WAITLIST,
} from "@/lib/seed-fallback";

export interface LocalStoreState {
  hackathons: Hackathon[];
  news_items: NewsItem[];
  dispatches: Dispatch[];
  lab_projects: LabProject[];
  client_inquiries: ClientInquiry[];
  orbit_waitlist: OrbitApplication[];
  newsletter_subscribers: NewsletterSubscriber[];
  meta: {
    last_hackathon_sync_at: string;
    last_news_sync_at: string;
  };
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

function createInitialState(): LocalStoreState {
  const nowIso = new Date().toISOString();
  return {
    hackathons: structuredClone(SEED_HACKATHONS),
    news_items: structuredClone(SEED_NEWS_ITEMS),
    dispatches: structuredClone(SEED_DISPATCHES),
    lab_projects: structuredClone(SEED_LAB_PROJECTS),
    client_inquiries: structuredClone(SEED_CLIENT_INQUIRIES),
    orbit_waitlist: structuredClone(SEED_ORBIT_WAITLIST),
    newsletter_subscribers: structuredClone(SEED_NEWSLETTER_SUBSCRIBERS),
    meta: {
      last_hackathon_sync_at: nowIso,
      last_news_sync_at: nowIso,
    },
  };
}

export function readLocalStore(): LocalStoreState {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const initial = createInitialState();
      fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as LocalStoreState;
    if (!parsed.hackathons || !parsed.lab_projects) {
      const initial = createInitialState();
      fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    return parsed;
  } catch {
    return createInitialState();
  }
}

export function writeLocalStore(state: LocalStoreState): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // Read-only filesystem fallback
  }
}

export function normalizeUrlForDedup(url: string): string {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    const pathname = parsed.pathname.replace(/\/+$/, "").toLowerCase();
    return `${host}${pathname}`;
  } catch {
    return url.trim().toLowerCase().replace(/\/+$/, "");
  }
}

export function mergeHackathonSources(
  existing: HackathonSource[],
  incoming: HackathonSource[]
): HackathonSource[] {
  const map = new Map<string, HackathonSource>();
  for (const s of [...existing, ...incoming]) {
    if (!s || !s.provider) continue;
    const key = s.provider;
    if (!map.has(key)) {
      map.set(key, s);
    }
  }
  return Array.from(map.values());
}

export interface HackathonFilterParams {
  source?: HackathonProvider | "all";
  format?: HackathonFormat | "ALL";
  theme?: string;
  sort?: "closing_soon" | "prize_pool" | "newest" | "oxakalabs";
  q?: string;
  includeExpired?: boolean;
  includeUnpublished?: boolean;
}

export async function getHackathons(
  filters: HackathonFilterParams = {}
): Promise<{ items: Hackathon[]; lastSyncAt: string }> {
  const store = readLocalStore();
  let list: Hackathon[] = store.hackathons;

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      let query = sb.from("hackathons").select("*");
      if (!filters.includeUnpublished) {
        query = query.eq("is_published", true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        list = data as Hackathon[];
      }
    }
  }

  const nowMs = Date.now();
  const filtered = list.filter((h) => {
    if (!filters.includeUnpublished && !h.is_published) return false;
    if (!filters.includeExpired && new Date(h.deadline_at).getTime() < nowMs - 12 * 3600 * 1000) {
      return false;
    }
    if (filters.source && filters.source !== "all") {
      const hasSource = h.sources.some((s) => s.provider === filters.source);
      if (!hasSource) return false;
    }
    if (filters.format && filters.format !== "ALL") {
      if (h.format !== filters.format) return false;
    }
    if (filters.theme && filters.theme !== "ALL") {
      const target = filters.theme.toLowerCase();
      const hasTheme = h.themes.some(
        (t) => t.toLowerCase() === target || t.toLowerCase().includes(target)
      );
      if (!hasTheme) return false;
    }
    if (filters.q && filters.q.trim()) {
      const q = filters.q.trim().toLowerCase();
      const hay =
        `${h.title} ${h.organizer} ${h.summary} ${h.location} ${h.themes.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sortMode = filters.sort ?? "closing_soon";
  filtered.sort((a, b) => {
    if (sortMode === "prize_pool") {
      return (b.prize_pool_usd ?? 0) - (a.prize_pool_usd ?? 0);
    }
    if (sortMode === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortMode === "oxakalabs") {
      const rank = (s: OxakalabsStatus) =>
        s === "SQUAD_DEPLOYED"
          ? 4
          : s === "SUBMITTED"
          ? 3
          : s === "WON"
          ? 5
          : s === "SCOUTING"
          ? 2
          : 0;
      const diff = rank(b.oxakalabs_status) - rank(a.oxakalabs_status);
      if (diff !== 0) return diff;
    }
    return new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime();
  });

  return {
    items: filtered,
    lastSyncAt: store.meta.last_hackathon_sync_at,
  };
}

export async function upsertHackathons(
  candidates: Omit<Hackathon, "id" | "created_at" | "updated_at">[]
): Promise<{ inserted: number; merged: number; total: number }> {
  const store = readLocalStore();
  let inserted = 0;
  let merged = 0;
  const nowIso = new Date().toISOString();

  for (const cand of candidates) {
    const candNormUrl = normalizeUrlForDedup(cand.primary_url);
    const existingIndex = store.hackathons.findIndex((h) => {
      if (h.fingerprint === cand.fingerprint) return true;
      if (
        candNormUrl.length > 14 &&
        !candNormUrl.endsWith("/hackathons") &&
        !candNormUrl.endsWith("/events") &&
        normalizeUrlForDedup(h.primary_url) === candNormUrl
      ) {
        return true;
      }
      return false;
    });

    if (existingIndex >= 0) {
      const current = store.hackathons[existingIndex];
      const mergedSources = mergeHackathonSources(current.sources, cand.sources);
      const mergedThemes = Array.from(new Set([...current.themes, ...cand.themes]));
      store.hackathons[existingIndex] = {
        ...current,
        prize_pool_usd: current.prize_pool_usd ?? cand.prize_pool_usd,
        prize_display:
          current.prize_display && current.prize_display !== "TBA"
            ? current.prize_display
            : cand.prize_display,
        sources: mergedSources,
        themes: mergedThemes,
        source_tweet_url: current.source_tweet_url ?? cand.source_tweet_url,
        confidence_score: Math.max(current.confidence_score, cand.confidence_score),
        updated_at: nowIso,
      };
      merged++;
    } else {
      const newRecord: Hackathon = {
        ...cand,
        id: `hack-${crypto.randomUUID().slice(0, 8)}`,
        created_at: nowIso,
        updated_at: nowIso,
      };
      store.hackathons.unshift(newRecord);
      inserted++;
    }
  }

  store.meta.last_hackathon_sync_at = nowIso;
  writeLocalStore(store);

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb && candidates.length > 0) {
      for (const cand of candidates) {
        await sb.from("hackathons").upsert(cand, { onConflict: "fingerprint" });
      }
    }
  }

  return {
    inserted,
    merged,
    total: store.hackathons.length,
  };
}

export async function updateHackathonAdmin(
  id: string,
  patch: Partial<Pick<Hackathon, "is_published" | "is_featured" | "oxakalabs_status">>
): Promise<Hackathon | null> {
  const store = readLocalStore();
  const idx = store.hackathons.findIndex((h) => h.id === id);
  if (idx === -1) return null;

  store.hackathons[idx] = {
    ...store.hackathons[idx],
    ...patch,
    updated_at: new Date().toISOString(),
  };
  writeLocalStore(store);

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      await sb.from("hackathons").update(patch).eq("id", id);
    }
  }

  return store.hackathons[idx];
}

export interface NewsFilterParams {
  category?: NewsCategory | "ALL";
  q?: string;
  includeUnpublished?: boolean;
}

export async function getNewsItems(
  filters: NewsFilterParams = {}
): Promise<{ items: NewsItem[]; lastSyncAt: string }> {
  const store = readLocalStore();
  let list = store.news_items;

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      let query = sb.from("news_items").select("*");
      if (!filters.includeUnpublished) {
        query = query.eq("is_published", true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        list = data as NewsItem[];
      }
    }
  }

  const filtered = list.filter((n) => {
    if (!filters.includeUnpublished && !n.is_published) return false;
    if (filters.category && filters.category !== "ALL") {
      if (n.category !== filters.category) return false;
    }
    if (filters.q && filters.q.trim()) {
      const q = filters.q.trim().toLowerCase();
      const hay = `${n.title} ${n.source_name} ${n.gravity_take} ${n.category}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
  });

  return {
    items: filtered,
    lastSyncAt: store.meta.last_news_sync_at,
  };
}

export async function upsertNewsItems(
  items: Omit<NewsItem, "id" | "created_at">[]
): Promise<{ inserted: number; total: number }> {
  const store = readLocalStore();
  let inserted = 0;
  const nowIso = new Date().toISOString();

  for (const item of items) {
    const exists = store.news_items.some(
      (n) =>
        n.url_hash === item.url_hash ||
        normalizeUrlForDedup(n.source_url) === normalizeUrlForDedup(item.source_url)
    );
    if (!exists) {
      store.news_items.unshift({
        ...item,
        id: `news-${crypto.randomUUID().slice(0, 8)}`,
        created_at: nowIso,
      });
      inserted++;
    }
  }

  store.meta.last_news_sync_at = nowIso;
  writeLocalStore(store);

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb && items.length > 0) {
      for (const item of items) {
        await sb.from("news_items").upsert(item, { onConflict: "url_hash" });
      }
    }
  }

  return {
    inserted,
    total: store.news_items.length,
  };
}

export async function updateNewsItemAdmin(
  id: string,
  patch: Partial<Pick<NewsItem, "is_pinned" | "is_published">>
): Promise<NewsItem | null> {
  const store = readLocalStore();
  const idx = store.news_items.findIndex((n) => n.id === id);
  if (idx === -1) return null;

  store.news_items[idx] = {
    ...store.news_items[idx],
    ...patch,
  };
  writeLocalStore(store);

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      await sb.from("news_items").update(patch).eq("id", id);
    }
  }

  return store.news_items[idx];
}

export async function getDispatches(
  category?: DispatchCategory | "ALL",
  q?: string
): Promise<Dispatch[]> {
  const store = readLocalStore();
  let list = store.dispatches;

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data, error } = await sb
        .from("dispatches")
        .select("*")
        .order("published_at", { ascending: false });
      if (!error && data && data.length > 0) {
        list = data as Dispatch[];
      }
    }
  }

  return list
    .filter((d) => {
      if (category && category !== "ALL" && d.category !== category) return false;
      if (q && q.trim()) {
        const query = q.trim().toLowerCase();
        const hay = `${d.title} ${d.subtitle} ${d.tags.join(" ")} ${d.category}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    })
    .sort((a, b) => Number(b.issue_number) - Number(a.issue_number));
}

export async function getDispatchBySlug(slug: string): Promise<Dispatch | null> {
  const all = await getDispatches();
  return all.find((d) => d.slug === slug) ?? null;
}

export async function getLabProjects(division?: LabDivision): Promise<LabProject[]> {
  const store = readLocalStore();
  let list = store.lab_projects;

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data, error } = await sb
        .from("lab_projects")
        .select("*")
        .order("sort_order", { ascending: true });
      if (!error && data && data.length > 0) {
        list = data as LabProject[];
      }
    }
  }

  return list
    .filter((p) => (!division ? true : p.division === division))
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function getLabProjectBySlug(slug: string): Promise<LabProject | null> {
  const all = await getLabProjects();
  return all.find((p) => p.slug === slug) ?? null;
}

export async function createClientInquiry(
  payload: Omit<ClientInquiry, "id" | "status" | "created_at">
): Promise<ClientInquiry> {
  const store = readLocalStore();
  const record: ClientInquiry = {
    ...payload,
    id: `inq-${crypto.randomUUID().slice(0, 8)}`,
    status: "NEW",
    created_at: new Date().toISOString(),
  };

  store.client_inquiries.unshift(record);
  writeLocalStore(store);

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      await sb.from("client_inquiries").insert(payload);
    }
  }

  return record;
}

export async function getClientInquiries(): Promise<ClientInquiry[]> {
  const store = readLocalStore();
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data, error } = await sb
        .from("client_inquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data as ClientInquiry[];
      }
    }
  }
  return store.client_inquiries;
}

export async function updateClientInquiryStatus(
  id: string,
  status: InquiryStatus
): Promise<ClientInquiry | null> {
  const store = readLocalStore();
  const idx = store.client_inquiries.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  store.client_inquiries[idx].status = status;
  writeLocalStore(store);

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      await sb.from("client_inquiries").update({ status }).eq("id", id);
    }
  }

  return store.client_inquiries[idx];
}

export async function createOrbitApplication(
  payload: Omit<OrbitApplication, "id" | "created_at">
): Promise<OrbitApplication> {
  const store = readLocalStore();
  const existing = store.orbit_waitlist.find(
    (o) => o.email.toLowerCase() === payload.email.toLowerCase()
  );
  if (existing) {
    existing.full_name = payload.full_name;
    existing.track = payload.track;
    existing.portfolio_url = payload.portfolio_url;
    existing.proof_of_work = payload.proof_of_work;
    writeLocalStore(store);
    return existing;
  }

  const record: OrbitApplication = {
    ...payload,
    id: `orb-${crypto.randomUUID().slice(0, 8)}`,
    created_at: new Date().toISOString(),
  };
  store.orbit_waitlist.unshift(record);
  writeLocalStore(store);

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      await sb.from("orbit_waitlist").upsert(payload, { onConflict: "email" });
    }
  }

  return record;
}

export async function getOrbitApplications(): Promise<OrbitApplication[]> {
  const store = readLocalStore();
  return store.orbit_waitlist;
}

export async function createNewsletterSubscriber(payload: {
  email: string;
  source?: string;
}): Promise<NewsletterSubscriber> {
  const store = readLocalStore();
  const existing = store.newsletter_subscribers.find(
    (s) => s.email.toLowerCase() === payload.email.toLowerCase()
  );
  if (existing) return existing;

  const record: NewsletterSubscriber = {
    id: `sub-${crypto.randomUUID().slice(0, 8)}`,
    email: payload.email.toLowerCase(),
    source: payload.source ?? "journal",
    created_at: new Date().toISOString(),
  };
  store.newsletter_subscribers.unshift(record);
  writeLocalStore(store);

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      await sb
        .from("newsletter_subscribers")
        .upsert({ email: record.email, source: record.source }, { onConflict: "email" });
    }
  }

  return record;
}

export async function getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  const store = readLocalStore();
  return store.newsletter_subscribers;
}

export async function searchGlobal(query: string): Promise<GlobalSearchResult[]> {
  const q = query.trim().toLowerCase();
  const store = readLocalStore();

  const staticRoutes: GlobalSearchResult[] = [
    {
      id: "route-home",
      type: "ROUTE",
      code: "NAV // 00",
      title: "Mission Control (Home)",
      subtitle: "G-Gravitator Masterbrand Flywheel, Kinetic Showcase & Live Intelligence",
      href: "/",
      badge: "ROUTE",
    },
    {
      id: "route-systems",
      type: "ROUTE",
      code: "NAV // 01",
      title: "G-Gravitator Systems",
      subtitle: "High-Ticket B2B AI Foundry — Gravity Audit, Velocity MVP & Lab Retainer",
      href: "/systems",
      badge: "B2B FOUNDRY",
    },
    {
      id: "route-labs",
      type: "ROUTE",
      code: "NAV // 02",
      title: "G-Gravitator Labs",
      subtitle: "Proprietary Numbered Product Drops (G-01 through G-04)",
      href: "/labs",
      badge: "PRODUCT LAB",
    },
    {
      id: "route-skunkworks",
      type: "ROUTE",
      code: "NAV // 03",
      title: "OXAKALABS // Skunkworks",
      subtitle: "Experimental 48-Hour R&D Foundry & Interactive 25-Point Graduation Scorecard",
      href: "/skunkworks",
      badge: "SKUNKWORKS",
    },
    {
      id: "route-hackathons",
      type: "ROUTE",
      code: "NAV // 04",
      title: "Live Hackathon Tracker",
      subtitle: "Multi-Provider + X (Twitter) Global AI Hackathon Radar",
      href: "/hackathons",
      badge: "LIVE RADAR",
    },
    {
      id: "route-journal",
      type: "ROUTE",
      code: "NAV // 05",
      title: "Journal & The Orbital Wire",
      subtitle: "Dual-Track Long-Form Lab Dispatches & Real-Time AI/Tech News Radar",
      href: "/journal",
      badge: "INTELLIGENCE",
    },
    {
      id: "route-orbit",
      type: "ROUTE",
      code: "NAV // 06",
      title: "G-Gravitator Orbit",
      subtitle: "6-Week Builder Accelerator (Gravity Cycles) & Residency Application",
      href: "/orbit",
      badge: "ACCELERATOR",
    },
    {
      id: "route-admin",
      type: "ACTION",
      code: "SYS // ADMIN",
      title: "Curator Admin Console",
      subtitle: "Moderate X hackathons, set OXAKALABS squad status, pin news & triage B2B inquiries",
      href: "/admin",
      badge: "CONSOLE",
    },
    {
      id: "action-audit",
      type: "ACTION",
      code: "ACT // 01",
      title: "Book a 5-Day Gravity Audit",
      subtitle: "Scope a rapid operational teardown or 4-week Velocity MVP build",
      href: "/systems#scope-intake",
      badge: "QUICK ACTION",
    },
    {
      id: "action-submit-hack",
      type: "ACTION",
      code: "ACT // 02",
      title: "Submit Hackathon or X (Twitter) Signal",
      subtitle: "Paste an X post or hackathon URL into the Gemini Flash verification pipeline",
      href: "/hackathons?submit=1",
      badge: "QUICK ACTION",
    },
    {
      id: "action-orbit-apply",
      type: "ACTION",
      code: "ACT // 03",
      title: "Join Orbit Cycle 01 Waitlist",
      subtitle: "Apply for Applied AI Engineering, Full-Stack Systems, or Kinetic Design",
      href: "/orbit#apply",
      badge: "QUICK ACTION",
    },
  ];

  const projectItems: GlobalSearchResult[] = store.lab_projects.map((p) => ({
    id: `proj-${p.id}`,
    type: p.division === "LABS" ? "LAB_DROP" : "SKUNKWORKS",
    code: p.code,
    title: `${p.code} // ${p.name}`,
    subtitle: p.tagline,
    href: p.division === "LABS" ? `/labs/${p.slug}` : `/skunkworks#${p.slug}`,
    badge: p.status,
  }));

  const hackathonItems: GlobalSearchResult[] = store.hackathons
    .filter((h) => h.is_published)
    .map((h) => ({
      id: `hack-${h.id}`,
      type: "HACKATHON",
      code: h.sources.map((s) => s.provider.toUpperCase()).join("+"),
      title: h.title,
      subtitle: `${h.organizer} • ${h.prize_display} • ${h.format}`,
      href: `/hackathons?q=${encodeURIComponent(h.title)}`,
      badge: h.prize_display,
    }));

  const dispatchItems: GlobalSearchResult[] = store.dispatches.map((d) => ({
    id: `disp-${d.id}`,
    type: "DISPATCH",
    code: `DISPATCH // ${d.issue_number}`,
    title: d.title,
    subtitle: `${d.category} • ${d.reading_time_mins} MIN READ`,
    href: `/journal/${d.slug}`,
    badge: d.category,
  }));

  const newsItems: GlobalSearchResult[] = store.news_items
    .filter((n) => n.is_published)
    .map((n) => ({
      id: `news-${n.id}`,
      type: "NEWS",
      code: `WIRE // ${n.category}`,
      title: n.title,
      subtitle: `${n.source_name} • Impact ${n.impact_score}/100`,
      href: `/journal?track=wire&q=${encodeURIComponent(n.title.slice(0, 32))}`,
      badge: `${n.impact_score}/100`,
    }));

  const combined = [
    ...staticRoutes,
    ...projectItems,
    ...dispatchItems,
    ...hackathonItems,
    ...newsItems,
  ];

  if (!q) {
    return combined.slice(0, 18);
  }

  return combined
    .filter((item) => {
      const hay = `${item.code ?? ""} ${item.title} ${item.subtitle} ${item.badge ?? ""}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, 20);
}
