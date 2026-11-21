import React from "react";

type Corner = "tl" | "tr" | "bl" | "br";

interface CrosshairCellProps {
  children: React.ReactNode;
  className?: string;
  corners?: Corner[];
  as?: "div" | "section" | "article";
  id?: string;
}

export function CrosshairCell({
  children,
  className = "",
  corners = ["tl", "tr"],
  as: Component = "div",
  id,
}: CrosshairCellProps) {
  return (
    <Component id={id} className={`arch-cell relative ${className}`}>
      {corners.includes("tl") && (
        <span
          aria-hidden="true"
          className="crosshair-marker -top-[5px] -left-[5px]"
        />
      )}
      {corners.includes("tr") && (
        <span
          aria-hidden="true"
          className="crosshair-marker -top-[5px] -right-[5px]"
        />
      )}
      {corners.includes("bl") && (
        <span
          aria-hidden="true"
          className="crosshair-marker -bottom-[5px] -left-[5px]"
        />
      )}
      {corners.includes("br") && (
        <span
          aria-hidden="true"
          className="crosshair-marker -bottom-[5px] -right-[5px]"
        />
      )}
      {children}
    </Component>
  );
}
