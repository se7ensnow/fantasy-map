import { useTranslation } from "react-i18next";

import { useDraggableSheet } from "@/hooks/useDraggableSheet";

/**
 * Draggable bottom sheet for the map viewers.
 * Modes: "hidden" | "peek" | "full".
 */
export default function MobileSheet({
    mode,
    onRequestMode,
    visibleHeight = 320,
    label,
    children,
}) {
    const { t } = useTranslation();
    const { isMounted, isDragging, translateYPx, handlePointerDown } =
        useDraggableSheet({ mode, onRequestMode, visibleHeight });

    if (!isMounted) return null;

    return (
        <div className="pointer-events-none fixed inset-0 z-[60] p-2 sm:p-4">
            <div
                role="dialog"
                aria-modal="false"
                aria-label={label}
                className="pointer-events-auto absolute inset-x-2 bottom-2 top-2 overflow-hidden rounded-2xl border border-border-emphasis bg-surface-panel/95 shadow-2xl sm:inset-x-4 sm:bottom-4 sm:top-4"
                style={{
                    transform: `translateY(${translateYPx}px)`,
                    transition: isDragging
                        ? "none"
                        : "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",
                    willChange: "transform",
                }}
            >
                <div
                    className="absolute inset-x-0 top-0 z-20 flex cursor-grab touch-none justify-center py-3 active:cursor-grabbing"
                    onPointerDown={handlePointerDown}
                    role="separator"
                    aria-label={t("mobileSheet.dragHandle")}
                    aria-orientation="horizontal"
                >
                    <div className="h-1.5 w-12 rounded-full bg-border-default/80" />
                </div>

                <div className="h-full pt-8">{children}</div>
            </div>
        </div>
    );
}
