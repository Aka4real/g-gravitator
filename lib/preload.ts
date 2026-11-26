/**
 * Project preload manifest: everything the site warms in the background so
 * navigation feels instant. Keep in sync with the primary navigation.
 */
export const PRELOAD_ROUTES = [
  "/systems",
  "/labs",
  "/skunkworks",
  "/hackathons",
  "/journal",
  "/orbit",
] as const;

/** Hero imagery, preloaded with the same `sizes` the pages render with. */
export const PRELOAD_IMAGES = [
  { src: "/images/hero-monolith.jpg", sizes: "100vw" },
  { src: "/images/labs-prism.jpg", sizes: "(max-width: 1024px) 100vw, 45vw" },
  { src: "/images/skunkworks-forge.jpg", sizes: "(max-width: 768px) 100vw, 50vw" },
  { src: "/images/orbit-atelier.jpg", sizes: "(max-width: 768px) 100vw, 50vw" },
] as const;

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

/** True when the visitor asked for reduced data or is on a slow connection. */
export function shouldSkipPreload(): boolean {
  if (typeof navigator === "undefined") return true;
  const connection = (
    navigator as Navigator & { connection?: NetworkInformationLike }
  ).connection;
  if (!connection) return false;
  return (
    Boolean(connection.saveData) ||
    /(^|-)2g$/.test(connection.effectiveType ?? "")
  );
}
