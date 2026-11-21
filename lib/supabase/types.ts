export type HackathonProvider =
  | "devpost"
  | "dorahacks"
  | "lablab"
  | "mlh"
  | "luma"
  | "devfolio"
  | "ethglobal"
  | "kaggle"
  | "unstop"
  | "twitter";

export type HackathonFormat = "ONLINE" | "IN_PERSON" | "HYBRID";

export type OxakalabsStatus =
  | "NONE"
  | "SCOUTING"
  | "SQUAD_DEPLOYED"
  | "SUBMITTED"
  | "WON";

export interface HackathonSource {
  provider: HackathonProvider;
  url: string;
  label?: string;
}

export interface Hackathon {
  id: string;
  fingerprint: string;
  title: string;
  slug: string;
  organizer: string;
  summary: string;
  prize_pool_usd: number | null;
  prize_display: string;
  start_at: string | null;
  deadline_at: string;
  format: HackathonFormat;
  location: string;
  themes: string[];
  sources: HackathonSource[];
  primary_url: string;
  source_tweet_url: string | null;
  image_url?: string | null;
  oxakalabs_status: OxakalabsStatus;
  confidence_score: number;
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export type NewsCategory =
  | "MODELS"
  | "AGENTS"
  | "DEVTOOLS"
  | "RESEARCH"
  | "BUSINESS"
  | "OPEN_SOURCE";

export interface NewsItem {
  id: string;
  url_hash: string;
  title: string;
  source_name: string;
  source_url: string;
  category: NewsCategory;
  gravity_take: string;
  impact_score: number;
  published_at: string;
  is_pinned: boolean;
  is_published: boolean;
  created_at: string;
}

export type DispatchCategory =
  | "ARCHITECTURE"
  | "POST-MORTEM"
  | "AI SYSTEMS"
  | "HACKATHON LOG"
  | "DESIGN ENGINEERING";

export interface Dispatch {
  id: string;
  issue_number: string;
  slug: string;
  title: string;
  subtitle: string;
  category: DispatchCategory;
  author_name: string;
  author_role: string;
  reading_time_mins: number;
  cover_image_url?: string | null;
  mdx_content: string;
  tags: string[];
  is_featured: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface GraduationScorecardData {
  pain_intensity: number; // 1-5
  willingness_to_pay: number; // 1-5
  technical_moat: number; // 1-5
  distribution_hook: number; // 1-5
  lean_maintainability: number; // 1-5
}

export type LabDivision = "LABS" | "SKUNKWORKS";

export type LabProjectStatus =
  | "CONCEPT"
  | "PROTOTYPING"
  | "R&D"
  | "SKUNKWORKS CANDIDATE"
  | "BETA"
  | "LIVE"
  | "ARCHIVED";

export interface LabProject {
  id: string;
  code: string;
  division: LabDivision;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  thesis?: string;
  architecture_notes?: string[];
  changelog?: { version: string; date: string; summary: string }[];
  status: LabProjectStatus;
  tech_stack: string[];
  live_url: string | null;
  repo_url: string | null;
  hackathon_origin: string | null;
  scorecard: GraduationScorecardData | null;
  sort_order: number;
  created_at: string;
}

export type ServiceTierKey =
  | "GRAVITY_AUDIT"
  | "VELOCITY_MVP"
  | "LAB_RETAINER"
  | "CUSTOM";

export type InquiryStatus =
  | "NEW"
  | "REVIEWED"
  | "DISCOVERY_CALL"
  | "CLOSED_WON"
  | "ARCHIVED";

export interface ClientInquiry {
  id: string;
  name: string;
  email: string;
  company: string | null;
  tier: ServiceTierKey;
  budget_range: string | null;
  timeline: string | null;
  project_brief: string;
  status: InquiryStatus;
  created_at: string;
}

export type OrbitTrack =
  | "AI_ENGINEERING"
  | "FULLSTACK_SYSTEMS"
  | "KINETIC_DESIGN";

export interface OrbitApplication {
  id: string;
  full_name: string;
  email: string;
  track: OrbitTrack;
  portfolio_url: string | null;
  proof_of_work: string | null;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  source: string;
  created_at: string;
}

export interface GlobalSearchResult {
  id: string;
  type: "ROUTE" | "LAB_DROP" | "SKUNKWORKS" | "HACKATHON" | "DISPATCH" | "NEWS" | "ACTION";
  code?: string;
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
}
