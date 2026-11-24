import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth/admin-auth";
import {
  appendAuditLog,
  createAdminInvite,
  createMcpToken,
  deleteAdminInvite,
  deleteAdminUser,
  deleteMcpToken,
  listAdminUsers,
  revokeMcpToken,
} from "@/lib/db/repository";
import { executeOpsTool } from "@/lib/ops/tools";

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

    // Admin-only team & MCP token actions
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
      const mode =
        args.permissions_mode === "full" || args.permissions_mode === "readonly"
          ? args.permissions_mode
          : "inherit";
      const { tokenRecord, plaintextToken } = await createMcpToken({
        name,
        permissions_mode: mode,
        created_by: admin.email,
      });
      await appendAuditLog({
        actor_type: "admin",
        actor_label: admin.email,
        action: "create_mcp_token",
        entity_type: "mcp_tokens",
        entity_id: tokenRecord.id,
        summary: `Issued MCP token "${tokenRecord.name}" (${mode})`,
        status: "ok",
      });
      return NextResponse.json({
        ok: true,
        data: {
          token: {
            id: tokenRecord.id,
            name: tokenRecord.name,
            prefix: tokenRecord.prefix,
            permissions_mode: tokenRecord.permissions_mode,
            created_by: tokenRecord.created_by,
            created_at: tokenRecord.created_at,
            is_active: tokenRecord.is_active,
          },
          plaintextToken,
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
