import { ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { useScrollFades } from "@/hooks/useScrollFades";

/**
 * Panel shell with scroll fades and a "scroll to top" affordance.
 */
export default function ScrollPanel({ title, resetKey, children, className }) {
    const { t } = useTranslation();
    const { scrollRef, showTopFade, showBottomFade, scrollToTop, updateFades } =
        useScrollFades(resetKey);

    return (
        <div
            className={cn(
                "relative h-full min-h-0 overflow-hidden rounded-xl bg-surface-panel/95",
                className
            )}
        >
            <div
                ref={scrollRef}
                onScroll={updateFades}
                className="h-full overflow-y-auto p-4"
            >
                {title && (
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-text-heading">{title}</h2>
                    </div>
                )}

                {children}
            </div>

            <button
                type="button"
                onClick={scrollToTop}
                aria-label={t("mapViewer.scrollToTop")}
                title={t("mapViewer.scrollToTop")}
                className={cn(
                    "absolute left-1/2 top-3 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-border-default bg-surface-panel/90 text-text-heading shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-surface-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50",
                    showTopFade
                        ? "pointer-events-auto opacity-100"
                        : "pointer-events-none opacity-0"
                )}
            >
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
            </button>

            <div
                aria-hidden="true"
                className={cn(
                    "pointer-events-none absolute left-0 right-0 top-0 h-10 bg-gradient-to-b from-surface-panel/95 to-transparent transition-opacity duration-200",
                    showTopFade ? "opacity-100" : "opacity-0"
                )}
            />

            <div
                aria-hidden="true"
                className={cn(
                    "pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-surface-panel/95 to-transparent transition-opacity duration-200",
                    showBottomFade ? "opacity-100" : "opacity-0"
                )}
            />
        </div>
    );
}
