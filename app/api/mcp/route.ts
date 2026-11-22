import { NextResponse } from "next/server";
import { verifyMcpAuth } from "@/lib/auth/admin-auth";
import { getAiPermissions } from "@/lib/db/repository";
import { executeOpsTool, OPS_TOOLS } from "@/lib/ops/tools";

export const maxDuration = 60;

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-mcp-api-key",
};

function rpcResult(id: string | number | null | undefined, result: unknown) {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id: id ?? null,
      result,
    },
    { headers: CORS_HEADERS }
  );
}

function rpcError(
  id: string | number | null | undefined,
  code: number,
  message: string,
  status = 200
) {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id: id ?? null,
      error: { code, message },
    },
    { status, headers: CORS_HEADERS }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  const auth = await verifyMcpAuth(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: "Unauthorized MCP request. Provide Authorization: Bearer <token>." },
      { status: 401, headers: CORS_HEADERS }
    );
  }
  const policy = await getAiPermissions();
  return NextResponse.json(
    {
      name: "g-gravitator-ops-mcp",
      version: "1.0.0",
      protocolVersion: "2024-11-05",
      mcp_enabled: policy.mcp_enabled,
      permissions_mode: auth.permissionsMode,
      toolsCount: OPS_TOOLS.length,
    },
    { headers: CORS_HEADERS }
  );
}

export async function POST(request: Request) {
  const auth = await verifyMcpAuth(request);
  if (!auth.authorized) {
    return rpcError(
      null,
      -32001,
      "Unauthorized MCP request. Provide Authorization: Bearer <token> or x-mcp-api-key.",
      401
    );
  }

  const policy = await getAiPermissions();
  if (!policy.mcp_enabled) {
    return rpcError(
      null,
      -32003,
      "External MCP server is currently disabled in G-Gravitator Admin AI Permissions.",
      403
    );
  }

  let body: JsonRpcRequest;
  try {
    body = (await request.json()) as JsonRpcRequest;
  } catch {
    return rpcError(null, -32700, "Invalid JSON payload.", 400);
  }

  const { id, method, params } = body;

  if (method === "initialize") {
    return rpcResult(id, {
      protocolVersion: "2024-11-05",
      serverInfo: {
        name: "g-gravitator-ops-mcp",
        version: "1.0.0",
      },
      capabilities: {
        tools: { listChanged: false },
        resources: { subscribe: false, listChanged: false },
      },
    });
  }

  if (method === "notifications/initialized" || method === "ping") {
    return rpcResult(id, {});
  }

  if (method === "tools/list") {
    const tools = OPS_TOOLS.filter((t) => t.requiredPermission !== "admin_only").map(
      (t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })
    );
    return rpcResult(id, { tools });
  }

  if (method === "tools/call") {
    const toolName = typeof params?.name === "string" ? params.name : "";
    const toolArgs =
      params?.arguments && typeof params.arguments === "object"
        ? (params.arguments as Record<string, unknown>)
        : {};

    if (!toolName) {
      return rpcError(id, -32602, "Missing params.name in tools/call.");
    }

    const res = await executeOpsTool(toolName, toolArgs, {
      actorType: "mcp",
      actorLabel: auth.label,
      permissionsMode: auth.permissionsMode,
    });

    if (!res.ok) {
      return rpcResult(id, {
        content: [{ type: "text", text: JSON.stringify({ ok: false, error: res.error }, null, 2) }],
        isError: true,
      });
    }

    return rpcResult(id, {
      content: [{ type: "text", text: JSON.stringify({ ok: true, data: res.data }, null, 2) }],
      isError: false,
    });
  }

  if (method === "resources/list") {
    return rpcResult(id, {
      resources: [
        {
          uri: "ggravitator://overview",
          name: "System Overview",
          description: "Live G-Gravitator system counts, pending reviews, and AI permissions.",
          mimeType: "application/json",
        },
        {
          uri: "ggravitator://pending-reviews",
          name: "Pending Review Queue",
          description: "Unpublished community hackathons and AI-authored posts awaiting review.",
          mimeType: "application/json",
        },
      ],
    });
  }

  if (method === "resources/read") {
    const uri = typeof params?.uri === "string" ? params.uri : "";
    if (uri === "ggravitator://overview") {
      const res = await executeOpsTool("get_system_overview", {}, {
        actorType: "mcp",
        actorLabel: auth.label,
        permissionsMode: auth.permissionsMode,
      });
      return rpcResult(id, {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(res.data ?? {}, null, 2),
          },
        ],
      });
    }
    if (uri === "ggravitator://pending-reviews") {
      const res = await executeOpsTool("list_pending_reviews", {}, {
        actorType: "mcp",
        actorLabel: auth.label,
        permissionsMode: auth.permissionsMode,
      });
      return rpcResult(id, {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(res.data ?? {}, null, 2),
          },
        ],
      });
    }
    return rpcError(id, -32602, `Unknown resource URI: ${uri}`);
  }

  return rpcError(id, -32601, `Method not found: ${String(method)}`);
}
