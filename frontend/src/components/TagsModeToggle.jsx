import React from "react";
import { cn } from "@/lib/utils";

export default function TagsModeToggle({ value, onChange }) {
    const isAll = value === "all";

    return (
        <button
            type="button"
            onClick={() => onChange(isAll ? "any" : "all")}
            className={cn(
                "h-10 px-3 rounded-md border text-sm font-medium transition-colors",
                "border-border-default/40 bg-surface-panel hover:bg-surface-muted",
                "text-text-primary",
                "flex items-center gap-1"
            )}
            title={isAll ? "Match all selected tags" : "Match any selected tag"}
        >
            <span
                className={cn(
                    "px-2 py-1 rounded-md transition-colors",
                    !isAll
                        ? "bg-accent-primary text-text-on-accent"
                        : "text-text-heading/80"
                )}
            >
                any
            </span>

            <span className="mx-1 text-text-heading/40">|</span>

            <span
                className={cn(
                    "px-2 py-1 rounded-md transition-colors",
                    isAll
                        ? "bg-accent-primary text-text-on-accent"
                        : "text-text-heading/80"
                )}
            >
                all
            </span>
        </button>
    );
}