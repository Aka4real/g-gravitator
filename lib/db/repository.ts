import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type {
  AdminInvite,
  AdminUser,
  AiPermissionsPolicy,
  AuditLogEntry,
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
  McpToken,
  MediaAsset,
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

export const DEFAULT_AI_PERMISSIONS: AiPermissionsPolicy = {
  ai_enabled: true,
  full_admin_parity: true,
  can_create_posts: true,
  can_publish_directly_journal: false,
  can_publish_directly_news: false,
  can_publish_directly_hackathons: false,
  can_edit_posts: true,
  can_approve_posts: true,
  can_revoke_approval: true,
  can_delete_posts: true,
  can_manage_labs: true,
  can_manage_inquiries: true,
  can_manage_orbit_and_subscribers: true,
  can_trigger_ingestion: true,
  can_web_research: true,
  can_manage_media: true,
  community_hackathons_require_approval: true,
  mcp_enabled: true,
  mcp_inherit_ai_permissions: true,
};

export interface LocalStoreState {
  hackathons: Hackathon[];
  news_items: NewsItem[];
  dispatches: Dispatch[];
  lab_projects: LabProject[];
  client_inquiries: ClientInquiry[];
  orbit_waitlist: OrbitApplication[];
  newsletter_subscribers: NewsletterSubscriber[];
  admin_users: AdminUser[];
  admin_invites: AdminInvite[];
  media_assets: MediaAsset[];
  ai_permissions: AiPermissionsPolicy;
  mcp_tokens: McpToken[];
  audit_logs: AuditLogEntry[];
  meta: {
    last_hackathon_sync_at: string;
    last_news_sync_at: string;
  };
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

const globalStore = globalThis as typeof globalThis & {
  __ggStoreCache?: LocalStoreState;
};

function createInitialState(): LocalStoreState {
  const nowIso = new Date().toISOString();
  return {
    hackathons: structuredClone(SEED_HACKATHONS),
    news_items: structuredClone(SEED_NEWS_ITEMS),
    dispatches: structuredClone(SEED_DISPATCHES).map((d) => ({
      ...d,
      is_published: d.is_published ?? true,
      approval_status: d.approval_status ?? "APPROVED",
      created_by: d.created_by ?? "admin",
    })),
    lab_projects: structuredClone(SEED_LAB_PROJECTS),
    client_inquiries: structuredClone(SEED_CLIENT_INQUIRIES),
    orbit_waitlist: structuredClone(SEED_ORBIT_WAITLIST),
    newsletter_subscribers: structuredClone(SEED_NEWSLETTER_SUBSCRIBERS),
    admin_users: [],
    admin_invites: [],
    media_assets: [],
    ai_permissions: { ...DEFAULT_AI_PERMISSIONS },
    mcp_tokens: [],
    audit_logs: [],
    meta: {
      last_hackathon_sync_at: nowIso,
      last_news_sync_at: nowIso,
    },
  };
}

function normalizeStoreShape(raw: Partial<LocalStoreState>): LocalStoreState {
  const base = createInitialState();
  return {
    hackathons: Array.isArray(raw.hackathons) ? raw.hackathons : base.hackathons,
    news_items: Array.isArray(raw.news_items) ? raw.news_items : base.news_items,
    dispatches: Array.isArray(raw.dispatches)
      ? raw.dispatches.map((d) => ({
          ...d,
          is_published: d.is_published ?? true,
          approval_status: d.approval_status ?? "APPROVED",
          created_by: d.created_by ?? "admin",
        }))
      : base.dispatches,
    lab_projects: Array.isArray(raw.lab_projects) ? raw.lab_projects : base.lab_projects,
    client_inquiries: Array.isArray(raw.client_inquiries)
      ? raw.client_inquiries
      : base.client_inquiries,
    orbit_waitlist: Array.isArray(raw.orbit_waitlist)
      ? raw.orbit_waitlist
      : base.orbit_waitlist,
    newsletter_subscribers: Array.isArray(raw.newsletter_subscribers)
      ? raw.newsletter_subscribers
      : base.newsletter_subscribers,
    admin_users: Array.isArray(raw.admin_users) ? raw.admin_users : [],
    admin_invites: Array.isArray(raw.admin_invites) ? raw.admin_invites : [],
    media_assets: Array.isArray(raw.media_assets) ? raw.media_assets : [],
    ai_permissions: {
      ...DEFAULT_AI_PERMISSIONS,
      ...(raw.ai_permissions ?? {}),
    },
    mcp_tokens: Array.isArray(raw.mcp_tokens) ? raw.mcp_tokens : [],
    audit_logs: Array.isArray(raw.audit_logs) ? raw.audit_logs : [],
    meta: {
      last_hackathon_sync_at:
        raw.meta?.last_hackathon_sync_at || base.meta.last_hackathon_sync_at,
      last_news_sync_at:
        raw.meta?.last_news_sync_at || base.meta.last_news_sync_at,
    },
  };
}

export function readLocalStore(): LocalStoreState {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      const initial = globalStore.__ggStoreCache
        ? normalizeStoreShape(globalStore.__ggStoreCache)
        : createInitialState();
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), "utf8");
      } catch {
        // Read-only serverless filesystem
      }
      globalStore.__ggStoreCache = initial;
      return initial;
    }

    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalStoreState>;
    if (!parsed.hackathons || !parsed.lab_projects) {
      const initial = createInitialState();
      writeLocalStore(initial);
      return initial;
    }
    const normalized = normalizeStoreShape(parsed);
    globalStore.__ggStoreCache = normalized;
    return normalized;
  } catch {
    if (globalStore.__ggStoreCache) {
      return globalStore.__ggStoreCache;
    }
    const fallback = createInitialState();
    globalStore.__ggStoreCache = fallback;
    return fallback;
  }
}

export function writeLocalStore(state: LocalStoreState): void {
  globalStore.__ggStoreCache = state;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // Read-only filesystem fallback relies on globalStore.__ggStoreCache
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

function slugifyText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

// =============================================================================
// HACKATHONS
// =============================================================================

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

export async function getHackathonById(id: string): Promise<Hackathon | null> {
  const { items } = await getHackathons({ includeExpired: true, includeUnpublished: true });
  return items.find((h) => h.id === id) ?? null;
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
        approval_status:
          cand.approval_status ?? (cand.is_published ? "APPROVED" : "PENDING_REVIEW"),
        created_by: cand.created_by ?? "ingestion",
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

export async function createHackathon(
  payload: Partial<Hackathon> & Pick<Hackathon, "title" | "organizer" | "summary" | "deadline_at" | "primary_url">
): Promise<Hackathon> {
  const store = readLocalStore();
  const nowIso = new Date().toISOString();
  const slugBase = slugifyText(payload.slug || payload.title) || `hackathon-${Date.now()}`;
  const uniqueSuffix = crypto.randomUUID().slice(0, 6);
  const slug = store.hackathons.some((h) => h.slug === slugBase)
    ? `${slugBase}-${uniqueSuffix}`
    : slugBase;
  const fingerprint =
    payload.fingerprint ||
    `${slugBase.slice(0, 28)}--${slugifyText(payload.organizer).slice(0, 14)}--${new Date(payload.deadline_at).toISOString().slice(0, 7)}`;

  const isPublished = payload.is_published ?? true;
  const record: Hackathon = {
    id: `hack-${crypto.randomUUID().slice(0, 8)}`,
    fingerprint,
    title: payload.title.trim(),
    slug,
    organizer: payload.organizer.trim(),
    summary: payload.summary.trim(),
    prize_pool_usd: payload.prize_pool_usd ?? null,
    prize_display: payload.prize_display || "Bounties + Prizes",
    start_at: payload.start_at ?? nowIso,
    deadline_at: new Date(payload.deadline_at).toISOString(),
    format: payload.format ?? "ONLINE",
    location: payload.location || "Global / Remote",
    themes: payload.themes && payload.themes.length > 0 ? payload.themes : ["AI"],
    sources:
      payload.sources && payload.sources.length > 0
        ? payload.sources
        : [{ provider: "devpost", url: payload.primary_url }],
    primary_url: payload.primary_url,
    source_tweet_url: payload.source_tweet_url ?? null,
    image_url: payload.image_url ?? null,
    oxakalabs_status: payload.oxakalabs_status ?? "SCOUTING",
    confidence_score: payload.confidence_score ?? 1.0,
    is_published: isPublished,
    is_featured: payload.is_featured ?? false,
    approval_status:
      payload.approval_status ?? (isPublished ? "APPROVED" : "PENDING_REVIEW"),
    created_by: payload.created_by ?? "admin",
    design: payload.design ?? null,
    related_links: payload.related_links ?? [],
    review_notes: payload.review_notes ?? null,
    created_at: nowIso,
    updated_at: nowIso,
  };

  store.hackathons.unshift(record);
  writeLocalStore(store);

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      await sb.from("hackathons").upsert(record, { onConflict: "fingerprint" });
    }
  }

  return record;
}

export async function updateHackathon(
  id: string,
  patch: Partial<Omit<Hackathon, "id" | "created_at">>
): Promise<Hackathon | null> {
  const store = readLocalStore();
  const idx = store.hackathons.findIndex((h) => h.id === id);
  const nowIso = new Date().toISOString();

  let updatedRecord: Hackathon | null = null;
  if (idx >= 0) {
    updatedRecord = {
      ...store.hackathons[idx],
      ...patch,
      updated_at: nowIso,
    };
    store.hackathons[idx] = updatedRecord;
    writeLocalStore(store);
  }

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data } = await sb
        .from("hackathons")
        .update({ ...patch, updated_at: nowIso })
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (data && !updatedRecord) {
        updatedRecord = data as Hackathon;
      }
    }
  }

  return updatedRecord;
}

export async function updateHackathonAdmin(
  id: string,
  patch: Partial<Pick<Hackathon, "is_published" | "is_featured" | "oxakalabs_status" | "approval_status">>
): Promise<Hackathon | null> {
  return updateHackathon(id, patch);
}

export async function deleteHackathon(id: string): Promise<boolean> {
  const store = readLocalStore();
  const prevLen = store.hackathons.length;
  store.hackathons = store.hackathons.filter((h) => h.id !== id);
  const removedLocal = store.hackathons.length < prevLen;
  if (removedLocal) {
    writeLocalStore(store);
  }

  let removedSb = false;
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { error } = await sb.from("hackathons").delete().eq("id", id);
      if (!error) removedSb = true;
    }
  }

  return removedLocal || removedSb;
}

// =============================================================================
// ORBITAL WIRE NEWS
// =============================================================================

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

export async function getNewsItemById(id: string): Promise<NewsItem | null> {
  const { items } = await getNewsItems({ includeUnpublished: true });
  return items.find((n) => n.id === id) ?? null;
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
        approval_status:
          item.approval_status ?? (item.is_published ? "APPROVED" : "PENDING_REVIEW"),
        created_by: item.created_by ?? "ingestion",
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

export async function createNewsItem(
  payload: Partial<NewsItem> & Pick<NewsItem, "title" | "source_name" | "source_url" | "category" | "gravity_take">
): Promise<NewsItem> {
  const store = readLocalStore();
  const nowIso = new Date().toISOString();
  const urlHash =
    payload.url_hash ||
    crypto
      .createHash("sha256")
      .update(`${payload.source_url}:${payload.title}:${nowIso}`)
      .digest("hex")
      .slice(0, 24);
  const isPublished = payload.is_published ?? true;

  const record: NewsItem = {
    id: `news-${crypto.randomUUID().slice(0, 8)}`,
    url_hash: urlHash,
    title: payload.title.trim(),
    source_name: payload.source_name.trim(),
    source_url: payload.source_url.trim(),
    category: payload.category,
    gravity_take: payload.gravity_take.trim(),
    impact_score: Math.min(100, Math.max(1, payload.impact_score ?? 85)),
    published_at: payload.published_at || nowIso,
    is_pinned: payload.is_pinned ?? false,
    is_published: isPublished,
    approval_status:
      payload.approval_status ?? (isPublished ? "APPROVED" : "PENDING_REVIEW"),
    created_by: payload.created_by ?? "admin",
    image_url: payload.image_url ?? null,
    design: payload.design ?? null,
    related_links: payload.related_links ?? [],
    created_at: nowIso,
  };

  store.news_items.unshift(record);
  writeLocalStore(store);

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      await sb.from("news_items").upsert(record, { onConflict: "url_hash" });
    }
  }

  return record;
}

export async function updateNewsItem(
  id: string,
  patch: Partial<Omit<NewsItem, "id" | "created_at">>
): Promise<NewsItem | null> {
  const store = readLocalStore();
  const idx = store.news_items.findIndex((n) => n.id === id);

  let updatedRecord: NewsItem | null = null;
  if (idx >= 0) {
    updatedRecord = {
      ...store.news_items[idx],
      ...patch,
    };
    store.news_items[idx] = updatedRecord;
    writeLocalStore(store);
  }

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data } = await sb
        .from("news_items")
        .update(patch)
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (data && !updatedRecord) {
        updatedRecord = data as NewsItem;
      }
    }
  }

  return updatedRecord;
}

export async function updateNewsItemAdmin(
  id: string,
  patch: Partial<Pick<NewsItem, "is_pinned" | "is_published" | "approval_status">>
): Promise<NewsItem | null> {
  return updateNewsItem(id, patch);
}

export async function deleteNewsItem(id: string): Promise<boolean> {
  const store = readLocalStore();
  const prevLen = store.news_items.length;
  store.news_items = store.news_items.filter((n) => n.id !== id);
  const removedLocal = store.news_items.length < prevLen;
  if (removedLocal) {
    writeLocalStore(store);
  }

  let removedSb = false;
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { error } = await sb.from("news_items").delete().eq("id", id);
      if (!error) removedSb = true;
    }
  }

  return removedLocal || removedSb;
}

// =============================================================================
// JOURNAL DISPATCHES
// =============================================================================

export async function getDispatches(
  category?: DispatchCategory | "ALL",
  q?: string,
  options?: { includeUnpublished?: boolean }
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
      if (!options?.includeUnpublished && d.is_published === false) return false;
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

export async function getDispatchBySlug(
  slug: string,
  options?: { includeUnpublished?: boolean }
): Promise<Dispatch | null> {
  const all = await getDispatches(undefined, undefined, options);
  return all.find((d) => d.slug === slug) ?? null;
}

export async function getDispatchById(id: string): Promise<Dispatch | null> {
  const all = await getDispatches(undefined, undefined, { includeUnpublished: true });
  return all.find((d) => d.id === id) ?? null;
}

export async function createDispatch(
  payload: Partial<Dispatch> &
    Pick<Dispatch, "title" | "subtitle" | "category" | "mdx_content">
): Promise<Dispatch> {
  const store = readLocalStore();
  const nowIso = new Date().toISOString();

  const maxIssue = store.dispatches.reduce((max, d) => {
    const n = Number.parseInt(d.issue_number, 10);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  const issueNumber =
    payload.issue_number || String(maxIssue + 1).padStart(3, "0");

  const baseSlug = slugifyText(payload.slug || payload.title) || `dispatch-${issueNumber}`;
  const slug = store.dispatches.some((d) => d.slug === baseSlug)
    ? `${baseSlug}-${crypto.randomUUID().slice(0, 4)}`
    : baseSlug;

  const words = payload.mdx_content.trim().split(/\s+/).length;
  const estMinutes = Math.max(2, Math.round(words / 210));
  const isPublished = payload.is_published ?? true;

  const record: Dispatch = {
    id: `disp-${crypto.randomUUID().slice(0, 8)}`,
    issue_number: issueNumber,
    slug,
    title: payload.title.trim(),
    subtitle: payload.subtitle.trim(),
    category: payload.category,
    author_name: payload.author_name?.trim() || "Enwedo Akaolisa Gift",
    author_role:
      payload.author_role?.trim() || "Principal Architect · G-Gravitator & OXAKALABS",
    reading_time_mins: payload.reading_time_mins || estMinutes,
    cover_image_url: payload.cover_image_url ?? null,
    mdx_content: payload.mdx_content,
    tags: payload.tags && payload.tags.length > 0 ? payload.tags : ["AI SYSTEMS"],
    is_featured: payload.is_featured ?? false,
    is_published: isPublished,
    approval_status:
      payload.approval_status ?? (isPublished ? "APPROVED" : "PENDING_REVIEW"),
    created_by: payload.created_by ?? "admin",
    design: payload.design ?? null,
    published_at: payload.published_at || nowIso,
    created_at: nowIso,
    updated_at: nowIso,
  };

  store.dispatches.unshift(record);
  writeLocalStore(store);

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      await sb.from("dispatches").upsert(record, { onConflict: "slug" });
    }
  }

  return record;
}

export async function updateDispatch(
  id: string,
  patch: Partial<Omit<Dispatch, "id" | "created_at">>
): Promise<Dispatch | null> {
  const store = readLocalStore();
  const idx = store.dispatches.findIndex((d) => d.id === id);
  const nowIso = new Date().toISOString();

  let updatedRecord: Dispatch | null = null;
  if (idx >= 0) {
    updatedRecord = {
      ...store.dispatches[idx],
      ...patch,
      updated_at: nowIso,
    };
    store.dispatches[idx] = updatedRecord;
    writeLocalStore(store);
  }

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data } = await sb
        .from("dispatches")
        .update({ ...patch, updated_at: nowIso })
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (data && !updatedRecord) {
        updatedRecord = data as Dispatch;
      }
    }
  }

  return updatedRecord;
}

export async function deleteDispatch(id: string): Promise<boolean> {
  const store = readLocalStore();
  const prevLen = store.dispatches.length;
  store.dispatches = store.dispatches.filter((d) => d.id !== id);
  const removedLocal = store.dispatches.length < prevLen;
  if (removedLocal) {
    writeLocalStore(store);
  }

  let removedSb = false;
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { error } = await sb.from("dispatches").delete().eq("id", id);
      if (!error) removedSb = true;
    }
  }

  return removedLocal || removedSb;
}

// =============================================================================
// LABS & SKUNKWORKS PROJECTS
// =============================================================================

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

export async function getLabProjectById(id: string): Promise<LabProject | null> {
  const all = await getLabProjects();
  return all.find((p) => p.id === id) ?? null;
}

export async function createLabProject(
  payload: Partial<LabProject> &
    Pick<LabProject, "code" | "division" | "name" | "tagline" | "description" | "status">
): Promise<LabProject> {
  const store = readLocalStore();
  const nowIso = new Date().toISOString();
  const slug = slugifyText(payload.slug || payload.name) || `lab-${Date.now()}`;

  const record: LabProject = {
    id: `proj-${crypto.randomUUID().slice(0, 8)}`,
    code: payload.code.trim().toUpperCase(),
    division: payload.division,
    name: payload.name.trim(),
    slug,
    tagline: payload.tagline.trim(),
    description: payload.description.trim(),
    thesis: payload.thesis,
    architecture_notes: payload.architecture_notes ?? [],
    changelog: payload.changelog ?? [],
    status: payload.status,
    tech_stack: payload.tech_stack ?? [],
    live_url: payload.live_url ?? null,
    repo_url: payload.repo_url ?? null,
    hackathon_origin: payload.hackathon_origin ?? null,
    scorecard: payload.scorecard ?? null,
    sort_order: payload.sort_order ?? store.lab_projects.length + 1,
    created_at: nowIso,
  };

  store.lab_projects.push(record);
  writeLocalStore(store);

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      await sb.from("lab_projects").upsert(record, { onConflict: "code" });
    }
  }

  return record;
}

export async function updateLabProject(
  id: string,
  patch: Partial<Omit<LabProject, "id" | "created_at">>
): Promise<LabProject | null> {
  const store = readLocalStore();
  const idx = store.lab_projects.findIndex((p) => p.id === id);

  let updatedRecord: LabProject | null = null;
  if (idx >= 0) {
    updatedRecord = {
      ...store.lab_projects[idx],
      ...patch,
    };
    store.lab_projects[idx] = updatedRecord;
    writeLocalStore(store);
  }

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data } = await sb
        .from("lab_projects")
        .update(patch)
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (data && !updatedRecord) {
        updatedRecord = data as LabProject;
      }
    }
  }

  return updatedRecord;
}

export async function deleteLabProject(id: string): Promise<boolean> {
  const store = readLocalStore();
  const prevLen = store.lab_projects.length;
  store.lab_projects = store.lab_projects.filter((p) => p.id !== id);
  const removedLocal = store.lab_projects.length < prevLen;
  if (removedLocal) {
    writeLocalStore(store);
  }

  let removedSb = false;
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { error } = await sb.from("lab_projects").delete().eq("id", id);
      if (!error) removedSb = true;
    }
  }

  return removedLocal || removedSb;
}

// =============================================================================
// CLIENT INQUIRIES
// =============================================================================

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
  let updated: ClientInquiry | null = null;
  if (idx >= 0) {
    store.client_inquiries[idx].status = status;
    updated = store.client_inquiries[idx];
    writeLocalStore(store);
  }

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data } = await sb
        .from("client_inquiries")
        .update({ status })
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (data && !updated) updated = data as ClientInquiry;
    }
  }

  return updated;
}

export async function deleteClientInquiry(id: string): Promise<boolean> {
  const store = readLocalStore();
  const prevLen = store.client_inquiries.length;
  store.client_inquiries = store.client_inquiries.filter((i) => i.id !== id);
  const removedLocal = store.client_inquiries.length < prevLen;
  if (removedLocal) writeLocalStore(store);

  let removedSb = false;
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { error } = await sb.from("client_inquiries").delete().eq("id", id);
      if (!error) removedSb = true;
    }
  }
  return removedLocal || removedSb;
}

// =============================================================================
// ORBIT APPLICATIONS & NEWSLETTER SUBSCRIBERS
// =============================================================================

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
    status: payload.status ?? "NEW",
    notes: payload.notes ?? null,
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
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data, error } = await sb
        .from("orbit_waitlist")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data as OrbitApplication[];
      }
    }
  }
  return store.orbit_waitlist;
}

export async function updateOrbitApplication(
  id: string,
  patch: Partial<Pick<OrbitApplication, "status" | "notes" | "track">>
): Promise<OrbitApplication | null> {
  const store = readLocalStore();
  const idx = store.orbit_waitlist.findIndex((o) => o.id === id);
  let updated: OrbitApplication | null = null;
  if (idx >= 0) {
    updated = { ...store.orbit_waitlist[idx], ...patch };
    store.orbit_waitlist[idx] = updated;
    writeLocalStore(store);
  }

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data } = await sb
        .from("orbit_waitlist")
        .update(patch)
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (data && !updated) updated = data as OrbitApplication;
    }
  }
  return updated;
}

export async function deleteOrbitApplication(id: string): Promise<boolean> {
  const store = readLocalStore();
  const prevLen = store.orbit_waitlist.length;
  store.orbit_waitlist = store.orbit_waitlist.filter((o) => o.id !== id);
  const removedLocal = store.orbit_waitlist.length < prevLen;
  if (removedLocal) writeLocalStore(store);

  let removedSb = false;
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { error } = await sb.from("orbit_waitlist").delete().eq("id", id);
      if (!error) removedSb = true;
    }
  }
  return removedLocal || removedSb;
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
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data, error } = await sb
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data as NewsletterSubscriber[];
      }
    }
  }
  return store.newsletter_subscribers;
}

export async function deleteNewsletterSubscriber(id: string): Promise<boolean> {
  const store = readLocalStore();
  const prevLen = store.newsletter_subscribers.length;
  store.newsletter_subscribers = store.newsletter_subscribers.filter((s) => s.id !== id);
  const removedLocal = store.newsletter_subscribers.length < prevLen;
  if (removedLocal) writeLocalStore(store);

  let removedSb = false;
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { error } = await sb.from("newsletter_subscribers").delete().eq("id", id);
      if (!error) removedSb = true;
    }
  }
  return removedLocal || removedSb;
}

// =============================================================================
// MEDIA ASSETS
// =============================================================================

export async function listMediaAssets(): Promise<MediaAsset[]> {
  const store = readLocalStore();
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data, error } = await sb
        .from("media_assets")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data as MediaAsset[];
      }
    }
  }
  return store.media_assets;
}

export async function getMediaAssetById(id: string): Promise<MediaAsset | null> {
  const store = readLocalStore();
  const local = store.media_assets.find((m) => m.id === id);
  if (local) return local;

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data } = await sb
        .from("media_assets")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (data) return data as MediaAsset;
    }
  }
  return null;
}

export async function createMediaAsset(
  asset: Omit<MediaAsset, "id" | "url" | "created_at"> & { id?: string }
): Promise<MediaAsset> {
  const store = readLocalStore();
  const id = asset.id || `med-${crypto.randomUUID().slice(0, 10)}`;
  const record: MediaAsset = {
    ...asset,
    id,
    url: `/api/media/${id}`,
    created_at: new Date().toISOString(),
  };

  store.media_assets.unshift(record);
  // Keep local media cache bounded cleanly (last 120 items)
  if (store.media_assets.length > 120) {
    store.media_assets = store.media_assets.slice(0, 120);
  }
  writeLocalStore(store);

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      await sb.from("media_assets").upsert(record, { onConflict: "id" });
    }
  }

  return record;
}

export async function deleteMediaAsset(id: string): Promise<boolean> {
  const store = readLocalStore();
  const prevLen = store.media_assets.length;
  store.media_assets = store.media_assets.filter((m) => m.id !== id);
  const removedLocal = store.media_assets.length < prevLen;
  if (removedLocal) writeLocalStore(store);

  let removedSb = false;
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { error } = await sb.from("media_assets").delete().eq("id", id);
      if (!error) removedSb = true;
    }
  }
  return removedLocal || removedSb;
}

// =============================================================================
// AI PERMISSIONS & SYSTEM SETTINGS
// =============================================================================

export async function getAiPermissions(): Promise<AiPermissionsPolicy> {
  const store = readLocalStore();
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data } = await sb
        .from("system_settings")
        .select("value")
        .eq("key", "ai_permissions")
        .maybeSingle();
      if (data?.value) {
        return {
          ...DEFAULT_AI_PERMISSIONS,
          ...(data.value as Partial<AiPermissionsPolicy>),
        };
      }
    }
  }
  return {
    ...DEFAULT_AI_PERMISSIONS,
    ...store.ai_permissions,
  };
}

export async function updateAiPermissions(
  patch: Partial<AiPermissionsPolicy>
): Promise<AiPermissionsPolicy> {
  const store = readLocalStore();
  const next: AiPermissionsPolicy = {
    ...DEFAULT_AI_PERMISSIONS,
    ...store.ai_permissions,
    ...patch,
  };
  store.ai_permissions = next;
  writeLocalStore(store);

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      await sb.from("system_settings").upsert(
        {
          key: "ai_permissions",
          value: next,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
    }
  }

  return next;
}

// =============================================================================
// ADMIN USERS & INVITES
// =============================================================================

export async function listAdminUsers(): Promise<AdminUser[]> {
  const store = readLocalStore();
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data, error } = await sb
        .from("admin_users")
        .select("*")
        .order("created_at", { ascending: true });
      if (!error && data && data.length > 0) {
        return data as AdminUser[];
      }
    }
  }
  return store.admin_users;
}

export async function getAdminUserByEmail(email: string): Promise<AdminUser | null> {
  const norm = email.trim().toLowerCase();
  const users = await listAdminUsers();
  return users.find((u) => u.email.toLowerCase() === norm) ?? null;
}

export async function getAdminUserById(id: string): Promise<AdminUser | null> {
  const users = await listAdminUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function createAdminUser(payload: {
  email: string;
  name: string;
  password_hash: string;
  role: "SUPER_ADMIN" | "ADMIN";
}): Promise<AdminUser> {
  const store = readLocalStore();
  const nowIso = new Date().toISOString();
  const record: AdminUser = {
    id: crypto.randomUUID(),
    email: payload.email.trim().toLowerCase(),
    name: payload.name.trim(),
    password_hash: payload.password_hash,
    role: payload.role,
    created_at: nowIso,
    last_login_at: nowIso,
  };

  store.admin_users.push(record);
  writeLocalStore(store);

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      await sb.from("admin_users").insert(record);
    }
  }

  return record;
}

export async function updateAdminLastLogin(id: string): Promise<void> {
  const store = readLocalStore();
  const nowIso = new Date().toISOString();
  const idx = store.admin_users.findIndex((u) => u.id === id);
  if (idx >= 0) {
    store.admin_users[idx].last_login_at = nowIso;
    writeLocalStore(store);
  }
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      await sb.from("admin_users").update({ last_login_at: nowIso }).eq("id", id);
    }
  }
}

export async function deleteAdminUser(id: string): Promise<boolean> {
  const store = readLocalStore();
  const prevLen = store.admin_users.length;
  store.admin_users = store.admin_users.filter((u) => u.id !== id);
  const removedLocal = store.admin_users.length < prevLen;
  if (removedLocal) writeLocalStore(store);

  let removedSb = false;
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { error } = await sb.from("admin_users").delete().eq("id", id);
      if (!error) removedSb = true;
    }
  }
  return removedLocal || removedSb;
}

export async function listAdminInvites(): Promise<AdminInvite[]> {
  const store = readLocalStore();
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data, error } = await sb
        .from("admin_invites")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        return data as AdminInvite[];
      }
    }
  }
  return store.admin_invites;
}

export async function createAdminInvite(createdBy: string): Promise<AdminInvite> {
  const store = readLocalStore();
  const code = `GG-INV-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
  const record: AdminInvite = {
    id: crypto.randomUUID(),
    code,
    created_by: createdBy,
    used_by: null,
    created_at: new Date().toISOString(),
  };

  store.admin_invites.unshift(record);
  writeLocalStore(store);

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      await sb.from("admin_invites").insert(record);
    }
  }

  return record;
}

export async function consumeAdminInvite(
  code: string,
  usedByEmail: string
): Promise<boolean> {
  const trimmed = code.trim();
  if (!trimmed) return false;

  const store = readLocalStore();
  const invite = store.admin_invites.find(
    (inv) => inv.code === trimmed && !inv.used_by
  );
  if (invite) {
    invite.used_by = usedByEmail.toLowerCase();
    writeLocalStore(store);
  }

  let consumedSb = false;
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data } = await sb
        .from("admin_invites")
        .update({ used_by: usedByEmail.toLowerCase() })
        .eq("code", trimmed)
        .is("used_by", null)
        .select("id")
        .maybeSingle();
      if (data) consumedSb = true;
    }
  }

  return Boolean(invite) || consumedSb;
}

export async function deleteAdminInvite(id: string): Promise<boolean> {
  const store = readLocalStore();
  const prev = store.admin_invites.length;
  store.admin_invites = store.admin_invites.filter((i) => i.id !== id);
  const removedLocal = store.admin_invites.length < prev;
  if (removedLocal) writeLocalStore(store);

  let removedSb = false;
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { error } = await sb.from("admin_invites").delete().eq("id", id);
      if (!error) removedSb = true;
    }
  }
  return removedLocal || removedSb;
}

// =============================================================================
// MCP TOKENS
// =============================================================================

export async function listMcpTokens(): Promise<McpToken[]> {
  const store = readLocalStore();
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data, error } = await sb
        .from("mcp_tokens")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        return data as McpToken[];
      }
    }
  }
  return store.mcp_tokens;
}

export async function createMcpToken(payload: {
  name: string;
  permissions_mode: "inherit" | "full" | "readonly";
  created_by: string;
}): Promise<{ tokenRecord: McpToken; plaintextToken: string }> {
  const store = readLocalStore();
  const plaintextToken = `gg_mcp_${crypto.randomBytes(24).toString("hex")}`;
  const tokenHash = crypto
    .createHash("sha256")
    .update(plaintextToken)
    .digest("hex");

  const tokenRecord: McpToken = {
    id: crypto.randomUUID(),
    name: payload.name.trim() || "External AI Agent",
    token_hash: tokenHash,
    prefix: plaintextToken.slice(0, 14),
    permissions_mode: payload.permissions_mode,
    created_by: payload.created_by,
    created_at: new Date().toISOString(),
    last_used_at: null,
    is_active: true,
  };

  store.mcp_tokens.unshift(tokenRecord);
  writeLocalStore(store);

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      await sb.from("mcp_tokens").insert(tokenRecord);
    }
  }

  return { tokenRecord, plaintextToken };
}

export async function findActiveMcpTokenByHash(
  tokenHash: string
): Promise<McpToken | null> {
  const tokens = await listMcpTokens();
  return tokens.find((t) => t.is_active && t.token_hash === tokenHash) ?? null;
}

export async function touchMcpTokenLastUsed(id: string): Promise<void> {
  const store = readLocalStore();
  const nowIso = new Date().toISOString();
  const idx = store.mcp_tokens.findIndex((t) => t.id === id);
  if (idx >= 0) {
    store.mcp_tokens[idx].last_used_at = nowIso;
    writeLocalStore(store);
  }
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      await sb.from("mcp_tokens").update({ last_used_at: nowIso }).eq("id", id);
    }
  }
}

export async function revokeMcpToken(id: string): Promise<boolean> {
  const store = readLocalStore();
  const idx = store.mcp_tokens.findIndex((t) => t.id === id);
  let updatedLocal = false;
  if (idx >= 0) {
    store.mcp_tokens[idx].is_active = false;
    writeLocalStore(store);
    updatedLocal = true;
  }

  let updatedSb = false;
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { error } = await sb
        .from("mcp_tokens")
        .update({ is_active: false })
        .eq("id", id);
      if (!error) updatedSb = true;
    }
  }
  return updatedLocal || updatedSb;
}

export async function deleteMcpToken(id: string): Promise<boolean> {
  const store = readLocalStore();
  const prev = store.mcp_tokens.length;
  store.mcp_tokens = store.mcp_tokens.filter((t) => t.id !== id);
  const removedLocal = store.mcp_tokens.length < prev;
  if (removedLocal) writeLocalStore(store);

  let removedSb = false;
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { error } = await sb.from("mcp_tokens").delete().eq("id", id);
      if (!error) removedSb = true;
    }
  }
  return removedLocal || removedSb;
}

// =============================================================================
// AUDIT LOGS
// =============================================================================

export async function appendAuditLog(
  entry: Omit<AuditLogEntry, "id" | "created_at">
): Promise<AuditLogEntry> {
  const store = readLocalStore();
  const record: AuditLogEntry = {
    ...entry,
    id: `aud-${crypto.randomUUID().slice(0, 8)}`,
    created_at: new Date().toISOString(),
  };

  store.audit_logs.unshift(record);
  if (store.audit_logs.length > 250) {
    store.audit_logs = store.audit_logs.slice(0, 250);
  }
  writeLocalStore(store);

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      await sb.from("audit_logs").insert(record);
    }
  }

  return record;
}

export async function getAuditLogs(limit = 80): Promise<AuditLogEntry[]> {
  const store = readLocalStore();
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data, error } = await sb
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (!error && data && data.length > 0) {
        return data as AuditLogEntry[];
      }
    }
  }
  return store.audit_logs.slice(0, limit);
}

// =============================================================================
// GLOBAL PUBLIC SEARCH (ZERO ADMIN ROUTES OR UNPUBLISHED ITEMS)
// =============================================================================

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
      subtitle: "High-Ticket B2B AI Foundry: Gravity Audit, Velocity MVP & Lab Retainer",
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

  const dispatchItems: GlobalSearchResult[] = store.dispatches
    .filter((d) => d.is_published !== false)
    .map((d) => ({
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
