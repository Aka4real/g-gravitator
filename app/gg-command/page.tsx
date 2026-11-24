import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { OpsConsoleClient } from "@/components/ops/OpsConsoleClient";
import type { OpsBootstrapData } from "@/components/ops/ops-types";
import { getAuthenticatedAdmin } from "@/lib/auth/admin-auth";
import {
  getAiPermissions,
  getAuditLogs,
  getClientInquiries,
  getDispatches,
  getHackathons,
  getLabProjects,
  getNewsItems,
  getNewsletterSubscribers,
  getOrbitApplications,
  isMcpTokenExpired,
  listAdminInvites,
  listAdminUsers,
  listMcpTokens,
  listMediaAssets,
} from "@/lib/db/repository";
import { getGeminiModelName, isGeminiConfigured } from "@/lib/gemini/client";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const metadata: Metadata = {
  title: "Command Center",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export const dynamic = "force-dynamic";

export default async function GgCommandPage() {
  const [admin, allUsers] = await Promise.all([
    getAuthenticatedAdmin(),
    listAdminUsers(),
  ]);

  const hasAdmins = allUsers.length > 0;
  const requiresInviteCode =
    hasAdmins || Boolean(process.env.ADMIN_SIGNUP_KEY?.trim());

  if (!admin) {
    return (
      <OpsConsoleClient
        initialUser={null}
        hasAdmins={hasAdmins}
        requiresInviteCode={requiresInviteCode}
        initialData={null}
      />
    );
  }

  const [
    dispatches,
    { items: news },
    { items: hackathons },
    labs,
    inquiries,
    orbit,
    subscribers,
    media,
    aiPermissions,
    mcpTokens,
    adminInvites,
    auditLogs,
    hdrs,
  ] = await Promise.all([
    getDispatches(undefined, undefined, { includeUnpublished: true }),
    getNewsItems({ includeUnpublished: true }),
    getHackathons({ includeUnpublished: true, includeExpired: true }),
    getLabProjects(),
    getClientInquiries(),
    getOrbitApplications(),
    getNewsletterSubscribers(),
    listMediaAssets(),
    getAiPermissions(),
    listMcpTokens(),
    listAdminInvites(),
    getAuditLogs(100),
    headers(),
  ]);

  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "";
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    (host ? `${proto}://${host}` : "https://www.ggravitator.xyz");

  const supabaseConfigured = isSupabaseConfigured();

  const initialData: OpsBootstrapData = {
    user: admin,
    dispatches,
    news,
    hackathons,
    labs,
    inquiries,
    orbit,
    subscribers,
    mediaAssets: media.map((m) => ({
      id: m.id,
      filename: m.filename,
      mime_type: m.mime_type,
      url: m.url,
      source_type: m.source_type,
      source_url: m.source_url,
      prompt: m.prompt,
      alt_text: m.alt_text,
      created_by: m.created_by,
      created_at: m.created_at,
    })),
    aiPermissions,
    mcpTokens: mcpTokens.map((t) => ({
      id: t.id,
      name: t.name,
      prefix: t.prefix,
      permissions_mode: t.permissions_mode,
      role_preset: t.role_preset,
      custom_scopes: t.custom_scopes,
      expires_at: t.expires_at,
      rate_limit_rpm: t.rate_limit_rpm,
      request_count: t.request_count,
      denied_count: t.denied_count,
      last_client_info: t.last_client_info,
      notes: t.notes,
      created_by: t.created_by,
      created_at: t.created_at,
      last_used_at: t.last_used_at,
      is_active: t.is_active,
      is_expired: isMcpTokenExpired(t),
    })),
    adminUsers: allUsers.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      created_at: u.created_at,
      last_login_at: u.last_login_at,
    })),
    adminInvites,
    auditLogs,
    mcpEndpointUrl: `${baseUrl}/api/mcp`,
    systemHealth: {
      geminiConfigured: isGeminiConfigured(),
      geminiModel: getGeminiModelName(),
      supabaseConfigured,
      storageMode: supabaseConfigured ? "supabase" : "local",
      resendConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
    },
  };

  return (
    <OpsConsoleClient
      initialUser={admin}
      hasAdmins={hasAdmins}
      requiresInviteCode={requiresInviteCode}
      initialData={initialData}
    />
  );
}
