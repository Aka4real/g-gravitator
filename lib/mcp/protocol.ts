import { recordMcpTokenUsage } from "@/lib/db/repository";
import { checkMcpTokenRateLimit } from "@/lib/mcp/guards";
import {
  resolveEffectiveMcpContext,
  type OpsActorContext,
} from "@/lib/mcp/permissions";
import { getMcpPrompt, listMcpPrompts } from "@/lib/mcp/prompts";
import {
  listMcpResources,
  listMcpResourceTemplates,
  readMcpResource,
} from "@/lib/mcp/resources";
import { executeOpsTool, getMcpToolListings } from "@/lib/ops/tools";
import type { AiPermissionsPolicy } from "@/lib/supabase/types";

export const MCP_SERVER_INFO = {
  name: "g-gravitator-ops-mcp",
  title: "G-Gravitator Command & Intelligence MCP",
  version: "2.0.0",
};

export const SUPPORTED_MCP_VERSIONS = [
  "2026-07-28",
  "2025-11-25",
  "2025-06-18",
  "2025-03-26",
  "2024-11-05",
] as const;

export const MCP_SERVER_INSTRUCTIONS =
  "You are connected to the G-Gravitator external MCP server. Start by inspecting `get_my_mcp_identity` or `ggravitator://permissions/effective` to confirm your exact granted scopes, and read `ggravitator://brand/editorial-guide` before drafting Journal Dispatches. Unpublished creations enter the /gg-command Admin Review Queue when direct-publish scopes are disabled. Respect PII and dry-run bulk-delete safeguards.";

export const MCP_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-mcp-api-key, MCP-Protocol-Version, Mcp-Session-Id, Mcp-Method, Mcp-Name, Accept",
  "Access-Control-Expose-Headers":
    "MCP-Protocol-Version, Mcp-Method, Mcp-Name, X-RateLimit-Limit, X-RateLimit-Remaining",
};

export interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

function makeRpcResult(
  id: string | number | null | undefined,
  result: unknown
): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    result,
  };
}

function makeRpcError(
  id: string | number | null | undefined,
  code: number,
  message: string,
  data?: unknown
): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    error: { code, message, ...(data !== undefined ? { data } : {}) },
  };
}

function negotiateProtocolVersion(requested?: string | null): string {
  if (
    requested &&
    (SUPPORTED_MCP_VERSIONS as readonly string[]).includes(requested)
  ) {
    return requested;
  }
  return SUPPORTED_MCP_VERSIONS[0];
}

function extractClientLabel(params?: Record<string, unknown>): string | undefined {
  if (!params) return undefined;
  const direct = params.clientInfo as { name?: string; version?: string } | undefined;
  const meta = params._meta as
    | { "io.modelcontextprotocol/clientInfo"?: { name?: string; version?: string } }
    | undefined;
  const info = direct ?? meta?.["io.modelcontextprotocol/clientInfo"];
  if (!info?.name) return undefined;
  return info.version ? `${info.name} ${info.version}` : info.name;
}

export async function handleMcpRpcMessage(
  msg: JsonRpcRequest,
  context: {
    actor: OpsActorContext;
    policy: AiPermissionsPolicy;
    headerProtocolVersion?: string | null;
  }
): Promise<{
  isNotification: boolean;
  response?: JsonRpcResponse;
  denied?: boolean;
  methodName?: string;
  toolOrTargetName?: string;
  clientInfo?: string;
  httpStatusOverride?: number;
}> {
  if (!msg || typeof msg !== "object" || typeof msg.method !== "string") {
    return {
      isNotification: false,
      response: makeRpcError(msg?.id ?? null, -32600, "Invalid JSON-RPC request."),
      httpStatusOverride: 400,
    };
  }

  const method = msg.method.trim();
  const params =
    msg.params && typeof msg.params === "object" ? msg.params : undefined;
  const clientInfo = extractClientLabel(params);
  const isNotification =
    msg.id === undefined || method.startsWith("notifications/");

  // Header vs _meta protocolVersion consistency check (MCP 2026-07-28)
  const metaVersion =
    params?._meta && typeof params._meta === "object"
      ? ((params._meta as Record<string, unknown>)[
          "io.modelcontextprotocol/protocolVersion"
        ] as string | undefined)
      : undefined;

  if (
    context.headerProtocolVersion &&
    metaVersion &&
    context.headerProtocolVersion !== metaVersion
  ) {
    return {
      isNotification: false,
      httpStatusOverride: 400,
      response: makeRpcError(
        msg.id,
        -32600,
        "HeaderMismatch: MCP-Protocol-Version header disagrees with _meta protocolVersion."
      ),
    };
  }

  const effectiveVersion =
    metaVersion || context.headerProtocolVersion || undefined;
  if (
    effectiveVersion &&
    method !== "initialize" &&
    method !== "server/discover" &&
    !(SUPPORTED_MCP_VERSIONS as readonly string[]).includes(effectiveVersion)
  ) {
    return {
      isNotification: false,
      httpStatusOverride: 400,
      response: makeRpcError(
        msg.id,
        -32600,
        `UnsupportedProtocolVersionError: "${effectiveVersion}" is not supported.`,
        { supportedVersions: SUPPORTED_MCP_VERSIONS }
      ),
    };
  }

  // Notifications require 202 Accepted with no JSON body
  if (isNotification && method.startsWith("notifications/")) {
    return {
      isNotification: true,
      methodName: method,
      clientInfo,
    };
  }

  const ctx = resolveEffectiveMcpContext(context.actor, context.policy);

  if (method === "server/discover") {
    return {
      isNotification: false,
      methodName: method,
      clientInfo,
      response: makeRpcResult(msg.id, {
        protocolVersions: [...SUPPORTED_MCP_VERSIONS],
        serverInfo: MCP_SERVER_INFO,
        capabilities: {
          tools: { listChanged: false },
          resources: ctx.ceilings.mcp_expose_resources
            ? { subscribe: false, listChanged: false }
            : undefined,
          prompts: ctx.ceilings.mcp_expose_prompts
            ? { listChanged: false }
            : undefined,
        },
        instructions: MCP_SERVER_INSTRUCTIONS,
      }),
    };
  }

  if (method === "initialize") {
    const requestedVersion =
      typeof params?.protocolVersion === "string"
        ? params.protocolVersion
        : context.headerProtocolVersion;
    const protocolVersion = negotiateProtocolVersion(requestedVersion);

    return {
      isNotification: false,
      methodName: method,
      clientInfo,
      response: makeRpcResult(msg.id, {
        protocolVersion,
        serverInfo: MCP_SERVER_INFO,
        capabilities: {
          tools: { listChanged: false },
          ...(ctx.ceilings.mcp_expose_resources
            ? { resources: { subscribe: false, listChanged: false } }
            : {}),
          ...(ctx.ceilings.mcp_expose_prompts
            ? { prompts: { listChanged: false } }
            : {}),
        },
        instructions: MCP_SERVER_INSTRUCTIONS,
      }),
    };
  }

  if (method === "ping") {
    return {
      isNotification: msg.id === undefined,
      methodName: method,
      ...(msg.id !== undefined ? { response: makeRpcResult(msg.id, {}) } : {}),
    };
  }

  if (method === "tools/list") {
    const tools = getMcpToolListings(context.actor, context.policy);
    return {
      isNotification: false,
      methodName: method,
      response: makeRpcResult(msg.id, { tools }),
    };
  }

  if (method === "tools/call") {
    const toolName = typeof params?.name === "string" ? params.name : "";
    const toolArgs =
      params?.arguments && typeof params.arguments === "object"
        ? (params.arguments as Record<string, unknown>)
        : {};

    if (!toolName) {
      return {
        isNotification: false,
        methodName: method,
        response: makeRpcError(msg.id, -32602, "Missing params.name in tools/call."),
      };
    }

    const res = await executeOpsTool(toolName, toolArgs, context.actor);
    if (!res.ok) {
      const errorPayload = { ok: false, error: res.error };
      return {
        isNotification: false,
        denied: Boolean(res.denied),
        methodName: method,
        toolOrTargetName: toolName,
        response: makeRpcResult(msg.id, {
          content: [{ type: "text", text: JSON.stringify(errorPayload, null, 2) }],
          structuredContent: errorPayload,
          isError: true,
        }),
      };
    }

    const okPayload = { ok: true, data: res.data };
    return {
      isNotification: false,
      methodName: method,
      toolOrTargetName: toolName,
      response: makeRpcResult(msg.id, {
        content: [{ type: "text", text: JSON.stringify(okPayload, null, 2) }],
        structuredContent: res.data ?? {},
        isError: false,
      }),
    };
  }

  if (method === "resources/list") {
    if (!ctx.ceilings.mcp_expose_resources) {
      return {
        isNotification: false,
        denied: true,
        methodName: method,
        response: makeRpcError(
          msg.id,
          -32003,
          "MCP Resources are disabled by Admin AI Governance settings."
        ),
      };
    }
    return {
      isNotification: false,
      methodName: method,
      response: makeRpcResult(msg.id, {
        resources: listMcpResources(context.actor, context.policy),
      }),
    };
  }

  if (method === "resources/templates/list") {
    if (!ctx.ceilings.mcp_expose_resources) {
      return {
        isNotification: false,
        denied: true,
        methodName: method,
        response: makeRpcError(
          msg.id,
          -32003,
          "MCP Resources are disabled by Admin AI Governance settings."
        ),
      };
    }
    return {
      isNotification: false,
      methodName: method,
      response: makeRpcResult(msg.id, {
        resourceTemplates: listMcpResourceTemplates(context.actor, context.policy),
      }),
    };
  }

  if (method === "resources/read") {
    const uri = typeof params?.uri === "string" ? params.uri : "";
    if (!uri) {
      return {
        isNotification: false,
        methodName: method,
        response: makeRpcError(msg.id, -32602, "Missing params.uri in resources/read."),
      };
    }
    const readRes = await readMcpResource(uri, context.actor, context.policy);
    if (!readRes.ok) {
      return {
        isNotification: false,
        denied: Boolean(readRes.denied),
        methodName: method,
        toolOrTargetName: uri,
        response: makeRpcError(
          msg.id,
          readRes.denied ? -32003 : readRes.notFound ? -32002 : -32602,
          readRes.error || `Failed to read resource: ${uri}`
        ),
      };
    }
    return {
      isNotification: false,
      methodName: method,
      toolOrTargetName: uri,
      response: makeRpcResult(msg.id, { contents: readRes.contents ?? [] }),
    };
  }

  if (method === "prompts/list") {
    if (!ctx.ceilings.mcp_expose_prompts) {
      return {
        isNotification: false,
        denied: true,
        methodName: method,
        response: makeRpcError(
          msg.id,
          -32003,
          "MCP Prompts are disabled by Admin AI Governance settings."
        ),
      };
    }
    return {
      isNotification: false,
      methodName: method,
      response: makeRpcResult(msg.id, {
        prompts: listMcpPrompts(context.actor, context.policy),
      }),
    };
  }

  if (method === "prompts/get") {
    const promptName = typeof params?.name === "string" ? params.name : "";
    const promptArgs: Record<string, string> = {};
    if (params?.arguments && typeof params.arguments === "object") {
      for (const [k, v] of Object.entries(
        params.arguments as Record<string, unknown>
      )) {
        if (v !== undefined && v !== null) {
          promptArgs[k] = String(v);
        }
      }
    }
    if (!promptName) {
      return {
        isNotification: false,
        methodName: method,
        response: makeRpcError(msg.id, -32602, "Missing params.name in prompts/get."),
      };
    }
    const promptRes = await getMcpPrompt(
      promptName,
      promptArgs,
      context.actor,
      context.policy
    );
    if (!promptRes.ok) {
      return {
        isNotification: false,
        denied: Boolean(promptRes.denied),
        methodName: method,
        toolOrTargetName: promptName,
        response: makeRpcError(
          msg.id,
          promptRes.denied ? -32003 : promptRes.notFound ? -32602 : -32603,
          promptRes.error || `Prompt "${promptName}" failed.`
        ),
      };
    }
    return {
      isNotification: false,
      methodName: method,
      toolOrTargetName: promptName,
      response: makeRpcResult(msg.id, {
        description: promptRes.description,
        messages: promptRes.messages,
      }),
    };
  }

  return {
    isNotification: false,
    methodName: method,
    response: makeRpcError(msg.id, -32601, `Method not found: ${method}`),
  };
}

export async function processMcpJsonRpcPayload(
  rawBody: unknown,
  context: {
    actor: OpsActorContext;
    policy: AiPermissionsPolicy;
    headerProtocolVersion?: string | null;
    enforceRateLimit?: boolean;
  }
): Promise<{
  status: number;
  body: unknown | null;
  headers: Record<string, string>;
}> {
  const rate =
    context.enforceRateLimit !== false
      ? checkMcpTokenRateLimit(
          context.actor.tokenId || context.actor.actorLabel,
          context.actor.rateLimitRpm ?? context.policy.mcp_default_rate_limit_rpm ?? 60
        )
      : {
          allowed: true,
          limit: context.actor.rateLimitRpm ?? 60,
          remaining: context.actor.rateLimitRpm ?? 60,
          resetSeconds: 60,
        };

  const extraHeaders: Record<string, string> = {
    ...MCP_CORS_HEADERS,
    "X-RateLimit-Limit": String(rate.limit),
    "X-RateLimit-Remaining": String(rate.remaining),
  };

  if (!rate.allowed) {
    return {
      status: 429,
      headers: {
        ...extraHeaders,
        "Retry-After": String(rate.resetSeconds),
      },
      body: makeRpcError(
        null,
        -32029,
        `Rate limit exceeded (${rate.limit} requests/min). Retry in ${rate.resetSeconds}s.`
      ),
    };
  }

  const isBatch = Array.isArray(rawBody);
  const items: JsonRpcRequest[] = isBatch
    ? (rawBody as JsonRpcRequest[]).slice(0, 20)
    : [rawBody as JsonRpcRequest];

  if (isBatch && items.length === 0) {
    return {
      status: 400,
      headers: extraHeaders,
      body: makeRpcError(null, -32600, "Empty JSON-RPC batch request."),
    };
  }

  const outcomes = await Promise.all(
    items.map((item) =>
      handleMcpRpcMessage(item, {
        actor: context.actor,
        policy: context.policy,
        headerProtocolVersion: context.headerProtocolVersion,
      })
    )
  );

  const anyDenied = outcomes.some((o) => o.denied);
  const clientInfo = outcomes.find((o) => o.clientInfo)?.clientInfo;
  const firstMethod = outcomes[0]?.methodName;
  const firstTarget = outcomes[0]?.toolOrTargetName;

  if (firstMethod) extraHeaders["Mcp-Method"] = firstMethod;
  if (firstTarget) extraHeaders["Mcp-Name"] = firstTarget;

  if (context.actor.tokenId && context.actor.tokenId !== "env-master") {
    void recordMcpTokenUsage(context.actor.tokenId, {
      denied: anyDenied,
      clientInfo,
    }).catch(() => null);
  }

  const responses = outcomes
    .filter((o) => !o.isNotification && o.response)
    .map((o) => o.response!);

  if (responses.length === 0) {
    return {
      status: 202,
      headers: extraHeaders,
      body: null,
    };
  }

  if (!isBatch && outcomes[0]?.httpStatusOverride) {
    return {
      status: outcomes[0].httpStatusOverride,
      headers: extraHeaders,
      body: responses[0],
    };
  }

  return {
    status: 200,
    headers: extraHeaders,
    body: isBatch ? responses : responses[0],
  };
}

export function inspectMcpTokenCapabilities(
  actor: OpsActorContext,
  policy: AiPermissionsPolicy
) {
  const effective = resolveEffectiveMcpContext(actor, policy);
  const tools = getMcpToolListings(actor, policy);
  const resources = listMcpResources(actor, policy);
  const resourceTemplates = listMcpResourceTemplates(actor, policy);
  const prompts = listMcpPrompts(actor, policy);

  return {
    serverInfo: MCP_SERVER_INFO,
    supportedVersions: [...SUPPORTED_MCP_VERSIONS],
    effective,
    counts: {
      tools: tools.length,
      resources: resources.length,
      resourceTemplates: resourceTemplates.length,
      prompts: prompts.length,
    },
    tools: tools.map((t) => ({
      name: t.name,
      title: t.annotations.title,
      readOnlyHint: Boolean(t.annotations.readOnlyHint),
      destructiveHint: Boolean(t.annotations.destructiveHint),
    })),
    resources: resources.map((r) => ({ uri: r.uri, name: r.name, mimeType: r.mimeType })),
    resourceTemplates: resourceTemplates.map((t) => ({
      uriTemplate: t.uriTemplate,
      name: t.name,
      mimeType: t.mimeType,
    })),
    prompts: prompts.map((p) => ({ name: p.name, title: p.title })),
  };
}
