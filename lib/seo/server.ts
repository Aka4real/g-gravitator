import { headers } from "next/headers";
import { resolveCanonicalOrigin } from "@/lib/seo/site";

export async function getSiteOrigin(): Promise<string> {
  try {
    const hdrs = await headers();
    return resolveCanonicalOrigin({ headers: hdrs });
  } catch {
    return resolveCanonicalOrigin();
  }
}
