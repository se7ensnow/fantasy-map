import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
].join(",");

const SIZES = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
};

/**
 * Accessible modal: portal, focus trap, Escape/backdrop close, scroll lock
 * and focus restoration.
 */
export default function Modal({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    size = "md",
    closeOnBackdrop = true,
    closeOnEscape = true,
    showCloseButton = true,
    closeLabel = "Close",
    initialFocusRef,
    className,
    bodyClassName,
}) {
    const panelRef = useRef(null);
    const titleId = useId();
    const descriptionId = useId();

    const handleBackdropClick = useCallback(() => {
        if (closeOnBackdrop) onClose?.();
    }, [closeOnBackdrop, onClose]);

    useEffect(() => {
        if (!open) return undefined;

        const previouslyFocused = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const panel = panelRef.current;
        const focusTarget =
            initialFocusRef?.current ||
            panel?.querySelector(FOCUSABLE_SELECTOR) ||
            panel;

        focusTarget?.focus?.();

        return () => {
            document.body.style.overflow = previousOverflow;
            previouslyFocused?.focus?.();
        };
    }, [open, initialFocusRef]);

    useEffect(() => {
        if (!open || !closeOnEscape) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                event.stopPropagation();
                onClose?.();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, closeOnEscape, onClose]);

    useEffect(() => {
        if (!open) return undefined;

        const panel = panelRef.current;
        if (!panel) return undefined;

        const handleKeyDown = (event) => {
            if (event.key !== "Tab") return;

            const focusable = Array.from(
                panel.querySelectorAll(FOCUSABLE_SELECTOR)
            ).filter((element) => element.offsetParent !== null);

            if (focusable.length === 0) {
                event.preventDefault();
                panel.focus();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        panel.addEventListener("keydown", handleKeyDown);
        return () => panel.removeEventListener("keydown", handleKeyDown);
    }, [open]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
            <div
                className="absolute inset-0 bg-overlay-backdrop/50 backdrop-blur-[2px]"
                onClick={handleBackdropClick}
                aria-hidden="true"
            />

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                aria-describedby={description ? descriptionId : undefined}
                tabIndex={-1}
                className={cn(
                    "relative flex max-h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-2xl border border-border-emphasis bg-surface-panel shadow-card outline-none sm:max-h-[calc(100dvh-2rem)]",
                    SIZES[size] ?? SIZES.md,
                    className
                )}
            >
                {(title || showCloseButton) && (
                    <div className="flex items-start justify-between gap-3 border-b border-border-default/30 px-4 py-3 md:px-6 md:py-4">
                        <div className="min-w-0">
                            {title && (
                                <h2
                                    id={titleId}
                                    className="text-lg font-bold text-text-heading md:text-xl"
                                >
                                    {title}
                                </h2>
                            )}

                            {description && (
                                <p
                                    id={descriptionId}
                                    className="mt-1 text-sm text-text-muted"
                                >
                                    {description}
                                </p>
                            )}
                        </div>

                        {showCloseButton && (
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label={closeLabel}
                                title={closeLabel}
                                className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-state-hover hover:text-text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
                            >
                                <X className="h-4 w-4" aria-hidden="true" />
                            </button>
                        )}
                    </div>
                )}

                <div
                    className={cn(
                        "min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5",
                        bodyClassName
                    )}
                >
                    {children}
                </div>

                {footer && (
                    <div className="border-t border-border-default/30 px-4 py-3 md:px-6 md:py-4">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
