import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth/admin-auth";
import {
  appendAuditLog,
  createAdminInvite,
  createMcpToken,
  deleteAdminInvite,
  deleteAdminUser,
  deleteMcpToken,
  getAiPermissions,
  getMcpTokenById,
  listAdminUsers,
  revokeMcpToken,
  rotateMcpToken,
  updateMcpToken,
} from "@/lib/db/repository";
import {
  MCP_ROLE_PRESETS,
  type OpsActorContext,
} from "@/lib/mcp/permissions";
import {
  inspectMcpTokenCapabilities,
  processMcpJsonRpcPayload,
} from "@/lib/mcp/protocol";
import { executeOpsTool } from "@/lib/ops/tools";
import type {
  McpPermissionsMode,
  McpRolePreset,
  McpScopeMap,
} from "@/lib/supabase/types";

function parsePreset(raw: unknown): McpRolePreset {
  if (typeof raw === "string" && raw in MCP_ROLE_PRESETS) {
    return raw as McpRolePreset;
  }
  return "inherit";
}

function parseMode(
  rawMode: unknown,
  preset: McpRolePreset
): McpPermissionsMode {
  if (
    rawMode === "inherit" ||
    rawMode === "full" ||
    rawMode === "readonly" ||
    rawMode === "custom"
  ) {
    return rawMode;
  }
  return MCP_ROLE_PRESETS[preset].permissionsMode;
}

function computeExpiresAt(args: Record<string, unknown>): string | null | undefined {
  if (args.expires_at === null) return null;
  if (typeof args.expires_at === "string" && args.expires_at.trim()) {
    const dt = new Date(args.expires_at);
    return Number.isNaN(dt.getTime()) ? undefined : dt.toISOString();
  }
  if (typeof args.expires_in_days === "number") {
    if (args.expires_in_days <= 0) return null;
    return new Date(Date.now() + args.expires_in_days * 24 * 3600 * 1000).toISOString();
  }
  return undefined;
}

function summarizeToken(t: NonNullable<Awaited<ReturnType<typeof getMcpTokenById>>>) {
  return {
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
  };
}

export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      action?: string;
      args?: Record<string, unknown>;
    };
    const action = (body.action || "").trim();
    const args = body.args && typeof body.args === "object" ? body.args : {};

    if (!action) {
      return NextResponse.json({ error: "Missing action name." }, { status: 400 });
    }

    // Admin-only team & MCP governance actions
    if (action === "create_invite") {
      const invite = await createAdminInvite(admin.email);
      await appendAuditLog({
        actor_type: "admin",
        actor_label: admin.email,
        action: "create_invite",
        entity_type: "admin_invites",
        entity_id: invite.id,
        summary: `Created admin signup invite code`,
        status: "ok",
      });
      return NextResponse.json({ ok: true, data: { invite } });
    }

    if (action === "revoke_invite") {
      const id = String(args.id || "");
      const deleted = await deleteAdminInvite(id);
      return NextResponse.json({ ok: deleted, data: { deleted, id } });
    }

    if (action === "delete_admin_user") {
      const id = String(args.id || "").trim();
      if (!id) {
        return NextResponse.json(
          { error: "Missing target admin user ID." },
          { status: 400 }
        );
      }
      if (id === admin.id) {
        return NextResponse.json(
          { error: "You cannot delete your own active session account." },
          { status: 400 }
        );
      }

      const allAdmins = await listAdminUsers();
      const target = allAdmins.find((u) => u.id === id);
      if (!target) {
        return NextResponse.json(
          { error: "Admin user not found." },
          { status: 404 }
        );
      }
      if (target.role === "SUPER_ADMIN" && admin.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Only a SUPER_ADMIN can remove another SUPER_ADMIN account." },
          { status: 403 }
        );
      }
      if (target.role === "SUPER_ADMIN") {
        const superAdminCount = allAdmins.filter((u) => u.role === "SUPER_ADMIN").length;
        if (superAdminCount <= 1) {
          return NextResponse.json(
            { error: "Cannot remove the last remaining SUPER_ADMIN account." },
            { status: 400 }
          );
        }
      }

      const deleted = await deleteAdminUser(id);
      await appendAuditLog({
        actor_type: "admin",
        actor_label: admin.email,
        action: "delete_admin_user",
        entity_type: "admin_users",
        entity_id: id,
        summary: `Removed admin user ${target.email} (${target.role})`,
        status: deleted ? "ok" : "error",
      });
      return NextResponse.json({ ok: deleted, data: { deleted, id } });
    }

    if (action === "create_mcp_token") {
      const name = String(args.name || "External AI Agent");
      const preset = parsePreset(args.role_preset);
      const mode = parseMode(args.permissions_mode, preset);
      const customScopes =
        args.custom_scopes && typeof args.custom_scopes === "object"
          ? (args.custom_scopes as McpScopeMap)
          : undefined;
      const expiresAt = computeExpiresAt(args) ?? null;
      const rateLimitRpm =
        typeof args.rate_limit_rpm === "number" && args.rate_limit_rpm > 0
          ? Math.round(args.rate_limit_rpm)
          : 60;
      const notes = typeof args.notes === "string" ? args.notes : null;

      const { tokenRecord, plaintextToken } = await createMcpToken({
        name,
        permissions_mode: mode,
        role_preset: preset,
        custom_scopes: customScopes,
        expires_at: expiresAt,
        rate_limit_rpm: rateLimitRpm,
        notes,
        created_by: admin.email,
      });

      await appendAuditLog({
        actor_type: "admin",
        actor_label: admin.email,
        action: "create_mcp_token",
        entity_type: "mcp_tokens",
        entity_id: tokenRecord.id,
        summary: `Issued MCP token "${tokenRecord.name}" (preset=${preset}, mode=${mode})`,
        status: "ok",
      });

      return NextResponse.json({
        ok: true,
        data: {
          token: summarizeToken(tokenRecord),
          plaintextToken,
        },
      });
    }

    if (action === "update_mcp_token") {
      const id = String(args.id || "").trim();
      if (!id) {
        return NextResponse.json({ error: "Missing MCP token ID." }, { status: 400 });
      }
      const preset = args.role_preset ? parsePreset(args.role_preset) : undefined;
      const mode = args.permissions_mode
        ? parseMode(args.permissions_mode, preset ?? "custom")
        : preset
        ? MCP_ROLE_PRESETS[preset].permissionsMode
        : undefined;
      const expiresAt = computeExpiresAt(args);

      const updated = await updateMcpToken(id, {
        ...(typeof args.name === "string" ? { name: args.name } : {}),
        ...(mode !== undefined ? { permissions_mode: mode } : {}),
        ...(preset !== undefined ? { role_preset: preset } : {}),
        ...(args.custom_scopes && typeof args.custom_scopes === "object"
          ? { custom_scopes: args.custom_scopes as McpScopeMap }
          : {}),
        ...(expiresAt !== undefined ? { expires_at: expiresAt } : {}),
        ...(typeof args.rate_limit_rpm === "number"
          ? { rate_limit_rpm: Math.max(5, Math.min(1000, Math.round(args.rate_limit_rpm))) }
          : {}),
        ...(typeof args.notes === "string" ? { notes: args.notes } : {}),
        ...(typeof args.is_active === "boolean" ? { is_active: args.is_active } : {}),
      });

      if (!updated) {
        return NextResponse.json({ error: "MCP token not found." }, { status: 404 });
      }

      await appendAuditLog({
        actor_type: "admin",
        actor_label: admin.email,
        action: "update_mcp_token",
        entity_type: "mcp_tokens",
        entity_id: updated.id,
        summary: `Updated MCP token "${updated.name}" (${updated.role_preset ?? updated.permissions_mode})`,
        status: "ok",
      });

      return NextResponse.json({
        ok: true,
        data: { token: summarizeToken(updated) },
      });
    }

    if (action === "rotate_mcp_token") {
      const id = String(args.id || "").trim();
      if (!id) {
        return NextResponse.json({ error: "Missing MCP token ID." }, { status: 400 });
      }
      const rotated = await rotateMcpToken(id);
      if (!rotated) {
        return NextResponse.json({ error: "MCP token not found." }, { status: 404 });
      }

      await appendAuditLog({
        actor_type: "admin",
        actor_label: admin.email,
        action: "rotate_mcp_token",
        entity_type: "mcp_tokens",
        entity_id: rotated.tokenRecord.id,
        summary: `Rotated secret for MCP token "${rotated.tokenRecord.name}"`,
        status: "ok",
      });

      return NextResponse.json({
        ok: true,
        data: {
          token: summarizeToken(rotated.tokenRecord),
          plaintextToken: rotated.plaintextToken,
        },
      });
    }

    if (action === "inspect_mcp_token") {
      const policy = await getAiPermissions();
      let actor: OpsActorContext;

      if (typeof args.token_id === "string" && args.token_id.trim()) {
        const token = await getMcpTokenById(args.token_id.trim());
        if (!token) {
          return NextResponse.json({ error: "MCP token not found." }, { status: 404 });
        }
        actor = {
          actorType: "mcp",
          actorLabel: `MCP:${token.name}`,
          permissionsMode: token.permissions_mode,
          tokenId: token.id,
          rolePreset: token.role_preset,
          customScopes: token.custom_scopes,
          expiresAt: token.expires_at ?? null,
          rateLimitRpm: token.rate_limit_rpm ?? 60,
        };
      } else {
        const preset = parsePreset(args.role_preset);
        actor = {
          actorType: "mcp",
          actorLabel: `Preview:${preset}`,
          permissionsMode: parseMode(args.permissions_mode, preset),
          rolePreset: preset,
          customScopes:
            args.custom_scopes && typeof args.custom_scopes === "object"
              ? (args.custom_scopes as McpScopeMap)
              : undefined,
        };
      }

      const inspection = inspectMcpTokenCapabilities(actor, policy);
      return NextResponse.json({ ok: true, data: inspection });
    }

    if (action === "run_mcp_rpc_probe") {
      const policy = await getAiPermissions();
      const method = typeof args.method === "string" ? args.method : "tools/list";
      const params =
        args.params && typeof args.params === "object"
          ? (args.params as Record<string, unknown>)
          : undefined;

      // Guard probe to safe introspection RPCs or read-only tool calls
      const allowedProbeMethods = new Set([
        "server/discover",
        "initialize",
        "ping",
        "tools/list",
        "resources/list",
        "resources/templates/list",
        "prompts/list",
        "resources/read",
        "prompts/get",
        "tools/call",
      ]);
      if (!allowedProbeMethods.has(method)) {
        return NextResponse.json(
          { error: `Unsupported probe method: ${method}` },
          { status: 400 }
        );
      }

      let actor: OpsActorContext;
      if (typeof args.token_id === "string" && args.token_id.trim()) {
        const token = await getMcpTokenById(args.token_id.trim());
        if (!token) {
          return NextResponse.json({ error: "MCP token not found." }, { status: 404 });
        }
        actor = {
          actorType: "mcp",
          actorLabel: `Probe:${token.name}`,
          permissionsMode: token.permissions_mode,
          rolePreset: token.role_preset,
          customScopes: token.custom_scopes,
        };
      } else {
        const preset = parsePreset(args.role_preset);
        actor = {
          actorType: "mcp",
          actorLabel: `Probe:${preset}`,
          permissionsMode: parseMode(args.permissions_mode, preset),
          rolePreset: preset,
        };
      }

      const probe = await processMcpJsonRpcPayload(
        {
          jsonrpc: "2.0",
          id: "admin-probe-1",
          method,
          ...(params ? { params } : {}),
        },
        {
          actor,
          policy,
          enforceRateLimit: false,
        }
      );

      return NextResponse.json({
        ok: true,
        data: {
          httpStatus: probe.status,
          headers: probe.headers,
          response: probe.body,
        },
      });
    }

    if (action === "revoke_mcp_token") {
      const id = String(args.id || "");
      const ok = await revokeMcpToken(id);
      return NextResponse.json({ ok, data: { revoked: ok, id } });
    }

    if (action === "delete_mcp_token") {
      const id = String(args.id || "");
      const ok = await deleteMcpToken(id);
      return NextResponse.json({ ok, data: { deleted: ok, id } });
    }

    // Unified system-wide action registry
    const result = await executeOpsTool(action, args, {
      actorType: "admin",
      actorLabel: admin.email,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute action" },
      { status: 500 }
    );
  }
}
