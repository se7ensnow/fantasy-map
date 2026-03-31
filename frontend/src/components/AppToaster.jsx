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
                        relative
                        flex items-start gap-3
                        rounded-xl border
                        bg-surface-panel/95
                        text-text-primary
                        shadow-card
                        backdrop-blur-sm
                        p-4 pr-12
                        font-serif
                        w-full
                    `,
                    icon: `
                        mt-0.5 shrink-0
                    `,
                    content: `
                        flex min-w-0 flex-1 flex-col
                    `,
                    title: `
                        text-sm font-semibold text-inherit leading-5
                    `,
                    description: `
                        mt-1 text-sm text-inherit/90 leading-5
                    `,
                    closeButton: `
                        absolute right-3 top-3
                        flex h-7 w-7 items-center justify-center
                        rounded-md
                        border border-transparent
                        bg-transparent
                        text-inherit/70
                        hover:bg-black/5
                        hover:text-inherit
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
                },
            }}
        />
    );
}