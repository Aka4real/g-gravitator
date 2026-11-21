"use client";

import { useEffect } from "react";
import { getImageProps } from "next/image";
import { useRouter } from "next/navigation";
import { PRELOAD_IMAGES, PRELOAD_ROUTES, shouldSkipPreload } from "@/lib/preload";

type IdleCallback = (cb: () => void) => number;

const STEP_DELAY_MS = 120;

/**
 * Warms the whole project once the current page has settled: every primary
 * route (JS + RSC payload) then the hero imagery. Runs only in production,
 * only when idle, and never on Save-Data or 2G connections.
 */
export function ProjectPreloader() {
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || shouldSkipPreload()) return;

    let cancelled = false;
    const timers: number[] = [];
    const idle: IdleCallback =
      (window as unknown as { requestIdleCallback?: IdleCallback }).requestIdleCallback ??
      ((cb) => window.setTimeout(cb, 200));

    const tasks: Array<() => void> = [
      ...PRELOAD_ROUTES.map((route) => () => router.prefetch(route)),
      ...PRELOAD_IMAGES.map(({ src, sizes }) => () => {
        const { props } = getImageProps({ src, alt: "", fill: true, sizes });
        const img = new window.Image();
        img.sizes = props.sizes ?? sizes;
        if (props.srcSet) img.srcset = props.srcSet;
        img.decoding = "async";
        img.src = typeof props.src === "string" ? props.src : src;
      }),
    ];

    const run = (index: number) => {
      if (cancelled || index >= tasks.length) return;
      idle(() => {
        if (cancelled) return;
        tasks[index]();
        timers.push(window.setTimeout(() => run(index + 1), STEP_DELAY_MS));
      });
    };

    const start = () => timers.push(window.setTimeout(() => run(0), 800));
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", start);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [router]);

  return null;
}
