import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isVercelAppHost } from "@/lib/seo/site";

export function proxy(request: NextRequest) {
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host")?.split(",")[0]?.trim() ||
    request.nextUrl.host;

  const response = NextResponse.next();

  // Prevent search engines from indexing .vercel.app preview/alias URLs alongside ggravitator.xyz
  if (isVercelAppHost(host)) {
    response.headers.set("X-Robots-Tag", "noindex, follow");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all public routes except API endpoints, Next internals, and favicons
     * so MCP/API consumers on vercel.app aliases are untouched.
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
