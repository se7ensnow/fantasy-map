import React from "react";
import { Toaster } from "sonner";

export default function AppToaster() {
    return (
        <Toaster
            position="bottom-right"
            expand={false}
            closeButton
            visibleToasts={4}
            toastOptions={{
                unstyled: true,
                classNames: {
                    toast: `
                        group
                        pointer-events-auto
                        rounded-xl
                        border
                        bg-surface-panel/95
                        text-text-primary
                        shadow-card
                        backdrop-blur-sm
                        p-4
                        font-serif
                    `,
                    content: "gap-1",
                    title: "font-semibold text-sm",
                    description: "text-sm opacity-90",
                    actionButton: `
                        bg-accent-primary
                        text-text-on-accent
                        hover:bg-accent-primary-hover
                        rounded-md
                        px-3
                        py-2
                        text-sm
                        font-semibold
                    `,
                    cancelButton: `
                        bg-surface-paper
                        text-text-heading
                        border
                        border-border-default
                        hover:bg-state-hover
                        rounded-md
                        px-3
                        py-2
                        text-sm
                        font-semibold
                    `,
                    closeButton: `
                        bg-transparent
                        text-text-muted
                        border
                        border-transparent
                        hover:text-text-heading
                        hover:bg-state-hover
                    `,
                    success: `
                        !border-status-success-border
                        !bg-status-success-border/10
                        !text-status-success-ink
                    `,
                    error: `
                        !border-status-error-border
                        !bg-status-error-border/10
                        !text-status-error-ink
                    `,
                    info: `
                        !border-status-info-border
                        !bg-status-info-border/10
                        !text-status-info-ink
                    `,
                    warning: `
                        !border-status-warning-border
                        !bg-status-warning-border/10
                        !text-status-warning-ink
                    `,
                    icon: "shrink-0",
                },
            }}
        />
    );
}