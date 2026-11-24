import { NextResponse } from "next/server";
import { verifyMcpAuth } from "@/lib/auth/admin-auth";
import { getAiPermissions } from "@/lib/db/repository";
import {
  resolveEffectiveMcpContext,
  type OpsActorContext,
} from "@/lib/mcp/permissions";
import { listMcpPrompts } from "@/lib/mcp/prompts";
import {
  MCP_CORS_HEADERS,
  MCP_SERVER_INFO,
  SUPPORTED_MCP_VERSIONS,
  processMcpJsonRpcPayload,
} from "@/lib/mcp/protocol";
import {
  listMcpResources,
  listMcpResourceTemplates,
} from "@/lib/mcp/resources";
import { getMcpToolListings } from "@/lib/ops/tools";

export const maxDuration = 60;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: MCP_CORS_HEADERS });
}

export async function GET(request: Request) {
  const auth = await verifyMcpAuth(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: "Unauthorized MCP request. Provide Authorization: Bearer <token>." },
      { status: 401, headers: MCP_CORS_HEADERS }
    );
  }

  const policy = await getAiPermissions();
  const actor: OpsActorContext = {
    actorType: "mcp",
    actorLabel: auth.label,
    permissionsMode: auth.permissionsMode,
    tokenId: auth.tokenId,
    rolePreset: auth.rolePreset,
    customScopes: auth.customScopes,
    expiresAt: auth.expiresAt,
    rateLimitRpm: auth.rateLimitRpm,
  };
  const effective = resolveEffectiveMcpContext(actor, policy);
  const tools = getMcpToolListings(actor, policy);
  const resources = listMcpResources(actor, policy);
  const resourceTemplates = listMcpResourceTemplates(actor, policy);
  const prompts = listMcpPrompts(actor, policy);

  return NextResponse.json(
    {
      ...MCP_SERVER_INFO,
      protocolVersion: SUPPORTED_MCP_VERSIONS[0],
      supportedProtocolVersions: [...SUPPORTED_MCP_VERSIONS],
      mcp_enabled: policy.mcp_enabled,
      permissions_mode: effective.effectiveMode,
      role_preset: effective.rolePreset,
      downgraded_from_full: effective.downgradedFromFull,
      rate_limit_rpm: auth.rateLimitRpm ?? policy.mcp_default_rate_limit_rpm ?? 60,
      toolsCount: tools.length,
      resourcesCount: resources.length,
      resourceTemplatesCount: resourceTemplates.length,
      promptsCount: prompts.length,
    },
    { headers: MCP_CORS_HEADERS }
  );
}

export async function POST(request: Request) {
  const auth = await verifyMcpAuth(request);
  if (!auth.authorized) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32001,
          message:
            "Unauthorized MCP request. Provide Authorization: Bearer <token> or x-mcp-api-key (token may be revoked or expired).",
        },
      },
      { status: 401, headers: MCP_CORS_HEADERS }
    );
  }

  const policy = await getAiPermissions();
  if (!policy.mcp_enabled) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32003,
          message:
            "External MCP server is currently disabled in G-Gravitator Admin AI Permissions.",
        },
      },
      { status: 403, headers: MCP_CORS_HEADERS }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Invalid JSON payload." },
      },
      { status: 400, headers: MCP_CORS_HEADERS }
    );
  }

  const actor: OpsActorContext = {
    actorType: "mcp",
    actorLabel: auth.label,
    permissionsMode: auth.permissionsMode,
    tokenId: auth.tokenId,
    rolePreset: auth.rolePreset,
    customScopes: auth.customScopes,
    expiresAt: auth.expiresAt,
    rateLimitRpm: auth.rateLimitRpm,
  };

  const result = await processMcpJsonRpcPayload(rawBody, {
    actor,
    policy,
    headerProtocolVersion: request.headers.get("mcp-protocol-version"),
  });

  if (result.body === null) {
    return new NextResponse(null, {
      status: result.status,
      headers: result.headers,
    });
  }

  return NextResponse.json(result.body, {
    status: result.status,
    headers: result.headers,
  });
}
