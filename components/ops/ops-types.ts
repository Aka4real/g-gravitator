import type {
  AdminInvite,
  AiPermissionsPolicy,
  AuditLogEntry,
  ClientInquiry,
  Dispatch,
  Hackathon,
  LabProject,
  NewsItem,
  NewsletterSubscriber,
  OrbitApplication,
} from "@/lib/supabase/types";

export interface OpsUserInfo {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "ADMIN";
}

export interface OpsMediaSummary {
  id: string;
  filename: string;
  mime_type: string;
  url: string;
  source_type: "generated" | "imported" | "uploaded";
  source_url?: string | null;
  prompt?: string | null;
  alt_text?: string | null;
  created_by: string;
  created_at: string;
}

export interface OpsMcpTokenSummary {
  id: string;
  name: string;
  prefix: string;
  permissions_mode: "inherit" | "full" | "readonly";
  created_by: string;
  created_at: string;
  last_used_at?: string | null;
  is_active: boolean;
}

export interface OpsAdminSummary {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "ADMIN";
  created_at: string;
  last_login_at?: string | null;
}

export interface OpsBootstrapData {
  user: OpsUserInfo;
  dispatches: Dispatch[];
  news: NewsItem[];
  hackathons: Hackathon[];
  labs: LabProject[];
  inquiries: ClientInquiry[];
  orbit: OrbitApplication[];
  subscribers: NewsletterSubscriber[];
  mediaAssets: OpsMediaSummary[];
  aiPermissions: AiPermissionsPolicy;
  mcpTokens: OpsMcpTokenSummary[];
  adminUsers: OpsAdminSummary[];
  adminInvites: AdminInvite[];
  auditLogs: AuditLogEntry[];
  mcpEndpointUrl: string;
}
