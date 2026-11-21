import React from "react";

type Corner = "tl" | "tr" | "bl" | "br";

interface CrosshairCellProps {
  children: React.ReactNode;
  className?: string;
  /** @deprecated Kept for backwards compatibility; crosshair markers are removed. */
  corners?: Corner[];
  as?: "div" | "section" | "article";
  id?: string;
}

export function CrosshairCell({
  children,
  className = "",
  as: Component = "div",
  id,
}: CrosshairCellProps) {
  return (
    <Component id={id} className={`surface-card relative rounded-2xl ${className}`}>
      {children}
    </Component>
  );
}
