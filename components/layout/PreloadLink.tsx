"use client";

import React, { useState } from "react";
import Link from "next/link";
import { shouldSkipPreload } from "@/lib/preload";

type PreloadLinkProps = Omit<React.ComponentProps<typeof Link>, "prefetch">;

/**
 * Drop-in replacement for `next/link` that preloads its destination.
 *
 * - Static routes keep Next's default viewport prefetch (production).
 * - On intent (hover, keyboard focus, touch) the full route is prefetched,
 *   including dynamic routes such as /labs/[slug] and /journal/[slug] that
 *   Next does not prefetch on its own.
 * - Visitors on Save-Data or 2G connections only prefetch on intent.
 */
export function PreloadLink({
  onPointerEnter,
  onFocus,
  onTouchStart,
  ...props
}: PreloadLinkProps) {
  const [intent, setIntent] = useState(false);
  const [constrained] = useState(() => shouldSkipPreload());

  const arm = () => setIntent(true);
  const prefetch = intent ? true : constrained ? false : null;

  return (
    <Link
      {...props}
      prefetch={prefetch}
      onPointerEnter={(event) => {
        arm();
        onPointerEnter?.(event);
      }}
      onFocus={(event) => {
        arm();
        onFocus?.(event);
      }}
      onTouchStart={(event) => {
        arm();
        onTouchStart?.(event);
      }}
    />
  );
}

export default PreloadLink;
