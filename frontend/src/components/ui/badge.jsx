import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center",
        "rounded-full",
        "border border-amber-700/30",
        "bg-amber-50/70",
        "px-2 py-[2px]",
        "text-[11px]",
        "font-tag",
        "font-semibold",
        "tracking-wide",
        "uppercase",
        "text-amber-900",
        "transition-colors",
        "hover:bg-amber-100/80",
        "leading-none",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}