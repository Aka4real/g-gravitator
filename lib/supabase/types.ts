export type ContentAuthorType =
  | "admin"
  | "ai_assistant"
  | "community"
  | "ingestion"
  | "mcp";

export type ApprovalStatus =
  | "APPROVED"
  | "PENDING_REVIEW"
  | "REJECTED"
  | "DRAFT";

export interface PostLinkRef {
  label: string;
  url: string;
  description?: string;
}

export interface PostGalleryImage {
  url: string;
  caption?: string;
  alt?: string;
}

export interface PostDesignConfig {
  accent_color?: string;
  surface_tint?: string;
  hero_layout?: "editorial" | "split" | "fullbleed" | "minimal";
  callout_style?: "left-bar" | "glass-card" | "tinted-banner";
  gallery_images?: PostGalleryImage[];
  featured_links?: PostLinkRef[];
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
}

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
  approval_status?: ApprovalStatus;
  created_by?: ContentAuthorType;
  design?: PostDesignConfig | null;
  related_links?: PostLinkRef[];
  review_notes?: string | null;
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
  approval_status?: ApprovalStatus;
  created_by?: ContentAuthorType;
  image_url?: string | null;
  design?: PostDesignConfig | null;
  related_links?: PostLinkRef[];
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
  is_published?: boolean;
  approval_status?: ApprovalStatus;
  created_by?: ContentAuthorType;
  design?: PostDesignConfig | null;
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

export type OrbitApplicationStatus =
  | "NEW"
  | "REVIEWING"
  | "ACCEPTED"
  | "WAITLISTED"
  | "REJECTED";

export interface OrbitApplication {
  id: string;
  full_name: string;
  email: string;
  track: OrbitTrack;
  portfolio_url: string | null;
  proof_of_work: string | null;
  status?: OrbitApplicationStatus;
  notes?: string | null;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  source: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: "SUPER_ADMIN" | "ADMIN";
  created_at: string;
  last_login_at?: string | null;
}

export interface AdminInvite {
  id: string;
  code: string;
  created_by: string;
  used_by?: string | null;
  created_at: string;
}

export interface MediaAsset {
  id: string;
  filename: string;
  mime_type: string;
  url: string;
  data_url: string;
  source_type: "generated" | "imported" | "uploaded";
  source_url?: string | null;
  prompt?: string | null;
  alt_text?: string | null;
  created_by: ContentAuthorType;
  created_at: string;
}

export type McpPermissionsMode = "inherit" | "full" | "readonly" | "custom";

export type McpRolePreset =
  | "inherit"
  | "readonly_public"
  | "editorial_writer"
  | "hackathon_scout"
  | "labs_copilot"
  | "crm_operator"
  | "full_ops"
  | "custom";

export type McpScopeKey =
  | "can_read_public_content"
  | "can_read_drafts_and_pending"
  | "can_read_media_library"
  | "can_read_inquiries_pii"
  | "can_read_orbit_pii"
  | "can_read_subscribers_pii"
  | "can_read_audit_logs"
  | "can_create_journal"
  | "can_create_news"
  | "can_create_hackathons"
  | "can_edit_posts"
  | "can_publish_directly_journal"
  | "can_publish_directly_news"
  | "can_publish_directly_hackathons"
  | "can_approve_posts"
  | "can_revoke_approval"
  | "can_bulk_moderate"
  | "can_delete_posts"
  | "can_purge_expired_posts"
  | "can_manage_labs"
  | "can_score_lab_graduation"
  | "can_promote_to_skunkworks"
  | "can_manage_inquiries"
  | "can_manage_orbit_and_subscribers"
  | "can_export_crm_data"
  | "can_trigger_ingestion"
  | "can_web_research"
  | "can_use_ai_drafter"
  | "can_manage_media";

export type McpScopeMap = Partial<Record<McpScopeKey, boolean>>;

export interface AiPermissionsPolicy {
  ai_enabled: boolean;
  full_admin_parity: boolean;
  can_create_posts: boolean;
  can_publish_directly_journal: boolean;
  can_publish_directly_news: boolean;
  can_publish_directly_hackathons: boolean;
  can_edit_posts: boolean;
  can_approve_posts: boolean;
  can_revoke_approval: boolean;
  can_bulk_moderate?: boolean;
  can_delete_posts: boolean;
  can_manage_labs: boolean;
  can_manage_inquiries: boolean;
  can_manage_orbit_and_subscribers: boolean;
  can_trigger_ingestion: boolean;
  can_web_research: boolean;
  can_use_ai_drafter?: boolean;
  can_manage_media: boolean;
  community_hackathons_require_approval: boolean;
  mcp_enabled: boolean;
  mcp_inherit_ai_permissions: boolean;
  mcp_allow_pii_over_mcp?: boolean;
  mcp_allow_full_parity_tokens?: boolean;
  mcp_require_dry_run_for_bulk_delete?: boolean;
  mcp_expose_prompts?: boolean;
  mcp_expose_resources?: boolean;
  mcp_read_audit_logs?: boolean;
  mcp_default_rate_limit_rpm?: number;
}

export interface McpToken {
  id: string;
  name: string;
  token_hash: string;
  prefix: string;
  permissions_mode: McpPermissionsMode;
  role_preset?: McpRolePreset;
  custom_scopes?: McpScopeMap;
  expires_at?: string | null;
  rate_limit_rpm?: number;
  request_count?: number;
  denied_count?: number;
  last_client_info?: string | null;
  notes?: string | null;
  created_by: string;
  created_at: string;
  last_used_at?: string | null;
  is_active: boolean;
}

export interface AuditLogEntry {
  id: string;
  actor_type: "admin" | "ai_assistant" | "mcp";
  actor_label: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  summary: string;
  status: "ok" | "denied" | "error";
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
