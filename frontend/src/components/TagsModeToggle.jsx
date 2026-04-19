import React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export default function TagsModeToggle({ value, onChange }) {
    const { t } = useTranslation();
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
            title={
                isAll
                    ? t("tagsModeToggle.matchAll")
                    : t("tagsModeToggle.matchAny")
            }
        >
            <span
                className={cn(
                    "px-2 py-1 rounded-md transition-colors",
                    !isAll
                        ? "bg-accent-primary text-text-on-accent"
                        : "text-text-heading/80"
                )}
            >
                {t("tagsModeToggle.any")}
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
                {t("tagsModeToggle.all")}
            </span>
        </button>
    );
}