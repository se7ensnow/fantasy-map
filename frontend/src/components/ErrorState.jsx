import { AlertTriangle, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function ErrorState({
    title,
    message,
    onRetry,
    retryLabel,
    className,
}) {
    return (
        <div
            role="alert"
            className={cn(
                "w-full max-w-2xl rounded-xl border border-status-error-border/60 bg-status-error-border/10 p-4 shadow-card md:p-6",
                className
            )}
        >
            <div className="flex items-start gap-3">
                <AlertTriangle
                    className="mt-0.5 h-5 w-5 shrink-0 text-status-error-ink"
                    aria-hidden="true"
                />

                <div className="min-w-0 flex-1">
                    {title && (
                        <h2 className="text-lg font-bold text-status-error-ink">
                            {title}
                        </h2>
                    )}

                    {message && (
                        <p className="mt-1 text-sm leading-relaxed text-status-error-ink md:text-base">
                            {message}
                        </p>
                    )}

                    {onRetry && (
                        <Button
                            variant="outline"
                            onClick={onRetry}
                            className="mt-4"
                        >
                            <RotateCcw className="h-4 w-4" aria-hidden="true" />
                            {retryLabel}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
