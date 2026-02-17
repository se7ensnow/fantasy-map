import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[#c9aa71] bg-[#fcf7e9] px-2 py-0.5 text-xs font-medium text-[#3a2f1b]",
        className
      )}
      {...props}
    />
  );
}