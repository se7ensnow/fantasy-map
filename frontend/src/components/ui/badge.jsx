import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, children, ...props }) {
    return (
        <span
            className={cn(
                "inline-flex items-center",
                "rounded-full",
                "border border-border-default/30",
                "bg-md-code-bg/70",
                "px-2 py-[2px]",
                "text-[11px]",
                "font-tag",
                "font-semibold",
                "tracking-wide",
                "uppercase",
                "text-text-heading",
                "transition-colors",
                "hover:bg-status-toast-bg/80",
                "leading-none",
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}