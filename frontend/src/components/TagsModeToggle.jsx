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
                "border-amber-700/40 bg-[#fcf7e9] hover:bg-amber-50",
                "flex items-center gap-1"
            )}
            title={isAll ? "Match all selected tags" : "Match any selected tag"}
        >
            <span
                className={cn(
                    "px-2 py-1 rounded-md transition-colors",
                    !isAll ? "bg-[#5b7a5b] text-white" : "text-amber-900/70"
                )}
            >
                any
            </span>
            <span className="mx-1 text-amber-900/40">|</span>
            <span
                className={cn(
                    "px-2 py-1 rounded-md transition-colors",
                    isAll ? "bg-[#5b7a5b] text-white" : "text-amber-900/70"
                )}
            >
                all
            </span>
        </button>
    );
}