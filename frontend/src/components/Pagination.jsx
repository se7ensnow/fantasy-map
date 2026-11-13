import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function Pagination({ page, totalPages, onChange, className }) {
    const { t } = useTranslation();

    if (!totalPages || totalPages <= 1) return null;

    const canGoPrevious = page > 1;
    const canGoNext = page < totalPages;

    return (
        <nav
            aria-label={t("pagination.navigation")}
            className={cn(
                "mt-3 flex items-center justify-between gap-2 md:mt-4 md:justify-center md:gap-4",
                className
            )}
        >
            <Button
                variant="outline"
                onClick={() => onChange(Math.max(page - 1, 1))}
                disabled={!canGoPrevious}
                className="min-w-[96px] md:min-w-[110px]"
            >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                {t("pagination.previous")}
            </Button>

            <span
                aria-live="polite"
                className="flex-1 text-center text-sm text-text-primary md:flex-none md:text-lg"
            >
                {t("pagination.pageOf", { page, total: totalPages })}
            </span>

            <Button
                variant="outline"
                onClick={() => onChange(Math.min(page + 1, totalPages))}
                disabled={!canGoNext}
                className="min-w-[96px] md:min-w-[110px]"
            >
                {t("pagination.next")}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
        </nav>
    );
}
