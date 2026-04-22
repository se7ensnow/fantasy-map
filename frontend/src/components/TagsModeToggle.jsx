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
                "flex h-9 w-full items-center justify-center gap-1 rounded-md border px-2 text-xs font-medium transition-colors md:h-10 md:w-auto md:px-3 md:text-sm",
                "border-border-default/40 bg-surface-panel hover:bg-surface-muted",
                "text-text-primary"
            )}
            title={
                isAll
                    ? t("tagsModeToggle.matchAll")
                    : t("tagsModeToggle.matchAny")
            }
        >
            <span
                className={cn(
                    "rounded-md px-2 py-1 transition-colors",
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
                    "rounded-md px-2 py-1 transition-colors",
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